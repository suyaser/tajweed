// The kit renders in both languages and themes at phone width without overflow, and its controls respond.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/dev/gallery.dart';
import 'package:tajweed/i18n/i18n.dart';
import 'package:tajweed/ui/kit.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late RawContent raw;
  setUpAll(() async {
    await loadArabic();
    raw = await loadRawContent();
  });
  tearDown(() {
    lang.value = Lang.ar;
    themeMode.value = ThemeMode.system;
  });

  for (final l in Lang.values) {
    for (final mode in [ThemeMode.light, ThemeMode.dark]) {
      testWidgets('gallery ${l.name} ${mode.name} at 390×844', (tester) async {
        tester.view.physicalSize = const Size(390, 844);
        tester.view.devicePixelRatio = 1;
        addTearDown(tester.view.reset);
        lang.value = l;
        themeMode.value = mode;
        useContent(raw);
        await tester.pumpWidget(TajweedApp(home: (_) => const DevGallery()));
        await tester.pumpAndSettle();
        for (var i = 0; i < 6; i++) {
          await tester.drag(find.byType(ListView), const Offset(0, -600));
          await tester.pumpAndSettle();
        }
        expect(tester.takeException(), isNull);
      });
    }
  }

  testWidgets('StepBar: skipped steps are not drawn, tapping goes to the step', (tester) async {
    lang.value = Lang.en;
    String? went;
    await tester.pumpWidget(TajweedApp(
      home: (_) => Scaffold(
        body: StepBar(
          stateOf: (id) => id == 'notice' ? StepMark.skipped : id == 'learn' ? StepMark.current : StepMark.fresh,
          onGo: (id) => went = id,
        ),
      ),
    ));
    expect(find.text('Notice'), findsNothing);
    expect(find.text('Hear'), findsOneWidget);
    await tester.tap(find.text('Check'));
    expect(went, 'check');
    expect(find.bySemanticsLabel('Learn, step 2 of 6, current'), findsOneWidget);
  });

  testWidgets('Segmented, toggle chip, nudge dismiss, disabled button', (tester) async {
    lang.value = Lang.en;
    var v = 'a', pressed = false, dismissed = false, tapped = false;
    await tester.pumpWidget(TajweedApp(
      home: (_) => Scaffold(
        body: Column(children: [
          Segmented<String>(value: v, onChanged: (x) => v = x, options: const [(value: 'a', label: 'A', icon: null), (value: 'b', label: 'B', icon: null)]),
          AppChip(label: 'Loop', pressed: pressed, onTap: () => pressed = true),
          Nudge(text: 'Hello', onDismiss: () => dismissed = true),
          AppButton(label: 'Off', onPressed: null),
          AppButton(label: 'On', onPressed: () => tapped = true),
        ]),
      ),
    ));
    await tester.tap(find.text('B'));
    await tester.tap(find.text('Loop'));
    await tester.tap(find.byTooltip('Dismiss'));
    await tester.tap(find.text('Off'));
    await tester.tap(find.text('On'));
    expect([v, pressed, dismissed, tapped], ['b', true, true, true]);
  });
}
