// Dev gallery (the web's #/dev/components): every kit widget with real content, in the current language and theme.
// English-only labels for the gallery's own controls; everything else goes through t() and the content.
// --dart-define=GALLERY_CYCLE=true walks Arabic/English × light/dark and three scroll positions, printing
// "SHOT <name>" when each frame is ready (tool/gallery_shots.sh takes the screenshots).
import 'package:flutter/material.dart';

import '../app.dart';
import '../content/content.dart';
import '../i18n/i18n.dart';
import '../quran/verse_text.dart';
import '../spike.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';

const _cycle = bool.fromEnvironment('GALLERY_CYCLE');

class DevGallery extends StatefulWidget {
  const DevGallery({super.key});
  @override
  State<DevGallery> createState() => _DevGalleryState();
}

class _DevGalleryState extends State<DevGallery> {
  final _scroll = ScrollController();
  var _view = 'list';
  var _size = 'm';
  var _loop = false, _slow = true;
  var _step = 'learn';
  var _nudge = true;

  @override
  void initState() {
    super.initState();
    if (_cycle) WidgetsBinding.instance.addPostFrameCallback((_) => _shots());
  }

  // Changing the language rebuilds the app (a new State), so the walk is driven from a static index.
  static var _shot = 0;
  static const _combos = [(Lang.ar, ThemeMode.light), (Lang.ar, ThemeMode.dark), (Lang.en, ThemeMode.light), (Lang.en, ThemeMode.dark)];

  Future<void> _shots() async {
    final (l, mode) = _combos[_shot ~/ 3];
    themeMode.value = mode;
    if (lang.value != l) {
      lang.value = l; // rebuilds the app: the new gallery state continues the walk
      return;
    }
    final page = _shot % 3;
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    // twice: the list is lazy, so the first jump to the end only finds the real end
    for (var i = 0; i < 2; i++) {
      _scroll.jumpTo(page == 0 ? 0 : page == 1 ? _scroll.position.maxScrollExtent / 2 : _scroll.position.maxScrollExtent);
      await Future<void>.delayed(const Duration(milliseconds: 200));
    }
    await Future<void>.delayed(const Duration(milliseconds: 900));
    debugPrint('SHOT ${l.name}_${mode.name}_$page');
    await Future<void>.delayed(const Duration(milliseconds: 2500));
    if (++_shot < _combos.length * 3 && mounted) {
      _shots();
    } else {
      debugPrint('SHOT done');
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final lesson = content.getLesson('ikhfa')!;
    final n = content.courseOrder.indexOf(lesson.id) + 1;
    final unit = content.unitOf(lesson.id)!;
    final ex = lesson.examples.first;
    final words = ex.text.split(' ');
    final verse = layoutVerse(words, focus: (1, words.length), focusText: ex.focus);
    final gloss = content.glossary.first;
    StepMark stateOf(String id) => id == _step
        ? StepMark.current
        : const {
            'hear': StepMark.done,
            'notice': StepMark.skipped,
            'learn': StepMark.visited,
            'say': StepMark.visited,
          }[id] ??
          StepMark.fresh;

    Widget sec(String title, List<Widget> children) => Padding(
      padding: const EdgeInsets.only(top: Space.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(title.toUpperCase(), textDirection: TextDirection.ltr, style: ty.label.copyWith(color: c.secondary, letterSpacing: 1)),
          const SizedBox(height: Space.sm),
          for (final (i, w) in children.indexed) ...[if (i > 0) const SizedBox(height: Space.sm), w],
        ],
      ),
    );
    Widget wrap(List<Widget> xs) => Wrap(spacing: Space.sm, runSpacing: Space.sm, crossAxisAlignment: WrapCrossAlignment.center, children: xs);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: ListView(
          controller: _scroll,
          padding: const EdgeInsets.fromLTRB(Space.gutter, Space.sm, Space.gutter, Space.xl),
          children: [
            // gallery controls (dev, English)
            Directionality(
              textDirection: TextDirection.ltr,
              child: Row(
                children: [
                  Expanded(
                    child: Segmented<Lang>(
                      small: true,
                      value: lang.value,
                      onChanged: (l) => lang.value = l,
                      options: const [(value: Lang.ar, label: 'AR', icon: null), (value: Lang.en, label: 'EN', icon: null)],
                    ),
                  ),
                  const SizedBox(width: Space.sm),
                  Expanded(
                    child: Segmented<ThemeMode>(
                      small: true,
                      value: Theme.of(context).brightness == Brightness.dark ? ThemeMode.dark : ThemeMode.light,
                      onChanged: (m) => themeMode.value = m,
                      options: const [
                        (value: ThemeMode.light, label: 'Lt', icon: Icons.light_mode_outlined),
                        (value: ThemeMode.dark, label: 'Dk', icon: Icons.dark_mode_outlined),
                      ],
                    ),
                  ),
                  AppIconButton(
                    icon: Icons.science_outlined,
                    label: 'Spike',
                    onPressed: () => Navigator.push(context, MaterialPageRoute<void>(builder: (_) => const SpikeScreen())),
                  ),
                ],
              ),
            ),
            const SizedBox(height: Space.md),
            PageHeader(
              en: 'Course path',
              ar: ar['Course path'],
              detail: [tn('{n} rule', '{n} rules', content.lessons.length), tn('{n} topic', '{n} topics', content.topics.length)],
              actions: [AppIconButton(icon: Icons.settings_outlined, label: t('Settings'), onPressed: () {})],
            ),
            sec('PageHeader · no ornament (Today)', [PageHeader(en: 'Settings', ar: ar['Settings'], ornament: false, detail: [riwayah])]),
            sec('PageHeader · stacked lesson header', [
              PageHeader(
                en: lesson.nameEn,
                ar: lesson.nameAr,
                stacked: true,
                eyebrow: [t('Lesson {n} of {m}', {'n': n, 'm': content.courseOrder.length}), t('Unit {n}', {'n': unit.n})],
                detail: [unit.surahs],
              ),
            ]),
            sec('StepBar (done / skipped / current / visited / new)', [StepBar(stateOf: stateOf, onGo: (id) => setState(() => _step = id))]),
            sec('Focus highlight (Amiri Quran, one style run)', [
              Panel(
                children: [
                  Row(
                    children: [
                      Expanded(child: Text(t('Example {n} of {total}', {'n': 1, 'total': lesson.examples.length}), style: ty.label.weight(600).copyWith(color: c.secondary))),
                      AppChip(icon: Icons.bookmark_outline, label: '${content.surahName(int.parse(ex.verseKey.split(':')[0]))} ${arDigits(ex.verseKey.split(':')[1])}'),
                    ],
                  ),
                  // centred like the web's example card (F7 owns the verse layout)
                  Center(child: VerseText(text: verse.text, ranges: verse.ranges, ink: c.onSurface, pauseInk: c.secondary, focusBg: c.focusBg, focusInk: c.focusInk)),
                ],
              ),
            ]),
            sec('Buttons', [
              AppButton(label: t('Continue'), onPressed: () {}, block: true),
              wrap([
                AppButton(label: t('Review'), variant: ButtonVariant.secondary, onPressed: () {}),
                AppButton(label: t('Skip'), variant: ButtonVariant.tertiary, onPressed: () {}),
                AppButton(label: t('Not now'), variant: ButtonVariant.ghost, onPressed: () {}),
                AppButton(label: t('Delete'), variant: ButtonVariant.destructive, onPressed: () {}),
                AppButton(label: t('Next'), onPressed: null),
                AppButton(label: t('Back up now'), size: ButtonSize.sm, icon: Icons.save_outlined, variant: ButtonVariant.secondary, onPressed: () {}),
              ]),
            ]),
            sec('Chips · StatusChip', [
              wrap([
                AppChip(icon: Icons.bookmark_outline, label: '${content.surahName(113)} ${arDigits(2)}'),
                AppChip(tone: ChipTone.gold, label: gloss.term),
                AppChip(tone: ChipTone.outline, label: lesson.nameAr),
                AppChip(icon: Icons.speed_outlined, label: t('Slower'), pressed: _slow, onTap: () => setState(() => _slow = !_slow)),
                AppChip(icon: Icons.repeat, pressed: _loop, semanticLabel: t('Loop'), onTap: () => setState(() => _loop = !_loop)),
              ]),
              wrap([
                StatusChip(status: Status.done, label: t('done')),
                StatusChip(status: Status.current, label: t('current')),
                StatusChip(status: Status.info, label: t('learning')),
                StatusChip(status: Status.todo, label: t('not started')),
                StatusChip(status: Status.warning, label: t('strong')),
              ]),
            ]),
            sec('Segmented', [
              Segmented<String>(
                value: _view,
                onChanged: (v) => setState(() => _view = v),
                options: [(value: 'list', label: t('List'), icon: Icons.list), (value: 'map', label: t('Map'), icon: Icons.account_tree_outlined)],
              ),
              Segmented<String>(
                small: true,
                value: _size,
                onChanged: (v) => setState(() => _size = v),
                options: [(value: 'm', label: t('Light'), icon: null), (value: 'l', label: t('Dark'), icon: null), (value: 'xl', label: t('System'), icon: null)],
              ),
            ]),
            sec('Cards · Panel · SectionCard', [
              Panel(
                title: lesson.nameEn,
                ar: lesson.nameAr,
                icon: Icons.menu_book_outlined,
                aside: Text(tn('{n} rule', '{n} rules', 1)),
                children: [Text(lesson.summary, style: ty.bodyMd.copyWith(color: c.onSurface))],
              ),
              SectionCard(n: 1, en: 'What happens', ar: ar['What happens'], child: Text(lesson.summary)),
            ]),
            sec('Nudge · sheet', [
              if (_nudge)
                Nudge(
                  text: t('No backup yet.'),
                  action: AppButton(label: t('Back up now'), size: ButtonSize.sm, variant: ButtonVariant.tertiary, onPressed: () {}),
                  onDismiss: () => setState(() => _nudge = false),
                ),
              AppButton(
                label: t('Rule'),
                variant: ButtonVariant.secondary,
                icon: Icons.menu_book_outlined,
                onPressed: () => showAppSheet<void>(
                  context,
                  title: isAr ? lesson.nameAr : lesson.nameEn,
                  builder: (_) => Text(lesson.summary),
                ),
              ),
            ]),
            sec('BottomBar', [
              ClipRRect(
                borderRadius: BorderRadius.circular(Radii.card),
                child: BottomBar(
                  hint: t('Play this word to continue.'),
                  child: AppButton(label: t('Next'), onPressed: null, block: true),
                ),
              ),
            ]),
          ],
        ),
      ),
    );
  }
}
