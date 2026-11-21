// Port of src/screens/Mutun.tsx (#/mutun/:matnId?from=N&to=M): the whole matn, the asked-for lines marked and
// scrolled to; memorise mode hides each second half until tapped; the rules each line names as chips.
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app/router.dart';
import '../app/shell.dart';
import '../content/content.dart';
import '../core/types.dart';
import '../i18n/i18n.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';

const _names = {
  'tuhfa': (ar: '\u062a\u062d\u0641\u0629 \u0627\u0644\u0623\u0637\u0641\u0627\u0644', en: 'Tuḥfat al-Aṭfāl'),
  'jazariyya': (ar: '\u0627\u0644\u0645\u0642\u062f\u0645\u0629 \u0627\u0644\u062c\u0632\u0631\u064a\u0629', en: 'Al-Muqaddimah al-Jazariyyah'),
};

class Mutun extends StatefulWidget {
  const Mutun({super.key, required this.matnId, this.from, this.to});
  final String matnId;
  final String? from, to;
  @override
  State<Mutun> createState() => _MutunState();
}

class _MutunState extends State<Mutun> {
  bool _memorise = false;
  final _open = <int>{};
  final _first = GlobalKey();
  late final int _from = int.tryParse(widget.from ?? '') ?? 0;
  late final int _to = int.tryParse(widget.to ?? '') ?? _from;

  @override
  void initState() {
    super.initState();
    if (_from > 0) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final ctx = _first.currentContext;
        if (ctx != null) Scrollable.ensureVisible(ctx, alignment: 0.4);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final ed = ((content.raw['mutun'] as Json)['editions'] as Json?)?[widget.matnId] as Json?;
    final lines = content.mutun.where((l) => l.matn == widget.matnId).toList();
    final name = _names[widget.matnId];
    if (ed == null || lines.isEmpty || name == null) {
      return PageBody(
        items: [
          EmptyState(
            icon: Icons.history_edu_outlined,
            title: t("This text isn't in the app."),
            action: AppButton(label: t('Rules'), onPressed: () => go(context, 'rules')),
          ),
        ],
      );
    }
    final toggle = AppButton(
      label: _memorise ? t('Show whole lines') : t('Memorise'),
      icon: _memorise ? Icons.visibility_outlined : Icons.psychology_outlined,
      variant: ButtonVariant.secondary,
      size: ButtonSize.sm,
      onPressed: () => setState(() {
        _memorise = !_memorise;
        _open.clear();
      }),
    );
    final verse = TextStyle(fontFamily: Fonts.naskh, fontSize: 20, height: 1.9, color: c.onSurface);
    return PageBody(
      gap: Space.md,
      items: [
        PageHeader(
          en: name.en,
          ar: name.ar,
          detail: [
            ed['author'] as String,
            t('{n} lines', {'n': lines.length}),
          ],
          actions: [toggle],
        ),
        if (_memorise) Text(t('Say the second half from memory, then tap the line to check.'), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
        for (final l in lines)
          Builder(
            builder: (context) {
              final marked = _from > 0 && l.n >= _from && l.n <= _to;
              final rules = [for (final id in l.lessonIds) ?content.getLesson(id)];
              final open = _open.contains(l.n);
              return Container(
                key: l.n == _from ? _first : null,
                padding: const EdgeInsets.symmetric(horizontal: Space.md, vertical: Space.sm),
                decoration: BoxDecoration(
                  color: marked ? c.primaryContainer.withValues(alpha: 0.4) : c.surfaceContainerLowest,
                  borderRadius: BorderRadius.circular(Radii.card),
                  border: Border.all(color: marked ? c.primary : c.outlineVariant),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  spacing: Space.md,
                  children: [
                    SizedBox(
                      width: 32,
                      child: Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(
                          digits(l.n),
                          textAlign: TextAlign.center,
                          style: ty.label.weight(600).copyWith(color: c.secondary),
                        ),
                      ),
                    ),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        spacing: 4,
                        children: [
                          if (_memorise) ...[
                            Semantics(
                              button: true,
                              expanded: open,
                              child: InkWell(
                                onTap: () => setState(() => open ? _open.remove(l.n) : _open.add(l.n)),
                                child: ConstrainedBox(
                                  constraints: const BoxConstraints(minHeight: 48),
                                  child: Row(
                                    textDirection: TextDirection.rtl,
                                    children: [
                                      Expanded(
                                        child: Text(l.sadr, textDirection: TextDirection.rtl, style: verse),
                                      ),
                                      AnimatedRotation(
                                        turns: open ? 0.5 : 0,
                                        duration: const Duration(milliseconds: 150),
                                        child: Icon(Icons.expand_more, size: 20, color: c.outline),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            if (open)
                              Text(
                                l.ajz,
                                textDirection: TextDirection.rtl,
                                style: verse.copyWith(color: c.primary),
                              ),
                          ] else ...[
                            Text.rich(
                              TextSpan(
                                children: [
                                  TextSpan(text: '${l.sadr} '),
                                  TextSpan(
                                    text: '\u06de',
                                    style: TextStyle(color: c.gold),
                                  ),
                                  TextSpan(text: ' ${l.ajz}'),
                                ],
                              ),
                              textDirection: TextDirection.rtl,
                              style: verse,
                            ),
                            if (l.gloss != null) Tx(l.gloss!, style: ty.label.weight(400).copyWith(color: c.onSurfaceVariant)),
                            if (rules.isNotEmpty)
                              Wrap(
                                spacing: Space.xs,
                                runSpacing: Space.xs,
                                children: [
                                  for (final r in rules)
                                    Material(
                                      color: c.surfaceContainer,
                                      borderRadius: BorderRadius.circular(999),
                                      child: InkWell(
                                        borderRadius: BorderRadius.circular(999),
                                        onTap: () => go(context, href('rules', r.id)),
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                          child: Text(
                                            r.nameAr,
                                            textDirection: TextDirection.rtl,
                                            style: ty.arabicLabel.copyWith(color: c.primary),
                                          ),
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                          ],
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        Wrap(
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: Space.xs,
          children: [
            Text(
              ed['editor'] as String,
              textDirection: TextDirection.rtl,
              style: ty.label.copyWith(color: c.onSurfaceVariant),
            ),
            AppButton(
              label: t('Source'),
              iconEnd: Icons.open_in_new,
              variant: ButtonVariant.tertiary,
              size: ButtonSize.sm,
              onPressed: () => launchUrl(Uri.parse(ed['source_url'] as String), mode: LaunchMode.externalApplication),
            ),
          ],
        ),
      ],
    );
  }
}
