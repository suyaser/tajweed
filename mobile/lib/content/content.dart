// Port of src/content/index.ts, course.ts and teach.ts: the reviewed content JSON (synced to assets/shared/content/)
// adapted to the shared types, with the Arabic overlay (content/ar.json) merged in the Arabic UI. The maps built here
// equal the web's objects (parity fixtures, test/parity_test.dart).
import 'dart:convert';

import 'package:flutter/services.dart';

import '../core/types.dart';
import '../i18n/i18n.dart';

const _dir = 'assets/shared/content';
const _files = [
  'rules', 'pairs', 'mutun', 'also', 'ar', 'course', 'topics', 'reciters', 'glossary', 'surahs', 'videos', //
];

/// The decoded JSON files, by name ('rules', 'ar', …). Loaded once; [Content] is rebuilt per language.
typedef RawContent = Map<String, dynamic>;

Future<RawContent> loadRawContent([AssetBundle? bundle]) async {
  final b = bundle ?? rootBundle;
  return {for (final f in _files) f: jsonDecode(await b.loadString('$_dir/$f.json'))};
}

/// The content in use (rebuilt by [useContent] when the language changes).
late Content content;
void useContent(RawContent raw) => content = Content(raw);

/// Drops the keys whose value is null: the web's `undefined` fields, which JSON.stringify leaves out.
Json _clean(Json m) => m..removeWhere((_, v) => v == null);

// Topics that are not a muṣḥaf colour rule: their lessons get no colour (UX review M4).
const _noColour = {'found', 'waqf', 'hafs'};
// "Which rule is highlighted?" only where one answer is right (unit 9 review X1); + الروم: heard, never written.
final _noIdentify = RegExp(r'^(makharij-|sifat-|maratib$|ibtida$|waqf-signs$|waqf-how$|rawm-ishmam$)');

class Content {
  Content(this.raw) {
    final arc = (isAr ? raw['ar'] : null) as Json? ?? const {};
    Json? arOf(String part, String id) => (arc[part] as Json?)?[id] as Json?;
    String? arStr(String part, String id) => (arc[part] as Json?)?[id] as String?;

    topics = [
      for (final (i, t) in (raw['topics'] as List).indexed)
        Topic({
          'id': t['id'],
          'nameAr': t['nameAr'],
          'nameEn': pick(t['nameEn'], arOf('topics', t['id'])?['name']),
          'intro': pick(t['intro'], arOf('topics', t['id'])?['intro']),
          'order': i,
        }),
    ];

    pairs = [
      for (final p in raw['pairs'] as List)
        ConfusablePair({
          'id': p['id'] ?? '${p['a']}~${p['b']}',
          'a': p['a'],
          'b': p['b'],
          'hint': pick(p['hint'] ?? p['difference'] ?? '', arStr('pairs', p['id'] ?? '${p['a']}~${p['b']}')),
        }),
    ];

    mutun = [
      for (final l in (raw['mutun'] as Json)['lines'] as List)
        MatnLine(_clean({
          'id': '${l['text']}-${l['n']}',
          'matn': l['text'],
          'n': l['n'],
          'sadr': l['sadr'],
          'ajz': l['ajuz'],
          'page': l['page']?.toString(),
          'url': l['url'],
          'lessonIds': l['rules'],
          'gloss': pick(l['gloss'], arStr('mutun', '${l['text']}-${l['n']}')),
          'verified': l['verified'],
        })),
    ];

    final also = raw['also'] as Json;
    lessons = [
      for (final (order, r) in (raw['rules'] as List).cast<Json>().indexed) _lesson(r, order, isAr ? arOf('lessons', r['id']) : null, also),
    ];
    _byId = {for (final l in lessons) l.id: l};

    // course.json → units with only the lesson ids rules.json knows (buildCourse)
    final course = raw['course'] as Json;
    units = [
      for (final u in course['units'] as List)
        Unit({
          ...Map.of(u as Json)..remove('lessons')..remove('mutun'),
          'nameEn': pick(u['nameEn'], arOf('units', u['id'])?['name']),
          'intro': pick(u['intro'], arOf('units', u['id'])?['intro']),
          'finale': u['finale'],
          'lessonIds': [for (final id in u['lessons'] as List) if (_byId.containsKey(id)) id],
          'mutun': [
            for (final (i, m) in ((u['mutun'] as List?) ?? const []).indexed)
              isAr ? _clean({...m as Json, 'note': pick(m['note'], (arOf('units', u['id'])?['mutun'] as List?)?.elementAtOrNull(i))}) : m,
          ],
        }),
    ];
    _courseLessons = course['lessons'] as Json;
    _arCourse = arc['course'] as Json? ?? const {};
    courseOrder = [for (final u in units) ...u.lessonIds];
    reciters = [for (final r in raw['reciters'] as List) Reciter(r)];
    glossary = [for (final g in raw['glossary'] as List) Term(g)];
  }

  final RawContent raw;
  late final List<Topic> topics;
  late final List<ConfusablePair> pairs;
  late final List<MatnLine> mutun;
  late final List<Lesson> lessons;
  late final Map<String, Lesson> _byId;
  late final List<Unit> units;
  late final Json _courseLessons, _arCourse;
  final _courseCache = <String, CourseLesson>{};

  /// Every lesson id in course order.
  late final List<String> courseOrder;
  late final List<Reciter> reciters;
  late final List<Term> glossary;

  Lesson? getLesson(String id) => _byId[id];
  Unit? getUnit(String id) => units.where((u) => u.id == id).firstOrNull;
  Unit? unitOf(String lessonId) => units.where((u) => u.lessonIds.contains(lessonId)).firstOrNull;

  /// Per-lesson course data (closing passage, Notice contrast, what to listen for). One object per id.
  CourseLesson courseLesson(String id) => _courseCache.putIfAbsent(id, () {
    final l = _courseLessons[id] as Json?;
    final cw = l?['contrastWith'] as String?;
    return CourseLesson({
      'closing': null,
      ...?l,
      'notice': pick(l?['notice'], (_arCourse[id] as Json?)?['notice']),
      'contrastWith': cw != null && cw.isNotEmpty && _byId.containsKey(cw) ? cw : null,
    });
  });

  /// The unit's mutun lines (تحفة الأطفال / الجزرية), in order.
  List<MatnLine> unitMutun(Unit u) => [
    for (final m in u.mutun) ...mutun.where((l) => l.matn == m.matn && l.n >= m.from && l.n <= m.to),
  ];

  /// Every ayah the unit plays (examples, closing passages, finale), plus the basmala (1:1) that precedes a surah's
  /// first ayah: src/audio/download.ts unitAyahs.
  List<VerseKey> unitAyahs(Unit u) {
    // ponytail: passages never cross a surah (course.build.test checks it)
    List<VerseKey> range(VerseKey from, VerseKey to) {
      final [s, a] = from.split(':');
      final [s2, b] = to.split(':');
      if (s != s2) return [from, to];
      return [for (var i = int.parse(a); i <= int.parse(b); i++) '$s:$i'];
    }

    final keys = <VerseKey>{'1:1'};
    for (final id in u.lessonIds) {
      keys.addAll([for (final e in getLesson(id)?.examples ?? const <Example>[]) e.verseKey]);
      final c = courseLesson(id).closing;
      if (c != null) keys.addAll(range(c.from, c.to));
    }
    final f = u.finale;
    if (f != null) keys.addAll(range(f.from, f.to));
    return keys.toList();
  }

  /// 1-based surah number → its Arabic name (src/quran/surahs.json).
  String surahName(int n) => (raw['surahs'] as List)[n - 1][0];
  int surahAyahs(int n) => (raw['surahs'] as List)[n - 1][1];

  /// The source locators' one English phrase, in Arabic for the Arabic UI.
  static String _arLocator(String l) =>
      isAr ? l.replaceAll('paging per the OpenITI copy of', '\u0628\u062a\u0631\u0642\u064a\u0645 \u0646\u0633\u062e\u0629 OpenITI \u0645\u0646') : l;

  /// Lessons also right about these words that the data can't mark: any ر (both ر lessons), ۫ (a merge of two نون).
  static List<String>? _quizAlso(String text, List<String>? also) {
    final extra = [if (text.contains('\u0631')) ...['ra-h', 'ra-l'], if (text.contains('\u06eb')) 'mithlayn'];
    return extra.isEmpty ? also : ({...?also, ...extra}.toList()..sort());
  }

  Lesson _lesson(Json r, int order, Json? a, Json also) {
    final id = r['id'] as String;
    String? exNote(Object key) => (a?['exampleNotes'] as Json?)?['$key'] as String?;
    final examples = [
      for (final (i, e) in ((r['examples'] as List?) ?? const []).indexed)
        _clean({
          'id': '$id#${i + 1}',
          'lessonId': id,
          'verseKey': e['verse'],
          'wordFrom': e['word_from'],
          'wordTo': e['word_to'],
          'text': e['text'],
          'focus': e['focus'],
          'stopping': e['stop'] == true,
          if (e['note'] != null) 'note': pick(e['note'], exNote(i + 1)),
          'also': _quizAlso(e['text'], (also['$id#${i + 1}'] as List?)?.cast<String>()),
          'role': e['role'],
          if (e['contrast'] != null)
            'contrast': _clean({
              'id': '$id#${i + 1}c',
              'lessonId': e['contrast']['lesson'],
              'verseKey': e['contrast']['verse'],
              'wordFrom': e['contrast']['word_from'],
              'wordTo': e['contrast']['word_to'],
              'text': e['contrast']['text'],
              'focus': e['contrast']['focus'],
              'stopping': e['contrast']['stop'] == true,
              if (e['contrast']['note'] != null) 'note': pick(e['contrast']['note'], exNote('${i + 1}c')),
            }),
        }),
    ];
    final arFacts = a?['facts'] as List?;
    final facts = [
      for (final (i, f) in ((r['facts'] as List?) ?? const []).indexed)
        {
          'id': '$id?${i + 1}',
          'lessonId': id,
          'prompt': pick(f['q'], arFacts?.elementAtOrNull(i)?['q']),
          'options': (arFacts?.elementAtOrNull(i)?['options'] as List?)?.length == (f['options'] as List).length
              ? arFacts![i]['options']
              : f['options'],
          'answer': f['answer'] is int ? f['answer'] : (f['options'] as List).indexOf(f['answer']),
          'explanation': pick(f['why'], arFacts?.elementAtOrNull(i)?['why']),
        },
    ];
    final counts = r['counts'] as Json?;
    final review = r['review'] as Json?;
    return Lesson(_clean({
      'id': id,
      'topicId': r['cat'],
      'order': order,
      'nameAr': r['ar'],
      'nameEn': pick(r['en'], a?['nameEn']),
      'colour': _noColour.contains(r['cat']) ? null : r['color'],
      'summary': pick(r['definition'], a?['definition']),
      'letters': r['letters'],
      'counts': counts?['note'] != null && a?['countsNote'] != null ? {...counts!, 'note': a!['countsNote']} : counts,
      'conditions': pick(r['conditions'], a?['conditions']),
      'tip': pick(r['tip'], a?['tip']),
      'list': pick(r['list'], a?['list']),
      'examples': examples,
      'facts': facts,
      'questionKinds': [
        if (examples.isNotEmpty && !_noIdentify.hasMatch(id)) 'identify',
        if (counts != null && r['cat'] == 'madd') 'length',
        if (facts.isNotEmpty) 'fact',
      ],
      'confusableWith': [
        for (final p in pairs)
          if (p.a == id) p.b else if (p.b == id) p.a,
      ],
      'sources': [
        for (final s in (r['sources'] as List?) ?? const [])
          s is String ? {'title': s, 'locator': ''} : {'title': s['title'], 'locator': _arLocator(s['locator'] ?? '')},
      ],
      'review': _clean({
        'status': review?['status'] == 'verified' ? 'verified' : 'needs-teacher',
        'notes': pick(review?['notes'], a?['reviewNotes']),
      }),
    }));
  }
}

/// The say-aloud drill for a مخارج / صفات lesson: each letter with سكون after a همزة; the حروف المد after a ب.
List<String> drillFor(Lesson lesson) {
  if (lesson.topicId != 'found' || lesson.letters == null) return const [];
  if (lesson.id == 'makharij-jawf') return const ['\u0628\u064e\u0627', '\u0628\u064f\u0648', '\u0628\u0650\u064a'];
  final letters = lesson.letters!
      .split(RegExp(r'[\s\u00b7:\u060c()]+'))
      .map((t) => t.replaceAll(RegExp(r'[\u0640\u064b-\u0652]'), ''))
      .where((t) => RegExp(r'^[\u0621-\u064a]$').hasMatch(t));
  return [for (final l in {...letters}) '\u0623\u064e${l == '\u0621' ? '\u0623' : l}\u0652'];
}

/* ---------------- teach (src/content/teach.ts) ---------------- */

extension type Term(Json j) {
  String get term => j['term'];
  List<String>? get forms => (j['forms'] as List?)?.cast<String>();
  List<String>? get not => (j['not'] as List?)?.cast<String>();
  String get say => j['say'];
  String get en => j['en'];
  String? get literal => j['literal'];
  String get ar => j['ar'];
  String? get arLiteral => j['arLiteral'];
  bool get aside => j['aside'] == true;
  String? get lesson => j['lesson']; // glossary entries only
}

extension type TeachText(Json j) {
  String get plain => j['plain'];
  String get fits => j['fits'];
  List<String> get how => (j['how'] as List).cast<String>();
  String get why => j['why'];
  String? get spot => j['spot'];
  List<({String wrong, String right})> get mistakes => [
    for (final m in j['mistakes'] as List) (wrong: m['wrong'] as String, right: m['right'] as String),
  ];
}

extension type Teach(Json j) {
  String get lesson => j['lesson'];
  List<Term> get terms => [for (final t in j['terms'] as List) Term(t)];
  TeachText get en => TeachText(j['en']);
  TeachText get ar => TeachText(j['ar']);
  TeachText get text => isAr ? ar : en;
}

final _teachCache = <String, Teach?>{};

/// The lesson's teaching text, or null when it has none (the Learn step then shows the rule card only).
Future<Teach?> loadTeach(String lessonId, [AssetBundle? bundle]) async {
  if (_teachCache.containsKey(lessonId)) return _teachCache[lessonId];
  Teach? t;
  try {
    t = Teach(jsonDecode(await (bundle ?? rootBundle).loadString('$_dir/teach/$lessonId.json')));
  } catch (_) {
    t = null; // no file for this lesson
  }
  return _teachCache[lessonId] = t;
}

/// Letters only: marks, tatweel and the shapes of alif/ya/hamza seats folded, so جوف, الجَوْف and الجوفُ compare equal.
String fold(String s) => s
    .replaceAll(RegExp(r'[\u064b-\u065f\u0670\u06d6-\u06ed\u0640]'), '')
    .replaceAll(RegExp(r'[\u0623\u0625\u0622\u0671]'), '\u0627')
    .replaceAll('\u0649', '\u064a');

const _pre = r'(?:^|[^\u0621-\u064a])(?:[\u0648\u0641\u0628\u0644\u0643])?(?:\u0627\u0644)?';
const _post = r'(?:\u0627\u062a|\u0627\u0646|\u064a\u0646|\u0647|\u0629)?(?=$|[^\u0621-\u064a])';
final _patterns = <String, RegExp>{};

/// Glossary terms written in [text] (Arabic script, any vowelling).
List<Term> termsIn(String text, List<Term> entries) {
  final t = fold(text);
  return entries.where((e) {
    final re = _patterns.putIfAbsent(
      e.term,
      () => RegExp(
        '$_pre(?:${[e.term, ...?e.forms].map((f) => fold(f).replaceFirst(RegExp('^\u0627\u0644'), '')).join('|')})$_post',
      ),
    );
    final u = (e.not ?? const []).fold(t, (x, n) => x.split(fold(n)).join(' '));
    return re.hasMatch(u);
  }).toList();
}
