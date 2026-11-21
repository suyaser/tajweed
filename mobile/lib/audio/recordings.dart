// Port of src/audio/recordings.ts: the learner's takes, newest first, the last 5 kept per range. Files live in
// <app support>/recordings/ with an index.json (rows are [Recording] maps); Android Auto Backup leaves the folder out
// (res/xml backup rules: recordings never leave the device).
import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';

import '../core/types.dart';

const keepPerRange = 5;

class Recordings {
  Recordings(this.dir);
  final Directory dir;

  static Future<Recordings> open() async => Recordings(Directory('${(await getApplicationSupportDirectory()).path}/recordings'));

  File get _index => File('${dir.path}/index.json');
  String pathOf(Recording r) => '${dir.path}/${r.file}';

  /// All takes, newest first.
  Future<List<Recording>> listAll() async {
    if (!await _index.exists()) return [];
    try {
      final rows = [for (final r in jsonDecode(await _index.readAsString()) as List) Recording(r as Json)];
      return rows..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    } on FormatException {
      return []; // a torn index: the files are still there, the list starts again
    }
  }

  Future<List<Recording>> list(String from, String to) async => [
    for (final r in await listAll()) if (r.from == from && r.to == to) r,
  ];

  /// Moves the take at `path` in and keeps only the newest [keepPerRange] for its range.
  Future<Recording> save({required String path, required String id, required String from, required String to, required int durationMs, DateTime? at}) async {
    await dir.create(recursive: true);
    final rec = Recording({
      'id': id, 'from': from, 'to': to, 'createdAt': (at ?? DateTime.now()).toUtc().toIso8601String(), //
      'durationMs': durationMs, 'mime': 'audio/mp4', 'file': '$id.m4a',
    });
    await File(path).rename(pathOf(rec)).catchError((Object _) async {
      final f = await File(path).copy(pathOf(rec)); // another volume (temp dir): copy, then drop the original
      await File(path).delete();
      return f;
    });
    final all = [rec, ...await listAll()];
    final old = all.where((r) => r.from == from && r.to == to).skip(keepPerRange).toList();
    await _write([for (final r in all) if (!old.contains(r)) r]);
    for (final r in old) {
      await _delete(r);
    }
    return rec;
  }

  Future<void> remove(String id) async {
    final all = await listAll();
    for (final r in all.where((r) => r.id == id)) {
      await _delete(r);
    }
    await _write(all.where((r) => r.id != id).toList());
  }

  Future<void> removeAll() async {
    if (await dir.exists()) await dir.delete(recursive: true);
  }

  Future<void> _delete(Recording r) async {
    final f = File(pathOf(r));
    if (await f.exists()) await f.delete();
  }

  /// Temp file, then rename: the index is never half written.
  Future<void> _write(List<Recording> rows) async {
    final tmp = File('${_index.path}.tmp');
    await tmp.writeAsString(jsonEncode(rows));
    await tmp.rename(_index.path);
  }
}
