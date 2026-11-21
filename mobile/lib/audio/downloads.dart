// "Download this unit's audio" (src/audio/download.ts): every ayah file a unit plays is saved to
// <app support>/audio/<reciter>/SSSAAA.mp3, and the player prefers a saved file over the network (offline study).
// The folder is left out of Android Auto Backup (res/xml): it can be downloaded again.
import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';

import '../content/content.dart';
import '../core/types.dart';
import '../i18n/i18n.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'player.dart';

class Downloads {
  Downloads(this.dir, {this.url = _everyayah, List<VerseKey> Function(String unitId)? ayahsOf})
      : ayahsOf = ayahsOf ?? ((id) => content.unitAyahs(content.getUnit(id)!)),
        _http = HttpClient();
  final Directory dir;
  final String Function(Reciter r, VerseKey k) url; // a local server in tests
  final List<VerseKey> Function(String unitId) ayahsOf;
  final HttpClient _http;
  static String _everyayah(Reciter r, VerseKey k) => ayahUrl(r.folder, k);

  static Future<Downloads> open() async => Downloads(Directory('${(await getApplicationSupportDirectory()).path}/audio'));

  File fileOf(Reciter r, VerseKey k) => File('${dir.path}/${r.id}/${Uri.parse(ayahUrl(r.folder, k)).pathSegments.last}');

  /// The player's source: the saved file when there is one, else the network.
  Future<Uri> source(Reciter r, VerseKey k) async {
    final f = fileOf(r, k);
    return await f.exists() ? f.uri : Uri.parse(url(r, k));
  }

  Future<int> count(Reciter r, List<VerseKey> keys) async {
    var n = 0;
    for (final k in keys) {
      if (await fileOf(r, k).exists()) n++;
    }
    return n;
  }

  /// The units saved for this reciter (`<reciter>/units.json`): deleting one keeps the files another still plays.
  File _unitsFile(Reciter r) => File('${dir.path}/${r.id}/units.json');
  Future<Set<String>> _units(Reciter r) async {
    try {
      return {...(jsonDecode(await _unitsFile(r).readAsString()) as List).cast<String>()};
    } catch (_) {
      return {};
    }
  }

  Future<void> _setUnits(Reciter r, Set<String> ids) async {
    final f = _unitsFile(r);
    await f.parent.create(recursive: true);
    await f.writeAsString(jsonEncode([...ids]));
  }

  /// Fetches the unit's missing files 4 at a time; `onProgress(done)` after each. Resolves to how many failed.
  Future<int> download(Reciter r, String unitId, void Function(int done) onProgress) async {
    await _setUnits(r, {...await _units(r), unitId});
    final queue = [...ayahsOf(unitId)];
    var done = 0, failed = 0;
    Future<void> worker() async {
      while (queue.isNotEmpty) {
        final k = queue.removeAt(0);
        final f = fileOf(r, k);
        if (!await f.exists()) {
          try {
            await _fetch(Uri.parse(url(r, k)), f);
          } catch (_) {
            failed++;
          }
        }
        onProgress(++done);
      }
    }

    await Future.wait([for (var i = 0; i < 4; i++) worker()]);
    return failed;
  }

  /// To a .part file, then renamed: a cut download never looks saved.
  Future<void> _fetch(Uri url, File f) async {
    await f.parent.create(recursive: true);
    final res = await (await _http.getUrl(url).timeout(const Duration(seconds: 20))).close();
    if (res.statusCode != 200) {
      await res.drain<void>();
      throw HttpException('HTTP ${res.statusCode}', uri: url);
    }
    final part = File('${f.path}.part');
    await res.pipe(part.openWrite());
    await part.rename(f.path);
  }

  /// Deletes the unit's files, except those another downloaded unit also plays (1:1, shared ayahs).
  Future<void> delete(Reciter r, String unitId) async {
    final others = (await _units(r))..remove(unitId);
    await _setUnits(r, others);
    final keep = {for (final id in others) ...ayahsOf(id)};
    for (final k in ayahsOf(unitId)) {
      final f = fileOf(r, k);
      if (!keep.contains(k) && await f.exists()) await f.delete();
    }
  }
}

/// The Unit screen's "Offline audio" panel: save the unit's recitation, progress, failures, delete.
class OfflineAudio extends StatefulWidget {
  const OfflineAudio({super.key, required this.unit, required this.reciter, required this.downloads});
  final Unit unit;
  final Reciter reciter;
  final Downloads downloads;

  @override
  State<OfflineAudio> createState() => OfflineAudioState();
}

/// Public so a dev walk can drive it.
class OfflineAudioState extends State<OfflineAudio> {
  int? _have, _busy;
  int _failed = 0;
  late List<VerseKey> _keys;

  @override
  void initState() {
    super.initState();
    _keys = content.unitAyahs(widget.unit);
    _recount();
  }

  Future<void> _recount() async {
    final n = await widget.downloads.count(widget.reciter, _keys);
    if (mounted) setState(() => _have = n);
  }

  bool get saved => _have != null && _have! >= _keys.length;

  Future<void> download() async {
    setState(() {
      _busy = 0;
      _failed = 0;
    });
    final f = await widget.downloads.download(widget.reciter, widget.unit.id, (n) => mounted ? setState(() => _busy = n) : null);
    if (mounted) {
      setState(() {
        _busy = null;
        _failed = f;
      });
    }
    await _recount();
  }

  Future<void> delete() async {
    await widget.downloads.delete(widget.reciter, widget.unit.id);
    await _recount();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    if (_have == null) return const SizedBox.shrink();
    final m = _keys.length;
    return Panel(
      title: t('Offline audio'),
      ar: ar['Offline audio'],
      icon: saved ? Icons.cloud_done_outlined : Icons.download_outlined,
      children: [
        Text(
          saved ? t("This unit's recitation is saved on this device.") : t("Save this unit's recitation ({n} ayahs) to study without internet.", {'n': m}),
          style: ty.bodyMd.copyWith(color: c.onSurfaceVariant),
        ),
        if (_busy != null) ...[
          Semantics(liveRegion: true, child: Text(t('Saving {n} of {m}…', {'n': _busy!, 'm': m}), style: ty.bodyMd.copyWith(color: c.onSurface))),
          LinearProgressIndicator(value: _busy! / m, color: c.primary, backgroundColor: c.surfaceContainerHigh),
        ] else if (!saved)
          AppButton(label: t('Download audio'), icon: Icons.download, variant: ButtonVariant.secondary, onPressed: download)
        else
          AppButton(label: t('Delete the saved audio'), icon: Icons.delete_outline, variant: ButtonVariant.tertiary, onPressed: delete),
        if (_failed > 0 && _busy == null)
          Text(t('{n} files could not be saved. Check the connection and try again.', {'n': _failed}), style: ty.bodyMd.copyWith(color: c.error)),
      ],
    );
  }
}
