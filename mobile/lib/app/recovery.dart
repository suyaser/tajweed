// Port of src/app/Recovery.tsx: unreadable saved data (M5). The old text stays untouched until the learner restores
// a backup or starts fresh; "Download my data" shares it as a file (the web's download()).
import 'dart:io';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

import '../i18n/i18n.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'services.dart';
import 'shell.dart';

String _stamp() => DateTime.now().toIso8601String().substring(0, 10);

/// Writes [text] to a temp file named [name] and opens the share sheet (save to Files, send…).
Future<void> shareText(String name, String text) async {
  final f = File('${(await getTemporaryDirectory()).path}/$name');
  await f.writeAsString(text);
  await SharePlus.instance.share(ShareParams(files: [XFile(f.path, mimeType: 'application/json')]));
}

/// A full backup in the web's format (Settings' "Export a backup").
Future<void> shareBackup(BuildContext context) => shareText('tajweed-path-${_stamp()}.json', store.exportJson());

/// The text of a .json file the learner picks, or null when they cancel.
Future<String?> pickBackupText() async {
  final fs = await FilePicker.pickFiles(type: FileType.custom, allowedExtensions: ['json']);
  return fs.isEmpty ? null : fs.first.xFile.readAsString();
}

class Recovery extends StatefulWidget {
  const Recovery({super.key});
  @override
  State<Recovery> createState() => _RecoveryState();
}

class _RecoveryState extends State<Recovery> {
  String? _err;

  void _again() {
    if (store.loadError == null) go(context, startRoute());
  }

  Future<void> _restore() async {
    try {
      final text = await pickBackupText();
      if (text == null) return;
      store.importJson(text);
      if (mounted) _again();
    } catch (e) {
      setState(() => _err = t('Not restored: {reason}', {'reason': '$e'}));
    }
  }

  Future<void> _fresh() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(t('Start fresh? This replaces your saved data on this device. Download it first.')),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t('Cancel'))),
          TextButton(onPressed: () => Navigator.pop(context, true), child: Text(t('Start fresh'))),
        ],
      ),
    );
    if (ok != true) return;
    store.resetAll();
    if (mounted) _again();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final e = store.loadError;
    return Scaffold(
      backgroundColor: c.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(Space.gutter, Space.xl, Space.gutter, Space.xl),
          child: Panel(children: [
            Text(t('Your saved data could not be read'), style: ty.label.weight(600).copyWith(color: c.secondary)),
            Text('${e?.message ?? ''} ${t('Nothing has been changed. Download your saved data first, then restore a backup or reload.')}', style: ty.bodyMd.copyWith(color: c.onSurface)),
            Wrap(spacing: Space.sm, runSpacing: Space.sm, children: [
              AppButton(label: t('Download my data'), onPressed: () => shareText('tajweed-path-unreadable-${_stamp()}.json', e?.raw ?? '')),
              AppButton(label: t('Reload'), variant: ButtonVariant.secondary, onPressed: () {
                store.reload();
                _again();
              }),
              AppButton(label: t('Restore from a backup'), variant: ButtonVariant.secondary, onPressed: _restore),
              AppButton(label: t('Start fresh'), variant: ButtonVariant.ghost, onPressed: _fresh),
            ]),
            if (_err != null) Semantics(liveRegion: true, child: Text(_err!, style: ty.bodyMd.copyWith(color: c.error))),
          ]),
        ),
      ),
    );
  }
}
