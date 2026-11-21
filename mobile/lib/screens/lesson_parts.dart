// The lesson's building blocks: ports of src/screens/study/QuestionView.tsx, Teach.tsx, RuleBody.tsx, Drill.tsx,
// CorrectionStep.tsx, Hint.tsx and Summary.tsx. No tajweed colours in any of them.
import 'package:flutter/material.dart';

import '../app/router.dart';
import '../app/services.dart';
import '../app/shell.dart';
import '../audio/compare.dart';
import '../content/content.dart';
import '../core/day.dart';
import '../core/questions.dart';
import '../core/types.dart' hide Passage;
import '../i18n/i18n.dart';
import '../quran/verse.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'path.dart';
import 'study.dart';

/// The step's one instruction line, with the step's icon (LessonShell Instruction).
class Instruction extends StatelessWidget {
  const Instruction({super.key, required this.icon, required this.text});
  final IconData icon;
  final String text;
  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Space.md, vertical: Space.sm),
      decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.card)),
      child: Row(spacing: Space.sm, children: [
        Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(color: c.secondaryContainer, shape: BoxShape.circle),
          child: Icon(icon, size: 18, color: c.onSecondaryContainer),
        ),
        Expanded(child: Semantics(header: true, child: Tx(text, style: context.type.bodyLg.weight(500).copyWith(color: c.onSurface)))),
      ]),
    );
  }
}

/// "What you just did", on arrival from the previous step (LessonShell DoneLine).
class DoneLine extends StatelessWidget {
  const DoneLine({super.key, required this.text});
  final String text;
  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Semantics(
      liveRegion: true,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: Space.md, vertical: Space.sm),
        decoration: BoxDecoration(color: c.successContainer, borderRadius: BorderRadius.circular(Radii.card)),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, spacing: Space.sm, children: [
          Icon(Icons.check_circle, size: 20, color: c.onSuccessContainer),
          Expanded(child: Tx(text, style: context.type.bodyMd.copyWith(color: c.onSuccessContainer))),
        ]),
      ),
    );
  }
}

/* ---------------- QuestionView ---------------- */

enum QMode { pretest, check, review, relearn }

const _beats = {'2': (2, 2), '246': (2, 6), '6': (6, 6)};
(int, int) _beatsOf(Option o) => _beats[o.id] ?? (o.labelEn == '4' ? (4, 4) : o.labelEn == '5' ? (5, 5) : (4, 5));
final _isLetters = RegExp(r'^[\u0600-\u06ff](\s[\u0600-\u06ff])*$');

/// One question (design §5.3–5.5): prompt, the ayah, answer tiles, feedback in place, Next.
class QuestionView extends StatefulWidget {
  const QuestionView({
    super.key,
    required this.q,
    required this.mode,
    required this.audio,
    required this.onAnswer,
    required this.onNext,
    this.nextLabel,
    this.eyebrow,
    this.note,
  });
  final Question q;
  final Widget? note; // above the question (Review: halfway, the confusable hint)
  final QMode mode;
  final StudyAudio audio;
  final void Function(String chosen, bool correct) onAnswer; // once, on the tap: write the attempt here
  final VoidCallback onNext;
  final String? nextLabel;
  final String? eyebrow;
  @override
  State<QuestionView> createState() => _QuestionViewState();
}

class _QuestionViewState extends State<QuestionView> {
  String? _chosen;

  void _choose(String id) {
    if (_chosen != null) return;
    setState(() => _chosen = id);
    widget.onAnswer(id, id == widget.q.answerId);
  }

  String _state(String id) {
    final q = widget.q, pre = widget.mode == QMode.pretest;
    if (_chosen == null) return 'idle';
    if (id == q.answerId) return pre ? 'revealed' : (_chosen == id ? 'correct' : 'revealed');
    if (id != _chosen) return 'idle';
    return pre ? 'picked' : 'wrong';
  }

  @override
  Widget build(BuildContext context) {
    final q = widget.q, c = context.c, ty = context.type;
    final ex = q.example;
    Widget body(List<Verse>? vs) {
      final v = vs?.firstOrNull;
      return Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.md, children: [
        if (widget.eyebrow != null) Text(widget.eyebrow!, style: ty.label.weight(600).copyWith(color: c.secondary)),
        ?widget.note,
        Panel(children: [
          Tx(q.prompt, style: ty.bodyLg.weight(500).copyWith(color: c.onSurface)),
          if (ex != null)
            ExampleVerse(
              ex: ex,
              verse: v,
              size: VerseSize.focus,
              actions: [PlayButton(audio: widget.audio, label: t('the ayah'), onTap: v == null ? null : () => widget.audio.ayah(v))],
            ),
        ]),
        if (ex != null) Text(t('Read it aloud, then choose.'), textAlign: TextAlign.center, style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
        Semantics(
          label: t('Answers'),
          child: Column(spacing: Space.sm, children: [
            for (var i = 0; i < q.options.length; i += 2)
              IntrinsicHeight(
                child: Row(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.sm, children: [
                  Expanded(child: _tile(context, q.options[i])),
                  Expanded(child: i + 1 < q.options.length ? _tile(context, q.options[i + 1]) : const SizedBox.shrink()),
                ]),
              ),
          ]),
        ),
        if (_chosen != null) ...[
          _feedback(context, v),
          AppButton(label: widget.nextLabel ?? t('Next'), iconEnd: Icons.arrow_forward, size: ButtonSize.lg, block: true, onPressed: widget.onNext),
        ],
      ]);
    }

    return ex == null ? body(null) : VersesOf(from: ex.verseKey, builder: (context, vs, _) => body(vs));
  }

  Widget _tile(BuildContext context, Option o) {
    final q = widget.q, c = context.c, ty = context.type;
    final s = _state(o.id);
    final (Color bg, Color border, Color fg) = switch (s) {
      'picked' => (c.primaryContainer, c.primary, c.onPrimaryContainer),
      'correct' => (c.successContainer, c.success, c.onSuccessContainer),
      'revealed' => (c.surfaceContainerLowest, c.success, c.onSurface),
      'wrong' => (c.errorContainer, c.error, c.onErrorContainer),
      _ => (c.surfaceContainerLowest, c.outlineVariant, c.onSurface),
    };
    final glyph = s == 'wrong' ? Icons.undo : s == 'correct' ? Icons.check_circle : s == 'revealed' ? Icons.check_circle_outline : null;
    Widget content;
    if (q.kind == 'length') {
      final (min, max) = _beatsOf(o);
      content = Column(mainAxisSize: MainAxisSize.min, spacing: 4, children: [
        CountBeats(min: min, max: max, size: 24),
        Text(countsText(pick(o.labelEn, o.labelAr)), style: ty.label.copyWith(color: fg)),
      ]);
    } else if (q.kind == 'fact') {
      content = _isLetters.hasMatch(o.labelAr.trim())
          ? Wrap(alignment: WrapAlignment.center, textDirection: TextDirection.rtl, spacing: 6, children: [
              for (final l in o.labelAr.trim().split(RegExp(r'\s'))) LetterTile(letter: l, bare: true),
            ])
          : Tx(o.labelAr, textAlign: TextAlign.center, style: ty.bodyLg.copyWith(color: fg));
    } else {
      content = Column(mainAxisSize: MainAxisSize.min, children: [
        Text(o.labelAr, textAlign: TextAlign.center, textDirection: TextDirection.rtl, style: ty.arabicHeadline.weight(600).copyWith(color: fg)),
        if (!isAr) Text(o.labelEn, textAlign: TextAlign.center, style: ty.label.copyWith(color: c.onSurfaceVariant)),
      ]);
    }
    return Semantics(
      key: ValueKey('option-${o.id}'),
      button: true,
      label: s == 'wrong' ? t(', not quite') : s == 'correct' || s == 'revealed' ? t(', correct') : null,
      child: Material(
        color: bg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(Radii.card),
          side: BorderSide(color: border, width: 2),
        ),
        child: InkWell(
          borderRadius: BorderRadius.circular(Radii.card),
          onTap: _chosen == null ? () => _choose(o.id) : null,
          child: Stack(children: [
            ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 80, minWidth: double.infinity),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(Space.sm, Space.md, Space.sm, Space.md),
                child: Column(mainAxisSize: MainAxisSize.min, mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.center, children: [
                  content,
                  if (s == 'picked') Text(t('Your guess'), style: ty.label.copyWith(color: fg)),
                ]),
              ),
            ),
            if (glyph != null) PositionedDirectional(top: 8, end: 8, child: Icon(glyph, size: 20, color: fg)),
          ]),
        ),
      ),
    );
  }

  /// Design §5.5: verdict → rule name → the reason → the confusable hint → ▶ Hear it, Open card.
  Widget _feedback(BuildContext context, Verse? v) {
    final q = widget.q, c = context.c, ty = context.type;
    final correct = _chosen == q.answerId;
    final lesson = content.getLesson(q.lessonId);
    final answer = q.options.firstWhere((o) => o.id == q.answerId);
    final name = q.kind == 'length' ? countsText(pick(answer.labelEn, answer.labelAr)) : answer.labelAr;
    final its = q.kind == 'fact' ? t('The answer is \u201c{x}\u201d.', {'x': name}) : t("It's {x}.", {'x': name});
    if (widget.mode == QMode.pretest) return Callout(child: Tx('$its ${t("You'll see why in a minute.")}'));
    final hint = !correct && q.kind == 'identify'
        ? content.pairs.where((p) => (p.a == q.answerId && p.b == _chosen) || (p.b == q.answerId && p.a == _chosen)).firstOrNull?.hint
        : null;
    final verdict = correct ? t('Correct.') : q.kind == 'length' ? t('Not quite.') : '${t('Not quite.')} $its';
    final ex = q.example;
    return Semantics(
      liveRegion: true,
      child: Container(
        padding: const EdgeInsets.all(Space.md),
        decoration: BoxDecoration(
          color: correct ? c.successContainer.withValues(alpha: 0.4) : c.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(Radii.card),
          border: Border.all(color: correct ? c.success.withValues(alpha: 0.4) : c.outlineVariant),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.sm, children: [
          if (lesson != null)
            Text(isAr ? lesson.nameAr : '${lesson.nameAr} \u00b7 ${lesson.nameEn}', style: ty.label.weight(600).copyWith(color: c.secondary)),
          Row(crossAxisAlignment: CrossAxisAlignment.start, spacing: Space.xs, children: [
            Icon(correct ? Icons.check_circle : Icons.undo, color: correct ? c.success : c.onSurfaceVariant),
            Expanded(child: Tx(verdict, style: ty.bodyLg.weight(600).copyWith(color: c.onSurface))),
          ]),
          Tx(q.explanation, style: ty.bodyMd.copyWith(color: c.onSurface)),
          if (hint != null) Callout(title: t('Easy to mix up'), child: Tx(hint)),
          if (ex != null) ExampleVerse(ex: ex, verse: v, spanOnly: true),
          Wrap(spacing: Space.sm, runSpacing: Space.sm, crossAxisAlignment: WrapCrossAlignment.center, children: [
            if (ex != null)
              PlayButton(audio: widget.audio, label: t('the example'), text: t('Hear it'), onTap: v == null ? null : () => widget.audio.example(v, ex)),
            AppButton(
              label: t('Open card'),
              iconEnd: Icons.chevron_right,
              variant: ButtonVariant.tertiary,
              onPressed: () => go(context, href('rules', q.lessonId)),
            ),
          ]),
          if (!correct && widget.mode == QMode.review)
            Text(t('This comes back at the end.'), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
        ]),
      ),
    );
  }
}

/* ---------------- Teach (the Learn step) ---------------- */

class _TermRow extends StatelessWidget {
  const _TermRow({required this.term, this.from});
  final Term term;
  final String? from;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final lesson = from == null ? null : content.getLesson(from!);
    final literal = isAr ? term.arLiteral : term.literal;
    final n = lesson == null ? -1 : content.courseOrder.indexOf(lesson.id);
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Space.md),
      decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, spacing: 2, children: [
        Wrap(spacing: Space.sm, crossAxisAlignment: WrapCrossAlignment.center, children: [
          Text(term.term, textDirection: TextDirection.rtl, style: TextStyle(fontFamily: Fonts.naskh, fontSize: 22, height: 1.5, color: c.primary).weight(700)),
          if (!isAr) Text(term.say, style: ty.bodyMd.copyWith(color: c.onSurfaceVariant, fontStyle: FontStyle.italic)),
        ]),
        Tx(isAr ? term.ar : term.en, style: ty.bodyMd.copyWith(color: c.onSurface)),
        if (literal != null && literal.isNotEmpty) Tx(t('Literally: {x}', {'x': literal}), style: ty.label.copyWith(color: c.onSurfaceVariant)),
        if (lesson != null)
          InkWell(
            onTap: () => go(context, href('rules', lesson.id)),
            child: Tx(n >= 0 ? t('Lesson {n}: {x}', {'n': n + 1, 'x': lesson.nameAr}) : lesson.nameAr, style: ty.label.copyWith(color: c.primary)),
          ),
      ]),
    );
  }
}

/// A folded section (the web details element): title row with a chevron, the content when open.
class Fold extends StatefulWidget {
  const Fold({super.key, required this.icon, required this.title, required this.children});
  final IconData icon;
  final String title;
  final List<Widget> children;
  @override
  State<Fold> createState() => _FoldState();
}

class _FoldState extends State<Fold> {
  bool _open = false;
  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: Space.md, vertical: Space.xs),
      decoration: BoxDecoration(color: c.surfaceContainerLowest, borderRadius: BorderRadius.circular(Radii.card), border: Border.all(color: c.outlineVariant)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.sm, children: [
        Semantics(
          button: true,
          expanded: _open,
          child: InkWell(
            onTap: () => setState(() => _open = !_open),
            child: ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 44),
              child: Row(spacing: Space.sm, children: [
                Icon(widget.icon, size: 20, color: c.secondary),
                Expanded(child: Text(widget.title, style: context.type.bodyMd.weight(600).copyWith(color: c.onSurface))),
                AnimatedRotation(turns: _open ? 0.5 : 0, duration: const Duration(milliseconds: 150), child: Icon(Icons.expand_more, size: 20, color: c.outline)),
              ]),
            ),
          ),
        ),
        if (_open) ...[...widget.children, const SizedBox(height: Space.xs)],
      ]),
    );
  }
}

/// This lesson's background words (aside) and the terms from other lessons its text and card use, folded away.
Widget? glossaryFold(Lesson lesson, Teach? teach) {
  final own = {for (final x in teach?.terms ?? const <Term>[]) x.term};
  final aside = [for (final x in teach?.terms ?? const <Term>[]) if (x.aside) x];
  final a = teach?.ar;
  final text = [
    lesson.summary, ...?lesson.conditions, lesson.tip ?? '', for (final r in lesson.list ?? const <List<String>>[]) ...r, lesson.counts?.note ?? '',
    if (a != null) ...[a.plain, a.fits, ...a.how, a.why, a.spot ?? '', for (final m in a.mistakes) ...[m.wrong, m.right]],
  ].join(' ');
  final used = [for (final e in termsIn(text, content.glossary)) if (!own.contains(e.term) && e.lesson != lesson.id) e];
  if (used.isEmpty && aside.isEmpty) return null;
  return Fold(icon: Icons.menu_book_outlined, title: t('Glossary ({n})', {'n': aside.length + used.length}), children: [
    for (final e in aside) _TermRow(term: e),
    for (final e in used) _TermRow(term: e, from: e.lesson),
  ]);
}

/// The teaching sections (docs/16): plain words, new words, where it fits, what happens and why, spot it, mistakes,
/// then the folded glossary. Without a teaching text only the glossary shows.
class TeachView extends StatefulWidget {
  const TeachView({super.key, required this.lesson, this.anchor, required this.audio});
  final Lesson lesson;
  final Example? anchor;
  final StudyAudio audio;
  @override
  State<TeachView> createState() => _TeachViewState();
}

class _TeachViewState extends State<TeachView> {
  Teach? _teach;
  bool _loading = true, _played = false;

  @override
  void initState() {
    super.initState();
    loadTeach(widget.lesson.id).then((x) {
      if (mounted) {
        setState(() {
          _teach = x;
          _loading = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Skeleton(height: 160);
    final teach = _teach;
    final glossary = glossaryFold(widget.lesson, teach);
    if (teach == null) return glossary ?? const SizedBox.shrink();
    final x = teach.text, c = context.c, ty = context.type;
    final main = [for (final term in teach.terms) if (!term.aside) term];
    var n = 0;
    final p = ty.bodyMd.copyWith(color: c.onSurface, height: 1.65);
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.md, children: [
      SectionCard(n: ++n, en: t('In plain words'), ar: '\u0628\u0643\u0644\u0645\u0627\u062a \u0628\u0633\u064a\u0637\u0629', child: Tx(x.plain, style: ty.bodyLg.copyWith(color: c.onSurface, height: 1.65))),
      if (main.isNotEmpty)
        SectionCard(n: ++n, en: t('New words'), ar: '\u0643\u0644\u0645\u0627\u062a \u062c\u062f\u064a\u062f\u0629', child: Column(spacing: Space.sm, children: [for (final term in main) _TermRow(term: term)])),
      SectionCard(n: ++n, en: t('Where it fits'), ar: '\u0623\u064a\u0646 \u064a\u0642\u0639', child: Tx(x.fits, style: p)),
      SectionCard(
        n: ++n,
        en: t('What happens'),
        ar: '\u0645\u0627\u0630\u0627 \u064a\u062d\u062f\u062b',
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.sm, children: [
          for (final (i, s) in x.how.indexed)
            Row(crossAxisAlignment: CrossAxisAlignment.start, spacing: Space.sm, children: [
              Container(
                width: 24,
                height: 24,
                alignment: Alignment.center,
                decoration: BoxDecoration(color: c.surfaceContainer, shape: BoxShape.circle),
                child: Text(digits(i + 1), style: ty.label.weight(600).copyWith(color: c.primary, height: 1)),
              ),
              Expanded(child: Tx(s, style: p)),
            ]),
          Container(
            margin: const EdgeInsets.only(top: Space.sm),
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
            child: Text.rich(TextSpan(children: [
              TextSpan(text: t('Why: '), style: p.weight(600)),
              TextSpan(text: bidi(x.why), style: p),
            ])),
          ),
        ]),
      ),
      if (x.spot != null && x.spot!.isNotEmpty)
        SectionCard(
          n: ++n,
          en: t('Spot it in the mu\u1e63\u1e25af'),
          ar: '\u0643\u064a\u0641 \u062a\u0639\u0631\u0641\u0647 \u0641\u064a \u0627\u0644\u0645\u0635\u062d\u0641',
          child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.sm, children: [
            Tx(x.spot!, style: p),
            if (widget.anchor != null)
              ExampleCard(ex: widget.anchor!, eyebrow: '', flat: true, audio: widget.audio, played: _played, onPlayed: () => setState(() => _played = true)),
          ]),
        ),
      if (x.mistakes.isNotEmpty)
        SectionCard(
          n: ++n,
          en: t('Common mistakes'),
          ar: '\u0623\u062e\u0637\u0627\u0621 \u0634\u0627\u0626\u0639\u0629',
          child: Column(spacing: Space.sm, children: [
            for (final m in x.mistakes)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(Space.md),
                decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, spacing: 4, children: [
                  Row(crossAxisAlignment: CrossAxisAlignment.start, spacing: Space.xs, children: [
                    Padding(padding: const EdgeInsets.only(top: 4), child: Icon(Icons.close, size: 18, color: c.error)),
                    Expanded(child: Tx(m.wrong, style: ty.bodyMd.copyWith(color: c.onSurfaceVariant))),
                  ]),
                  Row(crossAxisAlignment: CrossAxisAlignment.start, spacing: Space.xs, children: [
                    Padding(padding: const EdgeInsets.only(top: 4), child: Icon(Icons.check, size: 18, color: c.success)),
                    Expanded(child: Tx(m.right, style: ty.bodyMd.copyWith(color: c.onSurface))),
                  ]),
                ]),
              ),
          ]),
        ),
      ?glossary,
    ]);
  }
}

/* ---------------- RuleBody (the lesson's Rule sheet) ---------------- */

/// First sentence, and the rest.
(String, String) splitDefinition(String s) {
  final m = RegExp(r'[.!?\u061f]\s').firstMatch(s);
  return m == null ? (s, '') : (s.substring(0, m.start + 1), s.substring(m.start + 2).trim());
}

final _latin = RegExp('[A-Za-z]');

/// Letter tiles in a letters string (labels like `الهمس:` and a bracketed gloss don't count).
int letterCount(String letters) => _latin.hasMatch(letters)
    ? 0
    : letters.replaceAll(RegExp(r'\([^)]*\)'), '').split(RegExp(r'[\s\u00b7]+')).where((x) => x.isNotEmpty && !x.endsWith(':') && RegExp('[\u0600-\u06ff]').hasMatch(x)).length;

class Letters extends StatelessWidget {
  const Letters({super.key, required this.letters});
  final String letters;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    if (_latin.hasMatch(letters)) return Tx(t(letters));
    final note = RegExp(r'\(([^)]+)\)').firstMatch(letters)?[1];
    final groups = [
      for (final g in letters.replaceAll(RegExp(r'\([^)]*\)'), '').split('\u00b7'))
        if (RegExp(r'^\s*([^:]+):(.*)$').firstMatch(g) case final m)
          (label: m?[1]?.trim(), tiles: (m == null ? g : m[2]!).split(RegExp(r'\s+')).where((x) => x.isNotEmpty).toList()),
    ].where((g) => g.tiles.isNotEmpty);
    return Directionality(
      textDirection: TextDirection.rtl,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, spacing: Space.sm, children: [
        for (final g in groups)
          Column(crossAxisAlignment: CrossAxisAlignment.start, spacing: 6, children: [
            if (g.label != null) Text(g.label!, style: ty.arabicLabel.copyWith(color: c.secondary)),
            Wrap(spacing: 8, runSpacing: 8, children: [for (final l in g.tiles) LetterTile(letter: l)]),
          ]),
        if (note != null) Text('($note)', style: ty.arabicLabel.copyWith(color: c.onSurfaceVariant)),
      ]),
    );
  }
}

const _sectionAr = {
  'What happens': '\u0645\u0627 \u0627\u0644\u0630\u064a \u064a\u062d\u062f\u062b', 'In the matn': '\u0645\u0646 \u0627\u0644\u0645\u062a\u0646', 'Which letters': '\u0627\u0644\u062d\u0631\u0648\u0641', 'At a glance': '\u0628\u0627\u062e\u062a\u0635\u0627\u0631', //
  'How long': '\u0627\u0644\u0645\u0642\u062f\u0627\u0631', 'When it applies': '\u0645\u062a\u0649 \u064a\u0643\u0648\u0646', 'Example': '\u0645\u062b\u0627\u0644',
};
const _matnName = {'tuhfa': '\u062a\u062d\u0641\u0629 \u0627\u0644\u0623\u0637\u0641\u0627\u0644', 'jazariyya': '\u0627\u0644\u0645\u0642\u062f\u0645\u0629 \u0627\u0644\u062c\u0632\u0631\u064a\u0629'};

/// The rule card as numbered sections (docs/10 §4.4): the lesson's Rule sheet on Say, Find and Recite.
class RuleBody extends StatefulWidget {
  const RuleBody({super.key, required this.lesson, required this.audio});
  final Lesson lesson;
  final StudyAudio audio;
  @override
  State<RuleBody> createState() => _RuleBodyState();
}

class _RuleBodyState extends State<RuleBody> {
  bool _allConds = false, _played = false;

  @override
  Widget build(BuildContext context) {
    final lesson = widget.lesson, c = context.c, ty = context.type;
    final (what, detail) = splitDefinition(lesson.summary);
    final counts = lesson.counts;
    final conds = lesson.conditions ?? const [];
    final ex0 = lesson.examples.firstOrNull;
    final moreEx = lesson.examples.skip(1).toList();
    final matn = [for (final m in content.mutun) if (m.lessonIds.length == 1 && m.lessonIds.first == lesson.id) m];
    var n = 0;
    SectionCard sec(String en, Widget child) => SectionCard(n: ++n, en: t(en), ar: _sectionAr[en], child: child);
    final p = ty.bodyLg.copyWith(color: c.onSurface, height: 1.65);
    final shown = matn.take(3).toList();
    final review = lesson.review;
    final notes = review['notes'] as String?;
    final hasMore = detail.isNotEmpty || moreEx.isNotEmpty || lesson.confusableWith.isNotEmpty || lesson.sources.isNotEmpty || (notes ?? '').isNotEmpty;
    Text sub(String s) => Text(s, style: ty.label.weight(600).copyWith(color: c.onSurfaceVariant));
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.md, children: [
      if (review['status'] != 'verified')
        Align(alignment: AlignmentDirectional.centerStart, child: AppChip(icon: Icons.info_outline, label: t('Draft \u00b7 check with your teacher'))),
      sec('What happens', Tx(what, style: p)),
      if (lesson.letters != null)
        sec('Which letters', Column(crossAxisAlignment: CrossAxisAlignment.start, spacing: Space.sm, children: [
          Letters(letters: lesson.letters!),
          if (letterCount(lesson.letters!) > 1) Text(tn('{n} letter', '{n} letters', letterCount(lesson.letters!)), style: ty.label.copyWith(color: c.onSurfaceVariant)),
        ])),
      if (shown.isNotEmpty)
        sec('In the matn', Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.sm, children: [
          Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
            child: Column(spacing: Space.sm, children: [
              for (final m in shown)
                Column(children: [
                  Text.rich(
                    TextSpan(children: [TextSpan(text: '${m.sadr} '), TextSpan(text: '\u06de', style: TextStyle(color: c.gold)), TextSpan(text: ' ${m.ajz}')]),
                    textAlign: TextAlign.center,
                    textDirection: TextDirection.rtl,
                    style: TextStyle(fontFamily: Fonts.naskh, fontSize: 19, height: 1.9, color: c.onSurface),
                  ),
                  if (!isAr && m.gloss != null) Tx(m.gloss!, textAlign: TextAlign.center, style: ty.label.weight(400).copyWith(color: c.onSurfaceVariant)),
                ]),
            ]),
          ),
          InkWell(
            onTap: () => go(context, '${href('mutun', shown.first.matn)}?from=${shown.first.n}&to=${shown.last.n}'),
            child: Row(spacing: 4, children: [
              Icon(Icons.history_edu_outlined, size: 18, color: c.primary),
              Text('${_matnName[shown.first.matn]} ${arDigits(shown.first.n)}${shown.length > 1 ? '\u2013${arDigits(shown.last.n)}' : ''}',
                  style: ty.arabicLabel.copyWith(color: c.primary)),
            ]),
          ),
        ])),
      if (lesson.list?.isNotEmpty ?? false)
        sec('At a glance', Column(children: [
          for (final (i, r) in lesson.list!.indexed)
            Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(border: i == lesson.list!.length - 1 ? null : Border(bottom: BorderSide(color: c.surfaceContainer))),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, spacing: Space.sm, children: [
                Expanded(child: Tx(r.first, style: ty.bodyMd.weight(500).copyWith(color: c.onSurface))),
                Expanded(child: Tx(r.length > 1 ? r[1] : '', style: ty.bodyMd.copyWith(color: c.onSurfaceVariant))),
              ]),
            ),
        ])),
      if (counts != null)
        sec('How long', Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.sm, children: [
          Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
            child: Wrap(alignment: WrapAlignment.spaceBetween, crossAxisAlignment: WrapCrossAlignment.center, spacing: Space.sm, runSpacing: Space.sm, children: [
              Text(countsText(counts.min == counts.max ? counts.min : '${counts.min}\u2013${counts.max}'), style: ty.headlineMd.copyWith(color: c.onSurface)),
              CountBeats(min: counts.min, max: counts.max),
            ]),
          ),
          if (counts.note != null) Tx(counts.note!, style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
        ])),
      if (conds.isNotEmpty)
        sec('When it applies', Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.sm, children: [
          for (final (i, x) in (_allConds ? conds : conds.take(3)).indexed)
            Container(
              padding: const EdgeInsetsDirectional.fromSTEB(Space.md, Space.sm, Space.sm, Space.sm),
              decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, spacing: Space.sm, children: [
                Text(digits(i + 1), style: ty.label.weight(600).copyWith(color: c.primary)),
                Expanded(child: Tx(x, style: ty.bodyMd.copyWith(color: c.onSurface))),
              ]),
            ),
          if (conds.length > 3 && !_allConds)
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: AppButton(
                label: tn('Show {n} more', 'Show {n} more', conds.length - 3),
                iconEnd: Icons.expand_more,
                variant: ButtonVariant.tertiary,
                size: ButtonSize.sm,
                onPressed: () => setState(() => _allConds = true),
              ),
            ),
        ])),
      if (ex0 != null)
        sec('Example', ExampleCard(ex: ex0, eyebrow: '', flat: true, audio: widget.audio, played: _played, onPlayed: () => setState(() => _played = true))),
      if (lesson.tip != null) Callout(kind: CalloutKind.tip, title: t('Remember'), child: Tx(lesson.tip!)),
      if (hasMore)
        Fold(icon: Icons.library_books_outlined, title: t('More'), children: [
          if (detail.isNotEmpty) ...[sub(t('In detail')), Tx(detail)],
          if (moreEx.isNotEmpty) ...[
            sub(t('More examples ({n})', {'n': moreEx.length})),
            for (final ex in moreEx)
              VersesOf(
                from: ex.verseKey,
                builder: (context, vs, _) => Container(
                  padding: const EdgeInsets.symmetric(horizontal: Space.sm),
                  decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
                  child: Row(spacing: Space.sm, children: [
                    PlayButton(audio: widget.audio, label: verseRef(ex.verseKey), onTap: vs == null ? null : () => widget.audio.example(vs.first, ex)),
                    Expanded(child: ExampleVerse(ex: ex, verse: vs?.first, spanOnly: true, reference: true)),
                  ]),
                ),
              ),
          ],
          if (lesson.confusableWith.isNotEmpty) ...[
            sub(t('Easy to mix up with')),
            Wrap(spacing: Space.sm, runSpacing: Space.sm, children: [
              for (final id in lesson.confusableWith)
                if (content.getLesson(id) case final l?)
                  AppButton(label: l.nameAr, variant: ButtonVariant.secondary, onPressed: () => go(context, href('rules', id))),
            ]),
          ],
          if ((notes ?? '').isNotEmpty) Tx(notes!),
          if (lesson.sources.isNotEmpty) ...[
            sub(t('Sources')),
            for (final s in lesson.sources) Tx('\u2022 ${s.title}${s.locator.isEmpty ? '' : ' \u00b7 ${s.locator}'}', style: ty.bodyMd),
          ],
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: AppButton(label: t('Open card'), iconEnd: Icons.chevron_right, variant: ButtonVariant.tertiary, onPressed: () => go(context, href('rules', lesson.id))),
          ),
        ]),
    ]);
  }
}

/* ---------------- Drill ---------------- */

/// "Say it aloud" letter drill for مخارج / صفات lessons: read, record, play yourself back.
class Drill extends StatelessWidget {
  const Drill({super.key, required this.lesson, required this.audio});
  final Lesson lesson;
  final StudyAudio audio;
  @override
  Widget build(BuildContext context) {
    final syllables = drillFor(lesson);
    if (syllables.isEmpty) return const SizedBox.shrink();
    final c = context.c;
    return Panel(children: [
      Text(t('Say each one slowly, from its place. Record yourself, then listen back.'), style: context.type.bodyLg.copyWith(color: c.onSurface)),
      Text(syllables.join('\u060c '), textAlign: TextAlign.center, textDirection: TextDirection.rtl,
          style: TextStyle(fontFamily: Fonts.quran, fontFamilyFallback: Fonts.quranFallback, fontSize: 32, height: 2, color: c.onSurface)),
      recorderCards(from: 'drill:${lesson.id}', audio: audio, recordN: 1),
    ]);
  }
}

/* ---------------- CorrectionStep, Hint, Summary (Review's pieces) ---------------- */

/// A teacher-correction review item (design §5.4): listen → record → compare → "Did you apply the fix?".
class CorrectionStep extends StatefulWidget {
  const CorrectionStep({super.key, required this.c, required this.audio, required this.onRate, required this.onNext});
  final Correction c;
  final StudyAudio audio;
  final ValueChanged<bool> onRate;
  final VoidCallback onNext;
  @override
  State<CorrectionStep> createState() => _CorrectionStepState();
}

class _CorrectionStepState extends State<CorrectionStep> {
  bool _canRate = false;
  bool? _rated;

  @override
  Widget build(BuildContext context) {
    final corr = widget.c, c = context.c, ty = context.type;
    final j = corr.j;
    final lessons = [for (final id in corr.lessonIds) ?content.getLesson(id)];
    final jali = corr.severity == 'jali';
    return VersesOf(
      from: corr.verseKey,
      builder: (context, vs, failed) => Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.md, children: [
        Wrap(spacing: Space.sm, crossAxisAlignment: WrapCrossAlignment.center, children: [
          Text(t('Teacher correction'), style: ty.label.weight(600).copyWith(color: c.secondary)),
          AppChip(tone: jali ? ChipTone.error : ChipTone.outline, icon: jali ? Icons.flag : null, label: jali ? '\u062c\u0644\u064a' : '\u062e\u0641\u064a'),
        ]),
        Panel(children: [
          if (vs != null)
            VerseBlock(
              ayah: QAyah.of(vs.first),
              size: VerseSize.focus,
              tajweed: false,
              reference: verseRef(corr.verseKey),
              marks: j['wordPosition'] is int ? {j['wordPosition'] as int: WordMark.ring} : const {},
            )
          else if (failed)
            Text(t('The text needs a connection. Recite from your mu\u1e63\u1e25af.'), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant))
          else
            const Skeleton(height: 64),
          if ((j['note'] as String?)?.isNotEmpty ?? false) Callout(title: t("Your teacher's note: "), child: Tx(j['note'])),
          if (lessons.isNotEmpty)
            Tx(t('Rule: {x}', {'x': lessons.map((l) => l.nameAr).join(' \u00b7 ')}), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
        ]),
        RowCard(n: 1, title: t('Listen'), children: [
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: PlayButton(audio: widget.audio, label: verseRef(corr.verseKey), text: t('Listen'), onTap: vs == null ? null : () => widget.audio.ayah(vs.first)),
          ),
        ]),
        recorderCards(
          from: corr.verseKey,
          audio: widget.audio,
          recordN: 2,
          model: vs == null
              ? null
              : (path) {
                  widget.audio.player.load(vs, widget.audio.reciter);
                  playModelThenMe(widget.audio.player, path);
                },
          reciter: vs == null ? null : () => widget.audio.ayah(vs.first),
          onStatus: (_) => _canRate ? null : setState(() => _canRate = true),
        ),
        Panel(children: [
          Text(t('Did you apply the fix?'), style: ty.bodyLg.weight(600).copyWith(color: c.onSurface)),
          Row(spacing: Space.sm, children: [
            for (final (v, label) in [(true, t('Applied the fix')), (false, t('Not yet'))])
              Expanded(
                child: AppButton(
                  label: label,
                  variant: _rated == v ? ButtonVariant.primary : ButtonVariant.secondary,
                  onPressed: !_canRate || _rated != null
                      ? null
                      : () {
                          setState(() => _rated = v);
                          widget.onRate(v);
                        },
                ),
              ),
          ]),
          Text('${t('Your own rating')}${_canRate ? '' : t(' \u00b7 record first')}', textAlign: TextAlign.center, style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
        ]),
        if (_rated != null) ...[
          Callout(icon: Icons.check_circle_outline, child: Text(t('Saved. Your teacher will check it.'))),
          AppButton(label: t('Next'), iconEnd: Icons.arrow_forward, size: ButtonSize.lg, block: true, onPressed: widget.onNext),
        ],
      ]),
    );
  }
}

/// A one-time explanation at the top of a screen; ✕ hides it for good on this device.
class Hint extends StatefulWidget {
  const Hint({super.key, required this.id, required this.text});
  final String id, text;
  @override
  State<Hint> createState() => _HintState();
}

class _HintState extends State<Hint> {
  @override
  Widget build(BuildContext context) {
    final key = 'hint:${widget.id}';
    if (local.dismissed.containsKey(key)) return const SizedBox.shrink();
    return Nudge(
      text: widget.text,
      action: AppButton(label: t('More'), variant: ButtonVariant.tertiary, size: ButtonSize.sm, onPressed: () => go(context, 'guide')),
      onDismiss: () => setState(() => local.dismiss(key, today())),
    );
  }
}

/// One answered review item.
typedef ReviewResult = ({String itemId, String kind, String refId, bool correct, bool selfRated});

/// End of a review session (design §5.4): reviewed, correct, look again at, coming back.
class ReviewSummary extends StatelessWidget {
  const ReviewSummary({super.key, required this.results, this.onMore});
  final List<ReviewResult> results;
  final VoidCallback? onMore;

  String _name(String kind, String refId) {
    if (kind == 'lesson') return content.getLesson(refId)?.nameAr ?? refId;
    final c = store.data.corrections.where((c) => c.id == refId).firstOrNull;
    return c == null ? t('correction') : '${verseRef(c.verseKey)} \u00b7 ${t('correction')}';
  }

  String _due(Day due, Day day) {
    final n = diffDays(due, day);
    return n <= 0 ? t('today') : n == 1 ? t('tomorrow') : dayLabel(due);
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type, day = today();
    final quiz = results.where((r) => !r.selfRated).toList();
    final again = {for (final r in results) if (!r.correct && r.kind == 'lesson') r.refId}.toList();
    final items = store.data.items;
    final back = [
      for (final id in {for (final r in results) r.itemId})
        ?items.where((i) => i.id == id && i.state != 'closed').firstOrNull,
    ]..sort((a, b) => a.dueOn.compareTo(b.dueOn));
    final right = quiz.where((r) => r.correct).length;
    Widget stat(String label, String value) => Expanded(
      child: Container(
        padding: const EdgeInsets.all(Space.md),
        decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.card)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: ty.label.copyWith(color: c.onSurfaceVariant)),
          Text(value, style: ty.headlineLg.copyWith(color: c.onSurface)),
        ]),
      ),
    );
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.lg, children: [
      Column(spacing: Space.sm, children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(color: c.secondaryContainer, shape: BoxShape.circle),
          child: Icon(Icons.star, size: 32, color: c.onSecondaryContainer),
        ),
        Text(t('Review done.'), style: ty.headlineLg.copyWith(color: c.onSurface)),
      ]),
      Row(spacing: Space.sm, children: [
        stat(t('Reviewed'), digits(results.length)),
        if (quiz.isNotEmpty) stat(t('Correct'), t('{n} of {m}', {'n': right, 'm': quiz.length})),
      ]),
      if (again.isNotEmpty)
        SectionCard(en: t('Look again at'), child: Wrap(spacing: Space.sm, runSpacing: Space.sm, children: [
          for (final id in again)
            if (content.getLesson(id) case final l?) AppButton(label: l.nameAr, variant: ButtonVariant.secondary, onPressed: () => go(context, href('rules', id))),
        ])),
      if (back.isNotEmpty)
        SectionCard(en: t('Coming back'), child: Column(children: [
          for (final i in back)
            ConstrainedBox(
              constraints: const BoxConstraints(minHeight: 48),
              child: Row(children: [
                Expanded(child: Tx(_name(i.kind, i.refId))),
                AppChip(icon: Icons.event_outlined, label: _due(i.dueOn, day)),
              ]),
            ),
        ])),
      AppButton(label: t('Back to today'), size: ButtonSize.lg, block: true, onPressed: () => go(context, 'today')),
      if (onMore != null) AppButton(label: t('10 more'), variant: ButtonVariant.secondary, block: true, onPressed: onMore),
    ]);
  }
}
