// Progress: a new learner's empty states; a learner with lessons, answers and a teacher correction (from a backup).
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app/services.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/i18n/i18n.dart';

import 'harness.dart';

void main() {
  setUpAll(loadAll);
  tearDown(() => lang.value = Lang.ar);

  testWidgets('new learner: the empty lines', (tester) async {
    openTemp();
    store.completeOnboarding({});
    await open(tester, 'progress');
    expect(find.text(t('Levels start after your first lesson.')), findsOneWidget);
    expect(find.text(t("Your teacher's corrections will show here after your first session.")), findsOneWidget);
  });

  for (final l in Lang.values) {
    testWidgets('a learner (${l.name}): levels, a correction, all rules, goals', (tester) async {
      openTemp(language: l);
      seedLearner(4);
      final d = Map<String, dynamic>.from(store.data.j);
      final id = content.courseOrder.first;
      d['corrections'] = [
        {
          'id': 'c1',
          'verseKey': '1:2',
          'severity': 'jali',
          'lessonIds': [id],
          'status': 'open',
          'createdAt': '2026-11-20T08:00:00.000Z',
          'on': '2026-11-20',
        },
      ];
      store.importJson(jsonEncode(d));
      await open(tester, 'progress');
      expect(find.text(t('Corrected most')), findsOneWidget);
      await tap(tester, find.text(t('See all rules')));
      expect(find.text(t('teacher correction open')), findsOneWidget);
      await tap(tester, find.text(t('Goals')));
      expect(find.textContaining(isAr ? '١' : 'S1'), findsWidgets);
      await tap(tester, find.text(t('Plan')));
      expect(find.text(t('Progress')), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }
}
