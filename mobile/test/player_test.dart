// Player (src/audio/player.ts port) on a fake audio engine and a fake clock.
import 'dart:async';

import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/audio/player.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/core/types.dart';
import 'package:tajweed/i18n/i18n.dart';
import 'package:tajweed/quran/quran.dart';

class FakeOut implements AudioOut {
  final opened = <String>[];
  final _events = StreamController<AudioEvent>.broadcast(sync: true);
  bool fail = false, playing = false;
  @override
  Duration position = Duration.zero;
  @override
  Duration? duration = const Duration(seconds: 3);
  double speed = 1;

  @override
  Future<void> open(Uri uri, {Duration? start, Duration? end}) async {
    if (fail) throw Exception('no network');
    opened.add('${uri.pathSegments.last} ${start?.inMilliseconds} ${end?.inMilliseconds}');
    position = Duration.zero;
  }

  @override
  void play() {
    playing = true;
    _events.add(AudioEvent.playing);
  }

  @override
  void pause() => playing = false;
  @override
  Future<void> setSpeed(double rate) async => speed = rate;
  @override
  Stream<AudioEvent> get events => _events.stream;
  @override
  Future<void> dispose() => _events.close();
  void end() => _events.add(AudioEvent.ended);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late List<Verse> ikhlas;
  late Reciter reciter;
  setUpAll(() async {
    await loadArabic();
    useContent(await loadRawContent());
    ikhlas = await loadSurah(112);
    reciter = content.reciters.firstWhere((r) => r.hasTimings);
  });

  test('queue: basmala before ayah 1, the lamp follows the playhead, done after the last ayah', () {
    fakeAsync((async) {
      final out = FakeOut();
      final p = Player(out: out, online: () async => true)..load(ikhlas.sublist(0, 2), reciter);
      bool? done;
      p.whenDone().then((ok) => done = ok);
      p.play();
      async.flushMicrotasks();
      expect(out.opened, ['001001.mp3 null null']); // the basmala first
      expect([p.state.status, p.state.basmala], [PlayerStatus.playing, true]);
      out.end();
      async.flushMicrotasks();
      expect(out.opened.last, '112001.mp3 null null');
      final segs = segsOf(ikhlas[0], reciter.id)!;
      out.position = Duration(milliseconds: segs[2][2] + 10);
      async.elapse(const Duration(milliseconds: 40));
      expect(p.state.word, (segs[2][0], segs[2][1]));
      out.end();
      async.flushMicrotasks();
      expect([p.state.index, out.opened.last], [1, '112002.mp3 null null']); // no basmala before ayah 2
      out.end();
      async.flushMicrotasks();
      expect([p.state.status, done], [PlayerStatus.idle, true]);
    });
  });

  test('word clips: PAD_BEFORE 80 ms / PAD_AFTER 120 ms, the first word from 0, lit as a whole', () {
    fakeAsync((async) {
      final out = FakeOut();
      final p = Player(out: out, online: () async => true)..load([ikhlas[0]], reciter);
      final t = ikhlas[0].timings(reciter.id)!;
      p.playWords(ikhlas[0], 2, 3);
      async.flushMicrotasks();
      expect(out.opened.last, '112001.mp3 ${t[1][2] - 80} ${t[2][3] + 120}');
      expect(p.state.word, (1, 3));
      p.playWord(ikhlas[0], 0);
      async.flushMicrotasks();
      expect(out.opened.last, '112001.mp3 null ${t[0][3] + 120}');
      out.end();
      async.flushMicrotasks();
      expect([p.state.status, p.state.word], [PlayerStatus.idle, null]); // a clip ends the play, no advance
    });
  });

  test('repeat gap counts down whole seconds, loops replay the queue, rate goes to the engine', () {
    fakeAsync((async) {
      final out = FakeOut();
      final p = Player(out: out, online: () async => true)
        ..load([ikhlas[1]], reciter)
        ..setGap(const GapSeconds(2))
        ..setLoops(2)
        ..setRate(0.75);
      p.play();
      async.flushMicrotasks();
      expect(out.speed, 0.75);
      out.end();
      expect([p.state.status, p.state.gapLeft, p.state.gapTotal], [PlayerStatus.gap, 2, 2]);
      async.elapse(const Duration(milliseconds: 1100));
      expect(p.state.gapLeft, 1);
      async.elapse(const Duration(milliseconds: 1000));
      async.flushMicrotasks();
      expect([p.state.status, p.state.loop, out.opened.length], [PlayerStatus.playing, 2, 2]);
      out.end();
      p.skipGap();
      async.flushMicrotasks();
      expect(p.state.status, PlayerStatus.idle);
    });
  });

  test('load error: offline when there is no connection, an error otherwise; play retries', () {
    fakeAsync((async) {
      final out = FakeOut()..fail = true;
      var online = false;
      final p = Player(out: out, online: () async => online)..load([ikhlas[1]], reciter);
      p.play();
      async.flushMicrotasks();
      expect([p.state.status, p.state.error], [PlayerStatus.offline, t('Audio needs a connection.')]);
      online = true;
      p.play();
      async.flushMicrotasks();
      expect(p.state.status, PlayerStatus.error);
      out.fail = false;
      p.play();
      async.flushMicrotasks();
      expect(p.state.status, PlayerStatus.playing);
    });
  });

  test('playFile resolves when the recording ends; stop resolves waiters false', () {
    fakeAsync((async) {
      final out = FakeOut();
      final p = Player(out: out, online: () async => true)..load([ikhlas[1]], reciter);
      bool? ok;
      p.playFile('/tmp/take.m4a').then((x) => ok = x);
      async.flushMicrotasks();
      expect([p.state.clip, out.opened.last], [true, 'take.m4a null null']);
      out.end();
      async.flushMicrotasks();
      expect(ok, true);
      p.play();
      p.whenDone().then((x) => ok = x);
      p.stop();
      async.flushMicrotasks();
      expect(ok, false);
    });
  });
}
