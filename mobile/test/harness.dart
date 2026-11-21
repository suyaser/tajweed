// The app on temp files (store, device-local prefs, recordings, downloads), for screen tests.
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app.dart';
import 'package:tajweed/app/local.dart';
import 'package:tajweed/app/services.dart';
import 'package:tajweed/app/shell.dart';
import 'package:tajweed/audio/downloads.dart';
import 'package:tajweed/audio/recordings.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/core/store.dart';
import 'package:tajweed/i18n/i18n.dart';

late RawContent raw;

Future<void> loadAll() async {
  await loadArabic();
  raw = await loadRawContent();
}

/// Fresh services in a temp dir; `userdata` is written as the saved file first (null: none).
Directory openTemp({String? userdata, Lang language = Lang.ar}) {
  lang.value = language;
  useContent(raw);
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
  await tester.pumpWidget(TajweedApp(initialRoute: startRoute, onGenerateRoute: buildRoute));
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 400));
}
