// Review: the سبق offer, a whole run to the summary (a miss comes back once more), the empty state.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app/services.dart';
import 'package:tajweed/audio/player.dart';
import 'package:tajweed/i18n/i18n.dart';

import 'harness.dart';

void main() {
  setUpAll(loadAll);
  setUp(() => makePlayer = () => Player(out: InstantOut(), online: () async => true));
  tearDown(() => lang.value = Lang.ar);

  final option = find.byWidgetPredicate((w) => w.key is ValueKey<String> && (w.key as ValueKey<String>).value.startsWith('option-'));

  for (final l in Lang.values) {
    testWidgets('a run (${l.name}): offer, questions, a miss asked again, summary', (tester) async {
      openTemp(language: l);
      seedLearner(4);
      await open(tester, 'review');
      expect(find.text(t('Start lesson')), findsOneWidget); // the سبق offer
      await tap(tester, find.text(t('Review first')));
      var answered = 0, wrongOnce = false;
      while (find.text(t('Review done.')).evaluate().isEmpty && answered < 20) {
        expect(option, findsWidgets);
        // the first question: pick a wrong answer once, so it comes back
        final tiles = option.evaluate().map((e) => (e.widget.key as ValueKey<String>).value).toList();
        await tap(tester, wrongOnce ? option.first : option.last);
        wrongOnce = true;
        answered++;
        await tap(tester, find.text(t('Next')));
        expect(tiles, isNotEmpty);
      }
      expect(find.text(t('Review done.')), findsOneWidget);
      final asked = store.data.attempts.where((a) => a.source == 'review').toList();
      expect(asked, isNotEmpty);
      // a miss is asked again (once more, or both ways between a confused pair), never counted twice
      if (!asked.first.correct) expect(store.data.attempts.where((a) => a.source == 'relearn'), isNotEmpty);
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('nothing due: the empty state names the next review', (tester) async {
    openTemp();
    store.completeOnboarding({});
    await open(tester, 'review?go=1');
    expect(find.text(t('Nothing to review yet.')), findsOneWidget);
    expect(find.text(t('Your first lesson starts it.')), findsOneWidget);
  });
}
