// The course map and a unit: the current unit open with its lessons; a unit's finale opens the next unit.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app/services.dart';
import 'package:tajweed/app/shell.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/i18n/i18n.dart';

import 'harness.dart';

void main() {
  setUpAll(loadAll);
  tearDown(() => lang.value = Lang.ar);

  for (final l in Lang.values) {
    testWidgets('plan (${l.name}): the current unit is open with its next lesson', (tester) async {
      openTemp(language: l);
      store.completeOnboarding({});
      await pumpApp(tester);
      final nav = tester.state<NavigatorState>(find.byType(Navigator).first);
      go(nav.context, 'plan');
      await tester.pumpAndSettle();
      final u = content.units.first;
      expect(find.text(t('Open the unit')), findsOneWidget);
      expect(find.text(content.getLesson(u.lessonIds.first)!.nameAr), findsOneWidget);
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('unit: after its lessons, "I recited it" completes the finale', (tester) async {
    openTemp();
    store.completeOnboarding({});
    final u = content.units.firstWhere((u) => u.finale != null && u.lessonIds.isNotEmpty);
    for (final x in content.units.takeWhile((x) => x.id != u.id)) {
      for (final id in x.lessonIds) {
        store.introduceLesson(id);
      }
      if (x.finale != null) store.completeFinale(x.id);
    }
    for (final id in u.lessonIds) {
      store.introduceLesson(id);
    }
    await pumpApp(tester);
    final nav = tester.state<NavigatorState>(find.byType(Navigator).first);
    go(nav.context, 'unit/${u.id}?finale=1');
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 300)));
    await tester.pumpAndSettle();
    final done = find.text(t('I recited it'));
    await tester.ensureVisible(done);
    await tester.pumpAndSettle();
    await tester.tap(done);
    await tester.pumpAndSettle();
    expect(store.data.finales.any((f) => f.unitId == u.id), true);
    expect(find.text(t('Unit {n} complete.', {'n': u.n})), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
