// Recordings store (src/audio/recordings.ts port) and compare (src/audio/compare.ts port).
import 'dart:io';

import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/audio/compare.dart';
import 'package:tajweed/audio/player.dart';
import 'package:tajweed/audio/recordings.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/i18n/i18n.dart';
import 'package:tajweed/quran/quran.dart';

import 'player_test.dart' show FakeOut;

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('keeps the newest 5 per range, newest first; remove; a torn index starts again', () async {
    final tmp = await Directory.systemTemp.createTemp('rec');
    final r = Recordings(Directory('${tmp.path}/recordings'));
    Future<void> take(int i, String from) async {
      final f = File('${tmp.path}/take$i.m4a')..writeAsStringSync('audio $i');
      await r.save(path: f.path, id: 'r$i', from: from, to: from, durationMs: 1000 + i, at: DateTime.utc(2026, 1, 1, 0, i));
    }

    for (var i = 0; i < 7; i++) {
      await take(i, '112:1');
    }
    await take(9, '1:1');
    expect([for (final x in await r.list('112:1', '112:1')) x.id], ['r6', 'r5', 'r4', 'r3', 'r2']);
    expect(File('${tmp.path}/recordings/r0.m4a').existsSync(), false); // the dropped takes' files are gone
    expect(File(r.pathOf((await r.list('1:1', '1:1')).single)).readAsStringSync(), 'audio 9');
    expect(File('${tmp.path}/take6.m4a').existsSync(), false); // moved in, not copied
    await r.remove('r6');
    expect((await r.listAll()).map((x) => x.id), ['r9', 'r5', 'r4', 'r3', 'r2']);
    File('${tmp.path}/recordings/index.json').writeAsStringSync('{torn');
    expect(await r.listAll(), isEmpty);
    await r.removeAll();
    expect(Directory('${tmp.path}/recordings').existsSync(), false);
    await tmp.delete(recursive: true);
  });

  test('Both: the reciter once (no loop, no gap), 600 ms of silence, then the take; settings come back', () async {
    await loadArabic();
    useContent(await loadRawContent());
    final verses = await loadSurah(112);
    fakeAsync((async) {
      final out = FakeOut();
      final p = Player(out: out, online: () async => true)
        ..load([verses[1]], content.reciters.first)
        ..setLoops(3)
        ..setGap(const GapSeconds(5));
      final phases = <ComparePhase>[];
      playModelThenMe(p, '/tmp/me.m4a', phases.add);
      async.flushMicrotasks();
      expect([p.state.loops, out.opened.last], [1, '112002.mp3 null null']);
      out.end();
      async.flushMicrotasks();
      expect(phases, [ComparePhase.model, ComparePhase.silence]);
      expect([p.state.loops, p.state.gap], [3, isA<GapSeconds>()]);
      async.elapse(const Duration(milliseconds: 600));
      expect([phases.last, out.opened.last], [ComparePhase.me, 'me.m4a null null']);
      out.end();
      async.flushMicrotasks();
      expect(phases.last, ComparePhase.done);
    });
  });
}
