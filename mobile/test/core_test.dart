// Store, day and rng contract. Behaviour against the web's own logic is in parity_test.dart (fixtures from TS).
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/core/day.dart';
import 'package:tajweed/core/questions.dart';
import 'package:tajweed/core/store.dart';
import 'package:tajweed/i18n/i18n.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late Directory dir;
  late File file;
  var now = DateTime(2026, 3, 10, 9);
  AppStore store() => AppStore(file, content.units, clock: () => now);

  setUpAll(() async {
    lang.value = Lang.en;
    useContent(await loadRawContent());
  });
  setUp(() {
    dir = Directory.systemTemp.createTempSync('store');
    file = File('${dir.path}/userdata.json');
    now = DateTime(2026, 3, 10, 9);
  });
  tearDown(() => dir.deleteSync(recursive: true));

  test('day: 03:00 rollover, UTC arithmetic, Saturday weeks', () {
    expect(today(DateTime(2026, 3, 10, 2, 59)), '2026-03-09');
    expect(today(DateTime(2026, 3, 10, 3)), '2026-03-10');
    expect(today(DateTime(2026, 1, 1, 1)), '2025-12-31');
    expect(addDays('2026-03-28', 2), '2026-03-30');
    expect(diffDays('2026-04-01', '2026-03-01'), 31);
    expect(weekDays('2026-03-10').first, '2026-03-07'); // a Saturday
    expect(isoOf(DateTime.utc(2026, 3, 10, 9, 5, 7, 123, 456)), '2026-03-10T09:05:07.123Z');
  });

  test('seeded is mulberry32, bit for bit the web (values from node)', () {
    final r = seeded(42), m = seeded(-7);
    expect([r(), r(), r()], [0.6011037519201636, 0.44829055899754167, 0.8524657934904099]);
    expect([m(), m(), m()], [0.43306733411736786, 0.32539576734416187, 0.5442695003002882]);
  });

  test('store: defaults, onboarding, lessons, attempts, finale, persisted to the file', () {
    final s = store();
    expect(s.data.settings.reciterId, 'husary-muallim');
    expect(s.data.finales, isEmpty);
    s.completeOnboarding({'teacherDays': [4]});
    final ids = content.courseOrder.take(2).toList();
    ids.forEach(s.introduceLesson);
    s.introduceLesson(ids[0]); // twice: no-op
    expect(s.data.items.map((i) => i.id), ids.map((id) => 'lesson:$id'));
    final a = s.recordAttempt({'refId': ids[0], 'kind': 'lesson', 'source': 'review', 'correct': true, 'countsForSchedule': true});
    expect(a.itemId, 'lesson:${ids[0]}');
    expect(s.data.items.first.reps, 1);
    s.completeFinale('u1');
    s.completeFinale('u1');
    expect(s.data.finales.map((f) => f.unitId), ['u1']);
    final saved = jsonDecode(file.readAsStringSync());
    expect(saved['settings']['teacherDays'], [4]);
    expect(saved['settings']['onboardedOn'], '2026-03-10');
    expect(store().data.j, jsonDecode(jsonEncode(s.data.j))); // a fresh store reads the same data
  });

  test('corrections: log, suggest, resolve, undo', () {
    final s = store();
    final c = s.logCorrection(verseKey: '1:7', severity: 'jali', lessonIds: [content.lessons.first.id]);
    expect(s.data.items.firstWhere((i) => i.refId == c.id).state, 'manzil');
    expect(s.suggestPassages(), contains(equals({'from': '1:7', 'to': '1:7', 'reason': 'correction'})));
    s.resolveCorrection(c.id, correct: true, sessionId: 's1');
    expect(s.data.corrections.first.j['resolvedInSessionId'], 's1');
    expect(s.data.items.firstWhere((i) => i.refId == c.id).state, 'closed');
    final d = s.logCorrection(verseKey: '2:2', severity: 'khafi');
    s.undoCorrection(d.id);
    expect(s.data.items.where((i) => i.refId == d.id), isEmpty);
  });

  test('backup: export/import round trip; bad files change nothing', () {
    final s = store();
    s.introduceLesson(content.courseOrder.first);
    final json = s.exportJson();
    expect(s.data.settings.lastExportOn, '2026-03-10');
    s.resetAll();
    expect(s.data.introductions, isEmpty);
    s.importJson(json);
    expect(s.data.introductions.single.lessonId, content.courseOrder.first);
    final before = jsonEncode(s.data.j);
    for (final (text, msg) in [
      ('{', 'This file is not valid JSON.'),
      ('{"a":1}', 'Not a Tajweed Path backup (no schema version).'),
      ('{"schemaVersion":9}', 'This backup is from a newer version of the app (schema 9).'),
      ('{"schemaVersion":2,"settings":{}}', 'Backup is missing "introductions".'),
    ]) {
      expect(() => s.importJson(text), throwsA(isA<StoreError>().having((e) => e.message, 'message', msg)));
    }
    expect(jsonEncode(s.data.j), before);
  });

  test('an unreadable file is kept untouched and offered back', () {
    file.writeAsStringSync('{"schemaVersion": 99}');
    final s = store();
    expect(s.loadError!.message, contains('newer version'));
    s.updateSettings({'theme': 'dark'});
    expect(file.readAsStringSync(), '{"schemaVersion": 99}');
    s.resetAll();
    expect(s.loadError, isNull);
    expect(jsonDecode(file.readAsStringSync())['schemaVersion'], schemaVersion);
  });

  test('v1 backup: finales migrated, retired fields dropped, wrong-typed settings reset', () {
    final s = store();
    s.importJson(jsonEncode({
      'schemaVersion': 1,
      'phases': [1],
      'settings': {'munfasilLength': '5', 'theme': 'dark', 'introCourseDone': true},
      'introductions': [], 'attempts': [], 'sessions': [], 'corrections': [], 'days': [null, {'id': '2026-01-01'}],
    }));
    expect(s.data.schemaVersion, 2);
    expect(s.data.j.containsKey('phases'), isFalse);
    expect(s.data.settings.munfasilLength, 4);
    expect(s.data.settings.theme, 'dark');
    expect(s.data.settings.j.containsKey('introCourseDone'), isFalse);
    expect(s.data.days.single.parts['sabaq'], isNull);
    expect(s.data.finales, isA<List>());
  });
}
