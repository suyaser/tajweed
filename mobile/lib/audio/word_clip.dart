import 'dart:async';
import 'dart:math';

import 'package:just_audio/just_audio.dart';

const padBeforeMs = 80; // src/audio/player.ts PAD_BEFORE; quran-align error is < 73 ms on average
const padAfterMs = 120; // PAD_AFTER

/// everyayah ayah file, as src/audio/urls.ts `ayahUrl`.
String ayahUrl(String folder, String verseKey) {
  final [s, a] = verseKey.split(':');
  return 'https://everyayah.com/data/$folder/${s.padLeft(3, '0')}${a.padLeft(3, '0')}.mp3';
}

/// The slice `Player.playWords` plays for words fromWord..toWord (1-based inclusive).
/// `timings`: the bundled 1-based inclusive [wordFrom, wordTo, startMs, endMs] for one reciter.
/// From the ayah's first word it starts at 0 (the first word's timing can start after the voice does).
/// Either end untimed: the whole ayah (endMs null).
({int startMs, int? endMs}) wordSlice(List<List<int>> timings, int fromWord, int toWord) {
  // segsOf: 0-based, end exclusive; segForWord: the first segment covering the word
  List<int>? seg(int w) {
    for (final t in timings) {
      if (t[0] - 1 <= w && w < t[1]) return t;
    }
    return null;
  }

  final a = seg(fromWord - 1), b = seg(toWord - 1);
  final timed = a != null && b != null && a[2] <= b[3];
  if (!timed) return (startMs: 0, endMs: null);
  return (startMs: fromWord > 1 ? max(0, a[2] - padBeforeMs) : 0, endMs: b[3] + padAfterMs);
}

/// What one clip play measured (all ms).
class ClipResult {
  ClipResult(this.startMs, this.endMs, this.loadMs, this.firstPosMs, this.playedMs, this.endPosMs, this.stallMs);
  final int startMs, endMs;
  final int loadMs; // tap -> ready and playing (network + decode)
  final int firstPosMs; // clip-relative position when playback began (0 = started exactly at startMs)
  final int playedMs; // wall clock, playing -> completed
  final int endPosMs; // clip-relative position at completion
  final int stallMs; // after 'playing', wall time before the position starts moving (buffering after the seek)
  int get expectedMs => endMs - startMs;
  @override
  String toString() =>
      'clip $startMs-${endMs}ms (expected ${expectedMs}ms): load ${loadMs}ms, first position ${firstPosMs}ms, '
      'played ${playedMs}ms (${playedMs - expectedMs >= 0 ? '+' : ''}${playedMs - expectedMs}), end position ${endPosMs}ms, stall ${stallMs}ms, '
      'end lag ${playedMs - expectedMs - stallMs}ms';
}

/// Plays a slice of an ayah file with just_audio's ClippingAudioSource and measures it.
// ponytail: one player, no queue/lamp/rate; the real Player (F8) ports src/audio/player.ts.
Future<ClipResult> playClip(AudioPlayer p, String url, int startMs, int endMs) async {
  final sw = Stopwatch()..start();
  await p.stop();
  await p.setAudioSource(ClippingAudioSource(
    child: AudioSource.uri(Uri.parse(url)),
    start: Duration(milliseconds: startMs),
    end: Duration(milliseconds: endMs),
  ));
  final began = Completer<(int, int)>(), done = Completer<(int, int)>();
  final sub = p.playerStateStream.listen((s) {
    if (s.playing && s.processingState == ProcessingState.ready && !began.isCompleted) {
      began.complete((sw.elapsedMilliseconds, p.position.inMilliseconds));
    }
    if (s.processingState == ProcessingState.completed && !done.isCompleted) {
      done.complete((sw.elapsedMilliseconds, p.position.inMilliseconds));
    }
  });
  unawaited(p.play());
  final (t0, pos0) = await began.future;
  // the position is 0 until audio flows; 5 ms polling of the player's own clock
  var moved = -1;
  final poll = Timer.periodic(const Duration(milliseconds: 5), (_) {
    if (moved < 0 && p.position.inMilliseconds > pos0 + 20) moved = sw.elapsedMilliseconds - 20;
  });
  final (t1, pos1) = await done.future.timeout(Duration(milliseconds: endMs - startMs + 5000));
  poll.cancel();
  await sub.cancel();
  await p.pause();
  return ClipResult(startMs, endMs, t0, pos0, t1 - t0, pos1, moved < 0 ? -1 : moved - t0);
}
