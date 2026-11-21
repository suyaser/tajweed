// Onboarding: Welcome → reading check → how it works → lesson 1; the language switch rebuilds the app in English.
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app/services.dart';
import 'package:tajweed/i18n/i18n.dart';

import 'harness.dart';

void main() {
  setUpAll(loadAll);
  tearDown(() => lang.value = Lang.ar);

  Future<void> tapText(WidgetTester tester, String s) async {
    await tester.ensureVisible(find.text(s).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text(s).first);
    await tester.pumpAndSettle();
  }

  testWidgets('a new learner goes through the three steps to lesson 1', (tester) async {
    openTemp();
    await pumpApp(tester);
    expect(find.text(t('A tajweed course on real Quran words, one lesson at a time.')), findsOneWidget);
    await tapText(tester, 'ابدأ'); // Begin
    expect(find.text(t('Can you read this?')), findsOneWidget);
    await tapText(tester, t('Not yet, or only slowly'));
    expect(find.text(bidi(t('Start with القاعدة النورانية'))), findsOneWidget);
    await tapText(tester, t('Yes, I read it'));
    await tapText(tester, t('Next'));
    expect(find.text(t('Four things to know. You can read this again any time from Help.')), findsOneWidget);
    await tapText(tester, t('Start lesson 1'));
    expect(store.data.settings.onboardedOn, '2026-11-21');
    expect(local.routinePending, true);
    expect(tester.takeException(), isNull);
  });

  testWidgets('English from the language choice', (tester) async {
    openTemp();
    await pumpApp(tester);
    await tapText(tester, 'English');
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 100))); // saveLang's file write
    await tester.pumpAndSettle();
    expect(isAr, false);
    expect(find.text('A tajweed course on real Quran words, one lesson at a time.'), findsOneWidget);
    expect(find.text('Begin · ابدأ'), findsOneWidget);
  });
}
