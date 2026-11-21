// Port of src/core/store.ts: one UserData object, persisted as one JSON file (write to a temp file, then rename), with
// the web's schema, migrations and backup format: a web backup restores here and the other way round.
// AppStore is the web's external store (ChangeNotifier + ListenableBuilder, docs/19 §2.2).
import 'dart:convert';
import 'dart:io';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';

import '../i18n/i18n.dart';
import 'course.dart';
import 'day.dart';
import 'scheduler.dart';
import 'types.dart';

const schemaVersion = 2;

/// A backup or saved file the app can't read (message is shown to the learner).
class StoreError implements Exception {
  StoreError(this.message);
  final String message;
  @override
  String toString() => message;
}

final _rand = Random.secure();
String uuid() {
  final b = [for (var i = 0; i < 16; i++) _rand.nextInt(256)];
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  final h = b.map((x) => x.toRadixString(16).padLeft(2, '0')).join();
  return '${h.substring(0, 8)}-${h.substring(8, 12)}-${h.substring(12, 16)}-${h.substring(16, 20)}-${h.substring(20)}';
}

// ponytail: the abbreviation ("GST"), not the IANA name the web stores; nothing reads it yet. flutter_timezone if needed.
String _timezone() => DateTime.now().timeZoneName;

Json defaultSettings(Iso at) => {
  'id': uuid(), 'createdAt': at, 'updatedAt': at, 'deletedAt': null, //
  'wirdTime': '05:30', 'timezone': _timezone(), 'reciterId': 'husary-muallim', 'munfasilLength': 4, 'teacherDays': [],
  'textSize': 'm', 'theme': 'system', 'tajweedPatterns': false, 'tajweedColours': false, 'onboardedOn': null,
  'lastExportOn': null,
};

Json defaultData(Iso at) => {
  'schemaVersion': schemaVersion, 'updatedAt': at, 'settings': defaultSettings(at), 'introductions': [], 'items': [], //
  'attempts': [], 'sessions': [], 'corrections': [], 'days': [], 'finales': [],
};

/* ---------------- migrations ---------------- */

bool _isObj(Object? x) => x is Map;

/// Keeps only object rows that have every key field (a null row or a half-written one would crash a screen).
List<Json> _rows(Object? xs, List<String> keys, [Json defaults = const {}]) => [
  for (final x in xs as List)
    if (_isObj(x) && keys.every((k) => (x as Map)[k] != null)) {...defaults, ...(x as Map).cast<String, dynamic>()},
];

/// JS `typeof`, for the settings type check.
String _typeOf(Object? v) => switch (v) {
  num() => 'number',
  String() => 'string',
  bool() => 'boolean',
  _ => 'object',
};

/// migrations[n] turns schema n into n+1. Each is pure.
Json Function(Json) _migration(int v, List<Unit> units, Iso at) => switch (v) {
  // v0 (pre-release): no introductions (derived from lesson items), settings and lists may be partial.
  0 => (d) => {
    ...d,
    'schemaVersion': 1,
    'settings': {...defaultSettings(at), ...?(d['settings'] as Map?)?.cast<String, dynamic>()},
    'introductions':
        d['introductions'] ??
        [
          for (final i in (d['items'] as List? ?? const []))
            if (i['kind'] == 'lesson') {'lessonId': i['refId'], 'on': i['introducedOn'], 'at': i['createdAt']},
        ],
    'items': d['items'] ?? [],
    'attempts': d['attempts'] ?? [],
    'sessions': d['sessions'] ?? [],
    'corrections': d['corrections'] ?? [],
    'days': d['days'] ?? [],
  },
  // v1 → v2 (spec §4): every introduced lesson stays done; units whose v1 lessons are all done count as passed.
  1 => (d) => {
    ...d,
    'schemaVersion': 2,
    'finales': migratedFinales(_rows(d['introductions'] is List ? d['introductions'] : const [], ['lessonId', 'on']), units),
  },
  _ => throw StoreError('Unknown schema version $v.'),
};

/// Validates, migrates to [schemaVersion] and rebuilds the schedule. Throws [StoreError] on unknown/newer schemas.
UserData migrate(Object? raw, {required Day on, required List<Unit> units, Iso? at}) {
  final now = at ?? isoOf(DateTime.now());
  final sv = raw is Map ? raw['schemaVersion'] : null;
  if (sv is! num || sv != sv.truncate()) throw StoreError('Not a Tajweed Path backup (no schema version).');
  if (sv > schemaVersion) throw StoreError('This backup is from a newer version of the app (schema $sv).');
  var d = Map<String, dynamic>.from(raw as Map); // a copy: the caller's map stays as it was
  for (var v = sv.toInt(); v < schemaVersion; v++) {
    d = _migration(v, units, now)(d);
  }
  for (final k in ['introductions', 'attempts', 'sessions', 'corrections', 'days']) {
    if (d[k] is! List) throw StoreError('Backup is missing "$k".');
  }
  if (!_isObj(d['settings'])) throw StoreError('Backup is missing settings.');
  // Settings: defaults for anything missing or of the wrong type.
  final def = defaultSettings(now);
  final settings = {...def, ...(d['settings'] as Map).cast<String, dynamic>()};
  for (final k in def.keys) {
    if (def[k] != null && (_typeOf(settings[k]) != _typeOf(def[k]) || (settings[k] is List) != (def[k] is List))) {
      settings[k] = def[k];
    }
  }
  settings.remove('introCourseDone'); // retired v1 field
  final introductions = _rows(d['introductions'], ['lessonId', 'on']);
  final attempts = _rows(d['attempts'], ['id', 'refId', 'kind', 'on']);
  final corrections = _rows(d['corrections'], ['id', 'verseKey', 'severity'], {
    'lessonIds': [], 'status': 'open', 'by': 'learner', 'sessionId': null, 'deletedAt': null, //
  });
  final sessions = _rows(d['sessions'], ['id', 'on'], {
    'plannedPassages': [], 'milestoneResults': [], 'status': 'planned', 'deletedAt': null, //
  });
  final days = _rows(d['days'], ['id'], {
    'parts': {'listen': null, 'sabaq': null, 'recite': null, 'review': null}, 'listenSeconds': 0, //
  });
  final finales = _rows(d['finales'] is List ? d['finales'] : const [], ['unitId', 'on']);
  return UserData({
    ...d..remove('phases'), // retired v1 field
    'settings': settings,
    'introductions': introductions,
    'attempts': attempts,
    'corrections': corrections,
    'sessions': sessions,
    'days': days,
    'finales': finales,
    'items': [
      for (final i in rebuildItems(
        introductions.map(Introduction.new).toList(),
        attempts.map(Attempt.new).toList(),
        corrections.map(Correction.new).toList(),
        on,
      ))
        i.j,
    ],
  });
}

/* ---------------- the store ---------------- */

/// The saved file could not be read: the old text is kept untouched (offered as a download) until a reset or import.
typedef LoadError = ({String message, String raw});

class AppStore extends ChangeNotifier {
  AppStore(this.file, this.units, {DateTime Function()? clock}) : _clock = clock ?? DateTime.now {
    _load();
  }

  /// The store in the app's documents directory (userdata.json; Android Auto Backup and iCloud cover it).
  static Future<AppStore> open(List<Unit> units) async =>
      AppStore(File('${(await getApplicationDocumentsDirectory()).path}/userdata.json'), units);

  final File file;
  final List<Unit> units;
  final DateTime Function() _clock;
  late UserData data;
  LoadError? loadError;

  /// Set when the last save failed: the data lives only in memory until a save succeeds (M3).
  bool saveError = false;

  Day get _today => today(_clock());
  Iso get _now => isoOf(_clock());

  void _load() {
    loadError = null;
    String? raw;
    try {
      raw = file.existsSync() ? file.readAsStringSync() : null;
    } on FileSystemException {
      raw = null;
    }
    if (raw == null || raw.isEmpty) {
      data = UserData(defaultData(_now));
      return;
    }
    try {
      data = migrate(jsonDecode(raw), on: _today, units: units, at: _now);
    } catch (e) {
      // keep the old data untouched; the UI offers it as a download
      loadError = (message: e is StoreError ? e.message : 'This file is not valid JSON.', raw: raw);
      data = UserData(defaultData(_now));
    }
  }

  /// Re-reads the file (tests).
  void reload() {
    _load();
    notifyListeners();
  }

  void _commit(Json next) {
    data = UserData({...next, 'updatedAt': _now});
    if (loadError == null) {
      // ponytail: synchronous write of a small file (< 1 MB); move to an isolate if it ever shows in a frame
      try {
        final tmp = File('${file.path}.tmp');
        tmp.writeAsStringSync(jsonEncode(data.j), flush: true);
        tmp.renameSync(file.path);
        saveError = false;
      } on FileSystemException {
        saveError = true;
      }
    }
    notifyListeners();
  }

  Json get _d => data.j;
  List<Json> _of(String k) => (_d[k] as List).cast<Json>();

  /* ---------------- actions ---------------- */

  void updateSettings(Json patch) => _commit({
    ..._d,
    'settings': {...data.settings.j, ...patch, 'updatedAt': _now},
  });

  void completeOnboarding(Json patch) => _commit({
    ..._d,
    'settings': {...data.settings.j, ...patch, 'onboardedOn': _today, 'updatedAt': _now},
  });

  List<Json> _withDay(Day day, Json Function(Json) fn) {
    final cur = _of('days').where((x) => x['id'] == day).firstOrNull ??
        {'id': day, 'parts': {'listen': null, 'sabaq': null, 'recite': null, 'review': null}, 'listenSeconds': 0};
    return [..._of('days').where((x) => x['id'] != day), fn(cur)]..sort((a, b) => (a['id'] as String).compareTo(b['id']));
  }

  Json _part(Json l, String part, String? Function(Object? cur) mark) => {
    ...l,
    'parts': {...l['parts'] as Json, part: mark((l['parts'] as Json)[part])},
  };

  /// part: listen | sabaq | recite | review; mark: null | 'auto' | 'manual'.
  void markDayPart(String part, [String? mark = 'manual', Day? day]) =>
      _commit({..._d, 'days': _withDay(day ?? _today, (l) => _part(l, part, (_) => mark))});

  /// A saved recording marks the recite part done (spec F1), unless it is already marked.
  void noteRecording([Day? day]) =>
      _commit({..._d, 'days': _withDay(day ?? _today, (l) => _part(l, 'recite', (c) => c as String? ?? 'auto'))});

  /// Adds listening time; marks the listen part done at 3 minutes.
  void addListenSeconds(num seconds, [Day? day]) => _commit({
    ..._d,
    'days': _withDay(day ?? _today, (l) {
      final s = (l['listenSeconds'] as num) + seconds;
      return _part({...l, 'listenSeconds': s}, 'listen', (c) => c as String? ?? (s >= 180 ? 'auto' : null));
    }),
  });

  List<Json> _rebuild(List<Json> intros, List<Json> attempts, List<Json> corrections, Day on) => [
    for (final i in rebuildItems(
      intros.map(Introduction.new).toList(),
      attempts.map(Attempt.new).toList(),
      corrections.map(Correction.new).toList(),
      on,
    ))
      i.j,
  ];

  /// A lesson's Recite step done: the lesson is done and enters سبقي.
  void introduceLesson(String lessonId) {
    if (data.introductions.any((i) => i.lessonId == lessonId)) return;
    final on = _today;
    final intros = [..._of('introductions'), {'lessonId': lessonId, 'on': on, 'at': _now}];
    _commit({
      ..._d,
      'introductions': intros,
      'items': _rebuild(intros, _of('attempts'), _of('corrections'), on),
      'days': _withDay(on, (l) => _part(l, 'sabaq', (c) => c as String? ?? 'auto')),
    });
  }

  /// Writes the attempt first, then moves the schedule (spec F3). [a]: the web's NewAttempt (no id/itemId).
  Attempt recordAttempt(Json a) {
    final id = itemIdOf(a['kind'], a['refId']);
    final full = Attempt({
      'on': _today, 'at': _now, ...a, 'id': uuid(), //
      'itemId': data.items.any((i) => i.id == id) ? id : null,
    });
    _commit({
      ..._d,
      'attempts': [..._of('attempts'), full.j],
      'items': [for (final i in applyAttempt(data.items, full)) i.j],
    });
    return full;
  }

  /// The unit finale is recited ("I recited it"): the next unit opens (spec §4).
  void completeFinale(String unitId) {
    if (data.finales.any((f) => f.unitId == unitId)) return;
    final on = _today;
    _commit({
      ..._d,
      'finales': [..._of('finales'), {'unitId': unitId, 'on': on}],
      'days': _withDay(on, (l) => _part(l, 'recite', (c) => c as String? ?? 'auto')),
    });
  }

  /// Default passages for a session plan (F6): the unit finale when it is next, then ayat with open corrections.
  List<Json> suggestPassages([UserData? d]) {
    final u = d ?? data;
    final out = <Json>[];
    final next = CourseProgress.of(u, units).next;
    final f = next.unit?.finale;
    if (next.kind == 'finale' && f != null) out.add({'from': f.from, 'to': f.to, 'reason': 'milestone'});
    for (final c in u.corrections) {
      if (c.deletedAt == null && c.status == 'open' && !out.any((x) => x['from'] == c.verseKey && x['to'] == c.verseKey)) {
        out.add({'from': c.verseKey, 'to': c.verseKey, 'reason': 'correction'});
      }
    }
    return out;
  }

  Session planSession([Json input = const {}]) {
    final at = _now;
    final s = Session({
      'id': uuid(), 'createdAt': at, 'updatedAt': at, 'deletedAt': null, 'on': _today, //
      'teacherName': data.settings.teacherName, 'plannedPassages': suggestPassages(), 'milestoneResults': [],
      'status': 'planned', ...input,
    }..removeWhere((k, v) => k == 'teacherName' && v == null));
    _commit({..._d, 'sessions': [..._of('sessions'), s.j]});
    return s;
  }

  void updateSession(String id, Json patch) => _commit({
    ..._d,
    'sessions': [
      for (final s in _of('sessions')) s['id'] == id ? {...s, ...patch, 'id': id, 'updatedAt': _now} : s,
    ],
  });

  /// §6.3: a new correction item, due tomorrow; linked manzil lessons back to tomorrow.
  Correction logCorrection({
    required VerseKey verseKey,
    required String severity,
    List<String> lessonIds = const [],
    int? wordPosition,
    String? word,
    String? note,
    String? sessionId,
    String by = 'learner',
  }) {
    final at = _now, on = _today;
    final c = Correction({
      'id': uuid(), 'createdAt': at, 'updatedAt': at, 'deletedAt': null, 'on': on, 'sessionId': sessionId, //
      'verseKey': verseKey, 'severity': severity, 'lessonIds': lessonIds.take(2).toList(), 'status': 'open', 'by': by,
      'wordPosition': ?wordPosition,
      if (word != null && word.isNotEmpty) 'word': word,
      if (note != null && note.isNotEmpty) 'note': note,
    });
    final corrections = [..._of('corrections'), c.j];
    _commit({..._d, 'corrections': corrections, 'items': _rebuild(_of('introductions'), _of('attempts'), corrections, on)});
    return c;
  }

  /// Undo a correction just logged by mistake (soft delete, its review item goes with it).
  void undoCorrection(String id) {
    final at = _now;
    final corrections = [
      for (final c in _of('corrections')) c['id'] == id ? {...c, 'deletedAt': at, 'updatedAt': at} : c,
    ];
    _commit({..._d, 'corrections': corrections, 'items': _rebuild(_of('introductions'), _of('attempts'), corrections, _today)});
  }

  /// Teacher re-check: "correct now" closes it; "still wrong" is a lapse and sends its lessons back to tomorrow.
  void resolveCorrection(String id, {required bool correct, String? sessionId}) {
    final at = _now;
    final a = Attempt({
      'id': uuid(), 'itemId': itemIdOf('correction', id), 'refId': id, 'kind': 'correction', 'on': _today, 'at': at, //
      'source': 'teacher', 'chosen': correct ? 'passed' : 'still_wrong', 'correct': correct, 'countsForSchedule': true,
    });
    final corrections = [
      for (final c in _of('corrections'))
        c['id'] == id && correct ? {...c, 'status': 'resolved', 'resolvedInSessionId': ?sessionId, 'updatedAt': at} : c,
    ];
    _commit({
      ..._d,
      'corrections': corrections,
      'attempts': [..._of('attempts'), a.j],
      'items': [for (final i in applyAttempt(data.items, a)) i.j],
    });
  }

  /// Full backup in the web's format (recordings are not included). Records lastExportOn.
  String exportJson() {
    updateSettings({'lastExportOn': _today});
    return jsonEncode(data.j);
  }

  /// Replaces everything. Throws [StoreError] (and changes nothing) on an invalid, unknown or newer backup.
  void importJson(String text) {
    Object? raw;
    try {
      raw = jsonDecode(text);
    } on FormatException {
      throw StoreError('This file is not valid JSON.');
    }
    final next = migrate(raw, on: _today, units: units, at: _now);
    loadError = null;
    _commit(next.j);
  }

  void resetAll() {
    loadError = null;
    _commit(defaultData(_now));
  }
}

/* ---------------- language (per device, outside UserData, like the web's own key) ---------------- */

Future<File> _langFile() async => File('${(await getApplicationDocumentsDirectory()).path}/lang');

/// The saved language, or null when the learner hasn't picked one yet (onboarding asks once).
Future<Lang?> loadLang() async {
  try {
    final v = (await _langFile()).readAsStringSync().trim();
    return Lang.values.where((l) => l.name == v).firstOrNull;
  } catch (_) {
    return null;
  }
}

Future<void> saveLang(Lang l) async {
  try {
    (await _langFile()).writeAsStringSync(l.name);
  } catch (e) {
    debugPrint('lang not saved: $e'); // this session only, as the web with storage blocked
  }
  lang.value = l;
}
