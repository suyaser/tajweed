import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/ui/theme.dart';

void main() {
  test('tokens carry the docs/18 contrast values (generated from app.css)', () {
    expect(AppColors.light.onSurfaceVariant, const Color(0xff4f4942));
    expect(AppColors.light.outline, const Color(0xff686157));
    expect(AppColors.light.gold, const Color(0xff94702a));
    expect(AppColors.light.error, const Color(0xffb23232));
    expect(AppColors.light.success, const Color(0xff176f3b));
    expect(AppColors.dark.surfaceContainerLow, const Color(0xff292724));
    expect(AppColors.dark.surfaceContainerLowest, const Color(0xff1f1e1b));
    expect(AppColors.dark.outlineVariant, const Color(0xff45413a));
    expect(AppColors.dark.primary, const Color(0xff5fd3c2));
    expect(AppColors.dark.primaryFill, const Color(0xff23756a));
    expect(Radii.control, 14);
    expect(Radii.card, 18);
    expect(Space.target, 48);
  });

  test('type scale: Arabic never below 14px, Latin roles as docs/13', () {
    final ar = AppType.of(ar: true), en = AppType.of(ar: false);
    for (final s in [ar.caption, ar.label, ar.bodyMd, ar.bodyLg, ar.arabicLabel, ar.arabicBody]) {
      expect(s.fontSize, greaterThanOrEqualTo(14));
    }
    expect([en.caption.fontSize, en.label.fontSize, en.bodyMd.fontSize, en.bodyLg.fontSize], [11, 12, 14, 16]);
    expect(en.bodyMd.fontFamily, Fonts.inter);
    expect(ar.bodyMd.fontFamily, Fonts.sansArabic);
    expect(ar.quran.height, 2.05);
    expect(en.headlineLg.fontVariations, [const FontVariation.weight(600)]);
  });
}
