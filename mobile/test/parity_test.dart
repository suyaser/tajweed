// Parity with the web (docs/19 §2.8): test/fixtures/*.json hold inputs and the web's outputs, written by
// src/parity.test.ts (UPDATE_FIXTURES=1). The Dart port must produce the same outputs from the same inputs.
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app/router.dart';
import 'package:tajweed/audio/player.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/core/course.dart';
import 'package:tajweed/content/rulemap.dart';
import 'package:tajweed/core/day.dart';
import 'package:tajweed/core/lesson_steps.dart';
import 'package:tajweed/core/questions.dart';
import 'package:tajweed/core/scheduler.dart';
import 'package:tajweed/core/store.dart';
import 'package:tajweed/core/types.dart';
import 'package:tajweed/i18n/i18n.dart';
import 'package:tajweed/quran/quran.dart';

dynamic fixture(String name) => jsonDecode(File('test/fixtures/$name.json').readAsStringSync());

/// Plain JSON values, as the web wrote them (drops Dart-only types).
dynamic norm(Object? x) => jsonDecode(jsonEncode(x));

void same(Object? actual, Object? expected, String what) => expect(norm(actual), expected, reason: what);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late RawContent raw;
  setUpAll(() async {
    raw = await loadRawContent();
    await loadArabic();
  });
  tearDown(() => lang.value = Lang.ar);

  void useLang(Lang l) {
    lang.value = l;
    useContent(raw);
  }

  for (final l in Lang.values) {
    test('content adapter (${l.name})', () {
      useLang(l);
      final f = fixture('content.${l.name}');
      same(content.topics, f['topics'], 'topics');
      same(content.pairs, f['pairs'], 'pairs');
      same(content.mutun, f['mutun'], 'mutun');
      expect(content.lessons.length, (f['lessons'] as List).length);
      for (final (i, lesson) in content.lessons.indexed) {
        same(lesson, f['lessons'][i], 'lesson ${lesson.id}');
      }
      same(content.units, f['units'], 'units');
      same(content.courseOrder, f['courseOrder'], 'courseOrder');
      same({for (final id in content.courseOrder) id: content.courseLesson(id)}, f['courseLessons'], 'courseLesson');
      same({for (final x in content.lessons) x.id: drillFor(x)}, f['drills'], 'drillFor');
      same({for (final u in content.units) u.id: [for (final m in content.unitMutun(u)) m.id]}, f['unitMutun'], 'unitMutun');
      for (final [w, folded] in f['folds']) {
        expect(fold(w), folded, reason: 'fold $w');
      }
      for (final [w, terms] in f['terms']) {
        expect([for (final t in termsIn(w, content.glossary)) t.term], terms, reason: 'termsIn $w');
      }
    });

    test('i18n and bidi (${l.name})', () {
      useLang(l);
      final f = fixture('i18n.${l.name}');
      for (final [one, other, n, out] in f['tn']) {
        expect(tn(one, other, n, {'x': 'X'}), out, reason: 'tn($one, $n)');
      }
      for (final [k, v, out] in f['t']) {
        expect(t(k, (v as Map).cast<String, Object>()), out, reason: 't($k)');
      }
      expect([digits('2:5'), digits(114), sep], f['digits']);
      for (final c in f['bidi']) {
        final s = c['s'] as String;
        expect(carryMarks(s), c['carry'], reason: 'carryMarks $s');
        expect(arRefs(s, content.surahName), c['refs'], reason: 'arRefs $s');
        expect(isArabicLine(s), c['arabicLine'], reason: 'isArabicLine $s');
        same([for (final p in splitBidi(s)) [p.text, p.island]], c['bidi'], 'splitBidi $s');
        same([for (final p in splitLatin(s)) [p.text, p.island]], c['latin'], 'splitLatin $s');
      }
    });

    test('questions (${l.name})', () {
      useLang(l);
      final all = content.lessons;
      dynamic p(Question? q) {
        if (q == null) return null;
        final m = Map.of(q.j);
        for (final k in ['example', 'fact']) {
          if (m[k] == null) {
            m.remove(k);
          } else {
            m[k] = m[k]['id'];
          }
        }
        return m;
      }

      for (final c in fixture('questions.${l.name}') as List) {
        final id = c['id'] as String;
        final lesson = content.getLesson(id)!;
        final i = content.courseOrder.indexOf(id);
        final introduced = content.courseOrder.take(i).toList();
        final what = '$id ${jsonEncode(Map.of(c as Map)..removeWhere((k, _) => k == 'q' || k == 'qs' || k == 'reasons'))}';
        if (c['reasons'] != null) {
          same([for (final e in lesson.examples) reasonFor(lesson, e)], c['reasons'], 'reasons $id');
        } else if (c['check'] == true) {
          same([for (final q in checkQuestions(lesson, all, introduced, 4, seeded(i))) p(q)], c['qs'], 'check $what');
        } else if (c['pretest'] == true) {
          final ctx = QuestionCtx(lessons: all, introduced: introduced, munfasilLength: 4, rng: seeded(i + 7), pretest: true, excludeExampleIds: ['$id#2']);
          same(p(makeQuestion(id, ctx)), c['q'], 'pretest $what');
        } else if (c['vs'] != null) {
          final ctx = QuestionCtx(lessons: all, introduced: introduced, munfasilLength: 4, rng: seeded(i + 9), vs: c['vs']);
          same(p(makeQuestion(id, ctx)), c['q'], 'vs $what');
        } else {
          final seed = c['seed'] as int;
          final ctx = QuestionCtx(lessons: all, introduced: introduced, munfasilLength: seed == 1 ? 4 : 5, rng: seeded(seed * 1000 + i), kind: c['kind']);
          same(p(makeQuestion(id, ctx, reps: seed, lastExampleId: '$id#1')), c['q'], what);
        }
      }
    });
  }

  test('day', () {
    final f = fixture('day');
    for (final [a, out] in f['today']) {
      expect(today(DateTime(a[0], a[1] + 1, a[2], a[3], a[4])), out, reason: 'today $a');
    }
    for (final [d, n, out] in f['addDays']) {
      expect(addDays(d, n), out, reason: 'addDays $d $n');
    }
    for (final [a, b, out] in f['diffDays']) {
      expect(diffDays(a, b), out, reason: 'diffDays $a $b');
    }
    for (final [d, w, out] in f['weekDays']) {
      expect(weekDays(d, w), out, reason: 'weekDays $d $w');
    }
  });

  test('scheduler and course (simulated learners)', () {
    useLang(Lang.en);
    final units = content.units;
    for (final s in fixture('scheduler') as List) {
      final intros = [for (final x in s['introductions']) Introduction(x)];
      final attempts = [for (final x in s['attempts']) Attempt(x)];
      final corrections = [for (final x in s['corrections']) Correction(x)];
      same(migratedFinales((s['introductions'] as List).cast<Json>(), units), s['migratedFinales'], 'migratedFinales');
      for (final at in s['at']) {
        final today = at['today'] as String;
        final what = 'seed ${s['seed']} on $today';
        final items = rebuildItems(intros, attempts, corrections, today);
        same(items, at['items'], 'rebuildItems $what');
        same(applyAttempt(items, Attempt(at['extraAttempt'])), at['applied'], 'applyAttempt $what');
        final data = UserData({
          'schemaVersion': 2, 'settings': {}, 'introductions': s['introductions'], 'items': [for (final i in items) i.j], //
          'attempts': s['attempts'], 'sessions': [], 'corrections': s['corrections'], 'days': [], 'finales': s['finales'],
        });
        same(buildQueue(data, units, today).toJson(), at['queue'], 'buildQueue $what');
        same(buildQueue(data, units, today, 10).toJson(), at['queue10'], 'buildQueue +10 $what');
        same({for (final id in content.courseOrder) id: lessonGate(data, units, id, today)}, at['gates'], 'lessonGate $what');
        same({for (final i in items) i.id: levelOf(i, attempts)}, at['levels'], 'levelOf $what');
        final p = CourseProgress.of(data, units);
        same({'kind': p.next.kind, 'id': p.next.id, 'unit': p.next.unit?.id}, at['next'], 'next $what');
        same(content.courseOrder.where(p.unlocked).toList(), at['unlocked'], 'unlocked $what');
      }
    }
  });

  test('store: migrations and backup validation', () {
    useLang(Lang.en);
    final f = fixture('store');
    for (final c in f['ok']) {
      same(migrate(c['raw'], on: f['on'], units: content.units).j, c['out'], 'migrate ${jsonEncode(c['raw']).substring(0, 60)}');
    }
    for (final c in f['bad']) {
      String? error;
      try {
        migrate(c['raw'], on: f['on'], units: content.units);
      } on StoreError catch (e) {
        error = e.message;
      }
      expect(error, c['error'], reason: 'migrate ${jsonEncode(c['raw'])}');
    }
  });

  test('quran: tajweed segments, rulemap, unit ayahs', () async {
    useLang(Lang.en);
    final f = fixture('quran');
    final keys = (f['keys'] as List).cast<String>();
    final verses = <String, Verse>{for (final k in keys) k: (await getVerse(k))!};
    for (final (i, k) in keys.indexed) {
      final v = verses[k]!;
      same(wordSegments(v), f['segments'][i], 'wordSegments $k');
      same(lessonsInAyah(v), f['inAyah'][i], 'lessonsInAyah $k');
      same({for (final l in content.lessons) if (findTargets(v, l.id).isNotEmpty) l.id: findTargets(v, l.id)}, f['targets'][i], 'findTargets $k');
    }
    final all = [for (final l in content.lessons) ...l.examples];
    for (final [id, also, noVerse] in f['also']) {
      final e = all.firstWhere((x) => x.id == id);
      same(alsoLessons(e, verses[e.verseKey], all.where((o) => o.id != id).toList()), also, 'alsoLessons $id');
      same(alsoLessons(e, null, const []), noVerse, 'alsoLessons $id without the verse');
    }
    same([for (final u in content.units) [u.id, content.unitAyahs(u)]], f['unitAyahs'], 'unitAyahs');
  });

  test('lesson steps', () {
    final f = fixture('lessonSteps');
    expect([stepIds, requiredSteps, lessonMinutes], [f['steps'], f['required'], f['minutes']]);
    var s = freshSteps('hear', '2026-11-20');
    same(s, f['fresh'], 'freshSteps');
    for (final o in f['out']) {
      final String op = o['op'], id = o['id'], on = o['on'];
      s = op == 'visit' ? visitStep(s, id, on) : op == 'complete' ? completeStep(s, id, on) : scoreCheck(s, [true, false, true], on);
      same(s, o['s'], '$op $id');
      same([missingSteps(s, (_) => true), missingSteps(s, (id) => id != 'check' && id != 'say')], o['missing'], 'missing after $op $id');
      same(missingSteps(s, (_) => true, 'recite'), o['missingExceptRecite'], 'missing except recite');
      final sc = checkScore(s);
      same({'n': sc.n, 'm': sc.m}, o['score'], 'checkScore');
    }
  });

  test('router: parseHash', () {
    for (final [h, r] in fixture('router') as List) {
      final a = parseRoute(h as String);
      same({'name': a.name, 'params': a.params, 'path': a.path}, r, 'parseRoute $h');
    }
  });

  test('player: segments, the lamp, basmala', () async {
    final f = fixture('player');
    for (final c in f['segs']) {
      final v = (await getVerse(c['key']))!;
      final segs = segsOf(v, c['reciter']);
      same(segs, c['segs'], 'segsOf ${c['key']} ${c['reciter']}');
      if (segs != null) {
        same([for (var i = 0; i < (c['at'] as List).length; i++) segAt(segs, i * 37)], c['at'], 'segAt ${c['key']}');
      }
      same([for (var w = 0; w < v.words.length; w++) segForWord(segs, w)], c['forWord'], 'segForWord ${c['key']}');
    }
    for (final [k, b] in f['basmala']) {
      expect(needsBasmala(k), b, reason: 'needsBasmala $k');
    }
  });
}
