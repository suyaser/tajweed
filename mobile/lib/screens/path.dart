// Building blocks shared by Today, the course map and Unit (port of src/screens/path/blocks.tsx, path/helpers.ts and
// study/helpers.ts week()).
import 'package:flutter/material.dart';
import 'package:intl/intl.dart' show DateFormat;

import '../app/router.dart';
import '../app/services.dart';
import '../app/shell.dart';
import '../content/content.dart';
import '../core/course.dart';
import '../core/day.dart';
import '../core/lesson_steps.dart';
import '../core/types.dart';
import '../i18n/i18n.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'study.dart';

/// 'Thu 20 Nov' (Arabic: 'الخميس ٢٠ نوفمبر').
String dayLabel(Day d) => digits(DateFormat('EEE d MMM', isAr ? 'ar' : 'en_GB').format(DateTime.parse('${d}T12:00:00')));

/// The study day as Today's header shows it: the Gregorian date, the Hijri date (in Arabic), and the 03:00 note.
({String gregorian, String hijri, String late}) dates([DateTime? now]) {
  final n = now ?? DateTime.now();
  final d = DateTime.parse('${today(n)}T12:00:00');
  final g = digits(DateFormat(isAr ? 'EEEE\u060c d MMMM' : 'EEEE d MMMM', isAr ? 'ar' : 'en_GB').format(d));
  final late = n.hour < 3 ? t("Still {day}'s wird until 03:00", {'day': DateFormat('EEEE', isAr ? 'ar' : 'en_GB').format(d)}) : '';
  return (gregorian: g, hijri: hijri(d), late: late);
}

const _hijriMonths = [
  '\u0645\u062d\u0631\u0645', '\u0635\u0641\u0631', '\u0631\u0628\u064a\u0639 \u0627\u0644\u0623\u0648\u0644', '\u0631\u0628\u064a\u0639 \u0627\u0644\u0622\u062e\u0631', '\u062c\u0645\u0627\u062f\u0649 \u0627\u0644\u0623\u0648\u0644\u0649', '\u062c\u0645\u0627\u062f\u0649 \u0627\u0644\u0622\u062e\u0631\u0629', //
  '\u0631\u062c\u0628', '\u0634\u0639\u0628\u0627\u0646', '\u0631\u0645\u0636\u0627\u0646', '\u0634\u0648\u0627\u0644', '\u0630\u0648 \u0627\u0644\u0642\u0639\u062f\u0629', '\u0630\u0648 \u0627\u0644\u062d\u062c\u0629',
];

/// '٢١ جمادى الآخرة ١٤٤٨'.
// ponytail: the tabular (arithmetical) Islamic calendar; the web's Umm al-Qura can differ by a day. A table of
// Umm al-Qura month starts if it matters.
String hijri(DateTime d) {
  var l = DateTime.utc(d.year, d.month, d.day).millisecondsSinceEpoch ~/ 86400000 + 2440588 - 1948440 + 10632;
  final n = (l - 1) ~/ 10631;
  l = l - 10631 * n + 354;
  final j = ((10985 - l) ~/ 5316) * ((50 * l) ~/ 17719) + (l ~/ 5670) * ((43 * l) ~/ 15238);
  l = l - ((30 - j) ~/ 15) * ((17719 * j) ~/ 50) - (j ~/ 16) * ((15238 * j) ~/ 43) + 29;
  final m = (24 * l) ~/ 709;
  final day = l - (709 * m) ~/ 24;
  final y = 30 * n + j - 30;
  return '${arDigits(day)} ${_hijriMonths[m - 1]} ${arDigits(y)}';
}

/* ---------------- the week ---------------- */

/// Days with any study: a wird part marked, listening, an answer, or a lesson introduced.
Set<Day> studiedDays(UserData d) => {
  for (final l in d.days)
    if (l.listenSeconds > 0 || l.parts.values.any((v) => v != null)) l.id,
  for (final a in d.attempts)
    if (a.source != 'teacher') a.on,
  for (final i in d.introductions) i.on,
};

/// studied | not | before | future
({List<String> marks, int todayIndex, int count, int month}) week(UserData d, Day day, Day? startedOn) {
  final studied = studiedDays(d);
  final ds = weekDays(day);
  final marks = [
    for (final x in ds)
      x.compareTo(day) > 0
          ? 'future'
          : studied.contains(x)
          ? 'studied'
          : startedOn != null && x.compareTo(startedOn) < 0
          ? 'before'
          : 'not',
  ];
  final month = studied.where((x) => x.substring(0, 7) == day.substring(0, 7) && x.compareTo(day) <= 0).length;
  return (marks: marks, todayIndex: ds.indexOf(day), count: marks.where((m) => m == 'studied').length, month: month);
}

const _weekNames = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

/// One week (Saturday first) as seven circles: studied ✓, today ringed in gold, before you started dashed.
class WeekDots extends StatelessWidget {
  const WeekDots({super.key, required this.days, this.today});
  final List<String> days;
  final int? today;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final n = days.where((d) => d == 'studied').length;
    return Semantics(
      label: n == 1 ? t('1 day studied this week') : t('{n} days studied this week', {'n': n}),
      child: Row(children: [
        for (final (i, d) in days.indexed)
          Expanded(
            child: ExcludeSemantics(
              child: Column(spacing: 6, children: [
                Text(t(_weekNames[i]), maxLines: 1, style: ty.caption.weight(i == today ? 700 : 400).copyWith(color: i == today ? c.secondary : c.onSurfaceVariant)),
                Container(
                  padding: const EdgeInsets.all(2),
                  decoration: i == today ? BoxDecoration(shape: BoxShape.circle, border: Border.all(color: c.gold, width: 2)) : null,
                  child: Container(
                    margin: EdgeInsets.all(i == today ? 2 : 4),
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: d == 'studied' ? c.primaryFill : d == 'before' ? null : c.surfaceContainer,
                      border: d == 'before' ? Border.all(color: c.outlineVariant) : null,
                    ),
                    child: d == 'studied'
                        ? Icon(Icons.check, size: 16, color: c.onPrimary)
                        : d == 'not'
                        ? Center(child: Container(width: 4, height: 4, decoration: BoxDecoration(color: c.outline, shape: BoxShape.circle)))
                        : null,
                  ),
                ),
              ]),
            ),
          ),
      ]),
    );
  }
}

/// A quiet notice (backup, welcome back) with an optional action and ✕ (path/blocks Note).
class Note extends StatelessWidget {
  const Note({super.key, required this.text, this.icon = Icons.info_outline, this.action, this.onDismiss});
  final String text;
  final IconData icon;
  final Widget? action;
  final VoidCallback? onDismiss;
  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Container(
      padding: const EdgeInsetsDirectional.only(start: Space.md, end: Space.xs, top: Space.xs, bottom: Space.xs),
      decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.card), border: Border.all(color: c.outlineVariant)),
      child: Row(spacing: Space.sm, children: [
        Icon(icon, size: 20, color: c.secondary),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: Space.sm),
            child: Tx(text, style: context.type.bodyMd.copyWith(color: c.onSurface)),
          ),
        ),
        ?action,
        if (onDismiss != null) AppIconButton(icon: Icons.close, label: t('Dismiss'), onPressed: onDismiss),
      ]),
    );
  }
}

/* ---------------- units and lessons ---------------- */

enum UnitStatus { passed, active, locked }

UnitStatus statusOf(Unit u, CourseProgress p) =>
    p.lessonsDone(u) && p.finaleDone(u) ? UnitStatus.passed : p.open(u) ? UnitStatus.active : UnitStatus.locked;

/// A unit's round marker: ✓ when complete, its number (gold ring) when open, a lock when locked.
class UnitNode extends StatelessWidget {
  const UnitNode({super.key, required this.n, required this.status, this.large = false});
  final int n;
  final UnitStatus status;
  final bool large;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final s = large ? 56.0 : 40.0;
    return ExcludeSemantics(
      child: Container(
        width: s,
        height: s,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: switch (status) { UnitStatus.passed => c.primaryFill, UnitStatus.active => c.surfaceContainerLowest, UnitStatus.locked => c.surfaceContainer },
          border: status == UnitStatus.active ? Border.all(color: c.gold, width: 2) : null,
        ),
        child: switch (status) {
          UnitStatus.passed => Icon(Icons.check, size: large ? 28 : 20, color: c.onPrimary),
          UnitStatus.locked => Icon(Icons.lock_outline, size: large ? 24 : 18, color: c.outline),
          UnitStatus.active => Text(digits(n), style: (large ? ty.bodyLg : ty.bodyMd).weight(600).copyWith(color: c.primary, height: 1)),
        },
      ),
    );
  }
}

/// A lesson's state on the course map: done | next | catch-up | locked.
enum RowState { done, next, catchUp, locked }

/// A unit's lessons and its finale (the course map and the unit page). Tapping a locked lesson opens its gate.
class UnitLessons extends StatelessWidget {
  const UnitLessons({super.key, required this.u, required this.p});
  final Unit u;
  final CourseProgress p;

  @override
  Widget build(BuildContext context) {
    final day = today();
    final items = store.data.items;
    final nextId = p.next.kind == 'lesson' ? p.next.id : null;
    List<String> meta(String id, RowState st) {
      final item = items.where((i) => i.deletedAt == null && i.kind == 'lesson' && i.refId == id).firstOrNull;
      final steps = st == RowState.next ? local.getSteps(id) : null;
      final started = steps != null && ((steps['done'] as List).isNotEmpty || steps['current'] != 'hear');
      return [
        t('Lesson {n}', {'n': content.courseOrder.indexOf(id) + 1}),
        if (st == RowState.done && item != null)
          item.dueOn.compareTo(day) <= 0 ? t('review due') : t('next review {day}', {'day': dayLabel(item.dueOn)}),
        if (st == RowState.next)
          started
              ? t('step {n} of {m}', {'n': stepIds.indexOf(steps['current'] as String) + 1, 'm': stepIds.length})
              : t('about {n} min', {'n': lessonMinutes}),
      ];
    }

    final finale = p.finaleDone(u)
        ? RowState.done
        : p.next.kind == 'finale' && p.next.unit?.id == u.id
        ? RowState.next
        : RowState.locked;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: 2, children: [
      for (final id in u.lessonIds)
        Builder(builder: (context) {
          final l = content.getLesson(id)!;
          final st = p.done.contains(id)
              ? RowState.done
              : id == nextId
              ? RowState.next
              : p.catchUp(id)
              ? RowState.catchUp
              : RowState.locked;
          final c = content.courseLesson(id).closing;
          return LessonRow(
            onTap: () => go(context, href('learn', id)),
            ar: l.nameAr,
            en: isAr ? '' : l.nameEn,
            st: st,
            meta: meta(id, st),
            passage: c == null ? null : rangeRef(c.from, c.to),
          );
        }),
      if (u.finale != null)
        LessonRow(
          finale: true,
          onTap: () => go(context, '${href('unit', u.id)}?finale=1'),
          ar: u.finale!.label,
          en: t('Unit finale: recite the passage'),
          st: finale,
        ),
    ]);
  }
}

class LessonRow extends StatelessWidget {
  const LessonRow({super.key, required this.onTap, required this.ar, required this.en, required this.st, this.finale = false, this.meta = const [], this.passage});
  final VoidCallback onTap;
  final String ar, en;
  final RowState st;
  final bool finale;
  final List<String> meta;
  final String? passage;

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final next = st == RowState.next;
    final (Color bg, Color fg) = finale
        ? (c.secondaryContainer, c.onSecondaryContainer)
        : switch (st) {
            RowState.done => (c.primaryContainer, c.onPrimaryContainer),
            RowState.next => (c.onPrimary, c.primaryFill),
            RowState.catchUp => (c.secondaryContainer, c.onSecondaryContainer),
            RowState.locked => (c.surfaceContainer, c.outline),
          };
    final icon = finale
        ? (st == RowState.done ? Icons.star : Icons.star_outline)
        : switch (st) { RowState.done => Icons.check, RowState.next => Icons.play_arrow, RowState.catchUp => Icons.new_releases_outlined, RowState.locked => Icons.lock_outline };
    final action = switch (st) {
      RowState.done => t('done, replay it'),
      RowState.next => t('next, start it'),
      RowState.catchUp => t('new in this version, open'),
      RowState.locked => t('locked'),
    };
    final text = next ? c.onPrimary : c.onSurface;
    final sub = next ? c.onPrimary : c.onSurfaceVariant;
    return Semantics(
      button: true,
      label: '${[en, ar].where((x) => x.isNotEmpty).join(', ')}: $action${[...meta, ?passage].map((f) => ', $f').join()}',
      excludeSemantics: true,
      child: Material(
        color: next ? c.primaryFill : Colors.transparent,
        borderRadius: BorderRadius.circular(Radii.control),
        child: InkWell(
          borderRadius: BorderRadius.circular(Radii.control),
          onTap: onTap,
          child: ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 56),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: Space.sm, vertical: Space.xs),
              child: Row(spacing: Space.sm, children: [
                Container(width: 32, height: 32, decoration: BoxDecoration(color: bg, shape: BoxShape.circle), child: Icon(icon, size: 18, color: fg)),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Wrap(spacing: Space.sm, crossAxisAlignment: WrapCrossAlignment.center, children: [
                      Text(ar,
                          textDirection: TextDirection.rtl,
                          style: TextStyle(fontFamily: Fonts.sansArabic, fontSize: 18, height: 1.6, color: st == RowState.locked ? c.onSurfaceVariant : text)
                              .weight(next ? 600 : 400)),
                      if (en.isNotEmpty) Text(en, style: ty.bodyMd.weight(500).copyWith(color: st == RowState.locked ? c.onSurfaceVariant : text)),
                    ]),
                    if (meta.isNotEmpty || passage != null)
                      Wrap(crossAxisAlignment: WrapCrossAlignment.center, children: [
                        for (final (i, f) in meta.indexed) ...[if (i > 0) const Sep(), Text(f, style: ty.label.weight(400).copyWith(color: sub))],
                        if (passage != null) ...[
                          if (meta.isNotEmpty) const Sep(),
                          Icon(Icons.verified_outlined, size: 14, color: sub),
                          const SizedBox(width: 4),
                          Text(passage!, textDirection: TextDirection.rtl, style: ty.arabicLabel.weight(400).copyWith(color: sub)),
                        ],
                      ]),
                  ]),
                ),
              ]),
            ),
          ),
        ),
      ),
    );
  }
}

/// A tappable row inside a card: label, forward chevron (Today's routine and practice, the unit's mutun links).
class LinkRow extends StatelessWidget {
  const LinkRow({super.key, required this.onTap, required this.child});
  final VoidCallback onTap;
  final Widget child;
  @override
  Widget build(BuildContext context) => InkWell(
    borderRadius: BorderRadius.circular(Radii.control),
    onTap: onTap,
    child: ConstrainedBox(
      constraints: const BoxConstraints(minHeight: 48),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: Space.sm),
        child: Row(spacing: Space.sm, children: [
          Expanded(child: DefaultTextStyle.merge(style: context.type.bodyMd.copyWith(color: context.c.onSurface), child: child)),
          Icon(Icons.chevron_right, size: 20, color: context.c.outline),
        ]),
      ),
    ),
  );
}
