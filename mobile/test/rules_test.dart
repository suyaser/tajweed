// Rules (topics, search, the map) and a Rule card (Learn this under the definition, examples, More examples, sources).
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app/services.dart';
import 'package:tajweed/audio/player.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/i18n/i18n.dart';
import 'package:tajweed/screens/rules.dart';

import 'harness.dart';

void main() {
  setUpAll(loadAll);
  setUp(() => makePlayer = () => Player(out: InstantOut(), online: () async => true));
  tearDown(() => lang.value = Lang.ar);

  test('normalize folds marks, alef forms and ى', () {
    expect(normalize('إِخْفَاء'), 'اخفاء');
    expect(normalize('مَدّ'), 'مد');
  });

  for (final l in Lang.values) {
    testWidgets('Rules (${l.name}): topics, search, map, a card', (tester) async {
      openTemp(language: l);
      seedLearner(3);
      await open(tester, 'rules');
      final first = content.lessons.first;
      expect(find.text(first.nameAr), findsWidgets);
      await tester.enterText(find.byType(TextField), 'zzzz');
      await settle(tester);
      expect(find.textContaining('zzzz'), findsWidgets); // nothing matches
      await tester.enterText(find.byType(TextField), '');
      await settle(tester);
      await tap(tester, find.text(t('Map')));
      expect(find.textContaining(t('Tap a topic to open its section, or a rule to open its card.')), findsOneWidget);
      await tap(tester, find.text(t('List')));
      await tap(tester, find.text(first.nameAr).last);
      expect(find.text(isAr ? '\u0627\u0644\u062a\u0639\u0631\u064a\u0641' : 'WHAT IT IS'), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('a rule not learned yet: Learn this right under the definition; More examples', (tester) async {
    openTemp(language: Lang.en);
    seedLearner(1);
    final l = content.lessons.firstWhere((x) => x.examples.length > 3 && !store.data.introductions.any((i) => i.lessonId == x.id));
    await open(tester, 'rules/${l.id}');
    expect(find.text(t('Learn this')), findsOneWidget);
    final defY = tester.getTopLeft(find.text('WHAT IT IS')).dy;
    expect(tester.getTopLeft(find.text(t('Learn this'))).dy, greaterThan(defY));
    await tap(tester, find.text(t('More examples ({n})', {'n': l.examples.length - 3})));
    expect(find.text(t('Player')), findsNWidgets(l.examples.length));
    expect(tester.takeException(), isNull);
  });

  testWidgets('an unknown rule says so', (tester) async {
    openTemp();
    seedLearner(1);
    await open(tester, 'rules/nope');
    expect(find.text(t("This rule isn't in the library.")), findsOneWidget);
  });
}
