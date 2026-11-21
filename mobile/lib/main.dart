import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'spike.dart';

void main() {
  LicenseRegistry.addLicense(() async* {
    for (final (font, file) in [
      ('Amiri Quran', 'OFL-AmiriQuran.txt'),
      ('Amiri', 'OFL-Amiri.txt'),
      ('Noto Naskh Arabic', 'OFL-NotoNaskhArabic.txt'),
    ]) {
      yield LicenseEntryWithLineBreaks([font], await rootBundle.loadString('assets/fonts/$file'));
    }
  });
  runApp(MaterialApp(
    title: 'Tajweed Path',
    themeMode: ThemeMode.system,
    darkTheme: ThemeData(brightness: Brightness.dark),
    home: const SpikeScreen(),
  ));
}
