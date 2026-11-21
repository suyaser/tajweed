// Mutun: the marked lines, memorise mode (tap to reveal), a rule chip opens the rule; an unknown matn.
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/i18n/i18n.dart';

import 'harness.dart';

void main() {
  setUpAll(loadAll);
  tearDown(() => lang.value = Lang.ar);

  for (final l in Lang.values) {
    testWidgets('tuhfa lines 10-12 (${l.name})', (tester) async {
      openTemp(language: l);
      seedLearner(1);
      await open(tester, 'mutun/tuhfa?from=10&to=12');
      final line = content.mutun.firstWhere((m) => m.matn == 'tuhfa' && m.n == 10);
      expect(find.textContaining(line.ajz, findRichText: true), findsOneWidget);
      await tap(tester, find.text(t('Memorise')));
      expect(find.text(line.ajz), findsNothing);
      await tap(tester, find.text(line.sadr));
      expect(find.text(line.ajz), findsOneWidget);
      await tap(tester, find.text(t('Show whole lines')));
      final rule = content.getLesson(line.lessonIds.first)!;
      await tap(tester, find.text(rule.nameAr).first);
      expect(find.text(t('Learn this')), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('an unknown matn', (tester) async {
    openTemp();
    seedLearner(1);
    await open(tester, 'mutun/nope');
    expect(find.text(t("This text isn't in the app.")), findsOneWidget);
  });
}
