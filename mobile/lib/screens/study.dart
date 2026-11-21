// Shared by the lesson, the unit finale and onboarding: port of src/screens/study/verse.tsx (verse loading, one player
// per screen, the example card), helpers.ts (references) and Recorder.tsx (RowCard, PassageRecite).
import 'dart:async';

import 'package:flutter/material.dart';

import '../app/services.dart';
import '../app/shell.dart';
import '../audio/compare.dart';
import '../audio/player.dart';
import '../audio/recorder_view.dart';
import '../content/content.dart';
import '../core/types.dart' hide Passage;
import '../i18n/i18n.dart';
import '../quran/quran.dart';
import '../quran/verse.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'listen.dart';

(int, int) _parse(VerseKey k) {
  final [s, a] = k.split(':').map(int.parse).toList();
  return (s, a);
}

/// 'الضحى ٥' (design B4: never 93:5 on screen).
String verseRef(VerseKey k) {
  final (s, a) = _parse(k);
  return '${content.surahName(s)} ${arDigits(a)}';
}

/// 'الضحى ١–١١', or two refs joined across surahs.
String rangeRef(VerseKey from, VerseKey to) {
  if (from == to) return verseRef(from);
  final (s1, a1) = _parse(from);
  final (s2, a2) = _parse(to);
  return s1 == s2 ? '${content.surahName(s1)} ${arDigits(a1)}\u2013${arDigits(a2)}' : '${verseRef(from)} \u2013 ${verseRef(to)}';
}

/* ---------------- loading ---------------- */

/// Loads ayahs once per key (the web's useVerse / useVerses); [builder] gets null while loading, `failed` when it can't.
class VersesOf extends StatefulWidget {
  const VersesOf({super.key, required this.from, VerseKey? to, required this.builder}) : to = to ?? from;
  final VerseKey from, to;
  final Widget Function(BuildContext context, List<Verse>? verses, bool failed) builder;
  @override
  State<VersesOf> createState() => _VersesOfState();
}

class _VersesOfState extends State<VersesOf> {
  List<Verse>? _vs;
  bool _failed = false;
  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void didUpdateWidget(VersesOf old) {
    super.didUpdateWidget(old);
    if (old.from != widget.from || old.to != widget.to) {
      _vs = null;
      _failed = false;
      _load();
    }
  }

  Future<void> _load() async {
    final key = (widget.from, widget.to);
    try {
      final vs = await getRange(widget.from, widget.to);
      if (mounted && key == (widget.from, widget.to)) setState(() => _vs = vs);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  Widget build(BuildContext context) => widget.builder(context, _vs, _failed);
}

/* ---------------- audio ---------------- */

/// One player per screen (useStudyAudio): a whole ayah, an example's words as a slice, a passage; Slower and Loop are
/// per screen. `owner` is the control that started the current playback (its button shows Stop).
class StudyAudio extends ChangeNotifier {
  StudyAudio() : player = newPlayer() {
    player.addListener(notifyListeners);
  }
  final Player player;
  Object? owner;
  bool loop = false;
  int _gen = 0; // bumped by every play and stop: a stale `then` or loop never fires

  Reciter get reciter => player.reciter ?? learnerReciter;
  PlayerState get state => player.state;
  bool get busy => state.status == PlayerStatus.playing || state.status == PlayerStatus.loading;
  bool get offline => state.status == PlayerStatus.offline;
  bool get slow => state.rate == 0.75;
  void setSlow(bool on) => player.setRate(on ? 0.75 : 1);
  void setLoop(bool on) {
    loop = on;
    player.setLoops(on ? 1 << 30 : 1);
    notifyListeners();
  }

  void ayah(Verse v) {
    _gen++;
    player.load([v], learnerReciter, skipBasmala: true);
    player.play();
  }

  /// Fires [done] once the player settles (true: it finished, false: error or offline).
  void _whenIdle(int g, void Function(bool ok) done) {
    void l() {
      final s = player.state.status;
      if (s != PlayerStatus.idle && s != PlayerStatus.error && s != PlayerStatus.offline) return;
      player.removeListener(l);
      if (g == _gen) done(s == PlayerStatus.idle);
    }

    player.addListener(l);
  }

  /// Just the example's words (never the whole ayah when timings exist); [then] once they first finish; with Loop on
  /// they replay after a short breath until stopped.
  void example(Verse v, Example ex, {VoidCallback? then, bool once = false}) {
    final g = ++_gen;
    void run() {
      player.load([v], learnerReciter, skipBasmala: true);
      player.playWords(v, ex.wordFrom, ex.wordTo);
      _whenIdle(g, (ok) {
        if (!ok) return;
        then?.call();
        then = null;
        if (!once && loop) Timer(const Duration(milliseconds: 700), () => g == _gen && loop ? run() : null);
      });
    }

    run();
  }

  void exampleThen(Verse v, Example ex, VoidCallback then) => example(v, ex, then: then, once: true);

  /// A whole passage (basmala as the player decides); Loop repeats it.
  void passage(List<Verse> vs) {
    _gen++;
    player.load(vs, learnerReciter);
    player.setLoops(loop ? 1 << 30 : 1);
    player.play();
  }

  void stop() {
    _gen++;
    player.stop();
  }

  @override
  void dispose() {
    player.removeListener(notifyListeners);
    player.dispose();
    super.dispose();
  }
}

/// ▶ with a word ([text]) or the round icon named by [label]; Stop while its own playback runs. Offline it says so.
class PlayButton extends StatefulWidget {
  const PlayButton({super.key, required this.audio, required this.label, this.onTap, this.text});
  final StudyAudio audio;
  final String label;
  final VoidCallback? onTap;
  final String? text;
  @override
  State<PlayButton> createState() => _PlayButtonState();
}

class _PlayButtonState extends State<PlayButton> {
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: widget.audio,
    builder: (context, _) {
      final a = widget.audio, c = context.c;
      if (a.offline) return Text(t('Audio needs a connection'), style: context.type.caption.copyWith(color: c.onSurfaceVariant));
      final playing = a.busy && a.owner == this;
      void tap() {
        if (playing) return a.stop();
        a.owner = this;
        widget.onTap?.call();
      }

      if (widget.text != null) {
        return AppButton(
          label: playing ? t('Stop') : widget.text!,
          icon: playing ? Icons.pause : Icons.play_arrow,
          variant: ButtonVariant.secondary,
          onPressed: widget.onTap == null ? null : tap,
        );
      }
      return Semantics(
        button: true,
        label: playing ? t('Stop {x}', {'x': widget.label}) : t('Play {x}', {'x': widget.label}),
        excludeSemantics: true,
        child: Material(
          color: c.primaryContainer,
          borderRadius: BorderRadius.circular(Radii.control),
          child: InkWell(
            borderRadius: BorderRadius.circular(Radii.control),
            onTap: widget.onTap == null ? null : tap,
            child: SizedBox(width: 48, height: 48, child: Icon(playing ? Icons.pause : Icons.play_arrow, color: c.onPrimaryContainer)),
          ),
        ),
      );
    },
  );
}

/// Slower (0.75×) and Loop toggles.
class PlayOptions extends StatelessWidget {
  const PlayOptions({super.key, required this.audio});
  final StudyAudio audio;
  @override
  Widget build(BuildContext context) => ListenableBuilder(
    listenable: audio,
    builder: (context, _) => audio.offline
        ? const SizedBox.shrink()
        : Wrap(
            spacing: Space.sm,
            runSpacing: Space.sm,
            children: [
              AppChip(icon: Icons.speed_outlined, label: t('Slower'), pressed: audio.slow, onTap: () => audio.setSlow(!audio.slow)),
              AppChip(icon: Icons.repeat, label: t('Loop'), pressed: audio.loop, onTap: () => audio.setLoop(!audio.loop)),
            ],
          ),
  );
}

/* ---------------- the example ---------------- */

/// The example's ayah from the real text, the focus highlighted, never tajweed colours. [spanOnly]: just the
/// example's words. Until the ayah loads (or offline) the example's own words.
class ExampleVerse extends StatelessWidget {
  const ExampleVerse({super.key, required this.ex, this.verse, this.spanOnly = false, this.size = VerseSize.inline, this.reference, this.actions = const []});
  final Example ex;
  final Verse? verse;
  final bool spanOnly;
  final VerseSize size;
  final bool? reference;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final v = verse;
    final ref = (reference ?? !spanOnly) ? verseRef(ex.verseKey) : null;
    if (v == null) {
      final words = ex.text.split(' ');
      return VerseBlock(
        ayah: QAyah(key: ex.verseKey, words: words),
        focus: (1, words.length),
        focusText: ex.focus,
        size: size,
        reference: ref,
        stopping: ex.stopping,
        tajweed: false,
        actions: actions,
      );
    }
    if (spanOnly) {
      final words = v.words.sublist(ex.wordFrom - 1, ex.wordTo);
      final pauses = [
        for (final m in v.marks)
          if (m.after >= ex.wordFrom && m.after <= ex.wordTo) (after: m.after - ex.wordFrom + 1, mark: m.mark),
      ];
      return VerseBlock(
        ayah: QAyah(key: ex.verseKey, words: words, pauses: pauses),
        focus: (1, words.length),
        focusText: ex.focus,
        size: size,
        tajweed: false,
        reference: ref,
        stopping: ex.stopping,
        actions: actions,
      );
    }
    return VerseBlock(
      ayah: QAyah.of(v),
      wholeAyah: true,
      focus: (ex.wordFrom, ex.wordTo),
      focusText: ex.focus,
      tajweed: false,
      size: size,
      reference: ref,
      stopping: ex.stopping,
      actions: actions,
    );
  }
}

/// ExStepper state shared by Hear, Say and the Recite fallback: one card at a time, fixed order (useStepper).
class ExStepper {
  ExStepper(this.n);
  final int n;
  int at = 0, reached = 0;
  final _played = <int>{};
  bool get last => at >= n - 1;
  bool played(int i) => _played.contains(i);
  bool get allPlayed => _played.length >= n;
  void markPlayed(int i) => _played.add(i);
  void go(int i) {
    at = i;
    if (i > reached) reached = i;
  }
}

/// One example (docs/10 §4.1): eyebrow, reference, the words with the focus, the note, the audio row, the whole ayah
/// on request. [hidden] hides the words (Notice, by ear); [children] go under it.
class ExampleCard extends StatefulWidget {
  const ExampleCard({
    super.key,
    required this.ex,
    required this.audio,
    required this.played,
    required this.onPlayed,
    this.eyebrow,
    this.hidden = false,
    this.stepper,
    this.onGo,
    this.goForward = false,
    this.children = const [],
    this.flat = false,
  });
  final Example ex;
  final StudyAudio audio;
  final bool played;
  final VoidCallback onPlayed;
  final String? eyebrow;
  final bool hidden;
  final ExStepper? stepper;
  final ValueChanged<int>? onGo;
  final bool goForward; // every example open (Recite fallback): forward too
  final List<Widget> children;
  final bool flat;
  @override
  State<ExampleCard> createState() => _ExampleCardState();
}

class _ExampleCardState extends State<ExampleCard> {
  bool _whole = false;

  @override
  Widget build(BuildContext context) => VersesOf(
    from: widget.ex.verseKey,
    builder: (context, vs, failed) => ListenableBuilder(listenable: widget.audio, builder: (context, _) => _card(context, vs?.firstOrNull, failed)),
  );

  Widget _card(BuildContext context, Verse? v, bool failed) {
    final ex = widget.ex, a = widget.audio, c = context.c, ty = context.type;
    final noAudio = a.offline || failed || a.state.status == PlayerStatus.error;
    final hide = widget.hidden && !noAudio;
    if (noAudio && !widget.played) WidgetsBinding.instance.addPostFrameCallback((_) => widget.onPlayed());
    final sp = widget.stepper;
    void go(int i) {
      if (widget.goForward || (i <= sp!.reached && i != sp.at)) {
        a.stop();
        widget.onGo?.call(i);
      }
    }

    final playing = a.busy && a.owner == this;
    return ExampleFrame(
      index: sp?.at ?? 0,
      total: sp?.n ?? 1,
      eyebrow: widget.eyebrow,
      reference: hide ? null : verseRef(ex.verseKey),
      onPrev: sp != null && sp.at > 0 ? () => go(sp.at - 1) : null,
      onNext: sp != null && (widget.goForward ? !sp.last : sp.at < sp.reached) ? () => go(sp.at + 1) : null,
      onPick: sp == null ? null : go,
      reached: sp == null ? null : (widget.goForward ? sp.n - 1 : sp.reached),
      played: sp?.played,
      flat: widget.flat,
      controls: [
        if (noAudio)
          Callout(icon: Icons.wifi_off, child: Text(t('Audio needs a connection. Read it aloud instead.')))
        else
          AudioControls(
            playing: playing,
            played: widget.played,
            onPlay: v == null
                ? null
                : () {
                    if (playing) return a.stop();
                    a.owner = this;
                    a.example(v, ex, then: widget.onPlayed);
                  },
            slow: a.slow,
            onSlow: () => a.setSlow(!a.slow),
            loop: a.loop,
            onLoop: () => a.setLoop(!a.loop),
          ),
        if (!hide && v != null)
          Column(
            spacing: Space.sm,
            children: [
              AppButton(
                label: _whole ? t('Hide the whole ayah') : t('Show the whole ayah'),
                icon: _whole ? Icons.expand_less : Icons.expand_more,
                variant: ButtonVariant.tertiary,
                size: ButtonSize.sm,
                onPressed: () => setState(() => _whole = !_whole),
              ),
              if (_whole)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: Space.md),
                  decoration: BoxDecoration(color: c.surfaceContainerLow, borderRadius: BorderRadius.circular(Radii.control)),
                  child: ExampleVerse(ex: ex, verse: v, size: VerseSize.read),
                ),
            ],
          ),
        ...widget.children,
      ],
      child: hide
          ? Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(color: c.surfaceContainer, shape: BoxShape.circle),
              child: Icon(Icons.hearing, size: 36, color: c.onSurfaceVariant),
            )
          : Column(
              children: [
                ExampleVerse(ex: ex, verse: v, spanOnly: true, size: VerseSize.focus, reference: false),
                if (ex.note != null && ex.note!.isNotEmpty)
                  Tx(
                    ex.note!,
                    textAlign: TextAlign.center,
                    style: ty.bodyMd.copyWith(color: c.onSurfaceVariant),
                  ),
              ],
            ),
    );
  }
}

/* ---------------- recite ---------------- */

/// A numbered sub-card (Say and Recite rows): number, title, optional status at the end.
class RowCard extends StatelessWidget {
  const RowCard({super.key, required this.n, required this.title, this.status, required this.children});
  final int n;
  final String title;
  final Widget? status;
  final List<Widget> children;
  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    return Panel(
      children: [
        Row(
          spacing: Space.sm,
          children: [
            Container(
              width: 28,
              height: 28,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: c.surfaceContainer, shape: BoxShape.circle),
              child: Text(digits(n), style: ty.label.weight(700).copyWith(color: c.primary, height: 1)),
            ),
            Expanded(
              child: Text(title, style: ty.bodyLg.weight(600).copyWith(color: c.onSurface)),
            ),
            ?status,
          ],
        ),
        ...children,
      ],
    );
  }
}

/// The recorder for a range, laid out as the web's numbered cards: [record] then [compare] (or the hint).
Widget recorderCards({
  required String from,
  String? to,
  required StudyAudio audio,
  required int recordN,
  int? compareN,
  bool hideCompareUntilTake = false,
  VoidCallback? reciter,
  void Function(String path)? model,
  ValueChanged<String>? onStatus,
  bool privateInRecord = true,
  Key? key,
}) => RecorderView(
  key: key,
  from: from,
  to: to,
  player: audio.player,
  recordings: recordings,
  reciter: reciter,
  model: model,
  onSaved: store.noteRecording,
  onStatus: onStatus,
  layout: (context, record, compare, private) {
    final c = context.c;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: Space.lg,
      children: [
        RowCard(
          n: recordN,
          title: t('Record yourself'),
          status: hideCompareUntilTake && compare != null ? AppChip(tone: ChipTone.success, icon: Icons.check_circle, fill: true, label: t('Recorded')) : null,
          children: [record, private],
        ),
        if (compare != null || !hideCompareUntilTake)
          RowCard(
            n: compareN ?? recordN + 1,
            title: t('Compare'),
            children: [compare ?? Text(t('Record first, then compare.'), style: context.type.bodyMd.copyWith(color: c.onSurfaceVariant))],
          ),
      ],
    );
  },
);

/// A passage to recite (lesson Recite, unit finale): the text, 1 Listen, 2 Record, 3 Compare, then [doneLabel].
/// [onReady] once listening finished or a take exists (or neither is possible).
class PassageRecite extends StatelessWidget {
  const PassageRecite({super.key, required this.from, required this.to, required this.audio, this.doneLabel, this.onDone, this.onReady});
  final VerseKey from, to;
  final StudyAudio audio;
  final String? doneLabel;
  final VoidCallback? onDone, onReady;

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    return VersesOf(
      from: from,
      to: to,
      builder: (context, verses, failed) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        spacing: Space.md,
        children: [
          if (onReady == null)
            Tx(t('Recite {x}. Listen first, then recite it yourself and record.', {'x': rangeRef(from, to)}), style: ty.bodyLg.copyWith(color: c.onSurface)),
          Container(
            padding: const EdgeInsets.all(Space.md),
            decoration: BoxDecoration(
              color: c.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(Radii.card),
              border: Border.all(color: c.outlineVariant),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  spacing: 6,
                  children: [
                    Icon(Icons.bookmark_outline, size: 16, color: c.secondary),
                    Text(rangeRef(from, to), style: ty.label.weight(600).copyWith(color: c.secondary)),
                  ],
                ),
                if (failed) Text(t('The text needs a connection the first time it is opened.'), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
                if (verses == null && !failed) ...[for (var i = 0; i < 3; i++) const Padding(padding: EdgeInsets.only(top: 12), child: Skeleton())],
                if (verses != null) Passage(ayahs: [for (final v in verses) QAyah.of(v)], size: VerseSize.read),
              ],
            ),
          ),
          ListenableBuilder(
            listenable: audio,
            builder: (context, _) => RowCard(
              n: 1,
              title: t('Listen to the reciter'),
              children: [
                if (audio.offline)
                  Text(t('Audio needs a connection. Read it aloud instead.'), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant))
                else
                  Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: AppButton(
                      label: audio.busy ? t('Stop') : t('Listen'),
                      icon: audio.busy ? Icons.pause : Icons.play_arrow,
                      variant: ButtonVariant.secondary,
                      onPressed: verses == null
                          ? null
                          : () {
                              if (audio.busy) return audio.stop();
                              audio.passage(verses);
                              audio.player.whenDone().then((ok) => ok ? onReady?.call() : null);
                            },
                    ),
                  ),
                Align(
                  alignment: AlignmentDirectional.centerStart,
                  child: AppButton(
                    label: t('Open in the player'),
                    iconEnd: Icons.chevron_right,
                    variant: ButtonVariant.tertiary,
                    onPressed: () {
                      audio.stop();
                      go(context, listenPath(from, to));
                    },
                  ),
                ),
                PlayOptions(audio: audio),
              ],
            ),
          ),
          recorderCards(
            from: from,
            to: to,
            audio: audio,
            recordN: 2,
            reciter: verses == null || audio.offline ? null : () => audio.passage(verses),
            model: verses == null
                ? null
                : (path) {
                    audio.player.load(verses, audio.reciter);
                    playModelThenMe(audio.player, path);
                  },
            onStatus: (s) => s == 'saved' || audio.offline ? onReady?.call() : null,
          ),
          if (onDone != null) AppButton(label: doneLabel ?? '', size: ButtonSize.lg, block: true, onPressed: onDone),
        ],
      ),
    );
  }
}
