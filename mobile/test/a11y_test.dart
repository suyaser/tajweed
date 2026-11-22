// Accessibility across the screens, in both languages (docs/19 §2.8, release QA): every tap target has a label,
// and at 200% system text nothing overflows (the page scrolled to its end too).
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app/services.dart';
import 'package:tajweed/audio/player.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/i18n/i18n.dart';

import 'harness.dart';

void main() {
  setUpAll(loadAll);
  setUp(() => makePlayer = () => Player(out: InstantOut(), online: () async => true));
  tearDown(() => lang.value = Lang.ar);

  List<String> routes() => [
    'today',
    'plan',
    'progress',
    'rules',
    'rules/${content.lessons.first.id}',
    'unit/${content.units.first.id}',
    'learn/${content.courseOrder.first}',
    'review?go=1',
    'listen/112',
    'mutun/tuhfa',
    'settings',
    'resources',
    'guide',
  ];

  Future<void> toEnd(WidgetTester tester) async {
    for (final s in find.byType(Scrollable).evaluate().toList()) {
      final st = (s as StatefulElement).state as ScrollableState;
      if (st.axisDirection != AxisDirection.down) continue;
      st.position.jumpTo(st.position.maxScrollExtent);
      await tester.pump(const Duration(milliseconds: 100));
    }
  }

  testWidgets('a row that opens a page is its own button, not part of its group', (tester) async {
    final handle = tester.ensureSemantics();
    openTemp(language: Lang.en);
    seedLearner(1);
    await open(tester, 'settings');
    await tester.scrollUntilVisible(find.text(t('Credits and sources')), 300, scrollable: find.byType(Scrollable).first);
    expect(tester.getSemantics(find.text(t('Credits and sources'))), containsSemantics(isButton: true, hasTapAction: true, label: t('Credits and sources')));
    handle.dispose();
  });

  for (final l in Lang.values) {
    testWidgets('tap targets are labelled (${l.name})', (tester) async {
      final handle = tester.ensureSemantics();
      openTemp(language: l);
      for (final r in routes()) {
        openTemp(language: l);
        seedLearner(5);
        await open(tester, r);
        await expectLater(tester, meetsGuideline(labeledTapTargetGuideline), reason: r);
        await toEnd(tester);
        await expectLater(tester, meetsGuideline(labeledTapTargetGuideline), reason: '$r (end)');
      }
      handle.dispose();
    });

    testWidgets('200% text: no overflow (${l.name})', (tester) async {
      tester.platformDispatcher.textScaleFactorTestValue = 2;
      addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
      // every overflow on every page, with the widget that overflowed (lib/…:line)
      final bad = <String>{};
      var at = '';
      final prev = FlutterError.onError;
      FlutterError.onError = (d) => bad.add('$at: ${d.exceptionAsString().split('\n').first.trim()} '
          '${RegExp(r'lib/[^ ]+:\d+').firstMatch(d.toString())?.group(0) ?? ''}');
      openTemp(language: l);
      for (final r in routes()) {
        openTemp(language: l);
        seedLearner(5);
        at = r;
        await open(tester, r);
        await toEnd(tester);
        await settle(tester);
      }
      FlutterError.onError = prev;
      expect(bad, isEmpty);
    });
  }
}
