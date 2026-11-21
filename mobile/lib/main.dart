import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'app.dart';
import 'content/content.dart';
import 'dev/gallery.dart';
import 'i18n/i18n.dart';

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
  final raw = await loadRawContent();
  useContent(raw);
  lang.addListener(() => useContent(raw)); // before the app rebuilds for the new language
  // Until the screens are ported (docs/19 §3) the app opens on the dev gallery; the spike is one tap away.
  runApp(TajweedApp(home: (_) => const DevGallery()));
}
