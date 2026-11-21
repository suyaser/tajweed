// Port of src/app/Shell.tsx and App.tsx for phones: tab screens (top bar Help | brand | Settings, bottom tabs), pushed
// screens (‹ Back, title, tabs), focus screens (✕ Close, title; no tabs) and bare ones (onboarding). One Navigator;
// a tab starts a fresh stack, everything else is pushed, so Android back and iOS swipe-back work.
import 'package:flutter/material.dart';

import '../content/content.dart';
import '../i18n/i18n.dart';
import '../screens/learn.dart';
import '../screens/onboarding.dart';
import '../screens/plan.dart';
import '../screens/review.dart';
import '../screens/today.dart';
import '../screens/unit.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'recovery.dart';
import 'router.dart';
import 'services.dart';

/// Where the app opens: Recovery when the saved data can't be read (never a fresh welcome, M5), else onboarding or Today.
String startRoute() => store.loadError != null
    ? 'recovery'
    : store.data.settings.onboardedOn == null
    ? 'onboarding'
    : 'today';

Route<void> buildRoute(String name) {
  if (name == 'recovery') return MaterialPageRoute(builder: (_) => const Recovery(), settings: const RouteSettings(name: 'recovery'));
  final r = parseRoute(name);
  final page = ShellPage(key: ValueKey(r.path), route: r);
  // tabs swap in place (the web's tab bar); the rest slide
  if (tabRoots.contains(r.name) || r.name == 'onboarding') {
    return PageRouteBuilder(settings: RouteSettings(name: name), pageBuilder: (_, _, _) => page, transitionDuration: Duration.zero);
  }
  return MaterialPageRoute(builder: (_) => page, settings: RouteSettings(name: name));
}

/// Opens an app path ('rules/ikhfa', '#/unit/u1?finale=1'): a tab root replaces the stack, the rest is pushed
/// (`replace`: instead of the current screen, e.g. the next lesson).
void go(BuildContext context, String path, {bool replace = false}) {
  final name = path.replaceFirst(RegExp(r'^#?/?'), '');
  final r = parseRoute(name);
  final nav = Navigator.of(context);
  if (tabRoots.contains(r.name) || r.name == 'onboarding') {
    nav.pushAndRemoveUntil(buildRoute(name), (_) => false);
  } else if (replace) {
    nav.pushReplacement(buildRoute(name));
  } else {
    nav.push(buildRoute(name));
  }
}

/// ✕ / ‹: back where the learner came from, else the screen's parent (Shell META).
void leave(BuildContext context, AppRoute r) {
  final nav = Navigator.of(context);
  if (nav.canPop()) {
    nav.pop();
  } else {
    go(context, meta[r.name]?.parent ?? 'today');
  }
}

/// The page title in the bar is shown once the page's own header has scrolled away (Shell BarTitle / FocusTitle).
final _ownHeader = {'unit', 'learn'};

class ShellPage extends StatefulWidget {
  const ShellPage({super.key, required this.route});
  final AppRoute route;
  @override
  State<ShellPage> createState() => _ShellPageState();
}

class _ShellPageState extends State<ShellPage> {
  final _scrolled = ValueNotifier(false);

  @override
  void dispose() {
    _scrolled.dispose();
    super.dispose();
  }

  // a new scroll view (the next lesson step) reports its metrics too, so the title hides again at the top
  bool _onScroll(Notification n) {
    final m = n is ScrollNotification ? (n.depth == 0 ? n.metrics : null) : n is ScrollMetricsNotification && n.depth == 0 ? n.metrics : null;
    if (m != null && m.axis == Axis.vertical) _scrolled.value = m.pixels > 96;
    return false;
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.route;
    final m = meta[r.name]!;
    final c = context.c;
    final body = NotificationListener<Notification>(onNotification: _onScroll, child: _screen(r));
    final hasNav = m.kind == ShellKind.tab || m.kind == ShellKind.pushed;
    final top = switch (m.kind) {
      ShellKind.tab => const _TabBarTop(),
      ShellKind.pushed => _Bar(children: [
        AppIconButton(icon: Icons.arrow_back, label: t('Back'), onPressed: () => leave(context, r)),
        Expanded(child: _title(context, m, r)),
      ]),
      ShellKind.focus => _Bar(children: [
        _CloseButton(onTap: () => leave(context, r)),
        Expanded(child: _title(context, m, r, focus: true)),
        const SizedBox(width: 48),
      ]),
      ShellKind.bare => null,
    };
    return Scaffold(
      backgroundColor: c.background,
      body: Column(children: [
        ?top,
        Expanded(
          child: m.kind == ShellKind.bare
              ? SafeArea(bottom: false, child: body)
              : MediaQuery.removePadding(context: context, removeTop: true, child: body),
        ),
        const _SaveErrorBanner(),
      ]),
      bottomNavigationBar: hasNav ? _TabBar(active: m.tab) : null,
    );
  }

  Widget _title(BuildContext context, Meta m, AppRoute r, {bool focus = false}) {
    final ty = context.type, c = context.c;
    final lesson = r.name == 'learn' ? content.getLesson(r.params['lessonId'] ?? '') : null;
    Widget text() {
      if (focus) {
        final title = lesson?.nameAr ?? m.ar;
        final sub = isAr ? '' : lesson?.nameEn ?? m.en;
        return Column(mainAxisSize: MainAxisSize.min, children: [
          Text(title, maxLines: 1, overflow: TextOverflow.ellipsis, textDirection: TextDirection.rtl,
              style: TextStyle(fontFamily: Fonts.naskh, fontSize: ty.bodyLg.fontSize, height: 1.4, color: c.onSurface).weight(600)),
          if (sub.isNotEmpty) Text(sub, maxLines: 1, overflow: TextOverflow.ellipsis, style: ty.caption.copyWith(color: c.onSurfaceVariant)),
        ]);
      }
      return Text(isAr ? m.ar : m.en, maxLines: 1, overflow: TextOverflow.ellipsis, style: ty.headlineMd.copyWith(color: c.onSurface));
    }

    if (!_ownHeader.contains(r.name)) return Semantics(header: true, child: text());
    return ValueListenableBuilder(
      valueListenable: _scrolled,
      builder: (_, on, child) => AnimatedOpacity(opacity: on ? 1 : 0, duration: const Duration(milliseconds: 150), child: ExcludeSemantics(child: child)),
      child: text(),
    );
  }

  Widget _screen(AppRoute r) => switch (r.name) {
    'onboarding' => const Onboarding(),
    'today' => const Today(),
    'learn' => Learn(lessonId: r.params['lessonId']!),
    'plan' => const Plan(),
    'review' => ReviewScreen(go: r.params['go'] != null, more: int.tryParse(r.params['more'] ?? '') ?? 0),
    'unit' => UnitScreen(id: r.params['unitId']!, finale: r.params['finale'] != null),
    _ => NotBuilt(route: r),
  };
}

class _Bar extends StatelessWidget {
  const _Bar({required this.children});
  final List<Widget> children;
  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Container(
      decoration: BoxDecoration(color: c.surface, border: Border(bottom: BorderSide(color: c.outlineVariant)), boxShadow: c.shadowTop),
      padding: EdgeInsets.only(top: MediaQuery.paddingOf(context).top, left: Space.sm, right: Space.sm),
      child: SizedBox(height: 64, child: Row(spacing: Space.xs, children: children)),
    );
  }
}

class _CloseButton extends StatelessWidget {
  const _CloseButton({required this.onTap});
  final VoidCallback onTap;
  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Material(
      type: MaterialType.transparency,
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: onTap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 48, minWidth: 48),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: Space.sm),
            child: Row(mainAxisSize: MainAxisSize.min, spacing: 4, children: [
              Icon(Icons.close, size: 24, color: c.onSurfaceVariant),
              Text(t('Close'), style: context.type.label.weight(600).copyWith(color: c.onSurfaceVariant)),
            ]),
          ),
        ),
      ),
    );
  }
}

/// Tab screens: Help | brand | Settings (the language is in Settings).
class _TabBarTop extends StatelessWidget {
  const _TabBarTop();
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    return _Bar(children: [
      Expanded(child: Align(alignment: AlignmentDirectional.centerStart, child: AppIconButton(icon: Icons.help_outline, label: t('Help'), onPressed: () => go(context, 'guide')))),
      Semantics(
        header: true,
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Text(meta['onboarding']!.ar,
              style: TextStyle(fontFamily: Fonts.naskh, fontSize: 22, height: 1.25, color: c.primary).weight(700)),
          if (!isAr) Text('TAJWEED PATH', style: ty.caption.copyWith(color: c.onSurfaceVariant, letterSpacing: 1.1)),
        ]),
      ),
      Expanded(child: Align(alignment: AlignmentDirectional.centerEnd, child: AppIconButton(icon: Icons.settings_outlined, label: t('Settings'), onPressed: () => go(context, 'settings')))),
    ]);
  }
}

const _tabs = [
  (id: AppTab.today, to: 'today', icon: Icons.calendar_today_outlined, on: Icons.calendar_today, ar: '\u0627\u0644\u064a\u0648\u0645', en: 'Today'),
  (id: AppTab.rules, to: 'rules', icon: Icons.menu_book_outlined, on: Icons.menu_book, ar: '\u0627\u0644\u0623\u062d\u0643\u0627\u0645', en: 'Rules'),
  (id: AppTab.path, to: 'plan', icon: Icons.route_outlined, on: Icons.route, ar: '\u0627\u0644\u0645\u0633\u0627\u0631', en: 'Path'),
];

class _TabBar extends StatelessWidget {
  const _TabBar({this.active});
  final AppTab? active;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    return Semantics(
      label: t('Main'),
      container: true,
      child: Container(
        decoration: BoxDecoration(color: c.surface, boxShadow: c.shadowBar),
        padding: EdgeInsets.only(bottom: MediaQuery.paddingOf(context).bottom, left: Space.sm, right: Space.sm),
        child: SizedBox(
          height: 72,
          child: Row(children: [
            for (final tab in _tabs)
              Expanded(child: Builder(builder: (context) {
                final on = tab.id == active;
                final fg = on ? c.primary : c.onSurfaceVariant;
                return Semantics(
                  selected: on,
                  button: true,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(Radii.control),
                    onTap: () => go(context, tab.to),
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, spacing: 2, children: [
                      Container(
                        width: 56,
                        height: 28,
                        decoration: BoxDecoration(color: on ? c.primaryContainer : null, borderRadius: BorderRadius.circular(14)),
                        child: Icon(on ? tab.on : tab.icon, size: 22, color: fg),
                      ),
                      if (isAr)
                        Text(tab.ar, style: ty.arabicLabel.weight(on ? 700 : 500).copyWith(color: fg, height: 1.25))
                      else ...[
                        Text(tab.en, style: ty.label.weight(on ? 700 : 500).copyWith(color: fg, height: 1)),
                        Text(tab.ar, style: ty.arabicLabel.copyWith(color: fg.withValues(alpha: 0.8), height: 1.25)),
                      ],
                    ]),
                  ),
                );
              })),
          ]),
        ),
      ),
    );
  }
}

/// Shown while saves fail: the data is only in memory (M3).
class _SaveErrorBanner extends StatelessWidget {
  const _SaveErrorBanner();
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: store,
    builder: (context, _) => !store.saveError
        ? const SizedBox.shrink()
        : Padding(
            padding: const EdgeInsets.all(Space.gutter),
            child: Nudge(
              text: t("Couldn't save \u2014 storage is full. Export a backup now."),
              action: AppButton(label: t('Export a backup'), onPressed: () => shareBackup(context)),
            ),
          ),
  );
}

/// Screen body (the web's Page): gutters, vertical rhythm, and an optional pinned bottom bar (the lesson's one action).
class PageBody extends StatelessWidget {
  const PageBody({super.key, required this.items, this.bottom, this.gap = Space.lg, this.top = Space.lg});
  final List<Widget> items;
  final Widget? bottom;
  final double gap, top;
  @override
  Widget build(BuildContext context) {
    final list = SingleChildScrollView(
      padding: EdgeInsets.fromLTRB(Space.gutter, top, Space.gutter, Space.xl),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: gap, children: items),
    );
    if (bottom == null) return list;
    return Column(children: [Expanded(child: list), bottom!]);
  }
}

/// Screens not ported yet (src/screens/_placeholders.tsx), and unknown paths.
class NotBuilt extends StatelessWidget {
  const NotBuilt({super.key, required this.route});
  final AppRoute route;
  @override
  Widget build(BuildContext context) {
    final m = meta[route.name]!;
    if (route.name == 'notFound') {
      return PageBody(items: [
        EmptyState(
          icon: Icons.explore_off_outlined,
          title: t("This page doesn't exist."),
          body: t('The link may be mistyped or from an older version.'),
          action: AppButton(label: t('Go to Today'), onPressed: () => go(context, 'today')),
        ),
      ]);
    }
    return PageBody(items: [
      EmptyState(icon: Icons.construction_outlined, title: isAr ? m.ar : '${m.en}\n${m.ar}', body: t('Not built yet.')),
    ]);
  }
}
