// Lesson 1 end to end on a fake audio engine (every clip "plays" at once): steps, saved step state, self-ratings,
// the finished lesson in the store. And a later lesson's gate, Check questions and the Rule sheet.
import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app/services.dart';
import 'package:tajweed/app/shell.dart';
import 'package:tajweed/audio/player.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/i18n/i18n.dart';
import 'package:tajweed/quran/verse.dart';

import 'harness.dart';

/// Plays instantly: playing, then ended.
class InstantOut implements AudioOut {
  final _events = StreamController<AudioEvent>.broadcast();
  @override
  Duration position = Duration.zero;
  @override
  Duration? duration = const Duration(seconds: 1);
  @override
  Future<void> open(Uri uri, {Duration? start, Duration? end}) async {}
  @override
  void play() {
    _events.add(AudioEvent.playing);
    Timer(const Duration(milliseconds: 50), () => _events.add(AudioEvent.ended));
  }

  @override
  void pause() {}
  @override
  Future<void> setSpeed(double rate) async {}
  @override
  Stream<AudioEvent> get events => _events.stream;
  @override
  Future<void> dispose() => _events.close();
}

void main() {
  setUpAll(loadAll);
  setUp(() => makePlayer = () => Player(out: InstantOut(), online: () async => true));
  tearDown(() => lang.value = Lang.ar);

  Future<void> settle(WidgetTester tester) async {
    for (var i = 0; i < 10; i++) {
      await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 30)));
      await tester.pump(const Duration(milliseconds: 100));
    }
  }

  Future<void> tap(WidgetTester tester, Finder f) async {
    final ctx = tester.element(f.first);
    if (Scrollable.maybeOf(ctx) != null) await Scrollable.ensureVisible(ctx, alignment: 0.3);
    await tester.pump();
    await tester.tap(f.first);
    await settle(tester);
  }

  Future<NavigatorState> open(WidgetTester tester, String path) async {
    await pumpApp(tester);
    final nav = tester.state<NavigatorState>(find.byType(Navigator).first);
    go(nav.context, path);
    await settle(tester);
    return nav;
  }

  for (final l in Lang.values) {
    testWidgets('lesson 1 (${l.name}): every step to Finish lesson', (tester) async {
      openTemp(language: l);
      store.completeOnboarding({});
      final id = content.courseOrder.first;
      await open(tester, 'learn/$id');
      // Hear: play each word, Next word, then on
      final play = find.bySemanticsLabel(t('Play'));
      for (var i = 0; i < 3; i++) {
        await tap(tester, play);
        final nextWord = find.text(t('Next word'));
        if (nextWord.evaluate().isNotEmpty) await tap(tester, nextWord);
      }
      expect((local.getSteps(id)!['done'] as List), contains('hear'));
      await tap(tester, find.text(t('Next: Learn the rule')));
      expect(local.getSteps(id)!['current'], 'learn');
      expect(find.text(t('Read each part, top to bottom. Play the example.')), findsOneWidget);
      await tap(tester, find.text(t('Next: Say it yourself')));
      // Say: play, then rate each word in the bottom bar
      var rated = 0;
      while (find.text(t('Sounds the same')).evaluate().isNotEmpty && rated < 6) {
        await tap(tester, play);
        await tap(tester, find.text(t('Sounds the same')));
        rated++;
      }
      expect(store.data.attempts.where((a) => a.source == 'selfrate').length, rated);
      final steps = local.getSteps(id)!;
      expect(steps['done'], contains('say'));
      // on through whatever else this lesson has (Check: answer each), to Recite
      final option = find.byWidgetPredicate((w) => w.key is ValueKey<String> && (w.key as ValueKey<String>).value.startsWith('option-'));
      for (var i = 0; i < 12 && find.text(t('Finish lesson')).evaluate().isEmpty; i++) {
        final next = find.textContaining(isAr ? 'التال' : 'Next');
        if (next.evaluate().isEmpty && option.evaluate().isNotEmpty) await tap(tester, option);
        if (next.evaluate().isNotEmpty) await tap(tester, next.last);
      }
      // Recite: play an example (or the passage), then finish
      if (find.bySemanticsLabel(t('Play')).evaluate().isNotEmpty) await tap(tester, play);
      if (find.text(t('Listen')).evaluate().isNotEmpty) await tap(tester, find.text(t('Listen')));
      await tap(tester, find.text(t('Finish lesson')));
      expect(store.data.introductions.map((i) => i.lessonId), contains(id));
      expect(find.text(t('Back to today')), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('a later lesson is gated; an unlocked one has Check questions and the Rule sheet', (tester) async {
    openTemp();
    store.completeOnboarding({});
    final ids = content.courseOrder;
    await open(tester, 'learn/${ids[3]}');
    expect(find.text(t('Read the card')), findsOneWidget);
    expect(local.getSteps(ids[3]), isNull); // a gate saves nothing
  });

  testWidgets('lesson 3 (tabii): Notice, Find, Check and Recite; attempts saved; the Rule sheet', (tester) async {
    openTemp();
    store.completeOnboarding({});
    final ids = content.courseOrder;
    final d = Map<String, dynamic>.from(store.data.j);
    d['introductions'] = [
      {'lessonId': ids[0], 'on': '2026-11-19', 'at': '2026-11-19T08:00:00.000Z'},
      {'lessonId': ids[1], 'on': '2026-11-20', 'at': '2026-11-20T08:00:00.000Z'},
    ];
    store.importJson(jsonEncode(d));
    final id = ids[2];
    await open(tester, 'learn/$id');
    final play = find.bySemanticsLabel(t('Play'));
    // Hear
    for (var i = 0; i < 3; i++) {
      await tap(tester, play);
      if (find.text(t('Next word')).evaluate().isNotEmpty) await tap(tester, find.text(t('Next word')));
    }
    await tap(tester, find.text(t('Next: Notice the difference')));
    // Notice: play both by ear, pick one
    await tap(tester, play.at(0));
    await tap(tester, find.bySemanticsLabel(t('Play')).at(1));
    await tap(tester, find.text(t('This one')));
    expect(local.getSteps(id)!['done'], contains('notice'));
    await tap(tester, find.text(t('Next: Learn the rule')));
    await tap(tester, find.text(t('Next: Say it yourself')));
    // Say, with the Rule sheet open and closed
    await tap(tester, find.text(t('Rule')));
    expect(find.text(t('Remember')), findsWidgets);
    await tap(tester, find.byTooltip(t('Close')));
    while (find.text(t('Sounds the same')).evaluate().isNotEmpty) {
      await tap(tester, play);
      await tap(tester, find.text(t('Sounds the same')));
    }
    final steps = local.getSteps(id)!;
    expect(steps['find'], true);
    await tap(tester, find.text(t('Next: Find it in an ayah')));
    await tap(tester, find.byType(WordToken));
    await tap(tester, find.text(t('Check ({n} picked)', {'n': 1})));
    await tap(tester, find.text(t('Next: Check what you know')));
    final option = find.byWidgetPredicate((w) => w.key is ValueKey<String> && (w.key as ValueKey<String>).value.startsWith('option-'));
    for (var i = 0; i < 4 && find.text(t('Finish lesson')).evaluate().isEmpty; i++) {
      await tap(tester, option);
      final next = find.text(t('Next question')).evaluate().isNotEmpty ? find.text(t('Next question')) : find.text(t('Next: Recite the passage'));
      await tap(tester, next);
    }
    expect(store.data.attempts.where((a) => a.source == 'learn' && a.refId.isNotEmpty), isNotEmpty);
    expect(local.getSteps(id)!['check'], isNotNull);
    // Recite: listen to the passage, then finish
    await tap(tester, find.text(t('Listen')));
    await tap(tester, find.text(t('Finish lesson')));
    expect(store.data.introductions.map((i) => i.lessonId), contains(id));
    expect(find.text(t('Checks: {n} of {m}', {'n': (local.getSteps(id)!['check'] as List).where((x) => x == true).length, 'm': (local.getSteps(id)!['check'] as List).length})), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
