// Port of src/screens/Onboarding.tsx: Welcome (language, backup restore) → Can you read this? → How it works → lesson 1.
// Reciter, study time and teacher days wait in Today's "Set up your routine" card after the first lesson.
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app/recovery.dart';
import '../app/router.dart';
import '../app/services.dart';
import '../app/shell.dart';
import '../content/content.dart';
import '../core/store.dart';
import '../i18n/i18n.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'study.dart';

const _brand = '\u0645\u0633\u0627\u0631 \u0627\u0644\u062a\u062c\u0648\u064a\u062f';
const _nurania = '\u0627\u0644\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0646\u0648\u0631\u0627\u0646\u064a\u0629';

class Onboarding extends StatefulWidget {
  const Onboarding({super.key});
  @override
  State<Onboarding> createState() => _OnboardingState();
}

class _OnboardingState extends State<Onboarding> {
  int _step = 0;

  void _start() {
    store.completeOnboarding({});
    local.routinePending = true;
    final nav = Navigator.of(context);
    nav.pushAndRemoveUntil(buildRoute('today'), (_) => false); // under the lesson: ✕ returns to Today
    nav.push(buildRoute(href('learn', content.courseOrder.first)));
  }

  @override
  Widget build(BuildContext context) => PageBody(
    key: ValueKey(_step), // each step starts at the top
    children: switch (_step) {
      0 => _welcome(context),
      1 => [_ReadingCheck(onNext: () => setState(() => _step = 2))],
      _ => _how(context),
    },
  );

  List<Widget> _how(BuildContext context) {
    final c = context.c, ty = context.type;
    return [
      const _Steps(step: 2),
      Column(spacing: Space.xs, children: [
        Text('\u0643\u064a\u0641 \u064a\u0639\u0645\u0644', style: ty.arabicHeadline.copyWith(color: c.primary)),
        if (!isAr) Text(t('How the course works'), style: ty.headlineMd.copyWith(color: c.onSurface)),
        Text(t('Four things to know. You can read this again any time from Help.'), textAlign: TextAlign.center, style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
      ]),
      const Basics(),
      AppButton(label: t('Start lesson 1'), iconEnd: Icons.arrow_forward, size: ButtonSize.lg, block: true, onPressed: _start),
    ];
  }

  List<Widget> _welcome(BuildContext context) {
    final c = context.c, ty = context.type;
    return [
      Padding(
        padding: const EdgeInsets.only(top: Space.md),
        child: Column(children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(color: c.secondaryContainer, shape: BoxShape.circle),
            child: Icon(Icons.auto_stories_outlined, size: 28, color: c.onSecondaryContainer),
          ),
          const SizedBox(height: Space.xs * 2),
          Text(_brand, style: TextStyle(fontFamily: Fonts.naskh, fontSize: 32, height: 1.4, color: c.primary).weight(700)),
          Text('TAJWEED PATH', style: ty.label.copyWith(color: c.onSurfaceVariant, letterSpacing: 2.4, fontFamily: Fonts.inter)),
          const SizedBox(height: Space.sm),
          Container(width: 48, height: 2, decoration: BoxDecoration(color: c.gold, borderRadius: BorderRadius.circular(1))),
        ]),
      ),
      _AyahCard(from: '73:4', to: '73:4', ref: verseRef('73:4')),
      const _LangChoice(),
      Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.md, children: [
        const _Steps(step: 0),
        Text(t('A tajweed course on real Quran words, one lesson at a time.'), textAlign: TextAlign.center, style: ty.headlineMd.copyWith(color: c.onSurface)),
        for (final (icon, text) in [
          (Icons.headphones_outlined, t('Lessons are short (about 15 minutes): hear it, say it, then learn the rule')),
          (Icons.menu_book_outlined, t('Each lesson ends on a real passage you recite')),
          (Icons.history_edu_outlined, t('Brings rules back before you forget them')),
          (Icons.record_voice_over_outlined, t("Keeps your teacher's corrections, if you have one")),
        ])
          Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(color: c.surfaceContainerLowest, borderRadius: BorderRadius.circular(Radii.card), border: Border.all(color: c.outlineVariant)),
            child: Row(spacing: Space.md, children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
                child: Icon(icon, size: 22, color: c.primary),
              ),
              Expanded(child: Text(text, style: ty.bodyLg.copyWith(color: c.onSurface))),
            ]),
          ),
        Callout(title: t('An honest note'), child: Text(t('It does not grade your recitation. Only a teacher can. Your recordings stay on this device.'))),
      ]),
      _WelcomeActions(onNext: () => setState(() => _step = 1)),
    ];
  }
}

class _WelcomeActions extends StatefulWidget {
  const _WelcomeActions({required this.onNext});
  final VoidCallback onNext;
  @override
  State<_WelcomeActions> createState() => _WelcomeActionsState();
}

class _WelcomeActionsState extends State<_WelcomeActions> {
  String? _err;

  Future<void> _restore() async {
    try {
      final text = await pickBackupText();
      if (text == null) return;
      store.importJson(text);
      if (mounted) go(context, 'today');
    } catch (e) {
      setState(() => _err = RegExp('newer', caseSensitive: false).hasMatch('$e')
          ? t('This file is from a newer version of Tajweed Path. Update the app first.')
          : t("This file isn't a Tajweed Path backup."));
    }
  }

  @override
  Widget build(BuildContext context) => Column(spacing: Space.xs, children: [
    AppButton(
      label: isAr ? '\u0627\u0628\u062f\u0623' : 'Begin \u00b7 \u0627\u0628\u062f\u0623',
      iconEnd: Icons.arrow_forward,
      size: ButtonSize.lg,
      block: true,
      onPressed: widget.onNext,
    ),
    AppButton(label: t('I have a backup file'), icon: Icons.history, variant: ButtonVariant.ghost, onPressed: _restore),
    if (_err != null) Semantics(liveRegion: true, child: Text(_err!, style: context.type.bodyMd.copyWith(color: context.c.error))),
  ]);
}

/// The step dots and "Step n of 3 · name".
class _Steps extends StatelessWidget {
  const _Steps({required this.step});
  final int step;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final names = [t('Welcome'), t('Reading check'), t('How it works')];
    return Row(mainAxisAlignment: MainAxisAlignment.center, spacing: Space.sm, children: [
      ExcludeSemantics(
        child: Row(spacing: 4, children: [
          for (var i = 0; i < 3; i++)
            Container(
              width: i == step ? 16 : 6,
              height: 6,
              decoration: BoxDecoration(
                color: i <= step ? c.primary : c.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(3),
              ),
            ),
        ]),
      ),
      Text(t('Step {n} of {m}', {'n': step + 1, 'm': 3}), style: ty.label.copyWith(color: c.onSurfaceVariant)),
      const Sep(margin: 0),
      Text(names[step], style: ty.label.copyWith(color: c.onSurfaceVariant)),
    ]);
  }
}

/// An ayah (or two) in a card with its reference chip.
class _AyahCard extends StatelessWidget {
  const _AyahCard({required this.from, required this.to, required this.ref});
  final String from, to, ref;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Space.md, vertical: Space.lg),
      decoration: BoxDecoration(
        color: c.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(Radii.card),
        border: Border.all(color: c.outlineVariant),
        boxShadow: c.shadowCard,
      ),
      child: Column(spacing: Space.sm, children: [
        VersesOf(
          from: from,
          to: to,
          builder: (context, vs, _) => vs == null
              ? const Skeleton(height: 56, width: 240)
              : Text(
                  vs.length == 1 ? vs.first.text : [for (final v in vs) '${v.text} \ufd3f${arDigits(v.verseKey.split(':')[1])}\ufd3e'].join(' '),
                  textAlign: TextAlign.center,
                  textDirection: TextDirection.rtl,
                  style: ty.quran.copyWith(color: c.onSurface),
                ),
        ),
        AppChip(tone: ChipTone.gold, icon: Icons.bookmark_outline, label: ref),
      ]),
    );
  }
}

/// Big two-way choice (aria-pressed), 64px.
class Choice extends StatelessWidget {
  const Choice({super.key, required this.on, required this.onTap, required this.child});
  final bool on;
  final VoidCallback onTap;
  final Widget child;
  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Semantics(
      button: true,
      toggled: on,
      child: Material(
        color: on ? c.surfaceContainerLowest : c.surfaceContainerLow,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Radii.card),
          side: BorderSide(color: on ? c.primary : c.outlineVariant, width: on ? 2 : 1),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(Radii.card),
          onTap: onTap,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 64),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: Space.md),
              child: Row(spacing: Space.sm, children: [
                Expanded(child: DefaultTextStyle.merge(style: TextStyle(color: on ? c.primary : c.onSurface), child: child)),
                Icon(on ? Icons.check_circle : Icons.radio_button_unchecked, size: 22, color: on ? c.primary : c.outline),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

/// First thing on Welcome: the interface language (saved on the device; switching rebuilds the app in it).
class _LangChoice extends StatelessWidget {
  const _LangChoice();
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final arabic = Expanded(
      child: Choice(
        on: isAr,
        onTap: () => saveLang(Lang.ar),
        child: Text('\u0627\u0644\u0639\u0631\u0628\u064a\u0629', style: TextStyle(fontFamily: Fonts.sansArabic, fontSize: ty.bodyLg.fontSize).weight(600)),
      ),
    );
    final english = Expanded(
      child: Choice(
        on: !isAr,
        onTap: () => saveLang(Lang.en),
        child: Text('English', style: TextStyle(fontFamily: Fonts.inter, fontSize: 16).weight(600)),
      ),
    );
    return Semantics(
      label: 'Language \u00b7 \u0627\u0644\u0644\u063a\u0629',
      container: true,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, spacing: Space.sm, children: [
        ExcludeSemantics(
          child: Row(spacing: 6, children: [
            Icon(Icons.translate, size: 16, color: c.onSurfaceVariant),
            Text('Language', style: ty.label.copyWith(color: c.onSurfaceVariant, fontFamily: Fonts.inter)),
            const Sep(margin: 0),
            Text('\u0627\u0644\u0644\u063a\u0629', style: ty.arabicLabel.copyWith(color: c.onSurfaceVariant)),
          ]),
        ),
        // the current interface language first
        Row(spacing: Space.sm, children: isAr ? [arabic, english] : [english, arabic]),
      ]),
    );
  }
}

/// No test, no gate: an honest question, and a pointer to القاعدة النورانية for anyone who can't read yet.
class _ReadingCheck extends StatefulWidget {
  const _ReadingCheck({required this.onNext});
  final VoidCallback onNext;
  @override
  State<_ReadingCheck> createState() => _ReadingCheckState();
}

class _ReadingCheckState extends State<_ReadingCheck> {
  String? _answer;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.lg, children: [
      const _Steps(step: 1),
      Column(spacing: Space.xs, children: [
        Text(t('Can you read this?'), textAlign: TextAlign.center, style: ty.headlineMd.copyWith(color: c.onSurface)),
        Text(t('The course starts from reading Arabic with its marks (fatha, kasra, sukun\u2026). Read these aloud.'),
            textAlign: TextAlign.center, style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
      ]),
      _AyahCard(from: '112:1', to: '112:2', ref: '${verseRef('112:1')}\u2013\u0662'),
      Column(spacing: Space.sm, children: [
        Choice(on: _answer == 'yes', onTap: () => setState(() => _answer = 'yes'), child: Text(t('Yes, I read it'), style: ty.bodyLg)),
        Choice(on: _answer == 'slow', onTap: () => setState(() => _answer = 'slow'), child: Text(t('Not yet, or only slowly'), style: ty.bodyLg)),
      ]),
      if (_answer == 'slow')
        Callout(
          title: bidi(t('Start with \u0627\u0644\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0646\u0648\u0631\u0627\u0646\u064a\u0629')),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Tx(t('Learn the letters and marks first with \u0627\u0644\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0646\u0648\u0631\u0627\u0646\u064a\u0629 (a short reading primer), alongside the first units or before them. A teacher or a maqra\u02bea can take you through it; see Resources.')),
            InkWell(
              onTap: () => launchUrl(Uri.parse('https://www.youtube.com/results?search_query=${Uri.encodeComponent(_nurania)}'), mode: LaunchMode.externalApplication),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Text(bidi(t('Watch \u0627\u0644\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0646\u0648\u0631\u0627\u0646\u064a\u0629')),
                    style: ty.bodyMd.weight(600).copyWith(color: c.primary, decoration: TextDecoration.underline, decorationColor: c.primary)),
              ),
            ),
          ]),
        ),
      AppButton(label: t('Next'), iconEnd: Icons.arrow_forward, size: ButtonSize.lg, block: true, onPressed: _answer == null ? null : widget.onNext),
    ]);
  }
}

/// "How it works", the short version (guide/content.tsx Basics): onboarding and the Guide.
class Basics extends StatelessWidget {
  const Basics({super.key});
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final items = [
      ('\u0627\u0644\u0645\u0633\u0627\u0631', t('The course'), Icons.route_outlined,
          t('Ten units that follow real surahs, from \u0627\u0644\u0646\u0627\u0633 back to \u0627\u0644\u0636\u062d\u0649, then \u0627\u0644\u0641\u0627\u062a\u062d\u0629 and beyond. Lessons open one after another; each unit ends with a finale passage you recite, which opens the next unit.')),
      ('\u0627\u0644\u062f\u0631\u0633', t('A lesson'), Icons.menu_book_outlined,
          t('Seven short steps: hear real words, notice the sound, learn the rule, say it, find it in an ayah, check yourself, then recite a passage. At most two new lessons a day.')),
      ('\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629', t('Review'), Icons.history_edu_outlined,
          t('Every rule you learn is asked daily for a week, then after 3, 7, 14, 30, 60 and 120 days. Answer right and it waits longer; answer wrong and it comes back sooner.')),
      ('\u0627\u0644\u0634\u064a\u062e', t('A teacher (optional)'), Icons.record_voice_over_outlined,
          t('The app never grades your recitation. If you have a teacher, plan what to recite, log corrections in class, and they come back in your review until fixed.')),
    ];
    return Column(spacing: Space.sm, children: [
      for (final (i, (ar, en, icon, body)) in items.indexed)
        Container(
          padding: const EdgeInsets.all(Space.md),
          decoration: BoxDecoration(color: c.surfaceContainerLowest, borderRadius: BorderRadius.circular(Radii.card), border: Border.all(color: c.outlineVariant)),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, spacing: Space.md, children: [
            SizedBox(
              width: 50,
              height: 50,
              child: Stack(clipBehavior: Clip.none, children: [
                Container(
                  width: 44,
                  height: 44,
                  margin: const EdgeInsetsDirectional.only(top: 6),
                  decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
                  child: Icon(icon, size: 22, color: c.primary),
                ),
                PositionedDirectional(
                  end: 0,
                  top: 0,
                  child: Container(
                    width: 20,
                    height: 20,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: c.secondaryContainer, shape: BoxShape.circle),
                    child: Text(digits(i + 1), style: ty.caption.weight(700).copyWith(color: c.onSecondaryContainer, height: 1)),
                  ),
                ),
              ]),
            ),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, spacing: 2, children: [
                Wrap(spacing: Space.sm, crossAxisAlignment: WrapCrossAlignment.center, children: [
                  Text(en, style: ty.bodyLg.weight(600).copyWith(color: c.onSurface)),
                  if (!isAr) Text(ar, style: ty.arabicLabel.copyWith(color: c.secondary)),
                ]),
                Tx(body, style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
              ]),
            ),
          ]),
        ),
    ]);
  }
}
