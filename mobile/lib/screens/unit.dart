// Port of src/screens/Unit.tsx (#/unit/:unitId): intro, lessons, the finale (recite → "I recited it" opens the next
// unit), offline audio, and links to the unit's mutun lines.
import 'package:flutter/material.dart';

import '../app/router.dart';
import '../app/services.dart';
import '../app/shell.dart';
import '../audio/downloads.dart';
import '../content/content.dart';
import '../core/course.dart';
import '../core/types.dart';
import '../i18n/i18n.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'path.dart';
import 'study.dart';

class UnitScreen extends StatefulWidget {
  const UnitScreen({super.key, required this.id, this.finale = false});
  final String id;
  final bool finale; // ?finale=1: scrolled to the finale
  @override
  State<UnitScreen> createState() => _UnitScreenState();
}

class _UnitScreenState extends State<UnitScreen> {
  final _audio = StudyAudio();
  final _finaleKey = GlobalKey();
  String? _justDone; // the unit whose finale was just recited here

  @override
  void initState() {
    super.initState();
    if (widget.finale) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final ctx = _finaleKey.currentContext;
        if (ctx != null) Scrollable.ensureVisible(ctx, duration: const Duration(milliseconds: 250));
      });
    }
  }

  @override
  void dispose() {
    _audio.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ListenableBuilder(listenable: store, builder: (context, _) => _build(context));

  Widget _build(BuildContext context) {
    final c = context.c, ty = context.type;
    final u = content.getUnit(widget.id);
    if (u == null) {
      return PageBody(items: [
        EmptyState(
          icon: Icons.map_outlined,
          title: t("This unit isn't in the course."),
          action: AppButton(label: t('Course map'), onPressed: () => go(context, 'plan')),
        ),
      ]);
    }
    final units = content.units;
    final p = CourseProgress.of(store.data, units);
    final lines = content.unitMutun(u);
    final recited = store.data.finales.where((f) => f.unitId == u.id).firstOrNull;
    final i = units.indexWhere((x) => x.id == u.id);
    final prev = i > 0 ? units[i - 1] : null;
    final fin = u.finale;

    return PageBody(items: [
      Row(spacing: Space.md, children: [
        UnitNode(n: u.n, status: statusOf(u, p), large: true),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, spacing: 2, children: [
            Text(isAr ? t('Unit {n}', {'n': u.n}) : 'UNIT ${u.n} \u00b7 ${u.nameEn.toUpperCase()}',
                style: ty.label.weight(600).copyWith(color: c.secondary, letterSpacing: isAr ? 0 : 1)),
            Semantics(header: true, child: Text(u.nameAr, textDirection: TextDirection.rtl, style: ty.arabicHeadline.copyWith(color: c.primary))),
          ]),
        ),
      ]),
      Tx(u.intro, style: ty.bodyLg.copyWith(color: c.onSurface)),
      if (!p.open(u) && prev != null)
        Callout(icon: Icons.lock_outline, child: Tx(t('This unit opens after the finale of unit {n} \u00b7 {name}.', {'n': prev.n, 'name': prev.nameAr}))),
      if (u.lessonIds.isNotEmpty) Panel(title: t('Lessons'), ar: '\u0627\u0644\u062f\u0631\u0648\u0633', icon: Icons.menu_book_outlined, children: [UnitLessons(u: u, p: p)]),
      if (fin != null)
        Panel(
          key: _finaleKey,
          title: t('Finale'),
          ar: fin.label,
          icon: Icons.star_outline,
          aside: isAr ? Text(fin.label, style: TextStyle(fontFamily: Fonts.naskh, fontSize: ty.bodyMd.fontSize, color: c.primary).weight(600)) : null,
          children: [
            if (_justDone == u.id)
              _UnitComplete(u: u)
            else ...[
              if (recited != null)
                Row(spacing: 6, children: [
                  Icon(Icons.check_circle, size: 18, color: c.success),
                  Expanded(child: Text(t('Recited {day}. You can recite it again any time.', {'day': dayLabel(recited.on)}), style: ty.bodyMd.copyWith(color: c.onSurface))),
                ]),
              if (p.open(u) && p.lessonsDone(u))
                PassageRecite(
                  from: fin.from,
                  to: fin.to,
                  audio: _audio,
                  doneLabel: t('I recited it'),
                  onDone: recited != null
                      ? null
                      : () {
                          _audio.stop();
                          store.completeFinale(u.id);
                          setState(() => _justDone = u.id);
                        },
                )
              else
                Tx(t('After the last lesson of this unit, recite {x}. That opens the next unit.', {'x': fin.label}), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
            ],
            Wrap(crossAxisAlignment: WrapCrossAlignment.center, children: [
              Text('${t('Self-checked against the reciter. Only a teacher can tell you how you really recite.')} ', style: ty.label.copyWith(color: c.onSurfaceVariant)),
              InkWell(
                onTap: () => go(context, 'resources'),
                child: Text(t('Find a teacher'), style: ty.label.weight(600).copyWith(color: c.primary, decoration: TextDecoration.underline, decorationColor: c.primary)),
              ),
            ]),
          ],
        ),
      if (u.lessonIds.isNotEmpty) OfflineAudio(unit: u, reciter: learnerReciter, downloads: downloads),
      if (lines.isNotEmpty) _MutunLinks(lines: lines),
    ]);
  }
}

/// After "I recited it" (UX M7): the unit is done, and the way on.
class _UnitComplete extends StatelessWidget {
  const _UnitComplete({required this.u});
  final Unit u;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final next = CourseProgress.of(store.data, content.units).next;
    final (link, label) = switch (next.kind) {
      'lesson' => (href('learn', next.id!), t('Next lesson: {x}', {'x': content.getLesson(next.id!)?.nameAr ?? ''})),
      'finale' => (href('unit', next.unit!.id), t('Open unit {n} \u00b7 {name}', {'n': next.unit!.n, 'name': next.unit!.nameAr})),
      _ => ('today', t('Back to today')),
    };
    return Semantics(
      liveRegion: true,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: Space.md),
        child: Column(spacing: Space.sm, children: [
          UnitNode(n: u.n, status: UnitStatus.passed, large: true),
          Text(t('Unit {n} complete.', {'n': u.n}), style: ty.headlineMd.copyWith(color: c.onSurface)),
          Tx(next.kind == 'done' ? t('The course is done. \u062a\u0642\u0628\u0651\u0644 \u0627\u0644\u0644\u0647 \u0645\u0646\u0643') : t('The next unit is open.'), textAlign: TextAlign.center, style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
          const SizedBox(height: Space.xs),
          AppButton(label: bidi(label), iconEnd: Icons.arrow_forward, block: true, onPressed: () => go(context, link, replace: true)),
          AppButton(label: t('Recite this unit to a teacher'), icon: Icons.school_outlined, variant: ButtonVariant.secondary, block: true, onPressed: () => go(context, 'resources')),
        ]),
      ),
    );
  }
}

const _matnName = {'tuhfa': '\u062a\u062d\u0641\u0629 \u0627\u0644\u0623\u0637\u0641\u0627\u0644', 'jazariyya': '\u0627\u0644\u0645\u0642\u062f\u0645\u0629 \u0627\u0644\u062c\u0632\u0631\u064a\u0629'};

/// Optional: one link per matn to its lines for this unit on the Mutun screen.
class _MutunLinks extends StatelessWidget {
  const _MutunLinks({required this.lines});
  final List<MatnLine> lines;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    return Panel(title: isAr ? '\u0627\u0644\u0645\u062a\u0648\u0646 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)' : 'Optional', ar: '\u0627\u0644\u0645\u062a\u0648\u0646', icon: Icons.history_edu_outlined, children: [
      Column(children: [
        for (final m in ['tuhfa', 'jazariyya'])
          if (lines.where((l) => l.matn == m).isNotEmpty)
            Builder(builder: (context) {
              final ns = [for (final l in lines) if (l.matn == m) l.n];
              final from = ns.reduce((a, b) => a < b ? a : b), to = ns.reduce((a, b) => a > b ? a : b);
              return LinkRow(
                onTap: () => go(context, '${href('mutun', m)}?from=$from&to=$to'),
                child: Text('${_matnName[m]} ${from == to ? digits(from) : '${digits(from)}\u2013${digits(to)}'}',
                    textDirection: TextDirection.rtl, style: ty.arabicLabel.weight(600).copyWith(color: c.onSurface)),
              );
            }),
      ]),
    ]);
  }
}
