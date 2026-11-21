// The app on temp files (store, device-local prefs, recordings, downloads), for screen tests.
import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app.dart';
import 'package:tajweed/app/local.dart';
import 'package:tajweed/app/services.dart';
import 'package:tajweed/app/shell.dart';
import 'package:tajweed/audio/downloads.dart';
import 'package:tajweed/audio/player.dart';
import 'package:tajweed/audio/recordings.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/core/store.dart';
import 'package:tajweed/i18n/i18n.dart';
import 'package:tajweed/quran/quran.dart';
import 'package:tajweed/screens/review.dart';

late RawContent raw;

Future<void> loadAll() async {
  await loadArabic();
  raw = await loadRawContent();
}

/// Fresh services in a temp dir; `userdata` is written as the saved file first (null: none).
Directory openTemp({String? userdata, Lang language = Lang.ar}) {
  lang.value = language;
  clearSurahCache();
  rootBundle.clear(); // cached futures from an earlier test's zone never complete in this one
  useContent(raw);
  forgetReviewRun();
  final dir = Directory.systemTemp.createTempSync('app');
  final f = File('${dir.path}/userdata.json');
  if (userdata != null) f.writeAsStringSync(userdata);
  store = AppStore(f, content.units, clock: () => DateTime(2026, 11, 21, 10));
  local = Local(File('${dir.path}/local.json'));
  recordings = Recordings(Directory('${dir.path}/rec'));
  downloads = Downloads(Directory('${dir.path}/audio'));
  return dir;
}

Future<void> pumpApp(WidgetTester tester) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  // the record plugin: no microphone in tests
  tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(const MethodChannel('com.llfbandit.record/messages'), (_) async => null);
  await tester.pumpWidget(TajweedApp(initialRoute: startRoute, onGenerateRoute: buildRoute));
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 400));
}

/// Plays instantly: playing, then ended.
class InstantOut implements AudioOut {
  final _events = StreamController<AudioEvent>.broadcast();
  @override
  Duration position = Duration.zero;
  @override
  Duration? duration = const Duration(seconds: 1);
  @override
  Future<void> open(Uri uri, {Duration? start, Duration? end}) async {}
  @override
  void play() {
    _events.add(AudioEvent.playing);
    Timer(const Duration(milliseconds: 50), () => _events.add(AudioEvent.ended));
  }

  @override
  void pause() {}
  @override
  Future<void> setSpeed(double rate) async {}
  @override
  Stream<AudioEvent> get events => _events.stream;
  @override
  Future<void> dispose() => _events.close();
}

Future<void> settle(WidgetTester tester) async {
  for (var i = 0; i < 10; i++) {
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 30)));
    await tester.pump(const Duration(milliseconds: 100));
  }
}

Future<void> tap(WidgetTester tester, Finder f) async {
  final ctx = tester.element(f.first);
  if (Scrollable.maybeOf(ctx) != null) await Scrollable.ensureVisible(ctx, alignment: 0.3);
  await tester.pump();
  await tester.tap(f.first);
  await settle(tester);
}

Future<NavigatorState> open(WidgetTester tester, String path) async {
  await pumpApp(tester);
  final nav = tester.state<NavigatorState>(find.byType(Navigator).first);
  go(nav.context, path);
  await settle(tester);
  return nav;
}

/// A learner who has done the first [n] lessons, one a day up to yesterday (items due today), onboarded.
void seedLearner(int n) {
  store.completeOnboarding({});
  final d = Map<String, dynamic>.from(store.data.j);
  d['introductions'] = [
    for (var i = 0; i < n; i++)
      {
        'lessonId': content.courseOrder[i],
        'on': '2026-11-${(20 - n + i + 1).toString().padLeft(2, '0')}',
        'at': '2026-11-${(20 - n + i + 1).toString().padLeft(2, '0')}T08:00:00.000Z',
      },
  ];
  store.importJson(jsonEncode(d));
}
