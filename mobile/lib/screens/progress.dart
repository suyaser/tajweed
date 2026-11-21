// Port of src/screens/Progress.tsx (#/progress, the Path tab's second view): how you recite (from the teacher log),
// what you can recognise (from the quiz), consistency (16 weeks), and the S1–S6 goals as plain values (spec §1.2).
// The web's backup badge belongs to the account (phase 2), so it isn't shown.
import 'package:flutter/material.dart';

import '../app/router.dart';
import '../app/services.dart';
import '../app/shell.dart';
import '../content/content.dart';
import '../core/course.dart';
import '../core/day.dart';
import '../core/scheduler.dart';
import '../core/types.dart';
import '../i18n/i18n.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'lesson_parts.dart';
import 'path.dart';
import 'rules.dart';

String _times(int n) => tn('{n} time', '{n} times', n);
String _lapses(int n) => tn('{n} lapse', '{n} lapses', n);
String _weeksN(int n) => tn('{n} week', '{n} weeks', n);

/// Quiz accuracy on lesson answers in the last [days] days (helpers.ts accuracy).
({int correct, int total}) accuracy(List<Attempt> attempts, Day on, [int days = 30]) {
  final from = addDays(on, -(days - 1));
  final xs = attempts.where(
    (a) => a.kind == 'lesson' && !{'pretest', 'teacher', 'selfrate'}.contains(a.source) && a.on.compareTo(from) >= 0 && a.on.compareTo(on) <= 0,
  );
  return (correct: xs.where((a) => a.correct).length, total: xs.length);
}

/// The last [n] weeks (Saturday first), oldest first; `full` = weeks with ≥ 5 days studied since [since] (helpers.ts weeks).
({List<({Day start, List<String> marks, int count, bool counted})> weeks, int full, int total}) weeks(Set<Day> studied, Day on, [int n = 16, Day? since]) {
  final out = [
    for (var i = 0; i < n; i++)
      () {
        final days = weekDays(addDays(on, -7 * (n - 1 - i)));
        final marks = [
          for (final d in days)
            d.compareTo(on) > 0
                ? 'future'
                : studied.contains(d)
                ? 'studied'
                : 'not',
        ];
        return (start: days.first, marks: marks, count: marks.where((m) => m == 'studied').length, counted: since == null || days[6].compareTo(since) >= 0);
      }(),
  ];
  final counted = out.where((w) => w.counted).toList();
  return (weeks: out, full: counted.where((w) => w.count >= 5).length, total: counted.length);
}

class Progress extends StatelessWidget {
  const Progress({super.key});
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: store,
    builder: (context, _) {
      final d = store.data;
      final p = CourseProgress.of(d, content.units);
      return PageBody(
        items: [
          PageHeader(
            en: 'Course path',
            ar: '\u0627\u0644\u0645\u0633\u0627\u0631',
            detail: [
              tn('{n} unit', '{n} units', content.units.length),
              t('{n} of {m} lessons done', {'n': p.done.length, 'm': content.courseOrder.length}),
              riwayah,
            ],
            secondaryDetail: const {2},
          ),
          Segmented<String>(
            value: 'progress',
            onChanged: (v) => v == 'plan' ? go(context, 'plan') : null,
            options: [(value: 'plan', label: t('Plan'), icon: Icons.route_outlined), (value: 'progress', label: t('Progress'), icon: Icons.insights_outlined)],
          ),
          _Recitation(d: d),
          _Recognition(d: d),
          _Consistency(d: d),
          _Goals(d: d, p: p),
        ],
      );
    },
  );
}

Widget _eyebrow(BuildContext context, String s) => Text(
  isAr ? s : s.toUpperCase(),
  style: context.type.label.weight(600).copyWith(color: context.c.secondary, letterSpacing: isAr ? 0 : 1.2),
);

Widget _title(BuildContext context, String eyebrow, String title) => Column(
  crossAxisAlignment: CrossAxisAlignment.start,
  spacing: 2,
  children: [
    _eyebrow(context, eyebrow),
    Text(title, style: context.type.bodyLg.weight(600).copyWith(color: context.c.onSurface)),
  ],
);

Widget _muted(BuildContext context, String s) => Text(s, style: context.type.bodyMd.copyWith(color: context.c.onSurfaceVariant));

/// "Title:" then one Arabic name per line, so a wrapped Arabic island never reorders the sentence.
class _NameList extends StatelessWidget {
  const _NameList({required this.title, required this.items});
  final String title;
  final List<(String, String)> items;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: 4,
      children: [
        Text(title, style: ty.label.weight(600).copyWith(color: c.onSurfaceVariant)),
        for (final (i, (ar, detail)) in items.indexed)
          Container(
            padding: const EdgeInsets.symmetric(vertical: 6),
            decoration: BoxDecoration(
              border: i == items.length - 1 ? null : Border(bottom: BorderSide(color: c.surfaceContainer)),
            ),
            child: Wrap(
              spacing: Space.sm,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text(
                  ar,
                  textDirection: TextDirection.rtl,
                  style: ty.arabicBody.copyWith(color: c.onSurface),
                ),
                Text(detail, style: ty.label.copyWith(color: c.onSurfaceVariant)),
              ],
            ),
          ),
      ],
    );
  }
}

class _Recitation extends StatelessWidget {
  const _Recitation({required this.d});
  final UserData d;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final cs = d.corrections.where((x) => x.deletedAt == null).toList();
    final sessions = d.sessions.where((s) => s.j['deletedAt'] == null && (s.status == 'done' || cs.any((x) => x.j['sessionId'] == s.id))).toList()
      ..sort((a, b) => b.on.compareTo(a.on));
    final shown = sessions.take(8).toList();
    final open = cs.where((x) => x.status == 'open').length;
    final byRule = <String, int>{};
    for (final x in cs) {
      for (final l in x.lessonIds) {
        byRule[l] = (byRule[l] ?? 0) + 1;
      }
    }
    final top = (byRule.entries.toList()..sort((a, b) => b.value - a.value)).take(3).toList();
    final passed = [for (final f in d.finales) (content.getUnit(f.unitId)?.finale?.label ?? f.unitId, dayLabel(f.on))];
    return Panel(
      children: [
        _title(context, t('From your teacher'), t('How you recite')),
        if (cs.isEmpty && shown.isEmpty)
          _muted(context, t("Your teacher's corrections will show here after your first session."))
        else ...[
          if (shown.isNotEmpty)
            Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: 6,
              children: [
                Text('${t('Corrections per session')} ${t('· newest first')}', style: ty.label.weight(600).copyWith(color: c.onSurfaceVariant)),
                for (final s in shown)
                  Builder(
                    builder: (context) {
                      final mine = cs.where((x) => x.j['sessionId'] == s.id).toList();
                      final j = mine.where((x) => x.severity == 'jali').length, k = mine.length - j;
                      return Row(
                        spacing: Space.sm,
                        children: [
                          SizedBox(
                            width: 96,
                            child: Text(dayLabel(s.on), style: ty.label.copyWith(color: c.onSurfaceVariant)),
                          ),
                          Expanded(
                            child: ExcludeSemantics(
                              child: Wrap(
                                spacing: 3,
                                runSpacing: 3,
                                children: [
                                  for (var i = 0; i < j; i++)
                                    Container(
                                      width: 12,
                                      height: 12,
                                      decoration: BoxDecoration(color: c.error, borderRadius: BorderRadius.circular(3)),
                                    ),
                                  for (var i = 0; i < k; i++)
                                    Container(
                                      width: 12,
                                      height: 12,
                                      decoration: BoxDecoration(
                                        border: Border.all(color: c.outline, width: 1.5),
                                        borderRadius: BorderRadius.circular(3),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                          Tx('${digits(j)} \u062c\u0644\u064a$sep${digits(k)} \u062e\u0641\u064a', style: ty.label.copyWith(color: c.onSurface)),
                        ],
                      );
                    },
                  ),
              ],
            ),
          Text(t('Open {n} · Resolved {m}', {'n': open, 'm': cs.length - open}), style: ty.bodyMd.copyWith(color: c.onSurface)),
          if (top.isNotEmpty) _NameList(title: t('Corrected most'), items: [for (final e in top) (content.getLesson(e.key)?.nameAr ?? e.key, _times(e.value))]),
          if (passed.isNotEmpty) _NameList(title: t('Unit finales recited'), items: passed),
        ],
      ],
    );
  }
}

const _levelsOrder = ['strong', 'known', 'learning', 'not-started'];

class _Recognition extends StatelessWidget {
  const _Recognition({required this.d});
  final UserData d;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type, on = today();
    final itemOf = {
      for (final i in d.items)
        if (i.kind == 'lesson') i.refId: i,
    };
    final rows = [
      for (final l in content.lessons)
        () {
          final it = itemOf[l.id];
          final answers = d.attempts.where((a) => a.kind == 'lesson' && a.refId == l.id && a.countsForSchedule).toList();
          final last5 = answers.skip(answers.length < 5 ? 0 : answers.length - 5).toList();
          return (
            l: l,
            it: it,
            level: levelOf(it, d.attempts),
            last5: last5.where((a) => a.correct).length,
            n5: last5.length,
            open: hasOpenCorrection(l.id, d.corrections),
          );
        }(),
    ];
    final slipping = rows.where((r) => (r.it?.lapses ?? 0) >= 2).toList()..sort((a, b) => b.it!.lapses - a.it!.lapses);
    final acc = accuracy(d.attempts, on);
    return Panel(
      children: [
        _title(context, t('From the quiz'), t('What you can recognise')),
        if (d.introductions.isEmpty)
          _muted(context, t('Levels start after your first lesson.'))
        else ...[
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: [for (final lv in _levelsOrder) LevelChip(level: lv, detail: digits(rows.where((r) => r.level == lv).length))],
          ),
          if (acc.total > 0)
            Text(
              t('In the last 30 days you answered {n} of {m} review questions correctly.', {'n': acc.correct, 'm': acc.total}),
              style: ty.bodyMd.copyWith(color: c.onSurface),
            ),
          if (slipping.isNotEmpty) _NameList(title: t('Slipping'), items: [for (final r in slipping.take(3)) (r.l.nameAr, _lapses(r.it!.lapses))]),
          Fold(
            icon: Icons.list_alt,
            title: t('See all rules'),
            children: [
              for (final tp in content.topics)
                if ((rows.where((r) => r.l.topicId == tp.id).toList()..sort((a, b) => (b.it?.lapses ?? 0) - (a.it?.lapses ?? 0))) case final tr
                    when tr.isNotEmpty)
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    spacing: 4,
                    children: [
                      Padding(
                        padding: const EdgeInsets.only(top: Space.xs),
                        child: _eyebrow(context, isAr ? tp.nameAr : '${tp.nameAr} · ${tp.nameEn}'),
                      ),
                      for (final r in tr)
                        InkWell(
                          onTap: () => go(context, href('rules', r.l.id)),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: Space.sm),
                            child: Wrap(
                              spacing: Space.sm,
                              runSpacing: 4,
                              crossAxisAlignment: WrapCrossAlignment.center,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      r.l.nameAr,
                                      textDirection: TextDirection.rtl,
                                      style: ty.arabicBody.copyWith(color: c.onSurface),
                                    ),
                                    Text(
                                      r.it != null
                                          ? [
                                              tn('every {n} day', 'every {n} days', ladder[r.it!.step]),
                                              _lapses(r.it!.lapses),
                                              t('last {n}: {m} right', {'n': r.n5, 'm': r.last5}),
                                              t('next {day}', {'day': dayLabel(r.it!.dueOn)}),
                                            ].join(sep)
                                          : t('not started'),
                                      style: ty.label.copyWith(color: c.onSurfaceVariant),
                                    ),
                                  ],
                                ),
                                LevelChip(level: r.level),
                                if (r.open) AppChip(tone: ChipTone.error, icon: Icons.flag, fill: true, label: t('teacher correction open')),
                              ],
                            ),
                          ),
                        ),
                    ],
                  ),
            ],
          ),
        ],
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          spacing: 6,
          children: [
            Icon(Icons.info_outline, size: 16, color: c.onSurfaceVariant),
            Expanded(
              child: Text(
                t('This shows you can name a rule. Only your teacher can tell you if you recite it.'),
                style: ty.label.copyWith(color: c.onSurfaceVariant),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _Consistency extends StatelessWidget {
  const _Consistency({required this.d});
  final UserData d;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type, on = today();
    final w = weeks(studiedDays(d), on, 16, d.settings.onboardedOn);
    final shown = w.weeks.where((x) => x.counted).toList();
    final thisWeek = w.weeks.last;
    final fi = thisWeek.marks.indexOf('future');
    return Panel(
      title: t('Consistency'),
      icon: Icons.calendar_month_outlined,
      children: [
        Text(
          '${tn('This week: {n} day studied.', 'This week: {n} days studied.', thisWeek.count)}'
          '${w.total > 1 ? t(' Studied 5 or more days in {n} of the last {weeks}.', {'n': w.full, 'weeks': _weeksN(w.total)}) : ''}',
          style: ty.bodyMd.copyWith(color: c.onSurface),
        ),
        WeekDots(days: thisWeek.marks, today: fi >= 0 ? fi - 1 : 6),
        if (shown.length > 1)
          Semantics(
            label: t('Days studied per week, oldest first'),
            child: Column(
              spacing: Space.sm,
              children: [
                for (final x in shown.take(shown.length - 1))
                  Row(
                    spacing: Space.sm,
                    children: [
                      SizedBox(
                        width: 104,
                        child: Text(dayLabel(x.start), style: ty.label.copyWith(color: c.onSurfaceVariant)),
                      ),
                      for (final m in x.marks)
                        Container(
                          width: 14,
                          height: 14,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: m == 'studied'
                                ? c.primaryFill
                                : m == 'future'
                                ? null
                                : c.surfaceContainer,
                            border: m == 'future' ? Border.all(color: c.outlineVariant) : null,
                          ),
                        ),
                    ],
                  ),
              ],
            ),
          ),
      ],
    );
  }
}

/// S1–S6 (spec §1.2), plain values.
class _Goals extends StatelessWidget {
  const _Goals({required this.d, required this.p});
  final UserData d;
  final CourseProgress p;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type, on = today();
    final units = content.units;
    final cs = d.corrections.where((x) => x.deletedAt == null).toList();
    final unitsDone = units.where((u) => p.lessonsDone(u) && p.finaleDone(u)).length;
    final ms = d.sessions.where((s) => s.j['deletedAt'] == null && ((s.j['milestoneResults'] as List?)?.isNotEmpty ?? false)).toList()
      ..sort((a, b) => b.on.compareTo(a.on));
    final jaliLast = ms.isEmpty ? null : cs.where((x) => x.j['sessionId'] == ms.first.id && x.severity == 'jali').length;
    final quizzable = [
      for (final id in content.courseOrder)
        if (p.done.contains(id) && (content.getLesson(id)?.questionKinds.isNotEmpty ?? false)) id,
    ];
    final strongEnough = quizzable.where((id) => (d.items.where((i) => i.kind == 'lesson' && i.refId == id).firstOrNull?.step ?? 0) >= 3).length;
    final acc = accuracy(d.attempts, on, 14);
    final khafi = cs.where((x) => x.severity == 'khafi').toList();
    final w = weeks(studiedDays(d), on, 16, d.settings.onboardedOn);
    final done = d.sessions.where((s) => s.j['deletedAt'] == null && s.status == 'done').length;
    final goals = [
      (
        'S1',
        t('The course'),
        t('{n} of {m} lessons · {u} of {v} units done', {'n': p.done.length, 'm': content.courseOrder.length, 'u': unitsDone, 'v': units.length}),
      ),
      (
        'S2',
        t('Clear errors on the last finale session'),
        jaliLast == null ? t('No milestone session yet') : t('{n} \u062c\u0644\u064a (goal: 0)', {'n': jaliLast}),
      ),
      (
        'S3',
        t('Rule recognition (quiz only)'),
        t('{n} of {m} learned rules at a 14-day interval', {'n': strongEnough, 'm': quizzable.length}) +
            (acc.total > 0 ? t(' · {p}% right in the last 2 weeks', {'p': (100 * acc.correct / acc.total).round()}) : '') +
            t(' (goal: all, and 90%)'),
      ),
      (
        'S4',
        t('Fine-detail corrections that stick'),
        khafi.isNotEmpty
            ? t('{n} of {m} \u062e\u0641\u064a corrections resolved (goal: 80%)', {'n': khafi.where((x) => x.status == 'resolved').length, 'm': khafi.length})
            : t('No \u062e\u0641\u064a corrections yet'),
      ),
      ('S5', t('Consistency'), t('{n} of {weeks} with 5 or more study days (goal: 12 of 16)', {'n': w.full, 'weeks': _weeksN(w.total)})),
      ('S6', t('Teacher contact'), tn('{n} session logged (goal: 12)', '{n} sessions logged (goal: 12)', done)),
    ];
    return Fold(
      icon: Icons.flag_outlined,
      title: t('Goals'),
      children: [
        for (final (id, name, value) in goals)
          Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: 2,
              children: [
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: isAr ? digits(id.substring(1)) : id,
                        style: TextStyle(color: c.secondary, fontWeight: FontWeight.w700),
                      ),
                      TextSpan(text: sep),
                      TextSpan(text: name),
                    ],
                  ),
                  style: ty.label.copyWith(color: c.onSurfaceVariant),
                ),
                Tx(value, style: ty.bodyMd.copyWith(color: c.onSurface)),
              ],
            ),
          ),
      ],
    );
  }
}
