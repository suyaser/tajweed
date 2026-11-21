import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'spike.dart';
import 'ui/theme.dart';

void main() {
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
  runApp(MaterialApp(
    title: 'Tajweed Path',
    themeMode: ThemeMode.system,
    theme: buildTheme(brightness: Brightness.light, ar: true),
    darkTheme: buildTheme(brightness: Brightness.dark, ar: true),
    home: const SpikeScreen(),
  ));
}
