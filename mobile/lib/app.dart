// Root: theme, locale and direction. A language switch rebuilds everything under a new key (the web reloads), so
// every screen and the content adapter read one fixed language.
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'i18n/i18n.dart';
import 'ui/theme.dart';

/// The theme the learner chose (settings.theme: system / light / dark).
final themeMode = ValueNotifier<ThemeMode>(ThemeMode.system);

/// Text size (settings.textSize m / l / xl): the web zooms the whole UI by 1, 1.125, 1.25 on top of the system size.
final uiScale = ValueNotifier<double>(1);

class TajweedApp extends StatelessWidget {
  const TajweedApp({super.key, this.home, this.initialRoute, this.onGenerateRoute});
  final WidgetBuilder? home;
  final String Function()? initialRoute; // read on every rebuild (a language switch starts over)
  final Route<void> Function(String name)? onGenerateRoute;

  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: Listenable.merge([lang, themeMode, uiScale]),
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
        home: home == null ? null : Builder(builder: home!),
        initialRoute: initialRoute?.call(),
        onGenerateInitialRoutes: onGenerateRoute == null ? null : (name) => [onGenerateRoute!(name)],
        onGenerateRoute: onGenerateRoute == null ? null : (s) => onGenerateRoute!(s.name ?? 'today'),
        builder: (context, child) {
          final mq = MediaQuery.of(context);
          final scale = uiScale.value;
          return MediaQuery(
            data: mq.copyWith(textScaler: TextScaler.linear(mq.textScaler.scale(1) * scale)),
            child: child!,
          );
        },
      );
    },
  );
}
