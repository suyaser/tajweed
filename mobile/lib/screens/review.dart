// Port of src/screens/Review.tsx (#/review): today's queue (spec F3, design §5.4–5.5). جلي corrections first, the
// rest shuffled by the day's seed and spread; a miss asks once more on another example, a confusion asks both ways
// between the two rules (learning M6). The run in progress survives leaving the screen, for today only.
import 'package:flutter/material.dart';
import 'package:intl/intl.dart' show DateFormat;

import '../app/router.dart';
import '../app/services.dart';
import '../app/shell.dart';
import '../content/content.dart';
import '../core/day.dart';
import '../core/questions.dart';
import '../core/scheduler.dart';
import '../core/types.dart';
import '../i18n/i18n.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'lesson_parts.dart';
import 'study.dart';

/// relearn = example id to avoid; contrast = after a confusion, a two-option question between the two rules.
typedef Entry = ({ReviewItem item, String? relearn, ({String ask, String vs})? contrast});

/// Never two items with the same key back to back when another can sit between them (helpers.ts spread).
List<T> spread<T>(List<T> xs, String Function(T) keyOf) {
  final rest = [...xs], out = <T>[];
  while (rest.isNotEmpty) {
    final prev = out.isEmpty ? null : keyOf(out.last);
    final i = rest.indexWhere((x) => keyOf(x) != prev);
    out.add(rest.removeAt(i < 0 ? 0 : i));
  }
  return out;
}

bool _isJali(ReviewItem i) => i.kind == 'correction' && i.severity == 'jali';
String _topicOf(ReviewItem i) => i.kind == 'correction' ? 'correction' : content.getLesson(i.refId)?.topicId ?? i.refId;

({Queue q, List<Entry> entries, Day day}) _start(UserData d, int extra) {
  final day = today();
  final q = buildQueue(d, content.units, day, extra);
  bool askable(ReviewItem i) => i.kind == 'lesson'
      ? (content.getLesson(i.refId)?.questionKinds.isNotEmpty ?? false)
      : i.kind == 'correction' && d.corrections.any((c) => c.id == i.refId && c.status == 'open' && c.deletedAt == null);
  // ponytail: matn/contrast items (R2) and lessons without questions are left due, not asked (as the web).
  final all = shuffle([...q.sabqi, ...q.manzil].where(askable).toList(), seeded(int.parse(day.replaceAll('-', '')) + extra));
  final entries = spread([
    ...all.where(_isJali),
    ...all.where((i) => !_isJali(i)),
  ], _topicOf).map<Entry>((item) => (item: item, relearn: null, contrast: null)).toList();
  return (q: q, entries: entries, day: day);
}

/// The run in progress (the web keeps it in sessionStorage): today only, in memory.
({Day day, int extra, List<Entry> entries, int idx, List<ReviewResult> results})? _saved;
void forgetReviewRun() => _saved = null; // a restore or reset (and tests)

String? _lastAsked(UserData d, String refId) => d.attempts.where((a) => a.kind == 'lesson' && a.refId == refId && a.exampleId != null).lastOrNull?.exampleId;

String? _confusableHint(String answerId, String chosenId) =>
    content.pairs.where((p) => (p.a == answerId && p.b == chosenId) || (p.b == answerId && p.a == chosenId)).firstOrNull?.hint;

class ReviewScreen extends StatefulWidget {
  const ReviewScreen({super.key, this.go = false, this.more = 0});
  final bool go; // Today's Review button: straight to the review, no سبق offer
  final int more;
  @override
  State<ReviewScreen> createState() => _ReviewState();
}

class _ReviewState extends State<ReviewScreen> {
  final audio = StudyAudio();
  late int _extra;
  late ({Queue q, List<Entry> entries, Day day}) _run;
  int _idx = 0;
  List<ReviewResult> _results = [];
  late bool _offer;
  Question? _question;
  int _questionFor = -1;

  @override
  void initState() {
    super.initState();
    final saved = widget.more > 0 || _saved?.day != today() ? null : _saved;
    _extra = saved?.extra ?? widget.more;
    final r = _start(store.data, _extra);
    _run = saved == null ? r : (q: r.q, entries: saved.entries, day: r.day);
    _idx = saved?.idx ?? 0;
    _results = saved?.results ?? [];
    _offer = !widget.go && saved == null && _run.q.sabaq != null && _extra == 0 && local.mem['skipSabaq'] != _run.day;
  }

  @override
  void dispose() {
    audio.dispose();
    super.dispose();
  }

  void _save() => _saved = (day: _run.day, extra: _extra, entries: _run.entries, idx: _idx, results: _results);

  Entry? get _entry => _idx < _run.entries.length ? _run.entries[_idx] : null;

  Question? _questionOf(Entry e) {
    if (_questionFor == _idx) return _question;
    _questionFor = _idx;
    if (e.item.kind != 'lesson') return _question = null;
    final refId = e.contrast?.ask ?? e.item.refId;
    final data = store.data;
    final avoid = e.relearn ?? _lastAsked(data, refId);
    return _question = makeQuestion(
      refId,
      QuestionCtx(
        lessons: content.lessons,
        introduced: data.introductions.map((i) => i.lessonId),
        munfasilLength: data.settings.munfasilLength,
        excludeExampleIds: e.relearn == null ? const [] : [e.relearn!],
        vs: e.contrast?.vs,
      ),
      lastExampleId: avoid ?? e.item.lastExampleId,
      reps: e.item.reps,
    );
  }

  void _next() {
    audio.stop();
    if (_idx + 1 >= _run.entries.length) store.markDayPart('review', 'auto');
    setState(() => _idx++);
    _save();
  }

  @override
  Widget build(BuildContext context) => PageBody(key: ValueKey('review$_idx${_offer ? 'o' : ''}'), top: Space.sm, items: _items(context));

  List<Widget> _items(BuildContext context) {
    final c = context.c, ty = context.type;
    final data = store.data, day = _run.day, entries = _run.entries;

    // the سبق offer first (optional)
    if (_offer && _run.q.sabaq != null) {
      final l = content.getLesson(_run.q.sabaq!);
      return [
        Container(
          padding: const EdgeInsets.all(Space.lg),
          decoration: BoxDecoration(
            color: c.surfaceContainerLowest,
            borderRadius: BorderRadius.circular(Radii.card),
            border: Border.all(color: c.outlineVariant),
          ),
          child: Column(
            spacing: Space.sm,
            children: [
              Text(
                isAr
                    ? '\u0627\u0644\u0633\u0628\u0642: \u062f\u0631\u0633 \u0627\u0644\u064a\u0648\u0645 \u0627\u0644\u062c\u062f\u064a\u062f'
                    : "TODAY'S NEW LESSON · \u0627\u0644\u0633\u0628\u0642",
                textAlign: TextAlign.center,
                style: ty.label.weight(600).copyWith(color: c.secondary, letterSpacing: isAr ? 0 : 1.2),
              ),
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(color: c.primaryContainer, shape: BoxShape.circle),
                child: Icon(Icons.menu_book, size: 28, color: c.onPrimaryContainer),
              ),
              Text(
                l?.nameAr ?? '',
                textAlign: TextAlign.center,
                textDirection: TextDirection.rtl,
                style: ty.arabicHeadline.copyWith(color: c.onSurface),
              ),
              if (!isAr)
                Text(
                  l?.nameEn ?? '',
                  textAlign: TextAlign.center,
                  style: ty.bodyLg.copyWith(color: c.onSurfaceVariant),
                ),
              const SizedBox(height: Space.sm),
              AppButton(
                label: t('Start lesson'),
                iconEnd: Icons.arrow_forward,
                size: ButtonSize.lg,
                block: true,
                onPressed: () => go(context, href('learn', _run.q.sabaq)),
              ),
              AppButton(
                label: entries.isNotEmpty ? t('Review first') : t('Not today'),
                variant: ButtonVariant.secondary,
                block: true,
                onPressed: () => setState(() => _offer = false),
              ),
            ],
          ),
        ),
      ];
    }

    // empty
    if (entries.isEmpty) {
      final upcoming = ([
        for (final i in data.items)
          if (i.deletedAt == null && (i.state == 'sabqi' || i.state == 'manzil') && i.dueOn.compareTo(day) > 0) i.dueOn,
      ]..sort()).firstOrNull;
      return [
        EmptyState(
          icon: Icons.event_available,
          title: data.items.isNotEmpty ? t('Nothing due today.') : t('Nothing to review yet.'),
          body: upcoming != null
              ? (diffDays(upcoming, day) == 1
                    ? t('Your next review is tomorrow.')
                    : t('Your next review is on {day}.', {'day': DateFormat('EEEE', isAr ? 'ar' : 'en_GB').format(DateTime.parse('${upcoming}T12:00:00'))}))
              : data.items.isEmpty
              ? t('Your first lesson starts it.')
              : null,
          action: AppButton(label: t('Back'), onPressed: () => go(context, 'today')),
        ),
      ];
    }

    final entry = _entry;
    // end summary
    if (entry == null) {
      final more = buildQueue(data, content.units, day, _extra + 10);
      final hasMore = more.sabqi.length + more.manzil.length > 0;
      return [
        ReviewSummary(
          results: _results,
          onMore: hasMore
              ? () => setState(() {
                  _extra += 10;
                  _run = _start(store.data, _extra);
                  _idx = 0;
                  _results = [];
                  _questionFor = -1;
                  _save();
                })
              : null,
        ),
      ];
    }

    // re-asks are counted apart, so a miss never moves the bar backwards (m3)
    bool firstAsk(Entry e) => e.relearn == null && e.contrast == null;
    final base = entries.where(firstAsk).length;
    final n = entries.take(_idx + 1).where(firstAsk).length;
    final againLeft = entries.skip(_idx + (firstAsk(entry) ? 1 : 0)).where((e) => !firstAsk(e)).length;
    final progress = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: Space.xs,
      children: [
        Text(
          '${t('{n} of {m}', {'n': n, 'm': base})}${againLeft > 0 ? t(' · {n} to look at again', {'n': againLeft}) : ''}',
          style: ty.label.copyWith(color: c.onSurfaceVariant),
        ),
        ClipRRect(
          borderRadius: BorderRadius.circular(3),
          child: LinearProgressIndicator(value: n / (base < 1 ? 1 : base), minHeight: 6, color: c.primary, backgroundColor: c.surfaceContainerHigh),
        ),
      ],
    );
    final halfway = _idx == 10 && entries.length > 12 ? Callout(child: Text(t('Halfway. You can stop here; the rest stays due.'))) : null;

    if (entry.item.kind == 'correction') {
      final corr = data.corrections.firstWhere((x) => x.id == entry.item.refId);
      return [
        progress,
        ?halfway,
        CorrectionStep(
          key: ValueKey('c$_idx'),
          c: corr,
          audio: audio,
          onNext: _next,
          onRate: (applied) {
            store.recordAttempt({
              'kind': 'correction', 'refId': corr.id, 'source': 'selfrate', 'chosen': applied ? 'applied' : 'not_yet', //
              'correct': applied, 'countsForSchedule': true,
            });
            _results = [..._results, (itemId: entry.item.id, kind: 'correction', refId: corr.id, correct: applied, selfRated: true)];
            _save();
          },
        ),
      ];
    }

    final question = _questionOf(entry);
    if (question == null) {
      return [
        EmptyState(
          title: t('This item has no question yet.'),
          action: AppButton(label: t('Skip'), onPressed: _next),
        ),
      ];
    }
    final it = entry.item;
    final again = entry.relearn != null || entry.contrast != null;
    final hint = entry.contrast == null ? null : _confusableHint(entry.contrast!.ask, entry.contrast!.vs);
    final eyebrow = entry.contrast != null
        ? t('Tell the two apart')
        : entry.relearn != null
        ? t('Once more, a different example')
        : null;
    final note = [?halfway, if (hint != null) Callout(title: t('Easy to mix up'), child: Tx(hint))];
    return [
      progress,
      QuestionView(
        key: ValueKey('q$_idx'),
        q: question,
        mode: again ? QMode.relearn : QMode.review,
        eyebrow: eyebrow,
        audio: audio,
        note: note.isEmpty ? null : Column(spacing: Space.md, children: note),
        onNext: _next,
        onAnswer: (chosen, correct) {
          store.recordAttempt({
            'kind': 'lesson', 'refId': question.lessonId, 'source': again ? 'relearn' : 'review', 'questionKind': question.kind, //
            'exampleId': question.exampleId, 'chosen': chosen, 'correct': correct, 'countsForSchedule': !again,
          });
          if (again) return;
          _results = [..._results, (itemId: it.id, kind: 'lesson', refId: it.refId, correct: correct, selfRated: false)];
          if (!correct) {
            // confused with its partner: ask both ways between the two; otherwise once more on a different example
            final paired = question.kind == 'identify' && _confusableHint(it.refId, chosen) != null;
            final List<Entry> more = paired
                ? [(item: it, relearn: null, contrast: (ask: it.refId, vs: chosen)), (item: it, relearn: null, contrast: (ask: chosen, vs: it.refId))]
                : [(item: it, relearn: question.exampleId, contrast: null)];
            _run = (q: _run.q, entries: [..._run.entries, ...more], day: _run.day);
          }
          setState(_save);
        },
      ),
    ];
  }
}
