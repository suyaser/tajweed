// A learner who has finished five lessons, on a real device: Today, Review, Listen, Rules (list, map), a Rule card,
// Mutun, Progress, Settings, Resources and the Guide, with a screenshot per step. Logs "SHOT name" when a frame is
// ready; tool/walk_shots.sh takes the screenshot:
//   tool/walk_shots.sh ios <udid> <dir> ar light integration_test/screens_test.dart
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:path_provider/path_provider.dart';
import 'package:tajweed/app.dart';
import 'package:tajweed/app/services.dart';
import 'package:tajweed/app/shell.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/core/day.dart';
import 'package:tajweed/i18n/i18n.dart';
import 'package:tajweed/main.dart';

const _lang = String.fromEnvironment('WALK_LANG', defaultValue: 'ar');
const _theme = String.fromEnvironment('WALK_THEME', defaultValue: 'light');

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('screens', (tester) async {
    final docs = await getApplicationDocumentsDirectory();
    for (final f in ['userdata.json', 'local.json', 'lang']) {
      final x = File('${docs.path}/$f');
      if (x.existsSync()) x.deleteSync();
    }
    File('${docs.path}/lang').writeAsStringSync(_lang);
    await boot();
    // five lessons done, one a day up to yesterday, and a few answers: reviews are due today
    final day = today();
    store.completeOnboarding({});
    final d = Map<String, dynamic>.from(store.data.j);
    d['settings'] = {...d['settings'] as Map, 'theme': _theme, 'onboardedOn': addDays(day, -6)};
    d['introductions'] = [
      for (var i = 0; i < 5; i++) {'lessonId': content.courseOrder[i], 'on': addDays(day, i - 5), 'at': '${addDays(day, i - 5)}T08:00:00.000Z'},
    ];
    store.importJson(jsonEncode(d));
    await tester.pumpWidget(TajweedApp(initialRoute: startRoute, onGenerateRoute: buildRoute));

    Future<void> idle(int ms) async {
      final end = DateTime.now().add(Duration(milliseconds: ms));
      while (DateTime.now().isBefore(end)) {
        await tester.pump(const Duration(milliseconds: 50));
        await Future<void>.delayed(const Duration(milliseconds: 50));
      }
    }

    Future<void> shot(String name) async {
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
      await tester.drag(find.byWidgetPredicate((w) => w is SingleChildScrollView && w.scrollDirection == Axis.vertical).first, Offset(0, -by));
      await idle(500);
    }

    Future<void> open(String path) async {
      go(tester.state<NavigatorState>(find.byType(Navigator).first).context, path);
      await idle(1200);
    }

    final option = find.byWidgetPredicate((w) => w.key is ValueKey<String> && (w.key as ValueKey<String>).value.startsWith('option-'));

    // Today
    await idle(1500);
    await shot('a0_today');

    // Review: the سبق offer, then two questions (one missed on purpose, so it comes back)
    await open('review');
    await shot('b0_review_offer');
    await tap(find.text(t('Review first')));
    await shot('b1_review_question');
    await tap(option.last);
    await shot('b2_review_answered');
    for (var i = 0; i < 30 && find.text(t('Review done.')).evaluate().isEmpty; i++) {
      await tap(find.text(t('Next')));
      if (find.text(t('Review done.')).evaluate().isNotEmpty) break;
      if (i == 0) await shot('b3_review_next');
      await tap(option.first);
    }
    await shot('b4_review_done');

    // Listen: 112, play and stop
    await open('listen/112');
    await shot('c0_listen');
    await tap(find.bySemanticsLabel(RegExp('^${RegExp.escape(t('Play'))} ')));
    await idle(2500);
    await shot('c1_listen_playing');
    final pause = find.bySemanticsLabel(RegExp('^${RegExp.escape(t('Pause'))} '));
    if (pause.evaluate().isNotEmpty) await tap(pause); // still playing
    await scrollDown(700);
    await shot('c2_listen_record');

    // Rules, the map, a rule card (istiadha: 9:1 بَرَآءَةٌ with the focus)
    await open('rules');
    await shot('d0_rules');
    await scrollDown(900);
    await shot('d1_rules_list');
    await open('rules');
    await tap(find.text(t('Map')));
    await shot('d2_rules_map');
    await open('rules/istiadha');
    await shot('d3_rule');
    await scrollDown(700);
    await shot('d4_rule_examples');
    await scrollDown(900);
    await shot('d5_rule_end');
    await open('rules/lazim-k');
    await scrollDown(700);
    await shot('d6_rule_lazim');

    // Mutun: tuhfa 10–12 marked, memorise
    await open('mutun/tuhfa?from=10&to=12');
    await shot('e0_mutun');
    await tap(find.text(t('Memorise')));
    await shot('e1_mutun_memorise');

    // Progress
    await open('progress');
    await shot('f0_progress');
    await scrollDown(700);
    await shot('f1_progress_more');
    await tap(find.text(t('Goals')));
    await scrollDown(900);
    await shot('f2_progress_goals');

    // Settings
    await open('settings');
    await shot('g0_settings');
    await scrollDown(700);
    await shot('g1_settings_recitation');
    await scrollDown(700);
    await shot('g2_settings_data');
    await scrollDown(900);
    await shot('g3_settings_end');

    // Resources and the Guide
    await open('resources');
    await shot('h0_resources');
    await scrollDown(1400);
    await shot('h1_resources_more');
    await scrollDown(1600);
    await shot('h2_resources_credits');
    await open('guide');
    await shot('i0_guide');
    await scrollDown(900);
    await shot('i1_guide_more');
    debugPrint('SHOT done');
    await idle(500);
  });
}
