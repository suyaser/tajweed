// Kit widgets (port of src/components/kit/*, ui/button, Controls.tsx Nudge/Sheet, LessonShell StepNav), matching the
// web after the docs/17 clarity pass and the docs/18 contrast fixes. Strings go through t() (Arabic in
// src/i18n/ar/*.json). Depends only on lib/ui and lib/i18n (docs/19 §2.9).
import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../i18n/i18n.dart';
import 'theme.dart';

/* ---------------- Sep, Divider ---------------- */

/// Separator between items on one line: a small gold dot, never a "·" (it reads as ٠ next to Arabic-Indic digits).
class Sep extends StatelessWidget {
  const Sep({super.key, this.margin = 6});
  final double margin;
  @override
  Widget build(BuildContext context) => Semantics(
    label: ', ',
    child: Container(
      width: 4,
      height: 4,
      margin: EdgeInsets.symmetric(horizontal: margin),
      decoration: BoxDecoration(color: context.c.gold, shape: BoxShape.circle),
    ),
  );
}

/// The thin gold rule with a small star under a page title.
class GoldDivider extends StatelessWidget {
  const GoldDivider({super.key});
  @override
  Widget build(BuildContext context) {
    final gold = context.c.gold;
    Widget line() => Expanded(child: Container(height: 1, color: gold));
    return ExcludeSemantics(
      child: Opacity(
        opacity: 0.8,
        child: SizedBox(
          width: 128,
          child: Row(
            children: [
              line(),
              const SizedBox(width: 8),
              Icon(Icons.star, size: 12, color: gold),
              const SizedBox(width: 8),
              line(),
            ],
          ),
        ),
      ),
    );
  }
}

/* ---------------- buttons ---------------- */

enum ButtonVariant { primary, secondary, tertiary, ghost, destructive }

enum ButtonSize { normal, sm, lg }

/// DESIGN.md buttons: one primary per screen; secondary = hairline outline; tertiary = teal text. Heights 48 / 44 / 52.
class AppButton extends StatelessWidget {
  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = ButtonVariant.primary,
    this.size = ButtonSize.normal,
    this.icon,
    this.iconEnd,
    this.block = false,
    this.semanticLabel,
  });
  final String label;
  final VoidCallback? onPressed;

  /// The accessible name when it says more than the label (the web's aria-label).
  final String? semanticLabel;
  final ButtonVariant variant;
  final ButtonSize size;
  final IconData? icon;

  /// After the label (→ on Next buttons; arrow icons mirror in RTL).
  final IconData? iconEnd;

  /// Full width (the bottom bar's one action).
  final bool block;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final (Color bg, Color fg, BorderSide side) = switch (variant) {
      ButtonVariant.primary => (c.primaryFill, c.onPrimary, BorderSide.none),
      ButtonVariant.secondary => (Colors.transparent, c.onSurface, BorderSide(color: c.outlineVariant)),
      ButtonVariant.tertiary => (Colors.transparent, c.primary, BorderSide.none),
      ButtonVariant.ghost => (Colors.transparent, c.onSurfaceVariant, BorderSide.none),
      ButtonVariant.destructive => (c.error, c.onError, BorderSide.none),
    };
    final (double h, double px) = switch (size) {
      ButtonSize.normal => (48.0, 24.0),
      ButtonSize.sm => (44.0, 16.0),
      ButtonSize.lg => (52.0, 24.0),
    };
    final style = (size == ButtonSize.lg ? context.type.bodyLg : context.type.bodyMd).weight(600).copyWith(color: fg);
    final shape = RoundedRectangleBorder(borderRadius: BorderRadius.circular(Radii.control), side: side);
    return Semantics(
      button: true,
      enabled: onPressed != null,
      label: semanticLabel,
      excludeSemantics: semanticLabel != null,
      onTap: semanticLabel != null ? onPressed : null,
      child: Opacity(
        opacity: onPressed == null ? 0.5 : 1,
        child: Material(
          color: bg,
          shape: shape,
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onPressed,
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: h, minWidth: block ? double.infinity : 0),
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: px),
                child: Row(
                  mainAxisSize: block ? MainAxisSize.max : MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (icon != null) ...[Icon(icon, size: 20, color: fg), const SizedBox(width: 8)],
                    Flexible(
                      child: Text(label, style: style, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center, maxLines: 2),
                    ),
                    if (iconEnd != null) ...[const SizedBox(width: 8), Icon(iconEnd, size: 20, color: fg)],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// A 48px round icon button (top bars, dismiss). [label] is its accessible name.
class AppIconButton extends StatelessWidget {
  const AppIconButton({super.key, required this.icon, required this.label, required this.onPressed, this.color});
  final IconData icon;
  final String label;
  final VoidCallback? onPressed;
  final Color? color;
  @override
  Widget build(BuildContext context) => IconButton(
    onPressed: onPressed,
    tooltip: label,
    icon: Icon(icon, size: 22),
    color: color ?? context.c.onSurfaceVariant,
    style: IconButton.styleFrom(minimumSize: const Size(48, 48)),
  );
}

/* ---------------- chips ---------------- */

enum ChipTone { neutral, primary, gold, success, error, outline }

/// 28px pill: metadata (reference, makhraj), or a 44px toggle when [onTap] is given ([pressed] → selected).
class AppChip extends StatelessWidget {
  const AppChip({super.key, this.label, this.icon, this.tone = ChipTone.neutral, this.fill, this.pressed, this.onTap, this.semanticLabel});
  final String? label;
  final IconData? icon;
  final ChipTone tone;

  /// Filled icon (the web's FILL axis); defaults to [pressed].
  final bool? fill;
  final bool? pressed;
  final VoidCallback? onTap;

  /// Accessible name when the chip has only an icon.
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final t = pressed == true ? ChipTone.primary : tone;
    var (Color bg, Color fg, Color? border) = switch (t) {
      ChipTone.neutral => (c.surfaceContainer, c.onSurfaceVariant, null),
      ChipTone.primary => (c.primaryContainer, c.onPrimaryContainer, c.primary.withValues(alpha: 0.25)),
      ChipTone.gold => (c.secondaryContainer, c.onSecondaryContainer, null),
      ChipTone.success => (c.successContainer, c.onSuccessContainer, null),
      ChipTone.error => (c.errorContainer, c.onErrorContainer, null),
      ChipTone.outline => (Colors.transparent, c.onSurfaceVariant, c.outlineVariant),
    };
    if (onTap != null && pressed == false) (bg, border) = (c.surfaceContainerLowest, c.outlineVariant);
    final toggle = onTap != null;
    final h = toggle ? 44.0 : 28.0;
    final body = Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (icon != null) Icon(_filled(icon!, fill ?? pressed ?? false), size: 16, color: fg),
        if (icon != null && label != null) const SizedBox(width: 4),
        if (label != null)
          Flexible(
            child: Text(
              label!,
              style: context.type.label.copyWith(color: fg),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
      ],
    );
    final box = Container(
      height: h,
      constraints: BoxConstraints(minWidth: h),
      padding: EdgeInsets.symmetric(horizontal: label == null ? 0 : (toggle ? 14 : 12)),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(Radii.control),
        border: Border.all(color: border ?? Colors.transparent),
      ),
      child: body,
    );
    if (!toggle) return box;
    return Semantics(
      button: true,
      toggled: pressed,
      label: semanticLabel,
      child: Material(
        type: MaterialType.transparency,
        child: InkWell(borderRadius: BorderRadius.circular(Radii.control), onTap: onTap, child: box),
      ),
    );
  }
}

/// Outlined icons have a filled twin for the web's `fill`.
IconData _filled(IconData i, bool fill) => fill ? (_fills[i] ?? i) : i;

final _fills = <IconData, IconData>{
  Icons.check_circle_outline: Icons.check_circle,
  Icons.star_outline: Icons.star,
  Icons.bookmark_outline: Icons.bookmark,
  Icons.info_outline: Icons.info,
  Icons.headphones_outlined: Icons.headphones,
  Icons.visibility_outlined: Icons.visibility,
  Icons.menu_book_outlined: Icons.menu_book,
  Icons.record_voice_over_outlined: Icons.record_voice_over,
  Icons.fact_check_outlined: Icons.fact_check,
  Icons.verified_outlined: Icons.verified,
  Icons.speed_outlined: Icons.speed,
  Icons.error_outline: Icons.error,
};

enum Status { done, current, info, todo, warning }

/// Status pill with its icon. [label] is the caller's (already translated).
class StatusChip extends StatelessWidget {
  const StatusChip({super.key, required this.status, required this.label});
  final Status status;
  final String label;
  @override
  Widget build(BuildContext context) {
    final (tone, icon) = switch (status) {
      Status.done => (ChipTone.success, Icons.check_circle_outline),
      Status.current => (ChipTone.gold, Icons.radio_button_checked),
      Status.info => (ChipTone.primary, Icons.info_outline),
      Status.todo => (ChipTone.neutral, Icons.radio_button_unchecked),
      Status.warning => (ChipTone.error, Icons.error_outline),
    };
    return AppChip(tone: tone, icon: icon, fill: status == Status.done, label: label);
  }
}

/* ---------------- Segmented ---------------- */

/// Two to four mutually exclusive views (List / Map). [small]: the compact 40px control for settings rows.
class Segmented<V> extends StatelessWidget {
  const Segmented({super.key, required this.value, required this.onChanged, required this.options, this.small = false});
  final V value;
  final ValueChanged<V> onChanged;
  final List<({V value, String label, IconData? icon})> options;
  final bool small;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Container(
      height: small ? 40 : 48,
      padding: EdgeInsets.all(small ? 2 : 4),
      decoration: BoxDecoration(color: c.surfaceContainer, borderRadius: BorderRadius.circular(Radii.control)),
      child: Row(
        children: [
          for (final (i, o) in options.indexed) ...[if (i > 0) const SizedBox(width: 4), Expanded(child: _segment(context, o, o.value == value))],
        ],
      ),
    );
  }

  Widget _segment(BuildContext context, ({V value, String label, IconData? icon}) o, bool on) {
    final c = context.c;
    final style = (small && !isAr ? context.type.label : context.type.bodyMd).weight(on ? 600 : 500).copyWith(color: on ? c.onSurface : c.onSurfaceVariant);
    final r = BorderRadius.circular(small ? 12 : 10);
    return Semantics(
      button: true,
      selected: on,
      inMutuallyExclusiveGroup: true,
      child: Material(
        color: on ? c.surfaceContainerLowest : Colors.transparent,
        borderRadius: r,
        child: InkWell(
          borderRadius: r,
          onTap: () => onChanged(o.value),
          child: Container(
            decoration: BoxDecoration(borderRadius: r, boxShadow: on ? c.shadowCard : null),
            padding: EdgeInsets.symmetric(horizontal: small ? 12 : 16),
            alignment: Alignment.center,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (o.icon != null) ...[Icon(o.icon, size: 18, color: style.color), const SizedBox(width: 6)],
                Flexible(
                  child: Text(o.label, style: style, maxLines: 1, overflow: TextOverflow.ellipsis),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/* ---------------- cards ---------------- */

/// The white card on the sand canvas (hairline, 18px radius). [title] with its Arabic beside it in the English UI.
class Panel extends StatelessWidget {
  const Panel({super.key, this.title, this.ar, this.icon, this.aside, this.children = const [], this.padding = 16});
  final String? title;
  final String? ar;
  final IconData? icon;
  final Widget? aside;
  final List<Widget> children;
  final double padding;

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final header = title != null || aside != null;
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(padding),
      decoration: BoxDecoration(
        color: c.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(Radii.card),
        border: Border.all(color: c.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (header)
            Row(
              children: [
                Expanded(
                  child: Wrap(
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: 8,
                    runSpacing: 2,
                    children: [
                      if (icon != null) Icon(icon, size: 20, color: c.primary),
                      if (title != null) Text(title!, style: ty.bodyLg.weight(600).copyWith(color: c.onSurface)),
                      if (!isAr && ar != null)
                        Text(
                          ar!,
                          textDirection: TextDirection.rtl,
                          style: ty.arabicLabel.copyWith(color: c.onSurfaceVariant),
                        ),
                    ],
                  ),
                ),
                if (aside != null)
                  DefaultTextStyle.merge(
                    style: ty.label.copyWith(color: c.onSurfaceVariant),
                    child: aside!,
                  ),
              ],
            ),
          for (final (i, w) in children.indexed) ...[if (i > 0 || header) const SizedBox(height: Space.md), w],
        ],
      ),
    );
  }
}

/// Numbered content card. EN UI: number · English label at the start, Arabic label at the end. AR UI: Arabic only.
class SectionCard extends StatelessWidget {
  const SectionCard({super.key, this.n, required this.en, this.ar, required this.child});
  final int? n;
  final String en;
  final String? ar;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Space.md),
      decoration: BoxDecoration(
        color: c.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(Radii.card),
        border: Border.all(color: c.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              if (n != null) ...[
                Container(
                  width: 24,
                  height: 24,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: c.surfaceContainer, shape: BoxShape.circle),
                  child: Text(digits(n!), style: ty.label.weight(700).copyWith(color: c.primary, height: 1)),
                ),
                const SizedBox(width: Space.sm),
              ],
              Expanded(
                child: Text(
                  isAr ? ar ?? en : en.toUpperCase(),
                  style: ty.label.weight(600).copyWith(color: c.onSurfaceVariant, letterSpacing: isAr ? 0 : 0.6),
                ),
              ),
              if (!isAr && ar != null)
                Text(
                  ar!,
                  textDirection: TextDirection.rtl,
                  style: ty.arabicLabel.copyWith(color: c.secondary),
                ),
            ],
          ),
          const SizedBox(height: Space.sm),
          DefaultTextStyle.merge(
            style: ty.bodyMd.copyWith(color: c.onSurface),
            child: child,
          ),
        ],
      ),
    );
  }
}

/* ---------------- PageHeader ---------------- */

/// Page title (docs/13 "Page header"): ornament ۞ (when [ornament] and there is no eyebrow), the title (English ·
/// Arabic in the English UI, Arabic only in the Arabic UI), a detail line of real facts joined by [Sep], then the gold
/// divider. [stacked]: the Arabic is the title and the English a gloss under it (lessons). [plain]: no ornament and no
/// divider (lesson steps). [eyebrow] and [actions] share the top row.
class PageHeader extends StatelessWidget {
  const PageHeader({
    super.key,
    required this.en,
    this.ar,
    this.eyebrow,
    this.detail = const [],
    this.actions = const [],
    this.stacked = false,
    this.plain = false,
    this.ornament = true,
    this.secondaryDetail = const {},
  });
  final String en;

  /// Indexes of [detail] items shown in the secondary (gold) colour (Today's Hijri date).
  final Set<int> secondaryDetail;
  final String? ar;

  /// Eyebrow items (Lesson 17 of 58, Unit 2), joined by [Sep].
  final List<String>? eyebrow;
  final List<String> detail;
  final List<Widget> actions;
  final bool stacked, plain, ornament;

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final items = [
      for (final (i, x) in detail.indexed)
        if (x.isNotEmpty) (x, secondaryDetail.contains(i)),
    ];
    final arTitle = ty.arabicHeadline.copyWith(color: c.onSurface);
    return Column(
      children: [
        if (eyebrow != null || actions.isNotEmpty)
          ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 48),
            child: Row(
              children: [
                if (eyebrow != null)
                  Expanded(
                    child: Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        for (final (i, x) in eyebrow!.indexed) ...[
                          if (i > 0) const Sep(),
                          Text(
                            isAr ? x : x.toUpperCase(),
                            style: ty.label.weight(600).copyWith(color: c.secondary, letterSpacing: isAr ? 0 : 1.2),
                          ),
                        ],
                      ],
                    ),
                  )
                else
                  const Spacer(),
                ...actions,
              ],
            ),
          ),
        if (eyebrow == null && !plain && ornament)
          ExcludeSemantics(
            child: Text(
              '\u06de',
              style: TextStyle(fontFamily: Fonts.quran, fontSize: 22, height: 1, color: c.gold),
            ),
          ),
        const SizedBox(height: 4),
        if (stacked) ...[
          Text(ar ?? en, style: arTitle, textAlign: TextAlign.center, textDirection: TextDirection.rtl),
          if (!isAr)
            Text(
              en,
              style: ty.bodyLg.copyWith(color: c.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
        ] else if (isAr)
          Text(ar ?? en, style: arTitle, textAlign: TextAlign.center)
        else
          Wrap(
            alignment: WrapAlignment.center,
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 8,
            children: [
              Text(en, style: ty.headlineLg.copyWith(color: c.onSurface)),
              if (ar != null) ...[
                const Sep(margin: 0),
                Text(
                  ar!,
                  textDirection: TextDirection.rtl,
                  style: TextStyle(fontFamily: Fonts.naskh, fontSize: 22, height: 1.4, color: c.primary).weight(600),
                ),
              ],
            ],
          ),
        if (items.isNotEmpty) ...[
          const SizedBox(height: 4),
          Wrap(
            alignment: WrapAlignment.center,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              for (final (i, (x, gold)) in items.indexed) ...[
                if (i > 0) const Sep(),
                Text(x, style: ty.bodyMd.copyWith(color: gold ? c.secondary : c.onSurfaceVariant)),
              ],
            ],
          ),
        ],
        if (!plain) ...[const SizedBox(height: 10), const GoldDivider()],
      ],
    );
  }
}

/* ---------------- StepBar (the lesson's StepNav) ---------------- */

/// The lesson steps and their icons (kit/lesson.tsx STEP_ICONS, docs/13).
const stepIcons = <String, IconData>{
  'hear': Icons.headphones_outlined,
  'notice': Icons.visibility_outlined,
  'learn': Icons.menu_book_outlined,
  'say': Icons.record_voice_over_outlined,
  'find': Icons.search,
  'check': Icons.fact_check_outlined,
  'recite': Icons.verified_outlined,
};

// [Arabic, English] (LessonShell STEP_NAMES)
const _stepNames = <String, (String, String)>{
  'hear': ('\u0627\u0633\u0645\u0639', 'Hear'),
  'notice': ('\u0644\u0627\u062d\u0638', 'Notice'),
  'learn': ('\u062a\u0639\u0644\u0651\u0645', 'Learn'),
  'say': ('\u0631\u062f\u0651\u062f', 'Say'),
  'find': ('\u0627\u0633\u062a\u062e\u0631\u062c', 'Find'),
  'check': ('\u062a\u062d\u0642\u0651\u0642', 'Check'),
  'recite': ('\u0627\u0642\u0631\u0623', 'Recite'),
};
String stepName(String id) => isAr ? _stepNames[id]!.$1 : t(_stepNames[id]!.$2);

/// current | done | visited | new | pending | skipped (not in this lesson: not drawn).
enum StepMark { current, done, visited, fresh, pending, skipped }

/// Every step that exists is a button, backward or forward (docs/10 §3.1); skipped steps aren't drawn (docs/17).
class StepBar extends StatelessWidget {
  const StepBar({super.key, required this.stateOf, required this.onGo});
  final StepMark Function(String id) stateOf;
  final ValueChanged<String> onGo;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    final ids = stepIcons.keys.where((id) => stateOf(id) != StepMark.skipped).toList();
    return Semantics(
      label: t('Lesson steps'),
      container: true,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: Space.sm),
        decoration: BoxDecoration(color: c.surfaceContainerLowest, borderRadius: BorderRadius.circular(Radii.card), boxShadow: c.shadowCard),
        child: Stack(
          children: [
            PositionedDirectional(start: 24, end: 24, top: 23, child: Container(height: 1.5, color: c.surfaceContainerHighest)),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [for (final (k, id) in ids.indexed) Expanded(child: _step(context, id, k, ids.length))],
            ),
          ],
        ),
      ),
    );
  }

  Widget _step(BuildContext context, String id, int k, int count) {
    final c = context.c, ty = context.type;
    final s = stateOf(id);
    final (Color bg, Color fg) = switch (s) {
      StepMark.current || StepMark.done => (c.primaryFill, c.onPrimary),
      StepMark.visited => (c.surfaceContainerLowest, c.secondary),
      _ => (c.surfaceContainerHigh, c.outline),
    };
    final icon = s == StepMark.done ? Icons.check : _filled(stepIcons[id]!, s == StepMark.current);
    Widget node = Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
      child: Icon(icon, size: s == StepMark.current ? 18 : 16, color: fg),
    );
    if (s == StepMark.visited) node = CustomPaint(foregroundPainter: _DashedRing(c.gold), child: node);
    if (s == StepMark.current) {
      // ring-2 ring-primary ring-offset-2
      node = Container(
        padding: const EdgeInsets.all(2),
        decoration: BoxDecoration(
          color: c.surfaceContainerLowest,
          shape: BoxShape.circle,
          border: Border.all(color: c.primary, width: 2),
        ),
        child: node,
      );
    }
    final name = stepName(id);
    final label = switch (s) {
      StepMark.current => t('{x}, step {n} of {m}, current', {'x': name, 'n': k + 1, 'm': count}),
      StepMark.done => t('{x}, done', {'x': name}),
      StepMark.visited => t('{x}, visited, not finished', {'x': name}),
      _ => t('{x}, not started', {'x': name}),
    };
    final text = Text(
      name,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
      style: ty.caption
          .weight(s == StepMark.current ? 700 : 400)
          .copyWith(
            color: s == StepMark.current
                ? c.primary
                : s == StepMark.done || s == StepMark.visited
                ? c.onSurfaceVariant
                : c.outline,
          ),
    );
    final body = ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 48),
      child: Padding(
        padding: EdgeInsets.only(top: s == StepMark.current ? 4 : 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            node,
            SizedBox(height: s == StepMark.visited ? 2 : 4),
            if (s == StepMark.visited)
              Container(
                width: 4,
                height: 4,
                decoration: BoxDecoration(color: c.gold, shape: BoxShape.circle),
              ),
            ExcludeSemantics(child: text),
          ],
        ),
      ),
    );
    return Semantics(
      button: s != StepMark.pending,
      label: label,
      excludeSemantics: true,
      child: s == StepMark.pending ? body : InkWell(borderRadius: BorderRadius.circular(Radii.control), onTap: () => onGo(id), child: body),
    );
  }
}

class _DashedRing extends CustomPainter {
  _DashedRing(this.color);
  final Color color;
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final r = Rect.fromLTWH(0.5, 0.5, size.width - 1, size.height - 1);
    const n = 16;
    for (var i = 0; i < n; i++) {
      canvas.drawArc(r, i * 2 * math.pi / n, math.pi / n, false, p);
    }
  }

  @override
  bool shouldRepaint(_DashedRing old) => old.color != color;
}

/* ---------------- Nudge, BottomBar, sheet ---------------- */

/// One framed line, one action, ✕ (design §6 Nudge). Today shows at most one at a time (docs/17).
class Nudge extends StatelessWidget {
  const Nudge({super.key, required this.text, this.action, this.onDismiss});
  final String text;
  final Widget? action;
  final VoidCallback? onDismiss;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Semantics(
      container: true,
      child: Container(
        padding: const EdgeInsetsDirectional.only(start: Space.md, end: Space.xs, top: Space.sm, bottom: Space.sm),
        decoration: BoxDecoration(
          color: c.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(Radii.card),
          border: Border.all(color: c.outlineVariant),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Icon(Icons.info_outline, size: 20, color: c.secondary),
            ),
            const SizedBox(width: Space.sm),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: Space.xs),
                child: Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: Space.sm,
                  runSpacing: Space.xs,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Text(text, style: context.type.bodyMd.copyWith(color: c.onSurface)),
                    ),
                    ?action,
                  ],
                ),
              ),
            ),
            if (onDismiss != null) AppIconButton(icon: Icons.close, label: t('Dismiss'), onPressed: onDismiss),
          ],
        ),
      ),
    );
  }
}

/// The screen's one primary action, pinned to the bottom with the safe area; [hint] says what is missing while the
/// action is disabled.
class BottomBar extends StatelessWidget {
  const BottomBar({super.key, required this.child, this.hint});
  final Widget child;
  final String? hint;
  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Container(
      decoration: BoxDecoration(color: c.surface, boxShadow: c.shadowBar),
      padding: EdgeInsets.fromLTRB(Space.gutter, Space.sm, Space.gutter, math.max(Space.sm, MediaQuery.paddingOf(context).bottom)),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (hint != null) ...[
            Text(
              hint!,
              textAlign: TextAlign.center,
              style: context.type.bodyMd.copyWith(color: c.onSurfaceVariant),
            ),
            const SizedBox(height: Space.sm),
          ],
          child,
        ],
      ),
    );
  }
}

/// Bottom sheet (the web's Sheet): handle, title, close button, content. Max 85% of the screen.
Future<T?> showAppSheet<T>(BuildContext context, {required String title, required WidgetBuilder builder}) {
  final c = context.c;
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: c.surfaceContainerLowest,
    barrierColor: c.scrim,
    constraints: BoxConstraints(maxWidth: 680, maxHeight: MediaQuery.sizeOf(context).height * 0.85),
    shape: RoundedRectangleBorder(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(Radii.card)),
      side: BorderSide(color: c.outlineVariant),
    ),
    builder: (context) => SafeArea(
      top: false,
      child: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(Space.lg, Space.md, Space.lg, Space.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: c.surfaceContainerHighest, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: Space.sm),
            Row(
              children: [
                Expanded(
                  child: Text(title, style: context.type.headlineMd.copyWith(color: c.onSurface)),
                ),
                AppIconButton(icon: Icons.close, label: t('Close'), onPressed: () => Navigator.pop(context)),
              ],
            ),
            const SizedBox(height: Space.md),
            DefaultTextStyle.merge(
              style: context.type.bodyMd.copyWith(color: c.onSurface),
              child: builder(context),
            ),
          ],
        ),
      ),
    ),
  );
}

/* ---------------- Callout, EmptyState, progress, skeleton ---------------- */

enum CalloutKind { listenFor, tip, note }

/// Annotation box with a 2px gold edge on the inline start; [title] is a short label ("Listen for").
class Callout extends StatelessWidget {
  const Callout({super.key, this.kind = CalloutKind.note, this.title, this.icon, required this.child});
  final CalloutKind kind;
  final String? title;
  final IconData? icon;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final (Color box, Color badge, Color badgeFg, IconData i) = switch (kind) {
      CalloutKind.listenFor => (c.secondaryContainer.withValues(alpha: 0.6), c.secondaryContainer, c.onSecondaryContainer, Icons.hearing),
      CalloutKind.tip => (c.primaryContainer.withValues(alpha: 0.6), c.primaryContainer, c.onPrimaryContainer, Icons.lightbulb_outline),
      CalloutKind.note => (c.surfaceContainer, c.surfaceContainerHigh, c.onSurfaceVariant, Icons.info_outline),
    };
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Space.md),
      decoration: BoxDecoration(
        color: box,
        border: BorderDirectional(start: BorderSide(color: c.gold, width: 2)),
        borderRadius: const BorderRadiusDirectional.horizontal(start: Radius.circular(4), end: Radius.circular(Radii.card)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        spacing: Space.sm,
        children: [
          Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(color: badge, shape: BoxShape.circle),
            child: Icon(icon ?? i, size: 16, color: badgeFg),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 2,
              children: [
                if (title != null)
                  Text(
                    isAr ? title! : title!.toUpperCase(),
                    style: ty.label.weight(600).copyWith(color: c.secondary, letterSpacing: isAr ? 0 : 0.6),
                  ),
                DefaultTextStyle.merge(
                  style: ty.bodyMd.copyWith(color: c.onSurface),
                  child: child,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Nothing-here state: icon, title, optional body and one action (a dashed card).
class EmptyState extends StatelessWidget {
  const EmptyState({super.key, this.icon = Icons.inbox_outlined, required this.title, this.body, this.action});
  final IconData icon;
  final String title;
  final String? body;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    return CustomPaint(
      foregroundPainter: _DashedBox(c.outlineVariant, Radii.card),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Space.lg, vertical: Space.xl),
        child: Column(
          spacing: Space.sm,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(color: c.surfaceContainer, shape: BoxShape.circle),
              child: Icon(icon, color: c.onSurfaceVariant),
            ),
            Text(
              title,
              textAlign: TextAlign.center,
              style: ty.headlineMd.copyWith(color: c.onSurface),
            ),
            if (body != null)
              ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 360),
                child: Text(
                  body!,
                  textAlign: TextAlign.center,
                  style: ty.bodyMd.copyWith(color: c.onSurfaceVariant),
                ),
              ),
            if (action != null)
              Padding(
                padding: const EdgeInsets.only(top: Space.sm),
                child: action,
              ),
          ],
        ),
      ),
    );
  }
}

class _DashedBox extends CustomPainter {
  _DashedBox(this.color, this.radius);
  final Color color;
  final double radius;
  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final path = Path()..addRRect(RRect.fromRectAndRadius(Offset.zero & size, Radius.circular(radius)));
    for (final m in path.computeMetrics()) {
      for (var d = 0.0; d < m.length; d += 8) {
        canvas.drawPath(m.extractPath(d, math.min(d + 4, m.length)), p);
      }
    }
  }

  @override
  bool shouldRepaint(_DashedBox old) => old.color != color;
}

/// The web's Progress: a 8px rounded bar, primary fill.
class ProgressBar extends StatelessWidget {
  const ProgressBar({super.key, required this.value, this.label});
  final double value; // 0..1
  final String? label;
  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Semantics(
      label: label,
      value: '${(value * 100).round()}%',
      child: ClipRRect(
        borderRadius: BorderRadius.circular(4),
        child: LinearProgressIndicator(value: value.clamp(0, 1), minHeight: 8, color: c.primaryFill, backgroundColor: c.surfaceContainerHigh),
      ),
    );
  }
}

/// A grey placeholder block while text loads.
class Skeleton extends StatelessWidget {
  const Skeleton({super.key, this.height = 24, this.width});
  final double height;
  final double? width;
  @override
  Widget build(BuildContext context) => Container(
    height: height,
    width: width,
    decoration: BoxDecoration(color: context.c.surfaceContainerHigh, borderRadius: BorderRadius.circular(Radii.control)),
  );
}

/// Mixed English–Arabic content text (the web's Tx): bidi isolates, Arabic-Indic digits in Arabic, lone marks carried.
class Tx extends StatelessWidget {
  const Tx(this.text, {super.key, this.style, this.textAlign});
  final String text;
  final TextStyle? style;
  final TextAlign? textAlign;
  @override
  Widget build(BuildContext context) => Text(bidi(text), style: style, textAlign: textAlign);
}

/* ---------------- lesson pieces (kit/lesson.tsx) ---------------- */

/// Pager dots: the current one a wide pill, played ones teal; 44px buttons when [onPick] is set, later than
/// [reached] disabled.
class PagerDots extends StatelessWidget {
  const PagerDots({super.key, required this.index, required this.total, this.onPick, int? reached, this.played}) : reached = reached ?? total - 1;
  final int index, total, reached;
  final ValueChanged<int>? onPick;
  final bool Function(int)? played;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < total; i++)
          Builder(
            builder: (context) {
              final dot = AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                width: i == index ? 16 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: i == index || (played?.call(i) ?? false) ? c.primary : c.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(3),
                ),
              );
              if (onPick == null) return SizedBox(width: 12, height: 24, child: Center(child: dot));
              final on = i <= reached;
              return Semantics(
                button: true,
                enabled: on,
                label: t('Example {n} of {m}', {'n': i + 1, 'm': total}) + ((played?.call(i) ?? false) ? t(', played') : ''),
                child: InkWell(
                  onTap: on ? () => onPick!(i) : null,
                  child: SizedBox(
                    width: total > 5 ? 32 : 44,
                    height: 44,
                    child: Center(
                      child: Opacity(opacity: on ? 1 : 0.7, child: dot),
                    ),
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
}

/// One example in a lesson step (kit ExampleCard): eyebrow "Example 1 of 3" (or [eyebrow]; '' for none), reference
/// chip, the content, a controls slot, and ‹ dots › when there are several.
class ExampleFrame extends StatelessWidget {
  const ExampleFrame({
    super.key,
    required this.index,
    required this.total,
    this.eyebrow,
    this.reference,
    required this.child,
    this.controls = const [],
    this.onPrev,
    this.onNext,
    this.onPick,
    this.reached,
    this.played,
    this.flat = false,
  });
  final int index, total;
  final String? eyebrow; // '' hides it
  final String? reference;
  final Widget child;
  final List<Widget> controls;
  final VoidCallback? onPrev, onNext;
  final ValueChanged<int>? onPick;
  final int? reached;
  final bool Function(int)? played;

  /// Inside another card: no border, the low surface (Learn's "Spot it", the rule's example).
  final bool flat;

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    Widget nav(IconData icon, VoidCallback? f, String label, Color color) => IconButton(
      onPressed: f,
      tooltip: label,
      icon: Icon(icon, color: f == null ? color.withValues(alpha: 0.3) : color),
      style: IconButton.styleFrom(minimumSize: const Size(48, 48)),
    );
    final eb = eyebrow ?? t('Example {n} of {total}', {'n': index + 1, 'total': total});
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Space.md),
      decoration: BoxDecoration(
        color: flat ? c.surfaceContainerLow : c.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(flat ? Radii.control : Radii.card),
        border: flat ? null : Border.all(color: c.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: Space.md,
        children: [
          if (eb.isNotEmpty || reference != null)
            Row(
              children: [
                if (eb.isNotEmpty)
                  Expanded(
                    child: Row(
                      spacing: 6,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: BoxDecoration(color: c.gold, shape: BoxShape.circle),
                        ),
                        Flexible(
                          child: Text(
                            isAr ? eb : eb.toUpperCase(),
                            style: ty.label.weight(600).copyWith(color: c.secondary, letterSpacing: isAr ? 0 : 0.6),
                          ),
                        ),
                      ],
                    ),
                  )
                else
                  const Spacer(),
                if (reference != null) AppChip(icon: Icons.bookmark_outline, label: reference),
              ],
            ),
          ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 96),
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: Space.sm),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [child]),
            ),
          ),
          ...controls,
          if (total > 1)
            Container(
              decoration: BoxDecoration(
                border: Border(top: BorderSide(color: c.surfaceContainer)),
              ),
              padding: const EdgeInsets.only(top: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  nav(Icons.chevron_left, onPrev != null && index > 0 ? onPrev : null, t('Previous example'), c.outline),
                  PagerDots(index: index, total: total, onPick: onPick, reached: reached, played: played),
                  nav(Icons.chevron_right, onNext != null && index < total - 1 ? onNext : null, t('Next example'), c.primary),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Big round play (56px) between a "Played" status and Slower / Loop toggles.
class AudioControls extends StatelessWidget {
  const AudioControls({super.key, required this.playing, required this.onPlay, this.played = false, this.slow, this.onSlow, this.loop, this.onLoop});
  final bool playing, played;
  final VoidCallback? onPlay;
  final bool? slow, loop;
  final VoidCallback? onSlow, onLoop;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Row(
      children: [
        Expanded(
          child: Align(
            alignment: AlignmentDirectional.centerStart,
            child: played
                ? FittedBox(
                    fit: BoxFit.scaleDown,
                    child: AppChip(tone: ChipTone.primary, icon: Icons.check_circle_outline, label: t('Played')),
                  )
                : null,
          ),
        ),
        Semantics(
          button: true,
          label: playing ? t('Pause') : t('Play'),
          excludeSemantics: true,
          child: Opacity(
            opacity: onPlay == null ? 0.5 : 1,
            child: Material(
              color: c.primaryFill,
              shape: const CircleBorder(),
              elevation: 1,
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: onPlay,
                child: SizedBox(width: 56, height: 56, child: Icon(playing ? Icons.pause : Icons.play_arrow, size: 28, color: c.onPrimary)),
              ),
            ),
          ),
        ),
        Expanded(
          child: Align(
            alignment: AlignmentDirectional.centerEnd,
            child: FittedBox(
              fit: BoxFit.scaleDown,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                spacing: 6,
                children: [
                  if (onSlow != null) AppChip(icon: Icons.speed_outlined, label: t('Slower'), pressed: slow ?? false, onTap: onSlow),
                  if (onLoop != null) AppChip(icon: Icons.repeat, semanticLabel: t('Loop'), pressed: loop ?? false, onTap: onLoop),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

/// Numbered beats for a length in counts: 1…min solid, up to max dashed.
class CountBeats extends StatelessWidget {
  const CountBeats({super.key, required this.min, int? max, this.size = 32}) : max = max ?? min;
  final int min, max;
  final double size;
  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Semantics(
      label: min == max ? t('{n} counts', {'n': min}) : t('{min} to {max} counts', {'min': min, 'max': max}),
      excludeSemantics: true,
      child: Wrap(
        spacing: 6,
        runSpacing: 6,
        alignment: WrapAlignment.center,
        children: [
          for (var n = 1; n <= max; n++)
            CustomPaint(
              foregroundPainter: n > min ? _DashedBox(c.outline, size / 2) : null,
              child: Container(
                width: size,
                height: size,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: n <= min ? c.primaryContainer : null, shape: BoxShape.circle),
                child: Text(digits(n), style: context.type.label.weight(600).copyWith(color: n <= min ? c.onPrimaryContainer : c.onSurfaceVariant)),
              ),
            ),
        ],
      ),
    );
  }
}

/// One Arabic letter (with an optional name under it).
class LetterTile extends StatelessWidget {
  const LetterTile({super.key, required this.letter, this.name, this.bare = false});
  final String letter;
  final String? name;
  final bool bare; // inside an answer tile: no box
  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Container(
      constraints: const BoxConstraints(minWidth: 56, minHeight: 64),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: bare
          ? null
          : BoxDecoration(
              color: c.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(Radii.control),
              border: Border.all(color: c.outlineVariant),
            ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            letter,
            textDirection: TextDirection.rtl,
            style: TextStyle(fontFamily: Fonts.naskh, fontSize: 28, height: 1.3, color: c.onSurface).weight(600),
          ),
          if (name != null) Text(name!, style: context.type.caption.copyWith(color: c.onSurfaceVariant)),
        ],
      ),
    );
  }
}

/* ---------------- grouped lists (Controls.tsx Group, Row) ---------------- */

/// A titled grouped list: the label (Arabic beside it in the English UI), then rows divided by hairlines in one card.
class Group extends StatelessWidget {
  const Group({super.key, required this.en, this.ar, required this.children});
  final String en;
  final String? ar;
  final List<Widget> children;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    return Semantics(
      container: true,
      label: isAr ? ar ?? en : en,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: Space.xs,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.xs),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Text(
                    isAr ? ar ?? en : en.toUpperCase(),
                    style: ty.label.weight(600).copyWith(color: c.onSurfaceVariant, letterSpacing: isAr ? 0 : 1.2),
                  ),
                ),
                if (!isAr && ar != null)
                  Text(
                    ar!,
                    textDirection: TextDirection.rtl,
                    style: ty.arabicLabel.copyWith(color: c.secondary),
                  ),
              ],
            ),
          ),
          Container(
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(
              color: c.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(Radii.card),
              border: Border.all(color: c.outlineVariant),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final (i, w) in children.indexed) ...[if (i > 0) Divider(height: 1, color: c.outlineVariant), w],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// One grouped-list row: icon tile, label and hint, then the control ([stack]: under the label). [onTap] makes it a
/// link with a chevron.
class ListRow extends StatelessWidget {
  const ListRow({super.key, this.icon, required this.label, this.hint, this.child, this.onTap, this.stack = false, this.danger = false});
  final IconData? icon;
  final String label;
  final String? hint;
  final Widget? child;
  final VoidCallback? onTap;
  final bool stack, danger;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final head = Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: 12,
      children: [
        if (icon != null)
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(color: danger ? c.errorContainer : c.surfaceContainer, borderRadius: BorderRadius.circular(Radii.control)),
            child: Icon(icon, size: 20, color: danger ? c.onErrorContainer : c.onSurfaceVariant),
          ),
        Expanded(
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 36),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(label, style: (isAr ? ty.bodyLg : ty.bodyMd).weight(600).copyWith(color: danger ? c.error : c.onSurface)),
                if (hint != null) Tx(hint!, style: (isAr ? ty.bodyMd : ty.label).weight(400).copyWith(color: c.onSurfaceVariant)),
              ],
            ),
          ),
        ),
        if (!stack && child != null && onTap == null) child!,
        if (onTap != null) Icon(Icons.chevron_right, color: c.outline),
      ],
    );
    final body = Padding(
      padding: const EdgeInsets.symmetric(horizontal: Space.md, vertical: 12),
      child: stack && child != null ? Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.sm, children: [head, child!]) : head,
    );
    return onTap == null
        ? body
        : InkWell(
            onTap: onTap,
            child: ConstrainedBox(constraints: const BoxConstraints(minHeight: 56), child: body),
          );
  }
}
