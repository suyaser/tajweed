// Today for a new learner, after lesson 1, and with the routine card; Hijri date of a known day.
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app/services.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/i18n/i18n.dart';
import 'package:tajweed/screens/path.dart';

import 'harness.dart';

void main() {
  setUpAll(loadAll);
  tearDown(() => lang.value = Lang.ar);

  test('Hijri: 21 Nov 2026 is in Jumada al-Akhirah 1448', () {
    expect(hijri(DateTime(2026, 11, 21)), contains('١٤٤٨'));
    expect(hijri(DateTime(2026, 11, 21)), contains('جمادى'));
  });

  for (final l in Lang.values) {
    testWidgets('new learner (${l.name}): Start lesson; nothing to review', (tester) async {
      openTemp(language: l);
      store.completeOnboarding({});
      await pumpApp(tester);
      expect(find.text(t('Start lesson')), findsOneWidget);
      expect(find.text(content.getLesson(content.courseOrder.first)!.nameAr), findsOneWidget);
      expect(find.text(t('Nothing to review yet. Your first lesson starts it.')), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('after lesson 1: the next lesson and the routine card', (tester) async {
    openTemp();
    store.completeOnboarding({});
    local.routinePending = true;
    store.introduceLesson(content.courseOrder.first);
    await pumpApp(tester);
    expect(find.text(content.getLesson(content.courseOrder[1])!.nameAr), findsOneWidget);
    expect(find.text(t('Set up your routine')), findsOneWidget);
    await tester.ensureVisible(find.text(t('Done, hide this')));
    await tester.tap(find.text(t('Done, hide this')));
    await tester.pump();
    expect(find.text(t('Set up your routine')), findsNothing);
    expect(local.routinePending, false);
  });
}
