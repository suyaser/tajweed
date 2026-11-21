import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:just_audio/just_audio.dart';

import 'audio/word_clip.dart';
import 'quran/verse_text.dart';
import 'ui/theme.dart';

/// Week-1 go/no-go spike (docs/19 §2.5, P0): real examples from content/rules.json, whole ayah with the focus
/// highlight, and the example's words played as a clip of the ayah file. Run with
/// --dart-define=SPIKE_AUTORUN=true to play every clip on launch and log the measurements, and
/// --dart-define=SPIKE_INK_SPLIT=true to start with the focus ink as a colour-only TextSpan split.
// (rule, verse, first word). Not keyed by the Arabic focus: editors normalise typed Arabic (آ composed, shadda
// reordered), so a literal here would not match the data.
const _picks = [
  ('istiadha', '9:1', 1), // بَرَآءَةٌ: tanween + madda; the web lost this tanween to a split highlight
  ('lazim-k', '6:80', 4), // focus mid-word in أَتُحَٰٓجُّوٓنِّى: shadda, dagger alif, madda
  ('sakt', '83:14', 2), // بَلْ, pause marks ۖ and ۜ
  ('munfasil', '79:46', 5), // يَلْبَثُوٓا۟ إِلَّا: across two words, small round zero ۟
];
const _reciter = ('husary-muallim', 'Husary_Muallim_128kbps'); // the web's default (src/core/store.ts)
const _autorun = bool.fromEnvironment('SPIKE_AUTORUN');

class _Example {
  _Example(this.rule, this.ex, this.verse);
  final String rule;
  final Map ex, verse;
  String? result;
}

class SpikeScreen extends StatefulWidget {
  const SpikeScreen({super.key});
  @override
  State<SpikeScreen> createState() => _SpikeScreenState();
}

class _SpikeScreenState extends State<SpikeScreen> {
  final _player = AudioPlayer();
  final _scroll = ScrollController();
  List<_Example> _examples = [];
  bool _inkSplit = const bool.fromEnvironment('SPIKE_INK_SPLIT');

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final rules = jsonDecode(await rootBundle.loadString('assets/shared/content/rules.json')) as List;
    final out = <_Example>[];
    for (final (id, key, from) in _picks) {
      final rule = rules.firstWhere((r) => r['id'] == id);
      final ex = (rule['examples'] as List).firstWhere((e) => e['verse'] == key && e['word_from'] == from);
      final surah = key.split(':')[0].padLeft(3, '0');
      final verses = jsonDecode(await rootBundle.loadString('assets/shared/data/surah/$surah.json')) as List;
      out.add(_Example(id, ex, verses.firstWhere((v) => v['verseKey'] == key)));
    }
    setState(() => _examples = out);
    if (_autorun) {
      for (final e in out) {
        await _play(e);
      }
      await _scroll.animateTo(_scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 300), curve: Curves.ease);
      debugPrint('SPIKE_AUTORUN done');
    }
  }

  Future<void> _play(_Example e) async {
    final t = (e.verse['timings'][_reciter.$1] as List).map((s) => (s as List).cast<int>()).toList();
    final s = wordSlice(t, e.ex['word_from'], e.ex['word_to']);
    final words = (e.verse['words'] as List).sublist(e.ex['word_from'] - 1, e.ex['word_to']).join(' ');
    setState(() => e.result = 'playing…');
    try {
      final end = s.endMs ?? 600000; // untimed: whole ayah (ClippingAudioSource stops at the file's end)
      final r = await playClip(_player, ayahUrl(_reciter.$2, e.verse['verseKey']), s.startMs, end);
      setState(() => e.result = '$r');
      debugPrint('SPIKE ${e.verse['verseKey']} w${e.ex['word_from']}-${e.ex['word_to']} $words: $r');
    } catch (err) {
      setState(() => e.result = 'error: $err');
      debugPrint('SPIKE ${e.verse['verseKey']} error: $err');
    }
  }

  @override
  void dispose() {
    _player.dispose();
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final k = _Ink(context.c);
    return Scaffold(
      backgroundColor: k.surface,
      appBar: AppBar(
        backgroundColor: k.surface,
        foregroundColor: k.ink,
        title: const Text('Spike: text + word clips'),
        actions: [
          Row(children: [
            Text('ink split', style: TextStyle(color: k.muted, fontSize: 13)),
            Switch(value: _inkSplit, onChanged: (v) => setState(() => _inkSplit = v)),
          ]),
        ],
      ),
      body: ListView(
        controller: _scroll,
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        children: [
          for (final e in _examples) _card(e, k),
          TextButton(onPressed: () => showLicensePage(context: context), child: const Text('Licences')),
        ],
      ),
    );
  }

  Widget _card(_Example e, _Ink k) {
    final words = (e.verse['words'] as List).cast<String>();
    final pauses = {for (final m in (e.verse['marks'] as List? ?? [])) m['after'] as int: m['mark'] as String};
    final v = layoutVerse(words,
        pauses: pauses, focus: (e.ex['word_from'] as int, e.ex['word_to'] as int), focusText: e.ex['focus']);
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
        Text('${e.rule} · ${e.verse['verseKey']} · words ${e.ex['word_from']}–${e.ex['word_to']} · focus “${e.ex['focus']}”',
            style: TextStyle(color: k.muted, fontSize: 12)),
        VerseText(
            text: v.text, ranges: v.ranges, pauses: v.pauses, ink: k.ink, pauseInk: k.secondary, focusBg: k.focusBg, focusInk: k.focusInk, inkSplit: _inkSplit),
        Row(children: [
          IconButton(onPressed: () => _play(e), icon: Icon(Icons.play_arrow, color: k.gold), tooltip: 'Play the words'),
          Expanded(child: Text(e.result ?? '', style: TextStyle(color: k.muted, fontSize: 11))),
        ]),
      ]),
    );
  }
}

/// The spike's names for the token roles.
class _Ink {
  _Ink(AppColors c)
      : surface = c.surface, ink = c.onSurface, muted = c.onSurfaceVariant, focusBg = c.focusBg, focusInk = c.focusInk,
        gold = c.gold, secondary = c.secondary;
  final Color surface, ink, muted, focusBg, focusInk, gold, secondary;
}
