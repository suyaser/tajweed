// A new learner on a real device: onboarding, the whole of lesson 1 with real audio, then Today, Path and the unit.
// Logs "SHOT name" when a frame is ready; tool/walk_shots.sh takes the screenshot.
//   --dart-define=WALK_LANG=ar|en --dart-define=WALK_THEME=light|dark
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:path_provider/path_provider.dart';
import 'package:tajweed/app.dart';
import 'package:tajweed/app/services.dart';
import 'package:tajweed/app/shell.dart';
import 'package:tajweed/i18n/i18n.dart';
import 'package:tajweed/main.dart';

const _lang = String.fromEnvironment('WALK_LANG', defaultValue: 'ar');
const _theme = String.fromEnvironment('WALK_THEME', defaultValue: 'light');

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('walk', (tester) async {
    final docs = await getApplicationDocumentsDirectory();
    for (final f in ['userdata.json', 'local.json', 'lang']) {
      final x = File('${docs.path}/$f');
      if (x.existsSync()) x.deleteSync();
    }
    File('${docs.path}/lang').writeAsStringSync(_lang);
    await boot();
    store.updateSettings({'theme': _theme});
    await tester.pumpWidget(TajweedApp(initialRoute: startRoute, onGenerateRoute: buildRoute));

    Future<void> idle(int ms) async {
      final end = DateTime.now().add(Duration(milliseconds: ms));
      while (DateTime.now().isBefore(end)) {
        await tester.pump(const Duration(milliseconds: 50));
        await Future<void>.delayed(const Duration(milliseconds: 50));
      }
    }

    var shots = 0;
    Future<void> shot(String name) async {
      shots++;
      await idle(900);
      debugPrint('SHOT ${_lang}_${_theme}_$name');
      await idle(2200);
    }

    Future<bool> waitFor(Finder f, {int seconds = 20}) async {
      for (var i = 0; i < seconds * 5; i++) {
        if (f.evaluate().isNotEmpty) return true;
        await idle(200);
      }
      return false;
    }

    Future<void> tap(Finder f) async {
      await waitFor(f);
      final ctx = tester.element(f.first);
      if (Scrollable.maybeOf(ctx) != null) await Scrollable.ensureVisible(ctx, alignment: 0.4);
      await idle(300);
      await tester.tap(f.first, warnIfMissed: false);
      await idle(700);
    }

    Future<void> scrollDown([double by = 600]) async {
      await tester.drag(find.byType(SingleChildScrollView).first, Offset(0, -by));
      await idle(500);
    }

    Future<void> scrollTop() async {
      await tester.drag(find.byType(SingleChildScrollView).first, const Offset(0, 5000));
      await idle(500);
    }

    final play = find.bySemanticsLabel(t('Play'));
    final played = find.text(t('Played'));

    // onboarding
    await idle(1500);
    await shot('01_welcome');
    await scrollDown(700);
    await shot('02_welcome_end');
    await tap(find.text(isAr ? 'ابدأ' : 'Begin · ابدأ'));
    await shot('03_reading');
    await tap(find.text(t('Yes, I read it')));
    await shot('04_reading_yes');
    await tap(find.text(t('Next')));
    await shot('05_how');
    await scrollDown(700);
    await shot('06_how_end');
    await tap(find.text(t('Start lesson 1')));

    // Hear
    await shot('10_hear');
    for (var i = 0; i < 3; i++) {
      final before = played.evaluate().length;
      await tap(play);
      for (var k = 0; k < 60 && played.evaluate().length <= before && find.text(t('Audio needs a connection. Read it aloud instead.')).evaluate().isEmpty; k++) {
        await idle(250);
      }
      if (i == 0) await shot('11_hear_played');
      if (find.text(t('Next word')).evaluate().isNotEmpty) await tap(find.text(t('Next word')));
    }
    await scrollTop();
    await shot('12_hear_last');
    await tap(find.text(t('Next: Learn the rule')));

    // Learn
    await shot('20_learn');
    for (var i = 1; i <= 5; i++) {
      await scrollDown(650);
      await shot('2${i}_learn_$i');
    }
    await tap(find.text(t('Next: Say it yourself')));

    // Say
    await shot('30_say');
    var n = 0;
    while (find.text(t('Sounds the same')).evaluate().isNotEmpty && n < 6) {
      await tap(play);
      for (var k = 0; k < 60 && played.evaluate().isEmpty; k++) {
        await idle(250);
      }
      if (n == 0) await shot('31_say_played');
      await tap(find.text(t('Sounds the same')));
      if (n == 0) await shot('32_say_rated');
      n++;
    }
    await scrollTop();
    await shot('33_say_done');

    // whatever else lesson 1 has (Check: answer each question), to Recite
    final option = find.byWidgetPredicate((w) => w.key is ValueKey<String> && (w.key as ValueKey<String>).value.startsWith('option-'));
    for (var i = 0; i < 8 && find.text(t('Finish lesson')).evaluate().isEmpty; i++) {
      final next = find.textContaining(isAr ? '\u0627\u0644\u062a\u0627\u0644' : 'Next');
      if (next.evaluate().isEmpty && option.evaluate().isNotEmpty) {
        await tap(option);
        await shot('4${i}_answered');
        continue;
      }
      if (next.evaluate().isEmpty) break;
      await tap(next.last);
      await scrollTop();
      await shot('4${i}_step');
    }
    if (play.evaluate().isNotEmpty) {
      await tap(play);
      for (var k = 0; k < 60 && played.evaluate().isEmpty; k++) {
        await idle(250);
      }
    }
    await scrollTop();
    await shot('50_recite');
    await tap(find.text(t('Finish lesson')));
    await shot('51_done');

    // Today, Path, the unit
    await tap(find.text(t('Back to today')));
    await shot('60_today');
    await scrollDown(700);
    await shot('61_today_end');
    await tap(find.text(isAr ? 'المسار' : 'Path').last);
    await shot('70_plan');
    await tap(find.text(t('Open the unit')));
    await shot('71_unit');
    await scrollDown(700);
    await shot('72_unit_end');
    debugPrint('SHOT done $shots'); // walk_shots.sh checks it took this many
    await idle(500);
  });
}
