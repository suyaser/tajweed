// Port of src/screens/Today.tsx (#/today, v2 spec §5): the next step in the course, review, practice, the week, and at
// most one nudge (docs/17). The phone app is installed and has no account yet (phase 2), so the nudges are the routine
// card and the backup reminder; the teacher card waits for the Teacher tab (phase 2).
import 'package:flutter/material.dart';

import '../app/router.dart';
import '../app/services.dart';
import '../app/shell.dart';
import '../content/content.dart';
import '../core/course.dart';
import '../core/day.dart';
import '../core/lesson_steps.dart';
import '../core/scheduler.dart';
import '../i18n/i18n.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'path.dart';
import 'study.dart';

class Today extends StatefulWidget {
  const Today({super.key});
  @override
  State<Today> createState() => _TodayState();
}

class _TodayState extends State<Today> {
  @override
  Widget build(BuildContext context) => ListenableBuilder(listenable: store, builder: (context, _) => _build(context));

  Widget _build(BuildContext context) {
    final c = context.c, ty = context.type;
    final data = store.data;
    final day = today();
    final q = buildQueue(data, content.units, day);
    final progress = CourseProgress.of(data, content.units);
    final w = week(data, day, data.settings.onboardedOn);

    // the course
    final next = progress.next;
    final nextLesson = next.kind == 'lesson' ? content.getLesson(next.id!) : null;
    final steps = nextLesson == null ? null : local.getSteps(nextLesson.id);
    final started = steps != null && ((steps['done'] as List).isNotEmpty || steps['current'] != 'hear');
    final learnedToday = [for (final i in data.introductions) if (i.on == day) content.getLesson(i.lessonId)?.nameAr ?? ''];
    final finaleUnit = q.finaleUnit == null ? null : content.getUnit(q.finaleUnit!);
    final catchUp = content.courseOrder.where(progress.catchUp).toList();

    // review
    final due = q.sabqi.length + q.manzil.length;
    final dueManzil = q.manzil.length + q.overflowCount;
    final jali = q.manzil.where((i) => i.kind == 'correction' && i.severity == 'jali').length;
    final reviewedToday = {for (final a in data.attempts) if (a.on == day && a.countsForSchedule && a.source != 'teacher') a.refId}.length;

    // practice: the closing passages of the last 3 lessons done (newest first)
    final intros = [...data.introductions]..sort((a, b) => b.at.compareTo(a.at));
    final practice = <({String id, String from, String to})>[];
    for (final i in intros) {
      final cl = content.courseLesson(i.lessonId).closing;
      if (cl == null || practice.any((p) => p.from == cl.from && p.to == cl.to)) continue;
      practice.add((id: i.lessonId, from: cl.from, to: cl.to));
      if (practice.length == 3) break;
    }

    // one nudge at a time: the routine card, else the backup reminder
    final lastExport = data.settings.lastExportOn;
    final backupAge = lastExport == null ? null : diffDays(day, lastExport);
    final dismissedBackup = local.dismissed['backup'];
    final nudge = local.routinePending && data.introductions.isNotEmpty
        ? 'routine'
        : data.attempts.isNotEmpty && (backupAge == null || backupAge >= 14) && !(dismissedBackup != null && diffDays(day, dismissedBackup) < 7)
        ? 'backup'
        : null;

    final d = dates();
    Widget fwd(String label, String to, {ButtonVariant variant = ButtonVariant.primary}) =>
        AppButton(label: label, iconEnd: Icons.arrow_forward, variant: variant, block: true, onPressed: () => go(context, to));
    Widget inset(List<Widget> children, {bool center = false}) => Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Space.md),
      decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.card)),
      child: Column(crossAxisAlignment: center ? CrossAxisAlignment.center : CrossAxisAlignment.start, spacing: Space.sm, children: children),
    );
    final body = ty.bodyMd.copyWith(color: c.onSurfaceVariant);

    final List<Widget> course;
    if (q.sabaq != null && nextLesson != null) {
      course = [
        Column(crossAxisAlignment: CrossAxisAlignment.start, spacing: Space.xs, children: [
          Text(nextLesson.nameAr, textDirection: TextDirection.rtl, style: ty.arabicHeadline.copyWith(color: c.primary)),
          if (!isAr) Text(nextLesson.nameEn, style: ty.bodyLg.weight(600).copyWith(color: c.onSurface)),
          Wrap(crossAxisAlignment: WrapCrossAlignment.center, children: [
            Text(started ? t('Step {n} of {m}', {'n': stepIds.indexOf(steps['current'] as String) + 1, 'm': stepIds.length}) : t('{n} steps', {'n': stepIds.length}), style: body),
            const Sep(),
            Icon(Icons.schedule, size: 16, color: c.onSurfaceVariant),
            const SizedBox(width: 4),
            Text(t('About {n} min', {'n': lessonMinutes}), style: body),
          ]),
        ]),
        fwd(started ? t('Continue lesson') : t('Start lesson'), href('learn', nextLesson.id)),
      ];
    } else if (q.sabaqReason == 'finale' && finaleUnit != null) {
      final label = finaleUnit.finale?.label ?? finaleUnit.nameAr;
      course = [
        inset([
          Row(spacing: 6, children: [
            Icon(Icons.star, size: 16, color: c.gold),
            Text(t('Unit {n} finale', {'n': finaleUnit.n}), style: ty.label.weight(600).copyWith(color: c.secondary)),
          ]),
          Text(label, textDirection: TextDirection.rtl, style: ty.arabicHeadline.copyWith(color: c.primary)),
          Tx(t('Every lesson of {u} is done. Recite {x} from start to end to open the next unit.', {'u': finaleUnit.nameAr, 'x': label}),
              style: ty.bodyMd.copyWith(color: c.onSurface)),
        ]),
        fwd(t('Recite the finale'), '${href('unit', finaleUnit.id)}?finale=1'),
      ];
    } else if (q.sabaqReason == 'pace') {
      course = [
        inset([
          Tx(t('Learned today: {x}.', {'x': learnedToday.join('\u060c ')}), style: ty.bodyLg.weight(500).copyWith(color: c.onSurface)),
          Tx(
            [
              t('Two new lessons a day is the pace that sticks.'),
              if (nextLesson != null) t('Tomorrow: {x}.', {'x': nextLesson.nameAr}),
              due > 0 ? t('Today, do your review below.') : practice.isNotEmpty ? t('Today, recite your recent passages below.') : t('Come back tomorrow.'),
            ].join(' '),
            style: body,
          ),
        ]),
      ];
    } else if (q.sabaqReason == 'backlog') {
      course = [
        inset([
          Text(t('Review first.'), style: ty.bodyLg.weight(500).copyWith(color: c.onSurface)),
          Text(tn('{n} reviews are due. New lessons resume when fewer than 15 are overdue.', '{n} reviews are due. New lessons resume when fewer than 15 are overdue.', dueManzil), style: body),
        ]),
        fwd(t('Review'), 'review?go=1'),
      ];
    } else {
      course = [
        inset(center: true, [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(color: c.primaryFill, shape: BoxShape.circle),
            child: Icon(Icons.star, size: 28, color: c.onPrimary),
          ),
          Tx(t('The course is done. \u062a\u0642\u0628\u0651\u0644 \u0627\u0644\u0644\u0647 \u0645\u0646\u0643'), textAlign: TextAlign.center, style: ty.bodyLg.weight(500).copyWith(color: c.onSurface)),
          Text(t('Keep your review going, and keep reciting to a teacher.'), textAlign: TextAlign.center, style: body),
        ]),
      ];
    }

    return PageBody(items: [
      PageHeader(en: 'Today', ar: '\u0627\u0644\u064a\u0648\u0645', detail: [d.gregorian, d.hijri, d.late], secondaryDetail: const {1}),
      Container(
        padding: const EdgeInsets.all(Space.md),
        decoration: BoxDecoration(
          color: c.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(Radii.card),
          border: Border.all(color: c.outlineVariant),
          boxShadow: c.shadowCard,
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.lg, children: course),
      ),
      if (catchUp.isNotEmpty)
        Panel(title: t('New in this version'), icon: Icons.new_releases_outlined, children: [
          Text(
            tn("{n} new lesson in units you have finished. Take them when you like; they don't hold up the course.",
                "{n} new lessons in units you have finished. Take them when you like; they don't hold up the course.", catchUp.length),
            style: body,
          ),
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: AppButton(
              label: bidi(t('Start {x}', {'x': content.getLesson(catchUp.first)?.nameAr ?? ''})),
              variant: ButtonVariant.secondary,
              onPressed: () => go(context, href('learn', catchUp.first)),
            ),
          ),
        ]),
      // review
      Panel(children: [
        Row(spacing: Space.md, children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(color: c.surfaceContainerLow, shape: BoxShape.circle),
            child: Icon(Icons.history_edu_outlined, color: c.primary),
          ),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, spacing: 2, children: [
              Wrap(spacing: Space.sm, crossAxisAlignment: WrapCrossAlignment.center, children: [
                Text(t('Review'), style: ty.bodyLg.weight(600).copyWith(color: c.onSurface)),
                if (!isAr) Text('\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629', style: ty.arabicLabel.copyWith(color: c.onSurfaceVariant)),
              ]),
              if (due > 0) ...[
                Text(t('{n} due', {'n': due}), style: body),
                if (jali > 0) Text(tn('{n} correction due', '{n} corrections due', jali), style: ty.bodyMd.copyWith(color: c.onSurface)),
              ] else
                Text(data.items.isNotEmpty ? t('Nothing due today.') : t('Nothing to review yet. Your first lesson starts it.'), style: body),
            ]),
          ),
        ]),
        if (due > 0)
          AppButton(
            label: reviewedToday > 0 ? t('Continue review') : t('Review'),
            variant: ButtonVariant.secondary,
            block: true,
            onPressed: () => go(context, 'review?go=1'),
          ),
      ]),
      if (practice.isNotEmpty)
        Panel(title: isAr ? '\u0627\u0644\u062a\u0644\u0627\u0648\u0629' : 'Practice', ar: '\u0627\u0644\u062a\u0644\u0627\u0648\u0629', icon: Icons.record_voice_over_outlined, children: [
          Text(t('Recite your recent passages again: listen, recite, record, compare.'), style: body),
          Column(children: [
            for (final p in practice)
              LinkRow(
                onTap: () => go(context, href('listen', p.from == p.to ? p.from : '${p.from}-${p.to}')),
                child: Wrap(spacing: Space.sm, crossAxisAlignment: WrapCrossAlignment.center, children: [
                  Text(rangeRef(p.from, p.to), textDirection: TextDirection.rtl, style: TextStyle(fontFamily: Fonts.naskh, fontSize: 18, height: 1.6, color: c.onSurface).weight(600)),
                  Text(content.getLesson(p.id)?.nameAr ?? '', textDirection: TextDirection.rtl, style: ty.arabicLabel.weight(400).copyWith(color: c.onSurfaceVariant)),
                ]),
              ),
          ]),
        ]),
      if (nudge == 'routine')
        Panel(title: t('Set up your routine'), icon: Icons.tune, children: [
          Text(t('Three choices make the course yours. You can change them any time in Settings.'), style: body),
          Column(children: [
            LinkRow(onTap: () => go(context, 'settings?s=recitation'), child: Text(t('Model reciter'))),
            LinkRow(onTap: () => go(context, 'settings?s=wird'), child: Text(t('Daily study time (wird)'))),
            LinkRow(onTap: () => go(context, 'settings?s=wird'), child: Text(t('Teacher day'))),
          ]),
          Align(
            alignment: AlignmentDirectional.centerStart,
            child: AppButton(label: t('Done, hide this'), variant: ButtonVariant.ghost, onPressed: () => setState(() => local.routinePending = false)),
          ),
        ]),
      if (nudge == 'backup')
        Note(
          icon: Icons.backup_outlined,
          text: backupAge == null ? t('No backup yet.') : tn('Last backup: {n} days ago.', 'Last backup: {n} days ago.', backupAge),
          action: AppButton(label: t('Back up now'), variant: ButtonVariant.tertiary, onPressed: () => go(context, 'settings')),
          onDismiss: () => setState(() => local.dismiss('backup', day)),
        ),
      Panel(title: t('This week'), icon: Icons.calendar_month_outlined, children: [
        WeekDots(days: w.marks, today: w.todayIndex),
        Text(
          w.count == 0 && data.settings.onboardedOn == day
              ? t('Your week starts today.')
              : '${tn('{n} day studied this week', '{n} days studied this week', w.count)}$sep${t('This month: {n}', {'n': w.month})}',
          style: body,
        ),
      ]),
      if (q.welcomeBack case final wb?)
        Note(
          icon: Icons.waving_hand_outlined,
          text: isAr
              ? '${t('Welcome back.')} ${tn('{n} reviews are waiting', '{n} reviews are waiting', wb.due)}\u060c ${tn("about {n} day at today's pace", "about {n} days at today's pace", wb.daysToCatchUp)}. ${t('New lessons resume after that.')}'
              : "Welcome back. ${wb.due} reviews are waiting, about ${wb.daysToCatchUp} ${wb.daysToCatchUp == 1 ? 'day' : 'days'} at today's pace. New lessons resume after that.",
        ),
    ]);
  }
}
