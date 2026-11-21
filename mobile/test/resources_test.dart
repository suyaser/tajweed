// Resources (panels, episodes, credits incl. fonts, licences) and the Guide, read from content/*.json; phase-2 parts hidden.
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/i18n/i18n.dart';

import 'harness.dart';

void main() {
  setUpAll(loadAll);
  tearDown(() => lang.value = Lang.ar);

  for (final l in Lang.values) {
    testWidgets('resources (${l.name})', (tester) async {
      openTemp(language: l);
      seedLearner(1);
      await open(tester, 'resources');
      expect(find.text('Qutor'), findsOneWidget);
      expect(find.bySemanticsLabel(t('Episode {n}', {'n': 6})), findsOneWidget);
      expect(find.textContaining('Bring your teacher log'), findsNothing); // phase 2
      expect(find.text(t('Fonts')), findsOneWidget);
      expect(find.textContaining('everyayah.com', findRichText: true), findsWidgets);
      expect(find.text(t('Licences')), findsOneWidget);
      expect(tester.takeException(), isNull);
    });

    testWidgets('guide (${l.name})', (tester) async {
      openTemp(language: l);
      seedLearner(1);
      await open(tester, 'guide');
      expect(find.text(t('The short version:')), findsOneWidget);
      expect(find.text(t('The course')), findsWidgets);
      expect(find.text(t('Account and circles (optional)')), findsNothing); // phase 2
      expect(find.text(t('With a teacher (optional)')), findsNothing);
      expect(tester.takeException(), isNull);
    });
  }
}
