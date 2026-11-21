// The shell: where the app opens, tabs and pushed screens, Recovery on unreadable data.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app/services.dart';
import 'package:tajweed/app/shell.dart';
import 'package:tajweed/i18n/i18n.dart';

import 'harness.dart';

void main() {
  setUpAll(loadAll);
  tearDown(() => lang.value = Lang.ar);

  testWidgets('unreadable data opens Recovery; Start fresh goes to onboarding', (tester) async {
    openTemp(userdata: '{not json');
    expect(startRoute(), 'recovery');
    await pumpApp(tester);
    expect(find.text(t('Your saved data could not be read')), findsOneWidget);
    await tester.tap(find.text(t('Start fresh')).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text(t('Start fresh')).last); // the dialog's
    await tester.pumpAndSettle();
    expect(store.loadError, isNull);
    expect(startRoute(), 'onboarding');
  });

  testWidgets('tabs replace the stack; a pushed screen has Back; unknown paths say so', (tester) async {
    openTemp();
    store.completeOnboarding({});
    await pumpApp(tester);
    final nav = tester.state<NavigatorState>(find.byType(Navigator).first);
    go(nav.context, 'unit/u1');
    await tester.pumpAndSettle();
    expect(find.byTooltip(t('Back')), findsOneWidget);
    await tester.tap(find.text('الأحكام').last); // Rules tab
    await tester.pumpAndSettle();
    expect(nav.canPop(), false);
    go(nav.context, 'nope/x/y');
    await tester.pumpAndSettle();
    expect(find.text(t("This page doesn't exist.")), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
}
