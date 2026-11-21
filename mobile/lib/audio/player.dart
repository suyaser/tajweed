// Port of src/audio/player.ts: a queue of ayahs for one reciter, the basmala before a surah's first ayah, word clips,
// the word lamp, loop / repeat gap / rate, errors and the offline state. One Player per screen, listened to like the
// web's subscribe(). The audio itself goes through [AudioOut] (just_audio in the app, a fake in tests).
import 'dart:async';
import 'dart:io';
import 'dart:math';

import 'package:audio_session/audio_session.dart';
import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';

import '../core/types.dart';
import '../i18n/i18n.dart';
import '../quran/quran.dart';

/// [firstWord, endWord, startMs, endMs]: words 0-based into Verse.words, endWord exclusive (one segment can cover two).
typedef Seg = List<int>;

const padBefore = Duration(milliseconds: 80); // quran-align error is < 73 ms on average
const padAfter = Duration(milliseconds: 120);

/// Segment being spoken at `ms`. Between two adjacent words the previous one stays lit; if an untimed word sits in the
/// gap, or before the first / after the last segment: -1.
int segAt(List<Seg> segs, num ms) {
  var lo = 0, hi = segs.length - 1, i = -1;
  while (lo <= hi) {
    final mid = (lo + hi) >> 1;
    if (segs[mid][2] <= ms) {
      i = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  if (i < 0 || ms <= segs[i][3]) return i;
  final next = i + 1 < segs.length ? segs[i + 1] : null;
  return next != null && next[0] == segs[i][1] ? i : -1;
}

/// The bundled 1-based inclusive timings, 0-based end-exclusive for the player.
List<Seg>? segsOf(Verse? v, String reciterId) => v?.timings(reciterId)?.map((t) => [t[0] - 1, t[1], t[2], t[3]]).toList();

Seg? segForWord(List<Seg>? segs, int w) => segs?.where((s) => s[0] <= w && w < s[1]).firstOrNull;

/// everyayah ayah file: `{folder}/SSSAAA.mp3` (src/audio/urls.ts).
String ayahUrl(String folder, VerseKey k) {
  final [s, a] = k.split(':');
  return 'https://everyayah.com/data/$folder/${s.padLeft(3, '0')}${a.padLeft(3, '0')}.mp3';
}

enum PlayerStatus { idle, loading, playing, paused, gap, error, offline }

/// Repeat gap: off, the ayah's own length + 1 s, or fixed seconds.
sealed class Gap {
  const Gap();
}

class GapOff extends Gap {
  const GapOff();
}

class GapSame extends Gap {
  const GapSame();
}

class GapSeconds extends Gap {
  const GapSeconds(this.s);
  final int s;
}

@immutable
class PlayerState {
  const PlayerState({
    this.status = PlayerStatus.idle,
    this.index = 0,
    this.verseKey,
    this.word,
    this.loop = 1,
    this.loops = 1,
    this.gap = const GapOff(),
    this.gapLeft = 0,
    this.gapTotal = 0,
    this.rate = 1,
    this.hasTimings = false,
    this.error,
    this.clip = false,
    this.basmala = false,
  });
  final PlayerStatus status;
  final int index; // current ayah in the queue
  final VerseKey? verseKey;
  final (int, int)? word; // lit words, 0-based, end exclusive
  final int loop, loops; // pass (1-based); passes to play (a big number = forever)
  final Gap gap;
  final int gapLeft, gapTotal; // whole seconds
  final double rate; // 0.75 | 1
  final bool hasTimings;
  final String? error;
  final bool clip; // playing a recording, not the reciter
  final bool basmala; // playing 1:1 before ayah 1: no lamp

  bool get busy => status == PlayerStatus.playing || status == PlayerStatus.loading || status == PlayerStatus.gap;

  PlayerState copy({
    PlayerStatus? status, int? index, Object? verseKey = _keep, Object? word = _keep, int? loop, int? loops, Gap? gap, //
    int? gapLeft, int? gapTotal, double? rate, bool? hasTimings, Object? error = _keep, bool? clip, bool? basmala,
  }) => PlayerState(
    status: status ?? this.status, index: index ?? this.index,
    verseKey: verseKey == _keep ? this.verseKey : verseKey as VerseKey?, word: word == _keep ? this.word : word as (int, int)?,
    loop: loop ?? this.loop, loops: loops ?? this.loops, gap: gap ?? this.gap, gapLeft: gapLeft ?? this.gapLeft,
    gapTotal: gapTotal ?? this.gapTotal, rate: rate ?? this.rate, hasTimings: hasTimings ?? this.hasTimings,
    error: error == _keep ? this.error : error as String?, clip: clip ?? this.clip, basmala: basmala ?? this.basmala,
  );
}

const _keep = Object();

enum AudioEvent { playing, buffering, ended, error }

/// What the player needs from an audio engine.
abstract class AudioOut {
  /// Loads `uri`, clipped to [start, end) when given (positions are then clip-relative). Throws when it can't load.
  Future<void> open(Uri uri, {Duration? start, Duration? end});
  void play();
  void pause();
  Future<void> setSpeed(double rate);
  Duration get position;
  Duration? get duration;
  Stream<AudioEvent> get events;
  Future<void> dispose();
}

/// iOS: the `playback` category (the silent switch doesn't mute recitation); Android: speech attributes, focus.
Future<void> configurePlaybackSession() async =>
    (await AudioSession.instance).configure(const AudioSessionConfiguration.speech());

class JustAudioOut implements AudioOut {
  JustAudioOut() {
    _p.playerStateStream.listen((s) {
      if (_loads > 0) return; // the old source's states (a stale `completed`) while the new one loads
      final e = switch (s.processingState) {
        ProcessingState.completed => _started ? AudioEvent.ended : null,
        ProcessingState.loading || ProcessingState.buffering => s.playing ? AudioEvent.buffering : null,
        ProcessingState.ready => s.playing ? AudioEvent.playing : null,
        ProcessingState.idle => null,
      };
      if (e == AudioEvent.playing) _started = true;
      if (e != null && e != _last) _events.add(e);
      _last = e;
    });
    _p.playbackEventStream.listen(null, onError: (Object e) {
      if (_loads == 0 && e is! PlayerInterruptedException) _events.add(AudioEvent.error);
    });
  }
  final _p = AudioPlayer();
  final _events = StreamController<AudioEvent>.broadcast();
  AudioEvent? _last;
  int _loads = 0; // opens in flight (a newer open interrupts an older one)
  bool _started = false;

  @override
  Future<void> open(Uri uri, {Duration? start, Duration? end}) async {
    _loads++;
    _last = null;
    _started = false;
    try {
      await _p.stop();
      final src = AudioSource.uri(uri);
      await _p.setAudioSource(start == null && end == null ? src : ClippingAudioSource(child: src, start: start, end: end));
    } finally {
      _loads--;
    }
  }

  @override
  void play() => unawaited(_p.play().catchError((Object _) => _events.add(AudioEvent.error)));
  @override
  void pause() => unawaited(_p.pause());
  @override
  Future<void> setSpeed(double rate) => _p.setSpeed(rate);
  @override
  Duration get position => _p.position;
  @override
  Duration? get duration => _p.duration;
  @override
  Stream<AudioEvent> get events => _events.stream;
  @override
  Future<void> dispose() async {
    await _events.close();
    await _p.dispose();
  }
}

/// Where an ayah's audio comes from: a downloaded file when there is one (F10), else the network.
typedef AyahSource = Future<Uri> Function(Reciter r, VerseKey k);
Future<Uri> networkSource(Reciter r, VerseKey k) async => Uri.parse(ayahUrl(r.folder, k));

/// A connection check for the error message: DNS for the audio host.
Future<bool> isOnline() async {
  try {
    return (await InternetAddress.lookup('everyayah.com').timeout(const Duration(seconds: 3))).isNotEmpty;
  } catch (_) {
    return false;
  }
}

class Player extends ChangeNotifier {
  Player({AudioOut? out, this.source = networkSource, this.online = isOnline}) : _out = out ?? JustAudioOut() {
    _sub = _out.events.listen(_on);
  }
  final AudioOut _out;
  AyahSource source;
  final Future<bool> Function() online;
  late final StreamSubscription<AudioEvent> _sub;

  PlayerState state = const PlayerState();
  List<Verse> _verses = [];
  Reciter? _reciter;
  bool _skipBasmala = false, _slice = false, _resumeAdvances = false, _opened = false;
  int _gen = 0; // bumps on every new start: late results of an older one are dropped
  Timer? _gapTimer, _ticker;
  Verse? _segsFor;
  List<Seg>? _segs;
  var _waiters = <Completer<bool>>[];

  void _set(PlayerState s) {
    state = s;
    notifyListeners();
  }

  List<Verse> get verses => _verses;
  Reciter? get reciter => _reciter;

  /// `skipBasmala`: don't play 1:1 before ayah 1 of a surah (an ayah heard on its own as an example).
  void load(List<Verse> verses, Reciter reciter, {bool skipBasmala = false}) {
    stop();
    _verses = verses;
    _reciter = reciter;
    _skipBasmala = skipBasmala;
    _set(state.copy(
      verseKey: verses.firstOrNull?.verseKey,
      hasTimings: reciter.hasTimings && verses.any((v) => v.timings(reciter.id)?.isNotEmpty ?? false),
    ));
  }

  /// Resumes, retries after an error or offline, skips a gap, or starts the queue.
  void play() {
    final s = state.status;
    if (s == PlayerStatus.playing || s == PlayerStatus.loading) return;
    if (s == PlayerStatus.gap) return skipGap();
    if (s == PlayerStatus.paused && _resumeAdvances) {
      _resumeAdvances = false;
      return _advance();
    }
    if (s == PlayerStatus.paused && _opened) {
      _set(state.copy(status: PlayerStatus.loading));
      _out.play();
      return;
    }
    _start();
  }

  void pause() {
    if (state.status == PlayerStatus.gap) {
      _clearGap();
      _resumeAdvances = true;
    }
    _out.pause();
    _ticker?.cancel();
    if (state.status != PlayerStatus.idle) _set(state.copy(status: PlayerStatus.paused, word: null));
  }

  void toggle() => state.busy ? pause() : play();

  void stop() {
    _gen++;
    _clearGap();
    _ticker?.cancel();
    _out.pause();
    _slice = _resumeAdvances = _opened = false;
    _set(state.copy(
      status: PlayerStatus.idle, index: 0, verseKey: _verses.firstOrNull?.verseKey, word: null, loop: 1, error: null,
      clip: false, basmala: false,
    ));
    _settle(false);
  }

  /// Jump to ayah `i` (an ayah-end tap). Keeps playing if it was.
  void seek(int i) {
    if (_verses.isEmpty) return;
    i = i.clamp(0, _verses.length - 1);
    final was = state.busy;
    _clearGap();
    _resumeAdvances = false;
    _set(state.copy(index: i, verseKey: _verses[i].verseKey, word: null));
    if (was) {
      _start();
    } else {
      _gen++;
      _out.pause();
      _opened = false;
      _set(state.copy(status: PlayerStatus.idle));
    }
  }

  void next() => seek(state.index + 1);
  void prev() => seek(state.index - 1);
  void skipGap() {
    if (state.status != PlayerStatus.gap) return;
    _clearGap();
    _advance();
  }

  void setRate(double rate) {
    unawaited(_out.setSpeed(rate));
    _set(state.copy(rate: rate));
  }

  void setLoops(int loops) => _set(state.copy(loops: loops));
  void setGap(Gap gap) => _set(state.copy(gap: gap));

  /// Words fromWord..toWord (1-based inclusive) as one clip of the ayah file, lit as a whole. From the ayah's first
  /// word it starts at 0 (the first word's timing can start after the voice does). Either end untimed: the whole ayah.
  /// Never preceded by the basmala.
  void playWords(Verse verse, int fromWord, int toWord) {
    final r = _reciter;
    if (r == null) return;
    var i = _verses.indexWhere((v) => v.verseKey == verse.verseKey);
    if (i < 0) {
      load([verse], r, skipBasmala: _skipBasmala);
      i = 0;
    }
    final segs = segsOf(verse, r.id);
    final a = segForWord(segs, fromWord - 1), b = segForWord(segs, toWord - 1);
    final timed = a != null && b != null && a[2] <= b[3];
    _clearGap();
    _resumeAdvances = false;
    _set(state.copy(index: i, verseKey: verse.verseKey));
    _start(
      withBasmala: false,
      slice: true,
      start: timed && fromWord > 1 ? Duration(milliseconds: max(0, a[2] - padBefore.inMilliseconds)) : null,
      end: timed ? Duration(milliseconds: b[3]) + padAfter : null,
      word: timed ? (a[0], b[1]) : null,
    );
  }

  void playWord(Verse verse, int wordIdx) => playWords(verse, wordIdx + 1, wordIdx + 1);

  /// Plays a file (a recording). Resolves true when it ends.
  Future<bool> playFile(String path) {
    stop();
    final g = ++_gen;
    _set(state.copy(status: PlayerStatus.loading, clip: true, word: null, basmala: false));
    final done = whenDone();
    _open(g, Uri.file(path), rate: 1);
    return done;
  }

  /// Resolves true when the queue (all loops) or a file finishes, false on stop or error.
  Future<bool> whenDone() {
    final c = Completer<bool>();
    _waiters.add(c);
    return c.future;
  }

  @override
  void dispose() {
    stop();
    _sub.cancel();
    _out.dispose();
    super.dispose();
  }

  void _settle(bool ok) {
    final w = _waiters;
    _waiters = [];
    for (final c in w) {
      c.complete(ok);
    }
  }

  Future<void> _open(int g, Uri uri, {Duration? start, Duration? end, required double rate}) async {
    try {
      await _out.open(uri, start: start, end: end);
      if (g != _gen) return;
      _opened = true;
      await _out.setSpeed(rate);
      if (g != _gen) return;
      _out.play();
    } catch (_) {
      if (g == _gen) await _fail();
    }
  }

  /// Start the current ayah; first the basmala when it opens a surah (unless a slice or skipBasmala).
  void _start({bool withBasmala = true, bool slice = false, Duration? start, Duration? end, (int, int)? word}) {
    final v = _verses.elementAtOrNull(state.index), r = _reciter;
    if (v == null || r == null) return;
    final g = ++_gen;
    _ticker?.cancel();
    final basmala = withBasmala && !_skipBasmala && needsBasmala(v.verseKey);
    _slice = slice;
    _set(state.copy(
      status: PlayerStatus.loading, verseKey: v.verseKey, word: word, error: null, gapLeft: 0, clip: false, basmala: basmala,
    ));
    // a clip that starts at 0 and runs to the end is the whole file: no clipping source
    source(r, basmala ? '1:1' : v.verseKey).then((uri) {
      if (g == _gen) _open(g, uri, start: start, end: end, rate: state.rate);
    });
  }

  Future<void> _fail() async {
    final g = _gen;
    _clearGap();
    _ticker?.cancel();
    _slice = _opened = false;
    final off = !await online();
    if (g != _gen) return;
    _set(state.copy(
      status: off ? PlayerStatus.offline : PlayerStatus.error, word: null, clip: false, basmala: false,
      error: off ? t('Audio needs a connection.') : t("Couldn't load the recitation."),
    ));
    _settle(false);
  }

  void _on(AudioEvent e) {
    switch (e) {
      case AudioEvent.playing:
        if (state.status == PlayerStatus.loading) {
          _set(state.copy(status: PlayerStatus.playing, error: null));
          _tick();
        }
      case AudioEvent.buffering:
        if (state.status == PlayerStatus.playing) _set(state.copy(status: PlayerStatus.loading));
      case AudioEvent.ended:
        if (state.status == PlayerStatus.playing || state.status == PlayerStatus.loading) _ended();
      case AudioEvent.error:
        if (state.status != PlayerStatus.idle) _fail();
    }
  }

  void _ended() {
    _ticker?.cancel();
    if (state.clip) {
      _set(state.copy(status: PlayerStatus.idle, clip: false));
      return _settle(true);
    }
    if (state.basmala) return _start(withBasmala: false);
    if (_slice) {
      _slice = false;
      return _set(state.copy(status: PlayerStatus.idle, word: null));
    }
    final dur = _out.duration?.inMilliseconds ?? 0;
    final ms = switch (state.gap) {
      GapOff() => 0,
      GapSame() => (dur / state.rate + 1000).round(),
      GapSeconds(:final s) => s * 1000,
    };
    _set(state.copy(word: null));
    ms > 0 ? _startGap(ms) : _advance();
  }

  void _startGap(int ms) {
    var left = ms;
    int secs() => max(0, (left / 1000).ceil());
    _set(state.copy(status: PlayerStatus.gap, gapTotal: (ms / 1000).ceil(), gapLeft: secs()));
    _gapTimer = Timer.periodic(const Duration(milliseconds: 100), (_) {
      left -= 100;
      if (left <= 0) {
        _clearGap();
        _advance();
      } else if (secs() != state.gapLeft) {
        _set(state.copy(gapLeft: secs()));
      }
    });
  }

  void _clearGap() {
    _gapTimer?.cancel();
    _gapTimer = null;
    if (state.gapLeft != 0) _set(state.copy(gapLeft: 0));
  }

  void _advance() {
    var index = state.index + 1, loop = state.loop;
    if (index >= _verses.length) {
      index = 0;
      if (++loop > state.loops) {
        _set(state.copy(status: PlayerStatus.idle, index: 0, verseKey: _verses.firstOrNull?.verseKey, loop: 1, word: null));
        return _settle(true);
      }
    }
    _set(state.copy(index: index, loop: loop));
    _start();
  }

  /// The word lamp: the segment under the playhead, about 30 times a second while playing.
  void _tick() {
    _ticker?.cancel();
    _ticker = Timer.periodic(const Duration(milliseconds: 33), (_) => _sync());
  }

  void _sync() {
    if (state.status != PlayerStatus.playing || state.clip || state.basmala || _slice) return;
    final v = _verses.elementAtOrNull(state.index);
    if (_segsFor != v) {
      _segsFor = v;
      _segs = _reciter == null ? null : segsOf(v, _reciter!.id);
    }
    final segs = _segs;
    if (segs == null) return;
    final i = segAt(segs, _out.position.inMilliseconds);
    final w = i < 0 ? null : (segs[i][0], segs[i][1]);
    if (w != state.word) _set(state.copy(word: w));
  }
}
