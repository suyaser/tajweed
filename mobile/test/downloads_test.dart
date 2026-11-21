// Unit audio downloads (src/audio/download.ts port) against a local server.
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/audio/downloads.dart';
import 'package:tajweed/core/types.dart';

void main() {
  test('saves the missing files, counts failures, prefers saved files, deletes', () async {
    final server = await HttpServer.bind(InternetAddress.loopbackIPv4, 0);
    var hits = 0;
    server.listen((req) {
      hits++;
      final missing = req.uri.path.contains('404');
      req.response
        ..statusCode = missing ? 404 : 200
        ..write(missing ? '' : 'mp3 ${req.uri.path}')
        ..close();
    });
    final tmp = await Directory.systemTemp.createTemp('dl');
    final d = Downloads(Directory('${tmp.path}/audio'), url: (r, k) => 'http://127.0.0.1:${server.port}/${k == '9:9' ? '404' : k}');
    final r = Reciter({'id': 'husary-muallim', 'folder': 'Husary_Muallim_128kbps', 'nameAr': '', 'nameEn': '', 'style': 'muallim', 'hasTimings': true});
    final keys = ['1:1', '112:1', '112:2', '9:9'];
    final progress = <int>[];
    expect(await d.download(r, keys, progress.add), 1);
    expect(progress, [1, 2, 3, 4]);
    expect(await d.count(r, keys), 3);
    expect(d.fileOf(r, '112:1').path, endsWith('/audio/husary-muallim/112001.mp3'));
    expect(d.fileOf(r, '112:1').readAsStringSync(), 'mp3 /112:1');
    expect(File('${d.fileOf(r, '9:9').path}.part').existsSync(), false);
    expect((await d.source(r, '112:2')).scheme, 'file');
    expect((await d.source(r, '9:9')).scheme, 'http');
    hits = 0;
    expect(await d.download(r, keys, (_) {}), 1); // the saved ones are not fetched again
    expect(hits, 1);
    await d.delete(r, keys);
    expect(await d.count(r, keys), 0);
    await server.close(force: true);
    await tmp.delete(recursive: true);
  });
}
