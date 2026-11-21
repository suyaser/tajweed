// Ports of src/screens/Resources.tsx (#/resources: find a teacher, listening, explanations with the episodes, mutun,
// books, and the credits the data licences require) and Guide.tsx (#/guide: how the app works). Both read the web's
// own texts: content/resources.json and content/guide.json. Entries marked `app: false` need an account or the
// teacher log (phase 2) and are left out here.
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app/shell.dart';
import '../content/content.dart';
import '../core/types.dart';
import '../i18n/i18n.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';

/// The web's Material Symbols names used in the two files.
const _icons = <String, IconData>{
  'school': Icons.school_outlined,
  'headphones': Icons.headphones_outlined,
  'public': Icons.public,
  'smart_display': Icons.smart_display_outlined,
  'history_edu': Icons.history_edu_outlined,
  'menu_book': Icons.menu_book_outlined,
  'mic': Icons.mic_none,
  'route': Icons.route_outlined,
  'record_voice_over': Icons.record_voice_over_outlined,
  'shield': Icons.shield_outlined,
  'group': Icons.group_outlined,
};
IconData iconOf(String? name) => _icons[name] ?? Icons.circle_outlined;

List<Json> _shown(Object? xs) => [
  for (final x in (xs as List? ?? const []))
    if ((x as Json)['app'] != false) x,
];

final _arLetter = RegExp('[\u0600-\u06ff]');

void _open(String url) => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);

/// An outside link: teal, underlined, with the "opens elsewhere" icon.
class _Ext extends StatelessWidget {
  const _Ext({required this.url, required this.text, this.style});
  final String url, text;
  final TextStyle? style;
  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Semantics(
      link: true,
      child: InkWell(
        onTap: () => _open(url),
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 44),
          child: Wrap(
            crossAxisAlignment: WrapCrossAlignment.center,
            spacing: 4,
            children: [
              Text(
                text,
                style: (style ?? context.type.bodyLg).weight(600).copyWith(color: c.primary, decoration: TextDecoration.underline, decorationColor: c.primary),
              ),
              Icon(Icons.open_in_new, size: 16, color: c.primary),
            ],
          ),
        ),
      ),
    );
  }
}

class Resources extends StatelessWidget {
  const Resources({super.key});
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final r = content.raw['resources'] as Json;
    final episodes = ((content.raw['videos'] as Json)['episodes'] as List).cast<String>();
    final credits = r['credits'] as Json;
    return PageBody(
      items: [
        PageHeader(
          en: 'Resources',
          ar: '\u0627\u0644\u0645\u0635\u0627\u062f\u0631',
          detail: [
            t('{n} video episodes', {'n': episodes.length}),
            t('{n} reciters', {'n': content.reciters.length}),
          ],
        ),
        for (final p in _shown(r['panels']))
          Group(
            en: p['en'],
            ar: p['ar'],
            children: [
              for (final it in _shown(p['items']))
                if (it['note'] != null)
                  Padding(
                    padding: const EdgeInsets.all(Space.md),
                    child: Tx(t(it['note']), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
                  )
                else
                  Padding(
                    padding: const EdgeInsets.all(Space.md),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      spacing: Space.md,
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(color: c.surfaceContainer, borderRadius: BorderRadius.circular(Radii.control)),
                          child: Icon(iconOf(it['icon']), size: 22, color: c.onSurfaceVariant),
                        ),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            spacing: 4,
                            children: [
                              Directionality(
                                textDirection: _arLetter.hasMatch(it['name']) ? TextDirection.rtl : TextDirection.ltr,
                                child: it['link'] != null
                                    ? _Ext(url: it['link'], text: it['name'])
                                    : Text(it['name'], style: ty.bodyLg.weight(600).copyWith(color: c.onSurface)),
                              ),
                              Tx(t(it['body']), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
                              if (it['episodes'] == true)
                                Wrap(
                                  spacing: Space.xs,
                                  runSpacing: Space.xs,
                                  children: [
                                    for (final (i, id) in episodes.indexed)
                                      Semantics(
                                        link: true,
                                        label: t('Episode {n}', {'n': i + 1}),
                                        excludeSemantics: true,
                                        child: Material(
                                          color: c.surfaceContainer,
                                          shape: const CircleBorder(),
                                          child: InkWell(
                                            customBorder: const CircleBorder(),
                                            onTap: () => _open('https://www.youtube.com/watch?v=$id'),
                                            child: SizedBox(
                                              width: 44,
                                              height: 44,
                                              child: Center(
                                                child: Text(arDigits(i + 1), style: ty.arabicBody.weight(600).copyWith(color: c.primary)),
                                              ),
                                            ),
                                          ),
                                        ),
                                      ),
                                  ],
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
            ],
          ),
        Group(
          en: credits['en'],
          ar: credits['ar'],
          children: [
            for (final cr in _shown(credits['items'])) _Credit(cr: cr),
            Padding(
              padding: const EdgeInsets.fromLTRB(Space.md, Space.xs, Space.md, Space.md),
              child: Align(
                alignment: AlignmentDirectional.centerStart,
                child: AppButton(
                  label: t('Licences'),
                  iconEnd: Icons.chevron_right,
                  variant: ButtonVariant.tertiary,
                  onPressed: () => showLicensePage(context: context, applicationName: t('Tajweed Path')),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _Credit extends StatelessWidget {
  const _Credit({required this.cr});
  final Json cr;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final body = ty.bodyMd.copyWith(color: c.onSurfaceVariant);
    final parts = (cr[isAr ? 'ar' : 'en'] as List?)?.cast<Json>();
    return Padding(
      padding: const EdgeInsets.all(Space.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: 4,
        children: [
          Text(t(cr['title']), style: ty.bodyMd.weight(600).copyWith(color: c.onSurface)),
          if (parts != null)
            Text.rich(
              TextSpan(
                children: [
                  for (final p in parts)
                    if (p['link'] != null) ...[
                      TextSpan(
                        text: p['ltr'] == true ? '\u2066${p['text']}\u2069' : p['text'],
                        style: TextStyle(color: c.primary, fontWeight: FontWeight.w600, decoration: TextDecoration.underline, decorationColor: c.primary),
                        recognizer: TapGestureRecognizer()..onTap = () => _open(p['link']),
                      ),
                      WidgetSpan(
                        alignment: PlaceholderAlignment.middle,
                        child: Padding(
                          padding: const EdgeInsetsDirectional.only(start: 2),
                          child: Icon(Icons.open_in_new, size: 14, color: c.primary),
                        ),
                      ),
                    ] else
                      TextSpan(text: p['ltr'] == true ? '\u2066${p['text']}\u2069' : p['text']),
                ],
              ),
              style: body,
            ),
          if (cr['reciters'] == true)
            for (final r in content.reciters) Text('• ${r.nameAr}${isAr ? '' : ' · ${r.nameEn}'}', style: body),
          if (cr['editions'] != null)
            for (final e in (cr['editions'] as List).cast<Json>())
              Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                spacing: 4,
                children: [
                  Tx('• ${t(e['text'])}', style: body),
                  _Ext(url: e['link'], text: t(e['label']), style: ty.bodyMd),
                ],
              ),
          if (cr['after'] != null) Text(t(cr['after']), style: body),
        ],
      ),
    );
  }
}

/* ---------------- Guide ---------------- */

/// "How it works", the short version (guide.json basics): onboarding and the Guide.
class Basics extends StatelessWidget {
  const Basics({super.key});
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final items = _shown((content.raw['guide'] as Json)['basics']);
    return Column(
      spacing: Space.sm,
      children: [
        for (final (i, b) in items.indexed)
          Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(
              color: c.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(Radii.card),
              border: Border.all(color: c.outlineVariant),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              spacing: Space.md,
              children: [
                SizedBox(
                  width: 50,
                  height: 50,
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        margin: const EdgeInsetsDirectional.only(top: 6),
                        decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
                        child: Icon(iconOf(b['icon']), size: 22, color: c.primary),
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
                    ],
                  ),
                ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    spacing: 2,
                    children: [
                      Wrap(
                        spacing: Space.sm,
                        crossAxisAlignment: WrapCrossAlignment.center,
                        children: [
                          Text(t(b['en']), style: ty.bodyLg.weight(600).copyWith(color: c.onSurface)),
                          if (!isAr) Text(b['ar'], style: ty.arabicLabel.copyWith(color: c.secondary)),
                        ],
                      ),
                      Tx(t(b['body']), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
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

class Guide extends StatelessWidget {
  const Guide({super.key});
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final g = content.raw['guide'] as Json;
    final text = ty.bodyMd.copyWith(color: c.onSurface);
    Widget item(Json it, String marker) => Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      spacing: Space.sm,
      children: [
        SizedBox(
          width: 20,
          child: Text(
            marker,
            textAlign: TextAlign.end,
            style: ty.bodyMd.weight(600).copyWith(color: marker == '•' ? c.gold : c.secondary),
          ),
        ),
        Expanded(child: Tx(t(it['text']), style: text)),
      ],
    );
    Widget block(Json b) => switch (b['kind']) {
      'p' => Tx(t(b['text']), style: text),
      'note' => Tx(t(b['text']), style: ty.label.copyWith(color: c.onSurfaceVariant)),
      'ul' => Column(spacing: Space.xs, children: [for (final it in _shown(b['items'])) item(it, '•')]),
      'ol' => Column(spacing: Space.xs, children: [for (final (i, it) in _shown(b['items']).indexed) item(it, '${digits(i + 1)}.')]),
      'link' => Align(
        alignment: AlignmentDirectional.centerStart,
        child: AppButton(label: t(b['text']), iconEnd: Icons.chevron_right, variant: ButtonVariant.tertiary, onPressed: () => go(context, b['to'])),
      ),
      'levels' => Text.rich(
        TextSpan(
          children: [
            TextSpan(text: '${t(b['lead'])} '),
            for (final (i, l) in (b['levels'] as List).cast<String>().indexed) ...[
              if (i > 0) const TextSpan(text: ', '),
              TextSpan(
                text: t(l),
                style: const TextStyle(fontWeight: FontWeight.w700),
              ),
            ],
            TextSpan(text: t(b['tail'])),
          ],
        ),
        style: text,
      ),
      _ => const SizedBox.shrink(),
    };
    return PageBody(
      items: [
        Text(t('The short version:'), style: ty.label.weight(600).copyWith(color: c.secondary)),
        const Basics(),
        for (final s in _shown(g['sections']))
          Panel(title: t(s['en']), ar: s['ar'], icon: iconOf(s['icon']), children: [for (final b in (s['blocks'] as List).cast<Json>()) block(b)]),
      ],
    );
  }
}
