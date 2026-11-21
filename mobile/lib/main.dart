import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:intl/date_symbol_data_local.dart';

import 'app.dart';
import 'app/services.dart';
import 'app/shell.dart';
import 'audio/player.dart';
import 'core/store.dart';
import 'content/content.dart';
import 'dev/gallery.dart';
import 'dev/quran_page.dart';
import 'i18n/i18n.dart';

Future<void> main() async {
  await boot();
  // --dart-define=DEV_PAGE=quran | gallery opens a dev page (device checks, screenshots).
  const page = String.fromEnvironment('DEV_PAGE');
  runApp(page.isEmpty
      ? TajweedApp(initialRoute: startRoute, onGenerateRoute: buildRoute)
      : TajweedApp(home: (_) => page == 'quran' ? const QuranPage() : const DevGallery()));
}

/// Everything before the first frame (also the device walk, integration_test/walk_test.dart).
Future<void> boot() async {
  LicenseRegistry.addLicense(() async* {
    for (final (font, file) in [
      ('Amiri Quran', 'OFL-AmiriQuran.txt'),
      ('Amiri', 'OFL-Amiri.txt'),
      ('Noto Naskh Arabic', 'OFL-NotoNaskhArabic.txt'),
      ('Noto Sans Arabic', 'OFL-NotoSansArabic.txt'),
      ('Inter', 'OFL-Inter.txt'),
    ]) {
      yield LicenseEntryWithLineBreaks([font], await rootBundle.loadString('assets/fonts/$file'));
    }
  });
  WidgetsFlutterBinding.ensureInitialized();
  await loadArabic();
  await configurePlaybackSession(); // iOS `playback`: the silent switch doesn't mute recitation
  await initializeDateFormatting();
  final raw = await loadRawContent();
  lang.value = await loadLang() ?? Lang.ar; // per device; Arabic until the learner picks (onboarding)
  useContent(raw);
  lang.addListener(() => useContent(raw)); // before the app rebuilds for the new language
  await openServices();
  void applySettings() {
    final s = store.data.settings;
    themeMode.value = switch (s.theme) { 'light' => ThemeMode.light, 'dark' => ThemeMode.dark, _ => ThemeMode.system };
    uiScale.value = switch (s.textSize) { 'l' => 1.125, 'xl' => 1.25, _ => 1.0 };
  }

  applySettings();
  store.addListener(applySettings);
}
