// Dev page: the Quran widgets (F7) with real data. English-only labels for the page's own controls.
import 'package:flutter/material.dart';

import '../content/content.dart';
import '../content/rulemap.dart';
import '../core/types.dart' hide Passage;
import '../i18n/i18n.dart';
import '../quran/quran.dart';
import '../quran/verse.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';

// (lesson, verse, first word): the spike's hard cases. Not keyed by Arabic text (see README).
const _picks = [('istiadha', '9:1', 1), ('lazim-k', '6:80', 4), ('sakt', '83:14', 2), ('munfasil', '79:46', 5)];

class QuranPage extends StatefulWidget {
  const QuranPage({super.key});
  @override
  State<QuranPage> createState() => _QuranPageState();
}

/// --dart-define=DEV_WALK=true: the page drives itself through its sections and logs "SHOT name" when a frame is
/// ready (tool/gallery_shots.sh takes the screenshots).
const _walk = bool.fromEnvironment('DEV_WALK');

class _QuranPageState extends State<QuranPage> {
  final _scroll = ScrollController();
  final _keys = {for (final k in ['examples', 'passage', 'colours', 'find']) k: GlobalKey()};

  Future<void> _shot(String name) async {
    await Future<void>.delayed(const Duration(milliseconds: 900));
    debugPrint('SHOT $name');
    await Future<void>.delayed(const Duration(milliseconds: 2000));
  }

  Future<void> _show(String section) async {
    final ctx = _keys[section]!.currentContext;
    if (ctx != null) await Scrollable.ensureVisible(ctx, duration: const Duration(milliseconds: 200));
  }

  Future<void> _runWalk() async {
    await _shot('examples');
    _scroll.jumpTo(_scroll.position.maxScrollExtent * 0.33);
    await _shot('examples2');
    await _show('passage');
    setState(() => _lit = (key: '112:3', word: 2));
    await _shot('passage');
    await _show('colours');
    await _shot('colours');
    setState(() => _isolate = 'ghunnah');
    await _shot('colours_isolate');
    await _show('find');
    setState(() {
      _find[1] = WordMark.wrong;
      for (final n in findTargets(_verses['114:4']!, 'ikhfa')) {
        _find[n] = WordMark.found;
      }
    });
    await _shot('find');
    await _walkMore();
    debugPrint('SHOT done');
  }

  /// Player and recorder sections join the walk here.
  Future<void> _walkMore() async {}

  final _verses = <VerseKey, Verse>{};
  List<Verse> _ikhlas = [], _falaq = [];
  var _lit = (key: '112:1', word: 3);
  String? _isolate;
  final _find = <int, WordMark>{};

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    for (final (_, k, _) in _picks) {
      _verses[k] = (await getVerse(k))!;
    }
    _verses['114:4'] = (await getVerse('114:4'))!;
    _ikhlas = await loadSurah(112);
    _falaq = await loadSurah(113);
    if (mounted) setState(() {});
    if (_walk) WidgetsBinding.instance.addPostFrameCallback((_) => _runWalk());
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    if (_falaq.isEmpty) return const Scaffold(body: Center(child: CircularProgressIndicator()));
    Widget sec(String title, List<Widget> children, {String? key}) => Padding(
      key: key == null ? null : _keys[key],
      padding: const EdgeInsets.only(top: Space.lg),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text(title.toUpperCase(), textDirection: TextDirection.ltr, style: ty.label.copyWith(color: c.secondary, letterSpacing: 1)),
        const SizedBox(height: Space.sm),
        ...children,
      ]),
    );
    final v114 = _verses['114:4']!;
    final targets = findTargets(v114, 'ikhfa');
    return Scaffold(
      appBar: AppBar(title: const Text('Quran widgets')),
      body: ListView(
        controller: _scroll,
        padding: const EdgeInsets.fromLTRB(Space.gutter, 0, Space.gutter, Space.xl),
        children: [
          sec('Examples: focus mid-word, pause marks, across words', key: 'examples', [
            for (final (id, k, from) in _picks)
              Builder(builder: (context) {
                final ex = content.getLesson(id)!.examples.firstWhere((e) => e.verseKey == k && e.wordFrom == from);
                final v = _verses[k]!;
                return Panel(children: [
                  VerseBlock(
                    ayah: QAyah.of(v),
                    wholeAyah: true,
                    size: VerseSize.read,
                    focus: (ex.wordFrom, ex.wordTo),
                    focusText: ex.focus,
                    stopping: ex.stopping,
                    reference: '${content.surahName(int.parse(k.split(':')[0]))} ${arDigits(k.split(':')[1])}',
                  ),
                ]);
              }),
          ]),
          sec('Passage: lamp on the tapped word, current ayah, ayah ends', key: 'passage', [
            Panel(children: [
              Passage(
                ayahs: [for (final v in _ikhlas) QAyah.of(v)],
                current: _lit,
                currentAyah: _lit.key,
                onWord: (k, n, _) => setState(() => _lit = (key: k, word: n)),
                onAyah: (k) => setState(() => _lit = (key: k, word: 1)),
              ),
            ]),
          ]),
          sec('Tajweed colours (muṣḥaf), legend isolate', key: 'colours', [
            Wrap(spacing: Space.sm, children: [
              for (final k in ['ghunnah', 'silent', 'qalqalah', 'madd2'])
                AppChip(label: k, pressed: _isolate == k, onTap: () => setState(() => _isolate = _isolate == k ? null : k)),
            ]),
            Panel(children: [Passage(ayahs: [for (final v in _falaq) QAyah.of(v, tajweed: true)], tajweed: true, isolate: _isolate)]),
          ]),
          sec('Find chips (ikhfa in 114:4; tap a word)', key: 'find', [
            Panel(children: [
              VerseBlock(
                ayah: QAyah.of(v114),
                chips: true,
                tajweed: false,
                marks: _find,
                onWord: (n, _) => setState(() => _find[n] = targets.contains(n) ? WordMark.found : WordMark.wrong),
              ),
              AppButton(
                label: 'Show answers',
                variant: ButtonVariant.tertiary,
                onPressed: () => setState(() {
                  for (final n in targets) {
                    _find.putIfAbsent(n, () => WordMark.missed);
                  }
                }),
              ),
            ]),
          ]),
        ],
      ),
    );
  }
}
