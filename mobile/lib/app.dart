// Root: theme, locale and direction. A language switch rebuilds everything under a new key (the web reloads), so
// every screen and the content adapter read one fixed language.
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'i18n/i18n.dart';
import 'ui/theme.dart';

/// The theme the learner chose (settings.theme: system / light / dark).
final themeMode = ValueNotifier<ThemeMode>(ThemeMode.system);

class TajweedApp extends StatelessWidget {
  const TajweedApp({super.key, required this.home});
  final WidgetBuilder home;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: Listenable.merge([lang, themeMode]),
    builder: (context, _) {
      final a = isAr;
      return MaterialApp(
        key: ValueKey(lang.value),
        title: 'Tajweed Path',
        debugShowCheckedModeBanner: false,
        locale: Locale(a ? 'ar' : 'en'),
        supportedLocales: const [Locale('ar'), Locale('en')],
        localizationsDelegates: GlobalMaterialLocalizations.delegates,
        themeMode: themeMode.value,
        theme: buildTheme(brightness: Brightness.light, ar: a),
        darkTheme: buildTheme(brightness: Brightness.dark, ar: a),
        home: Builder(builder: home),
      );
    },
  );
}
