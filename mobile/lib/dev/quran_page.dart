// Dev page: the Quran widgets (F7) with real data. English-only labels for the page's own controls.
import 'dart:io';

import 'package:flutter/material.dart';

import '../audio/downloads.dart';
import '../audio/player.dart';
import '../audio/recorder.dart';
import '../audio/recorder_view.dart';
import '../audio/recordings.dart';
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
  final _keys = {for (final k in ['examples', 'passage', 'colours', 'find', 'player', 'recorder', 'download']) k: GlobalKey()};

  Future<void> _shot(String name) async {
    await Future<void>.delayed(const Duration(milliseconds: 900));
    debugPrint('SHOT $name');
    await Future<void>.delayed(const Duration(milliseconds: 2000));
  }

  Future<void> _show(String section) async {
    // the list is lazy: scroll on until the section is built
    for (var i = 0; i < 40 && _keys[section]!.currentContext == null; i++) {
      final p = _scroll.position;
      _scroll.jumpTo(p.pixels + 500 > p.maxScrollExtent ? 0 : p.pixels + 500);
      await Future<void>.delayed(const Duration(milliseconds: 50));
    }
    final ctx = _keys[section]!.currentContext;
    if (ctx != null && ctx.mounted) await Scrollable.ensureVisible(ctx, duration: const Duration(milliseconds: 200));
  }

  Future<void> _runWalk() async {
    const only = String.fromEnvironment('DEV_WALK_ONLY'); // recorder | download: start the walk there
    if (only.isNotEmpty) {
      await (only == 'recorder' ? _walkRecorder() : _walkDownload());
      debugPrint('SHOT done');
      return;
    }
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

  Future<void> _until(bool Function(PlayerState) f, {int seconds = 20}) async {
    for (var i = 0; i < seconds * 20 && !f(_player.state); i++) {
      await Future<void>.delayed(const Duration(milliseconds: 50));
    }
  }

  /// Player and recorder sections join the walk here.
  Future<void> _walkMore() async {
    await _show('player');
    // a word clip (word 3 of 112:1), then the whole surah with the lamp
    _player.playWord(_ikhlas[0], 2);
    await _until((s) => s.status == PlayerStatus.playing);
    await _shot('player_word');
    await _until((s) => s.status == PlayerStatus.idle);
    _player.play();
    await _until((s) => s.verseKey == '112:2' && s.word != null && s.word!.$1 == 1);
    debugPrint('SHOT player_lamp');
    await _until((s) => s.status == PlayerStatus.idle, seconds: 40);
    await _walkRecorder();
  }

  /// Record ~3 s (the mic permission granted beforehand: simctl privacy / adb pm grant), then Both.
  Future<void> _walkRecorder() async {
    await _show('recorder');
    final r = _recorder.currentState!;
    final saved = r.record();
    for (var i = 0; i < 200 && r.status != RecStatus.recording; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 50));
    }
    if (r.status != RecStatus.recording) {
      debugPrint('RECORDER did not start: ${r.status.name}');
      await _until((_) => r.status != RecStatus.requesting); // the start timeout
      await _shot('recorder_failed');
      return _walkDownload();
    }
    await Future<void>.delayed(const Duration(seconds: 3));
    await _shot('recorder_recording');
    await r.record(); // stop
    await saved;
    await Future<void>.delayed(const Duration(milliseconds: 300));
    debugPrint('RECORDER take ${r.last?.durationMs} ms ${r.last == null ? '' : File(_recordings!.pathOf(r.last!)).lengthSync()} bytes');
    await _shot('recorder_saved');
    _player.load([_ikhlas[1]], _reciter); // Both: one short ayah, then the take
    final both = r.both();
    await _until((s) => s.clip && s.status == PlayerStatus.playing);
    await _shot('recorder_both_me');
    await both;
    _player.load(_ikhlas, _reciter);
    await _walkDownload();
  }

  /// Download the first unit, then (airplane mode switched on by the host when it sees SHOT downloaded) play a saved
  /// ayah and an unsaved one.
  Future<void> _walkDownload() async {
    await _show('download');
    final o = _offline.currentState!;
    if (o.saved) await o.delete();
    final keys = content.unitAyahs(_unit);
    final run = o.download();
    await Future<void>.delayed(const Duration(milliseconds: 400));
    await _shot('downloading');
    await run;
    debugPrint('DOWNLOAD ${await _downloads!.count(_reciter, keys)} of ${keys.length} saved');
    await _shot('downloaded');
    for (var i = 0; i < 30 && await isOnline(); i++) {
      await Future<void>.delayed(const Duration(seconds: 1));
    }
    debugPrint('NETWORK online=${await isOnline()}');
    final saved = (await getVerse(keys[1]))!;
    debugPrint('SOURCE ${await _downloads!.source(_reciter, saved.verseKey)}');
    await _show('player');
    _player.load([saved], _reciter, skipBasmala: true);
    _player.play();
    await _until((s) => s.word != null || s.status == PlayerStatus.idle || s.error != null);
    await _shot('offline_saved_ayah');
    await _until((s) => s.status == PlayerStatus.idle || s.error != null, seconds: 40);
    final unsaved = (await getVerse('2:255'))!;
    _player.load([unsaved], _reciter);
    _player.play();
    await _until((s) => s.error != null || s.status == PlayerStatus.playing);
    await _shot('offline_unsaved_ayah');
    _player.stop();
  }

  final _verses = <VerseKey, Verse>{};
  List<Verse> _ikhlas = [], _falaq = [];
  var _lit = (key: '112:1', word: 3);
  String? _isolate;
  final _find = <int, WordMark>{};
  final _player = Player();
  Recordings? _recordings;
  final _recorder = GlobalKey<RecorderViewState>();
  Downloads? _downloads;
  final _offline = GlobalKey<OfflineAudioState>();
  Unit get _unit => content.units.first;
  var _lastLog = '';

  Reciter get _reciter => content.reciters.first; // husary-muallim, the web's default

  /// Logged for the device walk (what played, which word was lit).
  void _log() {
    final s = _player.state;
    final line = 'PLAYER ${s.status.name} ${s.verseKey} word=${s.word} basmala=${s.basmala} clip=${s.clip}${s.error == null ? '' : ' ${s.error}'}';
    if (line != _lastLog) debugPrint(_lastLog = line);
  }

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
    _recordings = await Recordings.open();
    _downloads = await Downloads.open();
    _player.source = _downloads!.source; // a saved file first, else the network
    _player.addListener(_log);
    _player.load(_ikhlas, _reciter);
    if (mounted) setState(() {});
    if (_walk) WidgetsBinding.instance.addPostFrameCallback((_) => _runWalk());
  }

  @override
  void dispose() {
    _player.dispose();
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
          sec('Player: tap a word for its clip; play for the lamp', key: 'player', [
            ListenableBuilder(listenable: _player, builder: (context, _) => _playerPanel(context)),
          ]),
          sec('Recorder: record, then Reciter / Me / Both (112:1-4)', key: 'recorder', [
            Panel(children: [
              RecorderView(
                key: _recorder,
                from: '112:1',
                to: '112:4',
                player: _player,
                recordings: _recordings!,
                reciter: () {
                  _player.load(_ikhlas, _reciter);
                  _player.play();
                },
              ),
            ]),
          ]),
          sec('Offline audio (unit ${_unit.n}; the player prefers saved files)', key: 'download', [
            OfflineAudio(key: _offline, unit: _unit, reciter: _reciter, downloads: _downloads!),
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

  Widget _playerPanel(BuildContext context) {
    final s = _player.state, c = context.c, ty = context.type;
    final w = s.word;
    final lit = <String, WordMark>{
      if (w != null && s.verseKey != null) for (var i = w.$1; i < w.$2; i++) '${s.verseKey}/${i + 1}': WordMark.lamp,
    };
    return Panel(children: [
      Passage(
        ayahs: [for (final v in _ikhlas) QAyah.of(v)],
        size: VerseSize.read,
        marks: lit,
        currentAyah: s.busy && !s.clip ? s.verseKey : null,
        onWord: (k, n, _) => _player.playWord(_ikhlas.firstWhere((v) => v.verseKey == k), n - 1),
        onAyah: (k) {
          _player.seek(_ikhlas.indexWhere((v) => v.verseKey == k));
          if (!_player.state.busy) _player.play();
        },
      ),
      Wrap(spacing: Space.sm, runSpacing: Space.sm, crossAxisAlignment: WrapCrossAlignment.center, children: [
        AppButton(
          label: s.busy ? t('Pause') : t('Play'),
          icon: s.busy ? Icons.pause : Icons.play_arrow,
          onPressed: _player.toggle,
        ),
        AppIconButton(icon: Icons.stop, label: t('Stop'), onPressed: _player.stop),
        AppChip(icon: Icons.speed_outlined, label: t('Slower'), pressed: s.rate < 1, onTap: () => _player.setRate(s.rate < 1 ? 1 : 0.75)),
        AppChip(icon: Icons.repeat, semanticLabel: t('Loop'), pressed: s.loops > 1, onTap: () => _player.setLoops(s.loops > 1 ? 1 : 1 << 30)),
      ]),
      Segmented<String>(
        small: true,
        value: switch (s.gap) { GapOff() => 'off', GapSame() => 'same', GapSeconds() => '2' },
        onChanged: (v) => _player.setGap(switch (v) { 'same' => const GapSame(), '2' => const GapSeconds(2), _ => const GapOff() }),
        options: const [(value: 'off', label: 'gap off', icon: null), (value: 'same', label: 'gap = ayah', icon: null), (value: '2', label: 'gap 2 s', icon: null)],
      ),
      Text(
        '${s.status.name} · ${s.verseKey ?? '-'} · word ${s.word ?? '-'}${s.basmala ? ' · basmala' : ''}'
        '${s.status == PlayerStatus.gap ? ' · ${s.gapLeft}/${s.gapTotal} s' : ''} · loop ${s.loop}',
        textDirection: TextDirection.ltr,
        style: ty.caption.copyWith(color: c.onSurfaceVariant),
      ),
      if (s.error != null) Text(s.error!, style: ty.bodyMd.copyWith(color: c.error)),
    ]);
  }
}
