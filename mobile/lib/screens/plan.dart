// Port of src/screens/Plan.tsx (#/plan, the course map) for phones: the units as a vertical path; the open one shows
// its lessons and finale.
import 'package:flutter/material.dart';

import '../app/router.dart';
import '../app/services.dart';
import '../app/shell.dart';
import '../content/content.dart';
import '../core/course.dart';
import '../core/types.dart';
import '../i18n/i18n.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'path.dart';

class Plan extends StatefulWidget {
  const Plan({super.key});
  @override
  State<Plan> createState() => _PlanState();
}

class _PlanState extends State<Plan> {
  String? _sel;
  bool _init = false;

  @override
  Widget build(BuildContext context) => ListenableBuilder(listenable: store, builder: (context, _) => _build(context));

  Widget _build(BuildContext context) {
    final c = context.c, ty = context.type;
    final units = content.units;
    final p = CourseProgress.of(store.data, units);
    if (!_init) {
      _init = true;
      _sel = p.next.kind == 'done' ? null : p.next.unit?.id;
    }
    final unitsDone = units.where((u) => statusOf(u, p) == UnitStatus.passed).length;
    final total = content.courseOrder.length;
    return PageBody(items: [
      PageHeader(en: 'Course path', ar: '\u0627\u0644\u0645\u0633\u0627\u0631', detail: [
        tn('{n} unit', '{n} units', units.length),
        t('{n} of {m} lessons done', {'n': p.done.length, 'm': total}),
        riwayah,
      ]),
      Segmented<String>(
        value: 'plan',
        onChanged: (v) => v == 'progress' ? go(context, 'progress') : null,
        options: [
          (value: 'plan', label: t('Plan'), icon: Icons.route_outlined),
          (value: 'progress', label: t('Progress'), icon: Icons.insights_outlined),
        ],
      ),
      Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: 6, children: [
        Text(t('{n} of {m} units done', {'n': unitsDone, 'm': units.length}), style: ty.label.copyWith(color: c.onSurfaceVariant)),
        ProgressBar(value: p.done.length / total, label: t('{n} of {m} lessons done', {'n': p.done.length, 'm': total})),
      ]),
      Stack(children: [
        PositionedDirectional(start: Space.md + 19, top: 24, bottom: 24, child: Container(width: 1, color: c.outlineVariant)),
        Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.sm, children: [
          for (final u in units) _unitCard(context, u, p),
        ]),
      ]),
    ]);
  }

  Widget _unitCard(BuildContext context, Unit u, CourseProgress p) {
    final c = context.c, ty = context.type;
    final status = statusOf(u, p);
    final n = u.lessonIds.where(p.done.contains).length;
    final open = _sel == u.id;
    final locked = status == UnitStatus.locked;
    final fin = u.finale;
    return Container(
      decoration: BoxDecoration(
        color: c.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(Radii.card),
        border: Border.all(color: open ? c.gold : c.outlineVariant),
        boxShadow: status == UnitStatus.active ? c.shadowCard : null,
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Semantics(
          button: true,
          expanded: open,
          child: InkWell(
            borderRadius: BorderRadius.circular(Radii.card),
            onTap: () => setState(() => _sel = open ? null : u.id),
            child: Padding(
              padding: const EdgeInsets.all(Space.md),
              child: Row(spacing: Space.md, children: [
                UnitNode(n: u.n, status: status),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, spacing: 2, children: [
                    Text(t('Unit {n}', {'n': u.n}),
                        style: ty.label.weight(600).copyWith(color: locked ? c.outline : c.secondary, letterSpacing: isAr ? 0 : 1)),
                    Text(u.nameAr,
                        textDirection: TextDirection.rtl,
                        style: TextStyle(fontFamily: Fonts.naskh, fontSize: 18, height: 1.6, color: locked ? c.onSurfaceVariant : c.onSurface).weight(600)),
                    if (!isAr) Text(u.nameEn, style: ty.bodyMd.weight(500).copyWith(color: c.onSurfaceVariant)),
                    Wrap(crossAxisAlignment: WrapCrossAlignment.center, children: [
                      if (u.lessonIds.isNotEmpty)
                        Text(
                          locked ? tn('{n} lesson', '{n} lessons', u.lessonIds.length) : t('{n} of {m} lessons done', {'n': n, 'm': u.lessonIds.length}),
                          style: ty.label.copyWith(color: c.onSurfaceVariant),
                        ),
                      if (fin != null) ...[
                        if (u.lessonIds.isNotEmpty) const Sep(),
                        Icon(p.finaleDone(u) ? Icons.star : Icons.star_outline, size: 14, color: c.gold),
                        const SizedBox(width: 4),
                        Text(fin.label, textDirection: TextDirection.rtl, style: ty.arabicLabel.weight(400).copyWith(color: c.onSurfaceVariant)),
                      ],
                    ]),
                    if (status == UnitStatus.active && u.lessonIds.isNotEmpty)
                      Padding(padding: const EdgeInsets.only(top: 6), child: ExcludeSemantics(child: ProgressBar(value: n / u.lessonIds.length))),
                  ]),
                ),
                if (status == UnitStatus.passed)
                  StatusChip(status: Status.done, label: t('done'))
                else if (status == UnitStatus.active)
                  AppChip(tone: ChipTone.gold, label: u.lessonIds.isNotEmpty ? t('{n} of {m}', {'n': n, 'm': u.lessonIds.length}) : t('finale')),
                AnimatedRotation(turns: open ? 0.5 : 0, duration: const Duration(milliseconds: 150), child: Icon(Icons.expand_more, size: 20, color: c.outline)),
              ]),
            ),
          ),
        ),
        if (open)
          Container(
            decoration: BoxDecoration(border: Border(top: BorderSide(color: c.outlineVariant))),
            padding: const EdgeInsets.all(Space.md),
            child: _detail(context, u, p),
          ),
      ]),
    );
  }

  /// The selected unit: its name, lessons done, its lessons and finale, and the way into the unit page.
  Widget _detail(BuildContext context, Unit u, CourseProgress p) {
    final c = context.c, ty = context.type;
    final n = u.lessonIds.where(p.done.contains).length;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.md, children: [
      Column(crossAxisAlignment: CrossAxisAlignment.start, spacing: Space.xs, children: [
        AppChip(tone: ChipTone.gold, label: t('Unit {n}', {'n': u.n})),
        Text(u.nameAr, textDirection: TextDirection.rtl, style: ty.arabicHeadline.copyWith(color: c.primary)),
        if (!isAr) Text(u.nameEn, style: ty.bodyLg.weight(500).copyWith(color: c.onSurface)),
      ]),
      if (u.lessonIds.isNotEmpty)
        Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: 6, children: [
          Text(t('{n} of {m} lessons done', {'n': n, 'm': u.lessonIds.length}), style: ty.label.copyWith(color: c.onSurfaceVariant)),
          ProgressBar(value: n / u.lessonIds.length),
        ]),
      UnitLessons(u: u, p: p),
      Align(
        alignment: AlignmentDirectional.centerStart,
        child: Semantics(
          label: t('Open unit {n}, {name}', {'n': u.n, 'name': isAr ? u.nameAr : u.nameEn}),
          child: AppButton(label: t('Open the unit'), iconEnd: Icons.chevron_right, variant: ButtonVariant.tertiary, onPressed: () => go(context, href('unit', u.id))),
        ),
      ),
    ]);
  }
}
