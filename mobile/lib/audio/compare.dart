// Port of src/audio/compare.ts: Reciter, Me, and Both (the reciter once, 600 ms of silence, then the take).
import 'dart:async';

import 'player.dart';

enum ComparePhase { model, silence, me, done }

/// "Both": plays the player's loaded range once (no gap, no loop), 600 ms silence, then the take at `path`. Loop and
/// gap settings come back afterwards. `cancel()` stops it.
({Future<void> done, void Function() cancel}) playModelThenMe(Player player, String path, [void Function(ComparePhase)? onPhase]) {
  var cancelled = false;
  Timer? timer;
  final (loops, gap) = (player.state.loops, player.state.gap);
  player
    ..stop()
    ..setLoops(1)
    ..setGap(const GapOff());
  onPhase?.call(ComparePhase.model);
  final model = player.whenDone();
  player.play();
  Future<void> run() async {
    try {
      final ok = await model;
      player
        ..setLoops(loops)
        ..setGap(gap);
      if (!ok || cancelled) return;
      onPhase?.call(ComparePhase.silence);
      final c = Completer<void>();
      timer = Timer(const Duration(milliseconds: 600), c.complete);
      await c.future;
      if (cancelled) return;
      onPhase?.call(ComparePhase.me);
      await player.playFile(path);
    } finally {
      onPhase?.call(ComparePhase.done);
    }
  }

  return (
    done: run(),
    cancel: () {
      cancelled = true;
      timer?.cancel();
      player.stop();
    },
  );
}

/// "Me": the take alone.
Future<bool> playMe(Player player, String path) => player.playFile(path);
