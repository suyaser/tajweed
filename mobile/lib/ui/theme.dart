// Theme from the generated tokens (tokens.g.dart) and the web's type scale (src/styles/app.css @utility text-*,
// docs/13 "Type scale"). Under Arabic the small roles grow so Arabic is never below 14px.
// Kept free of app imports (docs/19 §2.9: lib/ui may move to a shared package).
import 'package:flutter/material.dart';

import 'tokens.g.dart';

export 'tokens.g.dart';

/// Font families (pubspec.yaml), the web's --font-* stacks.
abstract final class Fonts {
  static const inter = 'Inter';
  static const sansArabic = 'Noto Sans Arabic';
  static const naskh = 'Noto Naskh Arabic';
  static const amiri = 'Amiri';
  static const quran = 'Amiri Quran';
  // a mark and its letter must come from one font, so the fallbacks are explicit (docs/19 §2.5)
  static const quranFallback = [amiri, naskh];
}

/// A weight that also drives the `wght` axis: Inter, Noto Sans Arabic and Noto Naskh Arabic are variable fonts.
TextStyle _w(TextStyle s, int w) =>
    s.copyWith(fontWeight: FontWeight.values[w ~/ 100 - 1], fontVariations: [FontVariation.weight(w.toDouble())]);

extension Weight on TextStyle {
  /// `style.weight(600)`: use this, not copyWith(fontWeight:), so variable fonts change too.
  TextStyle weight(int w) => _w(this, w);
}

TextStyle _s(String family, double size, double line, {int w = 400, double tracking = 0, List<String>? fallback}) => _w(
  TextStyle(
    fontFamily: family,
    fontFamilyFallback: fallback,
    fontSize: size,
    height: line / size,
    letterSpacing: tracking * size,
    leadingDistribution: TextLeadingDistribution.even,
  ),
  w,
);

/// The type roles (docs/13 table). `ar`: the Arabic UI (`:lang(ar)` sizes, Noto Sans Arabic first).
class AppType extends ThemeExtension<AppType> {
  const AppType({
    required this.caption,
    required this.label,
    required this.bodyMd,
    required this.bodyLg,
    required this.headlineMd,
    required this.headlineLg,
    required this.arabicLabel,
    required this.arabicBody,
    required this.arabicHeadline,
    required this.quran,
  });
  final TextStyle caption, label, bodyMd, bodyLg, headlineMd, headlineLg, arabicLabel, arabicBody, arabicHeadline, quran;

  factory AppType.of({required bool ar}) {
    final ui = ar ? Fonts.sansArabic : Fonts.inter;
    final fb = [ar ? Fonts.inter : Fonts.sansArabic];
    TextStyle u(double size, double line, {int w = 400, double tracking = 0}) =>
        _s(ui, size, line, w: w, tracking: tracking, fallback: fb);
    return AppType(
      caption: ar ? u(14, 20) : u(11, 16),
      label: ar ? u(14, 22, w: 500) : u(12, 18, w: 500, tracking: 0.02),
      bodyMd: ar ? u(16, 28) : u(14, 22),
      bodyLg: ar ? u(18, 30) : u(16, 26),
      headlineMd: ar ? u(20, 32, w: 600) : u(20, 28, w: 600, tracking: -0.01),
      // ponytail: the 30/38 step from 640px is for tablets (phase 3)
      headlineLg: ar ? u(24, 38, w: 600) : u(24, 32, w: 600, tracking: -0.02),
      arabicLabel: _s(Fonts.sansArabic, 14, 22, w: 500),
      arabicBody: _s(Fonts.sansArabic, 16, 28),
      arabicHeadline: _s(Fonts.naskh, 22, 34, w: 700, fallback: const [Fonts.amiri]),
      quran: _s(Fonts.quran, 28, 28 * 2.05, fallback: Fonts.quranFallback),
    );
  }

  @override
  AppType copyWith() => this;

  @override
  AppType lerp(AppType? other, double t) => t < 0.5 || other == null ? this : other;
}

ThemeData buildTheme({required Brightness brightness, required bool ar}) {
  final c = brightness == Brightness.dark ? AppColors.dark : AppColors.light;
  final type = AppType.of(ar: ar);
  final scheme = ColorScheme(
    brightness: brightness,
    primary: c.primaryFill,
    onPrimary: c.onPrimary,
    primaryContainer: c.primaryContainer,
    onPrimaryContainer: c.onPrimaryContainer,
    secondary: c.secondary,
    onSecondary: c.onSecondary,
    secondaryContainer: c.secondaryContainer,
    onSecondaryContainer: c.onSecondaryContainer,
    error: c.error,
    onError: c.onError,
    errorContainer: c.errorContainer,
    onErrorContainer: c.onErrorContainer,
    surface: c.surface,
    onSurface: c.onSurface,
    onSurfaceVariant: c.onSurfaceVariant,
    surfaceContainerLowest: c.surfaceContainerLowest,
    surfaceContainerLow: c.surfaceContainerLow,
    surfaceContainer: c.surfaceContainer,
    surfaceContainerHigh: c.surfaceContainerHigh,
    surfaceContainerHighest: c.surfaceContainerHighest,
    outline: c.outline,
    outlineVariant: c.outlineVariant,
    inverseSurface: c.inverseSurface,
    onInverseSurface: c.inverseOnSurface,
    inversePrimary: c.primary,
    scrim: c.scrim,
    shadow: Colors.black,
  );
  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    scaffoldBackgroundColor: c.background,
    fontFamily: type.bodyMd.fontFamily,
    fontFamilyFallback: type.bodyMd.fontFamilyFallback,
    textTheme: TextTheme(
      bodyMedium: type.bodyMd,
      bodyLarge: type.bodyLg,
      bodySmall: type.caption,
      labelLarge: type.label.copyWith(fontSize: type.bodyMd.fontSize),
      labelMedium: type.label,
      labelSmall: type.caption,
      titleMedium: type.bodyLg.weight(600),
      titleLarge: type.headlineMd,
      headlineSmall: type.headlineLg,
    ).apply(bodyColor: c.onSurface, displayColor: c.onSurface),
    dividerColor: c.outlineVariant,
    extensions: [c, type],
  );
}

extension ThemeX on BuildContext {
  AppColors get c => Theme.of(this).extension<AppColors>()!;
  AppType get type => Theme.of(this).extension<AppType>()!;
}
