import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app.dart';
import 'i18n/i18n.dart';
import 'spike.dart';

Future<void> main() async {
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
  runApp(TajweedApp(home: (_) => const SpikeScreen()));
}
