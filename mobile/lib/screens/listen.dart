// Port of src/screens/Listen.tsx (#/listen/:range): the passage with the word lamp, a tap plays a word, an ayah
// number jumps; the transport pinned at the bottom (ayah pips, prev / play / next, Loop ×n, Slower, Gap, Colours);
// record yourself and compare; listening time counted toward today's wird. The teacher link is phase 2 (no account).
import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart' show DateFormat;
import 'package:url_launcher/url_launcher.dart';

import '../app/services.dart';
import '../app/shell.dart';
import '../audio/player.dart';
import '../audio/recorder_view.dart';
import '../audio/recordings.dart';
import '../audio/compare.dart';
import '../content/content.dart';
import '../core/day.dart';
import '../core/types.dart' hide Passage;
import '../i18n/i18n.dart';
import '../quran/quran.dart';
import '../quran/verse.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'lesson_parts.dart';
import 'study.dart';

typedef AyahRange = ({VerseKey from, VerseKey to});

/// The passage when #/listen has no (valid) range: الفاتحة.
const defaultRange = (from: '1:1', to: '1:7');

/// Longest passage #/listen loads (M7).
const maxAyat = 300;

/// Route param → range (range.ts parseRange): `1:1-1:7`, `112:1-114:6`, `93:5`, `93:1-5`, `93`. Null when malformed,
/// out of bounds or backwards.
AyahRange? parseRange(String? raw) {
  final m = RegExp(r'^\s*(\d+)(?::(\d+))?(?:\s*[-–]\s*(?:(\d+):)?(\d+))?\s*$').firstMatch(raw ?? '');
  if (m == null) return null;
  final (s1, a1, s2, a2) = (m[1]!, m[2], m[3], m[4]);
  if (a1 == null && a2 != null) return null; // '93-5' is ambiguous
  (int, int)? key(String s, String? a, int fallback) {
    final n = int.parse(s);
    if (n < 1 || n > 114) return null;
    final k = a == null ? fallback : int.parse(a);
    return k < 1 || k > content.surahAyahs(n) ? null : (n, k);
  }

  final from = key(s1, a1, 1);
  if (from == null) return null;
  final to = a2 == null ? (a1 == null ? key(s1, null, content.surahAyahs(int.parse(s1))) : from) : key(s2 ?? s1, a2, 0);
  if (to == null) return null;
  if (to.$1 < from.$1 || (to.$1 == from.$1 && to.$2 < from.$2)) return null;
  return (from: '${from.$1}:${from.$2}', to: '${to.$1}:${to.$2}');
}

/// The first [max] ayat of a range.
AyahRange capRange(AyahRange r, [int max = maxAyat]) {
  var [s, a] = r.from.split(':').map(int.parse).toList();
  final [s2, a2] = r.to.split(':').map(int.parse).toList();
  for (var n = 1; n < max && !(s == s2 && a == a2); n++) {
    if (a < content.surahAyahs(s)) {
      a++;
    } else {
      s++;
      a = 1;
    }
  }
  return (from: r.from, to: '$s:$a');
}

/// `#/listen/93:1-93:11` (helpers.ts rangeParam).
String listenPath(VerseKey from, [VerseKey? to]) => 'listen/${to == null || to == from ? from : '$from-$to'}';

const _loops = [1, 3, 5, 10];

// [Arabic, English] (Marks.tsx COLOURS)
const colourNames = <String, (String, String)>{
  'clear': ('\u0625\u0638\u0647\u0627\u0631', 'Clear'),
  'ghunnah': ('\u063a\u0646\u0629 · \u0625\u062e\u0641\u0627\u0621', 'Ghunnah'),
  'silent': ('\u062d\u0631\u0641 \u0644\u0627 \u064a\u064f\u0646\u0637\u0642', 'Silent letter'),
  'merge': ('\u0625\u062f\u063a\u0627\u0645', 'Merge'),
  'madd2': ('\u0645\u062f \u062d\u0631\u0643\u062a\u0627\u0646', 'Madd 2'),
  'madd45': ('\u0645\u062f \u0664–\u0665', 'Madd 4–5'),
  'madd246': ('\u0645\u062f \u0662 \u0623\u0648 \u0664 \u0623\u0648 \u0666', 'Madd 2, 4 or 6'),
  'madd6': ('\u0645\u062f \u0666', 'Madd 6'),
  'qalqalah': ('\u0642\u0644\u0642\u0644\u0629', 'Qalqalah'),
  'heavy': ('\u062a\u0641\u062e\u064a\u0645', 'Heavy'),
  'light': ('\u062a\u0631\u0642\u064a\u0642', 'Light'),
};

String _mmss(int ms) {
  final s = (ms / 1000).round();
  return digits('${s ~/ 60}:${'${s % 60}'.padLeft(2, '0')}');
}

class Listen extends StatefulWidget {
  const Listen({super.key, this.range});
  final String? range;
  @override
  State<Listen> createState() => _ListenState();
}

class _ListenState extends State<Listen> {
  late final AyahRange? _parsed = parseRange(widget.range);
  late final AyahRange _wanted = _parsed ?? defaultRange;
  late final AyahRange _range = capRange(_wanted);
  late Reciter _reciter = learnerReciter;
  final _player = newPlayer();
  List<Verse>? _verses;
  bool _textError = false;
  String? _isolate;
  String? _dotted;
  Timer? _listenTimer;
  int _acc = 0;
  List<Recording> _recs = [];
  bool _saved = false; // a take recorded on this visit: Model, then me is the filled button
  ({Future<void> done, void Function() cancel})? _compare;
  ComparePhase? _phase;

  @override
  void initState() {
    super.initState();
    _player.addListener(_changed);
    _setGap();
    _load();
    _refreshTakes();
    // listening time → today's log, flushed every 15 s and on leave
    _listenTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_player.state.status == PlayerStatus.playing && !_player.state.clip && ++_acc >= 15) {
        store.addListenSeconds(_acc);
        _acc = 0;
      }
    });
  }

  void _setGap() => _player.setGap(_reciter.style == 'muallim' ? const GapOff() : const GapSame()); // spec F5 default

  void _changed() => mounted ? setState(() {}) : null;

  Future<void> _load() async {
    setState(() {
      _verses = null;
      _textError = false;
    });
    try {
      final vs = await getRange(_range.from, _range.to);
      if (!mounted) return;
      setState(() => _verses = vs);
      _player.load(vs, _reciter);
    } catch (_) {
      if (mounted) setState(() => _textError = true);
    }
  }

  @override
  void dispose() {
    _listenTimer?.cancel();
    final left = _acc; // after the unmount: saving notifies listeners, which may not rebuild while the tree is locked
    if (left > 0) scheduleMicrotask(() => store.addListenSeconds(left));
    _compare?.cancel();
    _player.removeListener(_changed);
    _player.dispose();
    super.dispose();
  }

  void _cancelCompare() {
    _compare?.cancel();
    _compare = null;
    _phase = null;
  }

  Future<void> _refreshTakes() async {
    final xs = await recordings.list(_range.from, _range.to);
    if (mounted) setState(() => _recs = xs);
  }

  /// The reciter over the passage once, a short pause, then the take (compare.ts playModelThenMe).
  void _modelThenMe(Recording r) {
    _cancelCompare();
    final b = playModelThenMe(_player, recordings.pathOf(r), (p) => mounted ? setState(() => _phase = p == ComparePhase.done ? null : p) : null);
    setState(() => _compare = b);
    b.done.whenComplete(() => mounted && identical(_compare, b) ? setState(_cancelCompare) : null);
  }

  void _me(Recording r) {
    setState(_cancelCompare);
    _player.stop();
    playMe(_player, recordings.pathOf(r));
  }

  void _togglePlay() {
    if (_phase != null) return setState(_cancelCompare);
    _player.toggle();
  }

  bool get _busy => _player.state.busy;

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final s = _player.state;
    final verses = _verses;
    final label = rangeRef(_range.from, _range.to);
    final colours = store.data.settings.tajweedColours;
    final listenDone = store.data.days.where((d) => d.id == today()).firstOrNull?.parts['listen'] != null;
    final lit = s.word != null && !s.clip && s.verseKey != null ? (key: s.verseKey!, word: s.word!.$1 + 1) : null;
    final shown = !colours || verses == null
        ? const <String>[]
        : {
            for (final v in verses)
              for (final w in QAyah.of(v, tajweed: true).segments ?? const <List<Segment>>[])
                for (final seg in w) ?seg.colour,
          }.toList();
    final [s1, a1] = _range.from.split(':');
    final [s2, a2] = _range.to.split(':');
    final quranCom = 'https://quran.com/$s1/${s1 == s2 ? (a1 == a2 ? a1 : '$a1-$a2') : a1}';

    final text = Container(
      padding: const EdgeInsets.all(Space.md),
      decoration: BoxDecoration(
        color: c.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(Radii.card),
        border: Border.all(color: c.outlineVariant),
      ),
      child: _textError
          ? EmptyState(
              icon: Icons.cloud_off,
              title: t("Couldn't load the text."),
              body: t('Check your connection. Text you have opened before works offline.'),
              action: AppButton(label: t('Try again'), variant: ButtonVariant.secondary, onPressed: _load),
            )
          : verses == null
          ? Column(spacing: 12, children: [for (var i = 0; i < 4; i++) const Skeleton()])
          : Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              spacing: Space.md,
              children: [
                Passage(
                  ayahs: [for (final v in verses) QAyah.of(v, tajweed: colours)],
                  tajweed: colours,
                  isolate: _isolate,
                  currentAyah: s.status != PlayerStatus.idle || s.index > 0 ? s.verseKey : null,
                  current: lit,
                  marks: _dotted != null && _busy ? {_dotted!: WordMark.lampDotted} : const {},
                  onWord: (k, w, _) {
                    final v = verses.firstWhere((x) => x.verseKey == k);
                    setState(_cancelCompare);
                    _player.playWord(v, w - 1);
                    setState(() => _dotted = segForWord(segsOf(v, _reciter.id), w - 1) == null ? '$k/$w' : null);
                  },
                  onAyah: (k) {
                    if (s.status == PlayerStatus.gap) return _player.skipGap();
                    setState(_cancelCompare);
                    _player.seek(verses.indexWhere((v) => v.verseKey == k));
                  },
                ),
                if (colours)
                  Container(
                    padding: const EdgeInsets.all(Space.md),
                    decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      spacing: Space.sm,
                      children: [
                        Legend(colours: shown, isolate: _isolate, onIsolate: (k) => setState(() => _isolate = k)),
                        Tx(
                          t(
                            'Colours come from the quran-tajweed markup. It does not mark every rule (for example \u0627\u0644\u0631\u0627\u0621 and \u0627\u0644\u0625\u0638\u0647\u0627\u0631), so a word without colour may still carry a rule.',
                          ),
                          style: ty.bodyMd.copyWith(color: c.onSurfaceVariant),
                        ),
                      ],
                    ),
                  ),
                Row(
                  spacing: Space.xs,
                  children: [
                    Icon(Icons.touch_app_outlined, size: 18, color: c.onSurfaceVariant),
                    Expanded(
                      child: Text(t('Tap a word to hear it alone. Tap an ayah number to jump to it.'), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
                    ),
                  ],
                ),
              ],
            ),
    );

    return PageBody(
      top: Space.md,
      items: [
        Hint(
          id: 'listen',
          text: t('Play to hear the reciter, repeat in the pause after each ayah. Tap a word to hear it alone. Record yourself, then play “reciter, then me”.'),
        ),
        Wrap(
          alignment: WrapAlignment.spaceBetween,
          crossAxisAlignment: WrapCrossAlignment.center,
          spacing: Space.md,
          runSpacing: Space.sm,
          children: [
            Text(
              label,
              textDirection: TextDirection.rtl,
              style: TextStyle(fontFamily: Fonts.naskh, fontSize: 24, height: 1.4, color: c.onSurface).weight(700),
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              spacing: Space.sm,
              children: [
                Text(t('Reciter'), style: ty.label.weight(600).copyWith(color: c.onSurfaceVariant)),
                _ReciterPicker(
                  value: _reciter,
                  onChanged: (r) {
                    setState(() {
                      _cancelCompare();
                      _reciter = r;
                    });
                    _player.stop();
                    _setGap();
                    if (verses != null) _player.load(verses, r);
                  },
                ),
              ],
            ),
          ],
        ),
        if (listenDone)
          Row(
            spacing: 4,
            children: [
              Icon(Icons.check_circle, size: 18, color: c.success),
              Text(t('Listening counted for today'), style: ty.bodyMd.copyWith(color: c.success)),
            ],
          ),
        if (widget.range != null && _parsed == null) Nudge(text: t("That passage link isn't valid, so here is {label}.", {'label': label})),
        if (_range.to != _wanted.to) Nudge(text: t('That passage is long, so here are its first {n} ayat: {label}.', {'n': maxAyat, 'label': label})),
        text,
        Panel(
          children: [
            RecorderView(
              from: _range.from,
              to: _range.to,
              player: _player,
              recordings: recordings,
              onSaved: () {
                store.noteRecording();
                _saved = true;
              },
              onStatus: (_) => _refreshTakes(),
              // as the web: [Model, then me] [Me] under the button, then what plays now (compare is null while recording)
              layout: (context, record, compare, _) => Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                spacing: Space.md,
                children: [
                  record,
                  if (compare != null && _recs.isNotEmpty)
                    Wrap(
                      spacing: Space.sm,
                      runSpacing: Space.sm,
                      children: [
                        AppButton(
                          label: t('Model, then me'),
                          icon: Icons.compare_arrows,
                          variant: _saved ? ButtonVariant.primary : ButtonVariant.secondary,
                          onPressed: verses == null ? null : () => _modelThenMe(_recs.first),
                        ),
                        AppButton(label: t('Me'), icon: Icons.play_arrow, variant: ButtonVariant.ghost, onPressed: () => _me(_recs.first)),
                      ],
                    ),
                  if (_phase != null)
                    Semantics(
                      liveRegion: true,
                      child: Text.rich(
                        _phase == ComparePhase.model
                            ? TextSpan(children: [
                                TextSpan(text: '${t('Now:')} '),
                                TextSpan(text: _reciter.nameAr, style: ty.arabicLabel),
                              ])
                            : TextSpan(text: _phase == ComparePhase.silence ? t('Now: your turn is next…') : t('Now: You')),
                        style: ty.bodyMd.copyWith(color: c.primary),
                      ),
                    ),
                ],
              ),
            ),
            if (_recs.isNotEmpty) _Takes(recs: _recs, onMe: _me, onModelThenMe: verses == null ? null : _modelThenMe, onDelete: (r) => recordings.remove(r.id).then((_) => _refreshTakes())),
          ],
        ),
        Align(
          alignment: AlignmentDirectional.centerStart,
          child: AppButton(
            label: t('Open on Quran.com'),
            iconEnd: Icons.open_in_new,
            variant: ButtonVariant.tertiary,
            onPressed: () => launchUrl(Uri.parse(quranCom), mode: LaunchMode.externalApplication),
          ),
        ),
      ],
      bottom: _Transport(
        state: s,
        reciter: _reciter,
        phase: _phase,
        loaded: verses != null,
        count: verses?.length ?? 0,
        from: _range.from,
        colours: colours,
        onPlay: _togglePlay,
        onPrev: () {
          setState(_cancelCompare);
          _player.prev();
        },
        onNext: () {
          setState(_cancelCompare);
          _player.next();
        },
        onSeek: (i) {
          setState(_cancelCompare);
          _player.seek(i);
        },
        onLoop: () => _player.setLoops(_loops[(_loops.indexOf(s.loops) + 1) % _loops.length]),
        onRate: () => _player.setRate(s.rate == 1 ? 0.75 : 1),
        onGap: () => _player.setGap(s.gap is GapOff ? const GapSame() : const GapOff()),
        onColours: () => setState(() {
          store.updateSettings({'tajweedColours': !colours});
          _isolate = null;
        }),
        onSkipGap: _player.skipGap,
        onRetry: _player.play,
      ),
    );
  }
}

class _ReciterPicker extends StatelessWidget {
  const _ReciterPicker({required this.value, required this.onChanged});
  final Reciter value;
  final ValueChanged<Reciter> onChanged;
  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Container(
      width: 200,
      constraints: const BoxConstraints(minHeight: 48),
      padding: const EdgeInsets.symmetric(horizontal: Space.sm),
      decoration: BoxDecoration(
        color: c.surfaceContainerLowest,
        borderRadius: BorderRadius.circular(Radii.control),
        border: Border.all(color: c.outlineVariant),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value.id,
          isExpanded: true,
          borderRadius: BorderRadius.circular(Radii.control),
          dropdownColor: c.surfaceContainerLowest,
          style: context.type.arabicLabel.copyWith(color: c.onSurface),
          items: [
            for (final r in content.reciters)
              DropdownMenuItem(
                value: r.id,
                child: Text(r.nameAr, textDirection: TextDirection.rtl, overflow: TextOverflow.ellipsis),
              ),
          ],
          onChanged: (id) => onChanged(content.reciters.firstWhere((r) => r.id == id)),
        ),
      ),
    );
  }
}

/// The colour key: a chip per colour shown, tap to see only that one (Marks.tsx Legend).
class Legend extends StatelessWidget {
  const Legend({super.key, required this.colours, this.isolate, this.onIsolate});
  final List<String> colours;
  final String? isolate;
  final ValueChanged<String?>? onIsolate;
  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Wrap(
      spacing: 6,
      runSpacing: 6,
      children: [
        for (final k in colours)
          Builder(
            builder: (context) {
              final on = isolate == k, col = tajweedColour(c, k);
              return Semantics(
                button: onIsolate != null,
                selected: on,
                child: Material(
                  color: c.surfaceContainerLowest,
                  shape: StadiumBorder(
                    side: BorderSide(color: on ? col : c.outlineVariant, width: on ? 2 : 1),
                  ),
                  child: InkWell(
                    customBorder: const StadiumBorder(),
                    onTap: onIsolate == null ? null : () => onIsolate!(on ? null : k),
                    child: Container(
                      constraints: const BoxConstraints(minHeight: 48),
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        spacing: 6,
                        children: [
                          Container(
                            width: 9,
                            height: 9,
                            decoration: BoxDecoration(color: col, shape: BoxShape.circle),
                          ),
                          Text(
                            colourNames[k]!.$1,
                            textDirection: TextDirection.rtl,
                            style: context.type.arabicLabel.copyWith(color: c.onSurface),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
      ],
    );
  }
}

/// The takes kept for this passage, newest first: Me, Model, then me, delete.
class _Takes extends StatelessWidget {
  const _Takes({required this.recs, required this.onMe, required this.onModelThenMe, required this.onDelete});
  final List<Recording> recs;
  final ValueChanged<Recording> onMe;
  final ValueChanged<Recording>? onModelThenMe;
  final ValueChanged<Recording> onDelete;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    String when(Recording r) => digits(DateFormat('d MMM, HH:mm', isAr ? 'ar' : 'en_GB').format(DateTime.parse(r.createdAt).toLocal()));
    return Fold(
      icon: Icons.library_music_outlined,
      title: t('Recordings · {n} · latest {time}', {'n': recs.length, 'time': _mmss(recs.first.durationMs)}),
      children: [
        for (final r in recs)
          Wrap(
            alignment: WrapAlignment.spaceBetween,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Text('${when(r)}$sep${_mmss(r.durationMs)}', style: ty.bodyMd.copyWith(color: c.onSurface)),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AppButton(
                    label: t('Me'),
                    semanticLabel: t('Play me, {when}', {'when': when(r)}),
                    icon: Icons.play_arrow,
                    variant: ButtonVariant.ghost,
                    size: ButtonSize.sm,
                    onPressed: () => onMe(r),
                  ),
                  AppButton(
                    label: t('Model, then me'),
                    semanticLabel: t('Model, then me, {when}', {'when': when(r)}),
                    variant: ButtonVariant.ghost,
                    size: ButtonSize.sm,
                    onPressed: onModelThenMe == null ? null : () => onModelThenMe!(r),
                  ),
                  AppIconButton(icon: Icons.delete_outline, label: t('Delete recording {when}', {'when': when(r)}), onPressed: () => onDelete(r)),
                ],
              ),
            ],
          ),
        Text(t('Keeps your last {n} for this passage. They stay on this device.', {'n': keepPerRange}), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
      ],
    );
  }
}

/// The pinned player (Controls.tsx AudioTransport): ayah pips, the status line, Next / Play / Prev, the chips.
class _Transport extends StatelessWidget {
  const _Transport({
    required this.state,
    required this.reciter,
    required this.phase,
    required this.loaded,
    required this.count,
    required this.from,
    required this.colours,
    required this.onPlay,
    required this.onPrev,
    required this.onNext,
    required this.onSeek,
    required this.onLoop,
    required this.onRate,
    required this.onGap,
    required this.onColours,
    required this.onSkipGap,
    required this.onRetry,
  });
  final PlayerState state;
  final Reciter reciter;
  final ComparePhase? phase;
  final bool loaded, colours;
  final int count;
  final VerseKey from;
  final VoidCallback onPlay, onPrev, onNext, onLoop, onRate, onGap, onColours, onSkipGap, onRetry;
  final ValueChanged<int> onSeek;

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type, s = state;
    final playing = s.busy || phase != null;
    final unavailable = !loaded
        ? t('Loading…')
        : s.status == PlayerStatus.offline
        ? t('Audio needs a connection. The text is here; recording still works.')
        : s.status == PlayerStatus.error
        ? t("Couldn't load the recitation.")
        : null;
    final label = verseRef(s.verseKey ?? from);
    final speaker = phase == ComparePhase.me || s.clip ? t('You') : reciter.nameAr;
    Widget chip(IconData icon, String text, bool on, VoidCallback tap) => AppChip(icon: icon, label: text, pressed: on, onTap: tap);
    Widget side(String text, IconData icon, String semantic, VoidCallback tap, {bool iconFirst = true}) => Semantics(
      button: true,
      label: semantic,
      excludeSemantics: true,
      child: InkWell(
        borderRadius: BorderRadius.circular(Radii.control),
        onTap: tap,
        child: ConstrainedBox(
          constraints: const BoxConstraints(minHeight: 48, minWidth: 64),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            spacing: 4,
            children: [
              if (iconFirst) Icon(icon, color: c.onSurfaceVariant),
              Text(text, style: ty.label.weight(600).copyWith(color: c.onSurfaceVariant)),
              if (!iconFirst) Icon(icon, color: c.onSurfaceVariant),
            ],
          ),
        ),
      ),
    );
    return GestureDetector(
      onTap: s.status == PlayerStatus.gap ? onSkipGap : null,
      child: Container(
        decoration: BoxDecoration(
          color: c.surfaceContainerLowest,
          border: Border(top: BorderSide(color: c.outlineVariant)),
          boxShadow: c.shadowBar,
        ),
        padding: EdgeInsets.fromLTRB(Space.gutter, Space.sm, Space.gutter, Space.sm + MediaQuery.paddingOf(context).bottom),
        child: Semantics(
          label: t('Recitation player'),
          container: true,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            spacing: Space.sm,
            children: [
              if (count > 1)
                Directionality(
                  textDirection: TextDirection.rtl,
                  child: Row(
                    spacing: 4,
                    children: [
                      for (var i = 0; i < count; i++)
                        Expanded(
                          child: Semantics(
                            button: true,
                            label: t('Ayah {n}', {'n': i + 1}),
                            selected: i == s.index,
                            child: GestureDetector(
                              behavior: HitTestBehavior.opaque,
                              onTap: () => onSeek(i),
                              child: SizedBox(
                                height: 20,
                                child: Center(
                                  child: Container(
                                    height: i == s.index ? 6 : 4,
                                    decoration: BoxDecoration(
                                      color: i <= s.index ? c.primary : c.surfaceContainerHighest,
                                      borderRadius: BorderRadius.circular(3),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              Semantics(
                liveRegion: true,
                child: unavailable != null
                    ? Text(
                        unavailable,
                        textAlign: TextAlign.center,
                        style: ty.bodyMd.copyWith(color: c.onSurfaceVariant),
                      )
                    : s.status == PlayerStatus.gap
                    ? Text(
                        '${t('Your turn')}${isAr ? '' : ' · \u0631\u062f\u0651\u062f'}$sep${t('{n}s', {'n': s.gapLeft})}',
                        style: ty.bodyMd.weight(600).copyWith(color: c.secondary),
                      )
                    : Text.rich(
                        TextSpan(
                          children: [
                            if (phase != ComparePhase.silence) ...[
                              TextSpan(text: speaker),
                              const WidgetSpan(alignment: PlaceholderAlignment.middle, child: Sep()),
                            ],
                            TextSpan(
                              text: label,
                              style: TextStyle(color: c.onSurface),
                            ),
                          ],
                        ),
                        textAlign: TextAlign.center,
                        style: ty.bodyMd.copyWith(color: c.onSurfaceVariant),
                      ),
              ),
              Directionality(
                textDirection: TextDirection.ltr,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  spacing: Space.lg,
                  children: [
                    side(t('Next'), Icons.arrow_back, t('Next ayah'), onNext),
                    Semantics(
                      button: true,
                      label: '${playing ? t('Pause') : t('Play')} $label',
                      excludeSemantics: true,
                      child: Opacity(
                        opacity: unavailable != null ? 0.5 : 1,
                        child: Material(
                          color: c.primaryFill,
                          shape: const CircleBorder(),
                          elevation: 2,
                          child: InkWell(
                            customBorder: const CircleBorder(),
                            onTap: unavailable != null ? null : onPlay,
                            child: SizedBox(width: 64, height: 64, child: Icon(playing ? Icons.pause : Icons.play_arrow, size: 32, color: c.onPrimary)),
                          ),
                        ),
                      ),
                    ),
                    side(t('Prev'), Icons.arrow_forward, t('Previous ayah'), onPrev, iconFirst: false),
                  ],
                ),
              ),
              Wrap(
                alignment: WrapAlignment.center,
                spacing: Space.sm,
                runSpacing: Space.sm,
                children: [
                  chip(Icons.repeat, '${t('Loop')} ${digits('×${s.loops}')}', s.loops > 1, onLoop),
                  chip(Icons.speed_outlined, t('Slower'), s.rate != 1, onRate),
                  chip(Icons.hourglass_empty, '${t('Gap')} ${s.gap is GapOff ? t('off') : t('on')}', s.gap is! GapOff, onGap),
                  chip(Icons.palette_outlined, '${t('Colours')} ${colours ? t('on') : t('off')}', colours, onColours),
                ],
              ),
              if (s.status == PlayerStatus.gap || s.status == PlayerStatus.error || s.status == PlayerStatus.offline)
                s.status == PlayerStatus.gap
                    ? AppButton(label: t('Skip the pause'), icon: Icons.skip_next, variant: ButtonVariant.ghost, onPressed: onSkipGap)
                    : AppButton(label: t('Try again'), icon: Icons.refresh, variant: ButtonVariant.secondary, onPressed: onRetry),
            ],
          ),
        ),
      ),
    );
  }
}
