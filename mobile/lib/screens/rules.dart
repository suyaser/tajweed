// Ports of src/screens/Rules.tsx (#/rules: the library by topic, search, the map) and Rule.tsx (#/rules/:id: the
// card). Phone layout: the web's single column, with "Learn this" right under the definition until the rule is learned.
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app/router.dart';
import '../audio/player.dart' show PlayerStatus;
import '../app/services.dart';
import '../app/shell.dart';
import '../content/content.dart';
import '../core/scheduler.dart';
import '../core/types.dart';
import '../i18n/i18n.dart';
import '../quran/quran.dart';
import '../quran/verse.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'lesson_parts.dart';
import 'listen.dart';
import 'path.dart';
import 'study.dart';

/* ---------------- shared ---------------- */

typedef LessonStatus = ({String level, bool correction, Day? dueOn, bool introduced});

LessonStatus lessonStatus(UserData d, String lessonId) {
  final item = d.items.where((i) => i.id == itemIdOf('lesson', lessonId)).firstOrNull;
  return (
    level: levelOf(item, d.attempts),
    correction: hasOpenCorrection(lessonId, d.corrections),
    dueOn: item != null && item.state != 'closed' && item.state != 'suspended' ? item.dueOn : null,
    introduced: d.introductions.any((i) => i.lessonId == lessonId),
  );
}

bool _known(LessonStatus s) => s.level == 'known' || s.level == 'strong';

const _levels = <String, (IconData, ChipTone, String)>{
  'not-started': (Icons.radio_button_unchecked, ChipTone.neutral, 'not started'),
  'learning': (Icons.timelapse, ChipTone.gold, 'learning'),
  'known': (Icons.check_circle, ChipTone.success, 'known'),
  'strong': (Icons.verified, ChipTone.primary, 'strong'),
};

/// Recognition level (not a score): not started · learning · known · strong.
class LevelChip extends StatelessWidget {
  const LevelChip({super.key, required this.level, this.detail, this.iconOnly = false});
  final String level;
  final String? detail;
  final bool iconOnly;
  @override
  Widget build(BuildContext context) {
    final (icon, tone, word) = _levels[level]!;
    return AppChip(
      icon: icon,
      tone: tone,
      fill: level != 'not-started',
      label: iconOnly ? null : '${t(word)}${detail == null ? '' : ' · $detail'}',
      semanticLabel: iconOnly ? t(word) : null,
    );
  }
}

/// The rule's muṣḥaf colour as a small dot (gold when it has none).
class ColourDot extends StatelessWidget {
  const ColourDot({super.key, this.colour});
  final String? colour;
  @override
  Widget build(BuildContext context) => Container(
    width: 10,
    height: 10,
    decoration: BoxDecoration(color: colour == null ? context.c.gold : tajweedColour(context.c, colour!), shape: BoxShape.circle),
  );
}

/// A content line: an Arabic-only line in the Quran font, else mixed text (Text.tsx Line).
class ContentLine extends StatelessWidget {
  const ContentLine(this.text, {super.key});
  final String text;
  @override
  Widget build(BuildContext context) {
    final s = carryMarks(arRefs(text, content.surahName));
    final x = isAr ? digits(s) : s;
    return isArabicLine(x)
        ? Text(
            x,
            textDirection: TextDirection.rtl,
            style: TextStyle(fontFamily: Fonts.quran, fontFamilyFallback: Fonts.quranFallback, fontSize: 24, height: 2, color: context.c.onSurface),
          )
        : Tx(x);
  }
}

/// Search folding: no marks or tatweel, one alef, ى → ي, lower case (range.ts normalize).
String normalize(String s) => s
    .replaceAll(RegExp('[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed\u0640]'), '')
    .replaceAll(RegExp('[\u0623\u0625\u0622\u0671]'), '\u0627')
    .replaceAll('\u0649', '\u064a')
    .toLowerCase()
    .trim();

String _dayShort(Day d) => dayLabel(d);

String _counts(Counts c) => c.min == c.max ? t('{n} counts', {'n': c.min}) : t('{min}–{max} counts', {'min': c.min, 'max': c.max});

/* ---------------- Rules ---------------- */

class Rules extends StatefulWidget {
  const Rules({super.key});
  @override
  State<Rules> createState() => _RulesState();
}

class _RulesState extends State<Rules> {
  final _q = TextEditingController();
  String _view = 'list';
  bool _legend = false;
  final _topicKeys = <String, GlobalKey>{};
  late final _hay = {
    for (final l in content.lessons)
      l.id: normalize(
        [
          l.nameAr, l.nameEn, l.letters ?? '', l.id, //
          ...content.topics.where((x) => x.id == l.topicId).expand((tp) => [tp.nameAr, tp.nameEn]),
        ].join(' '),
      ),
  };

  @override
  void dispose() {
    _q.dispose();
    super.dispose();
  }

  void _goToTopic(String id) {
    setState(() {
      _q.clear();
      _view = 'list';
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final ctx = _topicKeys[id]?.currentContext;
      if (ctx != null) Scrollable.ensureVisible(ctx, duration: const Duration(milliseconds: 250));
    });
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(listenable: store, builder: (context, _) => _build(context));

  Widget _build(BuildContext context) {
    final c = context.c, ty = context.type;
    final lessons = content.lessons, topics = content.topics;
    final status = {for (final l in lessons) l.id: lessonStatus(store.data, l.id)};
    final nq = normalize(_q.text);
    final shown = nq.isEmpty ? lessons : lessons.where((l) => _hay[l.id]!.contains(nq)).toList();
    final byTopic = [
      for (final tp in topics) (tp: tp, ls: shown.where((l) => l.topicId == tp.id).toList(), all: lessons.where((l) => l.topicId == tp.id).toList()),
    ];

    return PageBody(
      items: [
        PageHeader(
          en: 'Rules',
          ar: '\u0623\u062d\u0643\u0627\u0645 \u0627\u0644\u062a\u062c\u0648\u064a\u062f',
          detail: [
            tn('{n} rule', '{n} rules', lessons.length),
            tn('{n} topic', '{n} topics', topics.where((tp) => lessons.any((l) => l.topicId == tp.id)).length),
            t('{n} known', {'n': lessons.where((l) => _known(status[l.id]!)).length}),
          ],
        ),
        Semantics(
          label: t('Search rules'),
          textField: true,
          child: TextField(
            controller: _q,
            onChanged: (v) => setState(() => v.isNotEmpty ? _view = 'list' : null),
            textInputAction: TextInputAction.search,
            style: ty.bodyLg.copyWith(color: c.onSurface),
            decoration: InputDecoration(
              hintText: t('Search · \u0627\u0628\u062d\u062b — e.g. \u0625\u062e\u0641\u0627\u0621 or \u0645\u062f'),
              filled: true,
              fillColor: c.surfaceContainerLowest,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(Radii.control),
                borderSide: BorderSide(color: c.outline),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(Radii.control),
                borderSide: BorderSide(color: c.outline),
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
              prefixIcon: Icon(Icons.search, color: c.onSurfaceVariant),
              suffixIcon: _q.text.isEmpty ? null : AppIconButton(icon: Icons.close, label: t('Clear'), onPressed: () => setState(_q.clear)),
            ),
          ),
        ),
        Row(
          spacing: Space.sm,
          children: [
            Expanded(
              child: Segmented<String>(
                value: _view,
                onChanged: (v) => setState(() => _view = v),
                options: [(value: 'list', label: t('List'), icon: null), (value: 'map', label: t('Map'), icon: null)],
              ),
            ),
            AppButton(
              label: t('Colours'),
              icon: Icons.palette_outlined,
              iconEnd: _legend ? Icons.expand_less : Icons.expand_more,
              variant: ButtonVariant.tertiary,
              onPressed: () => setState(() => _legend = !_legend),
            ),
          ],
        ),
        if (_legend) Panel(children: [Legend(colours: colourKeys.toList())]),
        if (_view == 'list')
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            child: Row(
              spacing: Space.sm,
              children: [
                for (final x in byTopic)
                  if (x.all.isNotEmpty)
                    _Pill(
                      onTap: () => _goToTopic(x.tp.id),
                      children: [
                        Text(
                          x.tp.nameAr,
                          textDirection: TextDirection.rtl,
                          style: ty.arabicBody.weight(600).copyWith(color: c.onSurface),
                        ),
                        Text(
                          t('{known}/{all} known', {'known': x.all.where((l) => _known(status[l.id]!)).length, 'all': x.all.length}),
                          style: ty.caption.copyWith(color: c.onSurfaceVariant),
                        ),
                      ],
                    ),
                _Pill(
                  onTap: () => go(context, 'resources'),
                  children: [
                    Icon(Icons.library_books_outlined, size: 20, color: c.primary),
                    Text(
                      '\u0627\u0644\u0645\u0635\u0627\u062f\u0631',
                      textDirection: TextDirection.rtl,
                      style: ty.arabicBody.copyWith(color: c.primary),
                    ),
                    if (!isAr) Text(t('Resources and credits'), style: ty.caption.copyWith(color: c.onSurfaceVariant)),
                  ],
                ),
              ],
            ),
          ),
        if (_view == 'map')
          _MindMap(status: status, onTopic: _goToTopic)
        else if (shown.isEmpty)
          EmptyState(icon: Icons.search_off, title: bidi(t('Nothing matches “{q}”.', {'q': _q.text})), body: t('Try the Arabic name, or a letter.'))
        else
          for (final x in byTopic)
            if (x.ls.isNotEmpty)
              Column(
                key: _topicKeys.putIfAbsent(x.tp.id, GlobalKey.new),
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: Space.md,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    spacing: Space.md,
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: c.surfaceContainerLowest,
                          shape: BoxShape.circle,
                          border: Border.all(color: c.gold),
                        ),
                        child: Text(digits(x.tp.order + 1), style: ty.label.weight(700).copyWith(color: c.secondary)),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          spacing: 2,
                          children: [
                            Semantics(
                              header: true,
                              child: Text(
                                x.tp.nameAr,
                                textDirection: TextDirection.rtl,
                                style: TextStyle(fontFamily: Fonts.naskh, fontSize: 22, height: 1.4, color: c.onSurface).weight(700),
                              ),
                            ),
                            Tx(isAr ? x.tp.intro : '${x.tp.nameEn}. ${x.tp.intro}', style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (nq.isEmpty) ?_chooser(context, x.tp.id, x.ls),
                  Container(
                    clipBehavior: Clip.antiAlias,
                    decoration: BoxDecoration(
                      color: c.surfaceContainerLowest,
                      borderRadius: BorderRadius.circular(Radii.card),
                      border: Border.all(color: c.outlineVariant),
                    ),
                    child: Column(
                      children: [
                        for (final (i, l) in x.ls.indexed) ...[
                          if (i > 0) Divider(height: 1, color: c.outlineVariant),
                          _RuleRow(lesson: l, status: status[l.id]!),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
      ],
    );
  }

  /// "The next letter is…" (nun / meem / lam) and the madd lengths, folded to one line (design §5.6).
  Widget? _chooser(BuildContext context, String topicId, List<Lesson> ls) {
    final ask = const {'nun': 'The next letter is…', 'meem': 'The next letter is…', 'lam': 'The letter after \u0627\u0644 is…'}[topicId];
    final rows = ask != null
        ? ls.where((l) => l.letters != null).toList()
        : topicId == 'madd'
        ? ls.where((l) => l.counts != null).toList()
        : const <Lesson>[];
    if (rows.isEmpty) return null;
    final c = context.c;
    return Fold(
      icon: ask != null ? Icons.help_outline : Icons.straighten,
      title: bidi(t(ask ?? 'Lengths at a glance · solid = required, striped = allowed')),
      children: [
        for (final l in rows)
          Container(
            padding: const EdgeInsets.all(Space.sm),
            decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
            child: Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: Space.sm,
              runSpacing: Space.sm,
              children: [
                if (ask != null) Letters(letters: l.letters!) else CountBeats(min: l.counts!.min, max: l.counts!.max),
                InkWell(
                  onTap: () => go(context, href('rules', l.id)),
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(minHeight: 44),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      spacing: 6,
                      children: [
                        ColourDot(colour: l.colour),
                        Text(
                          l.nameAr,
                          textDirection: TextDirection.rtl,
                          style: context.type.arabicBody.weight(600).copyWith(color: c.onSurface),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.onTap, required this.children});
  final VoidCallback onTap;
  final List<Widget> children;
  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Material(
      color: c.surfaceContainerLowest,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(Radii.control),
        side: BorderSide(color: c.outlineVariant),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(Radii.control),
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: 48),
          padding: const EdgeInsets.symmetric(horizontal: Space.md),
          child: Row(mainAxisSize: MainAxisSize.min, spacing: Space.sm, children: children),
        ),
      ),
    );
  }
}

class _RuleRow extends StatelessWidget {
  const _RuleRow({required this.lesson, required this.status});
  final Lesson lesson;
  final LessonStatus status;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type, l = lesson;
    final unit = content.unitOf(l.id);
    final facts = [
      if (l.letters != null && letterCount(l.letters!) > 1) tn('{n} letter', '{n} letters', letterCount(l.letters!)),
      if (l.counts != null) _counts(l.counts!),
      if (unit != null) t('Unit {n}', {'n': unit.n}),
    ];
    final chips = [
      if (status.correction) AppChip(tone: ChipTone.error, icon: Icons.flag, fill: true, label: t('correction open')),
      LevelChip(level: status.level),
    ];
    final big = MediaQuery.textScalerOf(context).scale(1) >= 1.5; // no room beside the name: chips go under it
    return InkWell(
      onTap: () => go(context, href('rules', l.id)),
      child: Container(
        constraints: const BoxConstraints(minHeight: 64),
        padding: const EdgeInsets.symmetric(horizontal: Space.md, vertical: Space.sm),
        child: Row(
          spacing: Space.md,
          children: [
            ColourDot(colour: l.colour),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l.nameAr,
                    textDirection: TextDirection.rtl,
                    style: TextStyle(fontFamily: Fonts.naskh, fontSize: ty.bodyLg.fontSize, height: 1.5, color: c.onSurface).weight(600),
                  ),
                  if (!isAr) Text(l.nameEn, style: ty.bodyMd.weight(500).copyWith(color: c.onSurfaceVariant)),
                  if (facts.isNotEmpty)
                    Wrap(
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        for (final (i, f) in facts.indexed) ...[
                          if (i > 0) const Sep(),
                          Text(f, style: ty.label.weight(400).copyWith(color: c.onSurfaceVariant)),
                        ],
                      ],
                    ),
                  if (big) Wrap(spacing: Space.xs, runSpacing: Space.xs, children: chips),
                ],
              ),
            ),
            if (!big) ...chips,
            Icon(Icons.chevron_right, color: c.outline),
          ],
        ),
      ),
    );
  }
}

/// Topics as clusters read right to left, each with its rules as leaves.
class _MindMap extends StatelessWidget {
  const _MindMap({required this.status, required this.onTopic});
  final Map<String, LessonStatus> status;
  final ValueChanged<String> onTopic;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: Space.md,
      children: [
        Text(
          '${isAr ? '' : 'Read it from right to left, as in a muṣḥaf. '}${t('Tap a topic to open its section, or a rule to open its card.')}',
          style: ty.bodyMd.copyWith(color: c.onSurfaceVariant),
        ),
        Directionality(
          textDirection: TextDirection.rtl,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            spacing: Space.md,
            children: [
              ExcludeSemantics(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: Space.lg, vertical: Space.sm),
                  decoration: BoxDecoration(color: c.primaryFill, borderRadius: BorderRadius.circular(999)),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    spacing: Space.sm,
                    children: [
                      Icon(Icons.auto_awesome, size: 20, color: c.onPrimary),
                      Text(
                        '\u0627\u0644\u062a\u062c\u0648\u064a\u062f',
                        style: TextStyle(fontFamily: Fonts.naskh, fontSize: 22, height: 1.4, color: c.onPrimary).weight(700),
                      ),
                      if (!isAr)
                        Text(
                          'TAJWEED',
                          textDirection: TextDirection.ltr,
                          style: ty.caption.copyWith(color: c.onPrimary.withValues(alpha: 0.8), letterSpacing: 2),
                        ),
                    ],
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsetsDirectional.only(start: Space.md),
                decoration: BoxDecoration(
                  border: BorderDirectional(start: BorderSide(color: c.gold.withValues(alpha: 0.6), width: 2)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  spacing: Space.md,
                  children: [
                    for (final tp in content.topics)
                      if (content.lessons.where((l) => l.topicId == tp.id).toList() case final ls when ls.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.all(Space.sm),
                          decoration: BoxDecoration(
                            color: c.surfaceContainerLowest,
                            borderRadius: BorderRadius.circular(Radii.card),
                            border: Border.all(color: c.outlineVariant),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            spacing: Space.sm,
                            children: [
                              Material(
                                color: c.surfaceContainer,
                                borderRadius: BorderRadius.circular(Radii.control),
                                child: InkWell(
                                  borderRadius: BorderRadius.circular(Radii.control),
                                  onTap: () => onTopic(tp.id),
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: Space.md, vertical: Space.xs),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          tp.nameAr,
                                          style: TextStyle(fontFamily: Fonts.naskh, fontSize: ty.bodyLg.fontSize, height: 1.5, color: c.onSurface).weight(700),
                                        ),
                                        Text(
                                          isAr
                                              ? t('{known}/{all} known', {'known': ls.where((l) => _known(status[l.id]!)).length, 'all': ls.length})
                                              : '${tp.nameEn} · ${ls.where((l) => _known(status[l.id]!)).length}/${ls.length} known',
                                          textDirection: isAr ? TextDirection.rtl : TextDirection.ltr,
                                          style: ty.caption.copyWith(color: c.onSurfaceVariant),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              Container(
                                margin: const EdgeInsetsDirectional.only(start: Space.sm),
                                decoration: BoxDecoration(
                                  border: BorderDirectional(start: BorderSide(color: c.outlineVariant)),
                                ),
                                child: Column(
                                  children: [
                                    for (final l in ls)
                                      InkWell(
                                        onTap: () => go(context, href('rules', l.id)),
                                        child: Container(
                                          constraints: const BoxConstraints(minHeight: 44),
                                          padding: const EdgeInsetsDirectional.only(start: Space.sm, end: Space.xs),
                                          child: Row(
                                            spacing: Space.sm,
                                            children: [
                                              ColourDot(colour: l.colour),
                                              Expanded(
                                                child: Text(l.nameAr, style: ty.arabicBody.weight(500).copyWith(color: c.onSurface)),
                                              ),
                                              if (status[l.id]!.correction)
                                                Container(
                                                  width: 8,
                                                  height: 8,
                                                  decoration: BoxDecoration(color: c.error, shape: BoxShape.circle),
                                                ),
                                              LevelChip(level: status[l.id]!.level, iconOnly: true),
                                            ],
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/* ---------------- Rule ---------------- */

class RuleScreen extends StatefulWidget {
  const RuleScreen({super.key, required this.lessonId});
  final String lessonId;
  @override
  State<RuleScreen> createState() => _RuleState();
}

class _RuleState extends State<RuleScreen> {
  final audio = StudyAudio();
  String? _started; // the example whose Play was tapped
  bool _more = false;

  @override
  void dispose() {
    audio.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(listenable: Listenable.merge([store, audio]), builder: (context, _) => _build(context));

  Widget _example(BuildContext context, Example e) {
    final c = context.c, ty = context.type;
    final s = audio.state;
    return VersesOf(
      from: e.verseKey,
      builder: (context, vs, _) {
        final v = vs?.firstOrNull;
        final playingThis = audio.busy && _started == e.id;
        final lit = s.verseKey == e.verseKey && s.word != null ? s.word!.$1 + 1 : null;
        return Container(
          padding: const EdgeInsets.all(Space.md),
          decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            spacing: Space.xs,
            children: [
              VerseBlock(
                ayah: v == null ? QAyah(key: e.verseKey, words: e.text.split(' ')) : QAyah.of(v),
                wholeAyah: v != null,
                focus: v == null ? null : (e.wordFrom, e.wordTo),
                focusText: e.focus,
                current: lit,
                stopping: e.stopping,
                tajweed: false,
                reference: verseRef(e.verseKey),
                onWord: v == null
                    ? null
                    : (n, _) {
                        setState(() => _started = null);
                        audio.player.load([v], audio.reciter, skipBasmala: true);
                        audio.player.playWord(v, n - 1);
                      },
                actions: [
                  AppButton(
                    label: playingThis ? t('Stop') : t('Play'),
                    icon: playingThis ? Icons.stop : Icons.volume_up_outlined,
                    variant: ButtonVariant.secondary,
                    size: ButtonSize.sm,
                    onPressed: v == null
                        ? null
                        : () {
                            if (playingThis) return audio.stop();
                            audio.ayah(v);
                            setState(() => _started = e.id);
                          },
                  ),
                  AppButton(
                    label: t('Player'),
                    iconEnd: Icons.arrow_forward,
                    variant: ButtonVariant.tertiary,
                    size: ButtonSize.sm,
                    onPressed: () => go(context, listenPath(e.verseKey)),
                  ),
                ],
              ),
              if (e.note?.isNotEmpty ?? false) Tx(e.note!, style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
            ],
          ),
        );
      },
    );
  }

  Widget _build(BuildContext context) {
    final c = context.c, ty = context.type;
    final lesson = content.getLesson(widget.lessonId);
    if (lesson == null) {
      return PageBody(
        items: [
          EmptyState(
            icon: Icons.search_off,
            title: t("This rule isn't in the library."),
            body: t('Check the link, or browse the library.'),
            action: AppButton(label: t('All rules'), variant: ButtonVariant.secondary, onPressed: () => go(context, 'rules')),
          ),
        ],
      );
    }
    final data = store.data;
    final s = lessonStatus(data, lesson.id);
    final topic = content.topics.where((x) => x.id == lesson.topicId).firstOrNull;
    final corrections = data.corrections.where((x) => x.deletedAt == null && x.status == 'open' && x.lessonIds.contains(lesson.id)).toList();
    final conds = lesson.conditions ?? const <String>[];
    final facts = lesson.letters != null || lesson.counts != null || conds.isNotEmpty || (lesson.list?.isNotEmpty ?? false);
    final lines = content.mutun.where((m) => m.lessonIds.contains(lesson.id)).toList();
    final matn = [
      for (final k in ['tuhfa', 'jazariyya'])
        if ((lines.where((m) => m.matn == k).map((m) => m.n).toList()..sort()) case final ns when ns.isNotEmpty)
          (
            k: k,
            from: ns.first,
            to: ns.last,
            name: k == 'tuhfa'
                ? '\u062a\u062d\u0641\u0629 \u0627\u0644\u0623\u0637\u0641\u0627\u0644'
                : '\u0627\u0644\u0645\u0642\u062f\u0645\u0629 \u0627\u0644\u062c\u0632\u0631\u064a\u0629',
            range: ns.length > 1 ? '${arDigits(ns.first)}–${arDigits(ns.last)}' : arDigits(ns.first),
          ),
    ];
    final review = lesson.review;
    final verified = review['status'] == 'verified';
    final notes = review['notes'] as String?;
    var n = 0;
    Widget label(String x) => Text(
      isAr ? x : x.toUpperCase(),
      style: ty.label.weight(600).copyWith(color: c.secondary, letterSpacing: isAr ? 0 : 1.2),
    );
    Widget fact(String l, List<Widget> children) =>
        Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.xs, children: [label(l), ...children]);

    final header = Container(
      padding: const EdgeInsets.all(Space.md),
      decoration: BoxDecoration(
        color: c.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(Radii.card),
        border: Border.all(color: c.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: Space.sm,
        children: [
          Wrap(
            spacing: Space.xs,
            runSpacing: Space.xs,
            children: [
              if (topic != null) AppChip(tone: ChipTone.gold, label: isAr ? topic.nameAr : '${topic.nameAr} · ${topic.nameEn}'),
              if (lesson.colour != null)
                Container(
                  height: 28,
                  padding: const EdgeInsets.symmetric(horizontal: 10),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: c.outlineVariant),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    spacing: 6,
                    children: [
                      ColourDot(colour: lesson.colour),
                      Text(
                        colourNames[lesson.colour]?.$1 ?? '',
                        textDirection: TextDirection.rtl,
                        style: ty.arabicLabel.copyWith(color: c.onSurface),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          Semantics(
            header: true,
            child: Text(
              lesson.nameAr,
              textDirection: TextDirection.rtl,
              style: TextStyle(fontFamily: Fonts.naskh, fontSize: 30, height: 1.5, color: c.onSurface).weight(700),
            ),
          ),
          if (!isAr) Text(lesson.nameEn, style: ty.headlineMd.weight(500).copyWith(color: c.onSurfaceVariant)),
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: LevelChip(level: s.level, detail: s.dueOn == null ? null : t('next review {day}', {'day': _dayShort(s.dueOn!)})),
          ),
          for (final x in corrections)
            Wrap(
              spacing: Space.sm,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Material(
                  color: c.errorContainer,
                  borderRadius: BorderRadius.circular(Radii.control),
                  child: InkWell(
                    onTap: () => go(context, listenPath(x.verseKey)),
                    child: Container(
                      constraints: const BoxConstraints(minHeight: 44),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        spacing: 4,
                        children: [
                          Icon(Icons.flag, size: 16, color: c.onErrorContainer),
                          Text('${t('Teacher correction open:')} ${verseRef(x.verseKey)}', style: ty.label.weight(600).copyWith(color: c.onErrorContainer)),
                        ],
                      ),
                    ),
                  ),
                ),
                if ((x.j['note'] as String?)?.isNotEmpty ?? false) Tx(x.j['note'], style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
              ],
            ),
          if (!verified)
            Callout(
              icon: Icons.edit_note,
              title: t('Draft.'),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                spacing: 4,
                children: [
                  Text(t('Not yet checked by a teacher. Read it with your teacher before relying on it.')),
                  if (notes?.isNotEmpty ?? false) Tx(notes!, style: TextStyle(color: c.onSurfaceVariant)),
                ],
              ),
            ),
        ],
      ),
    );

    final definition = SectionCard(
      n: ++n,
      en: 'What it is',
      ar: '\u0627\u0644\u062a\u0639\u0631\u064a\u0641',
      child: Tx(lesson.summary, style: ty.bodyLg.copyWith(color: c.onSurface, height: 1.65)),
    );

    final learn = Container(
      padding: const EdgeInsets.all(Space.md),
      decoration: BoxDecoration(color: c.primaryFill, borderRadius: BorderRadius.circular(Radii.card)),
      child: s.introduced
          ? Text(
              s.dueOn != null ? t('In your review. Next due {day}.', {'day': _dayShort(s.dueOn!)}) : t('In your review.'),
              style: ty.bodyLg.copyWith(color: c.onPrimary),
            )
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: Space.sm,
              children: [
                Tx(
                  t("Reading a card doesn't add it to your review. Learning it does. You'll meet it in unit {n} of the course.", {
                    'n': content.unitOf(lesson.id)?.n ?? '–',
                  }),
                  style: ty.bodyMd.copyWith(color: c.onPrimary.withValues(alpha: 0.9)),
                ),
                Material(
                  color: c.secondaryContainer,
                  borderRadius: BorderRadius.circular(Radii.control),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(Radii.control),
                    onTap: () => go(context, href('learn', lesson.id)),
                    child: Container(
                      constraints: const BoxConstraints(minHeight: 48),
                      alignment: Alignment.center,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        spacing: 8,
                        children: [
                          Flexible(child: Text(t('Learn this'), style: ty.bodyMd.weight(600).copyWith(color: c.onSecondaryContainer))),
                          Icon(Icons.arrow_forward, size: 20, color: c.onSecondaryContainer),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
    );

    final howItWorks = !facts
        ? null
        : SectionCard(
            n: ++n,
            en: 'How it works',
            ar: '\u0627\u0644\u0636\u0627\u0628\u0637',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: Space.md,
              children: [
                if (lesson.letters != null) fact(t('Letters'), [Letters(letters: lesson.letters!)]),
                if (lesson.counts case final k?)
                  fact(t('Length'), [
                    Wrap(
                      spacing: Space.sm,
                      crossAxisAlignment: WrapCrossAlignment.center,
                      children: [
                        CountBeats(min: k.min, max: k.max),
                        Text(_counts(k), style: ty.bodyMd.weight(600).copyWith(color: c.onSurface)),
                      ],
                    ),
                    if (k.note != null) Tx(k.note!, style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
                  ]),
                if (conds.isNotEmpty)
                  fact(t('When'), [
                    for (final x in conds)
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        spacing: Space.sm,
                        children: [
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Icon(Icons.check, size: 18, color: c.primary),
                          ),
                          Expanded(child: Tx(x)),
                        ],
                      ),
                  ]),
                if (lesson.list?.isNotEmpty ?? false)
                  fact(t('List'), [
                    for (final (i, r) in lesson.list!.indexed)
                      Container(
                        padding: const EdgeInsets.symmetric(vertical: Space.sm),
                        decoration: BoxDecoration(
                          border: i == 0 ? null : Border(top: BorderSide(color: c.outlineVariant)),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          spacing: 4,
                          children: [Tx(r.first), if (r.length > 1 && r[1].isNotEmpty) ContentLine(r[1])],
                        ),
                      ),
                  ]),
              ],
            ),
          );

    final more = lesson.examples.skip(3).toList();
    final examples = lesson.examples.isEmpty
        ? null
        : SectionCard(
            n: ++n,
            en: 'Examples',
            ar: '\u0623\u0645\u062b\u0644\u0629',
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: Space.md,
              children: [
                for (final e in lesson.examples.take(3)) _example(context, e),
                if (more.isNotEmpty) ...[
                  Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: AppButton(
                      label: t('More examples ({n})', {'n': more.length}),
                      iconEnd: _more ? Icons.expand_less : Icons.expand_more,
                      variant: ButtonVariant.tertiary,
                      size: ButtonSize.sm,
                      onPressed: () => setState(() => _more = !_more),
                    ),
                  ),
                  if (_more)
                    for (final e in more) _example(context, e),
                ],
                if (audio.state.status == PlayerStatus.offline || audio.state.status == PlayerStatus.error)
                  Text(audio.state.error ?? t('Audio needs a connection'), style: ty.bodyMd.copyWith(color: c.onSurface)),
                Row(
                  spacing: Space.xs,
                  children: [
                    Icon(Icons.touch_app_outlined, size: 18, color: c.onSurfaceVariant),
                    Expanded(
                      child: Text(t('Tap a word to hear it alone.'), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
                    ),
                  ],
                ),
              ],
            ),
          );

    final tip = lesson.tip == null ? null : Callout(kind: CalloutKind.tip, title: t('Remember'), child: Tx(lesson.tip!));

    final related = lesson.confusableWith.isEmpty && matn.isEmpty
        ? null
        : Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(color: c.surfaceContainer, borderRadius: BorderRadius.circular(Radii.card)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: Space.md,
              children: [
                if (lesson.confusableWith.isNotEmpty)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    spacing: Space.sm,
                    children: [
                      Text(t('Easy to mix up with:'), style: ty.label.weight(600).copyWith(color: c.onSurfaceVariant)),
                      Wrap(
                        spacing: Space.sm,
                        runSpacing: Space.sm,
                        children: [
                          for (final id in lesson.confusableWith)
                            if (content.getLesson(id) case final o?)
                              _Pill(
                                onTap: () => go(context, href('rules', id)),
                                children: [
                                  ColourDot(colour: o.colour),
                                  Text(
                                    o.nameAr,
                                    textDirection: TextDirection.rtl,
                                    style: ty.arabicBody.weight(600).copyWith(color: c.onSurface),
                                  ),
                                ],
                              ),
                        ],
                      ),
                    ],
                  ),
                if (matn.isNotEmpty)
                  Wrap(
                    spacing: Space.sm,
                    runSpacing: Space.xs,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    children: [
                      Icon(Icons.history_edu_outlined, size: 20, color: c.secondary),
                      for (final m in matn)
                        InkWell(
                          onTap: () => go(context, '${href('mutun', m.k)}?from=${m.from}&to=${m.to}'),
                          child: ConstrainedBox(
                            constraints: const BoxConstraints(minHeight: 44),
                            child: Center(
                              widthFactor: 1,
                              child: Text('${t('In the matn:')} ${m.name} ${m.range}', style: ty.bodyMd.weight(500).copyWith(color: c.primary)),
                            ),
                          ),
                        ),
                    ],
                  ),
              ],
            ),
          );

    final sources = lesson.sources.isEmpty && !verified
        ? null
        : Fold(
            icon: Icons.menu_book_outlined,
            title: t('Sources ({n})', {'n': lesson.sources.length}),
            children: [
              if (verified)
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  spacing: Space.xs,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Icon(Icons.verified, size: 18, color: c.primary),
                    ),
                    Expanded(
                      child: Tx(
                        '${t('Checked against at least two sources and the muṣḥaf text. Not yet reviewed by a teacher.')}${notes?.isNotEmpty ?? false ? ' $notes' : ''}',
                        style: ty.bodyMd.copyWith(color: c.onSurfaceVariant),
                      ),
                    ),
                  ],
                ),
              for (final src in lesson.sources) _Source(title: src.title, locator: src.locator),
            ],
          );

    // phones keep the web's reading order: definition, Learn this (until learned), facts, examples, the reminder
    return PageBody(items: [header, definition, if (!s.introduced) learn, ?howItWorks, ?examples, ?tip, ?related, ?sources, if (s.introduced) learn]);
  }
}

/// A source: its title, then the locator with its URLs as links.
class _Source extends StatelessWidget {
  const _Source({required this.title, required this.locator});
  final String title, locator;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final parts = <String>[];
    var at = 0;
    for (final m in RegExp(r'https?://\S+').allMatches(locator)) {
      parts
        ..add(locator.substring(at, m.start))
        ..add(m[0]!);
      at = m.end;
    }
    parts.add(locator.substring(at));
    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Tx(title, style: ty.bodyMd.copyWith(color: c.onSurface)),
        if (locator.isNotEmpty) Text(sep, style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
        for (final p in parts.where((p) => p.isNotEmpty))
          if (RegExp(r'^https?://').hasMatch(p.trim()))
            InkWell(
              onTap: () => launchUrl(Uri.parse(p.trim().replaceFirst(RegExp(r'[)\u060c,.]+$'), '')), mode: LaunchMode.externalApplication),
              child: Text(
                '${p.trim().replaceFirst(RegExp(r'^https?://'), '').replaceFirst(RegExp(r'[)\u060c,.]+$'), '')} ↗',
                style: ty.bodyMd.copyWith(color: c.primary),
              ),
            )
          else
            Tx(p, style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
      ],
    );
  }
}
