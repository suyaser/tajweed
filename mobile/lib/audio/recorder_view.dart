// Record yourself and compare (src/screens/study/Recorder.tsx): the 56 px record button with its state line, and
// [Reciter] [Me] [Both] once there is a take. Used by the Say and Recite steps and the unit finale.
import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../core/store.dart' show uuid;
import '../core/types.dart';
import '../i18n/i18n.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'compare.dart';
import 'player.dart';
import 'recorder.dart';
import 'recordings.dart';

String _mmss(int s) => digits('${s ~/ 60}:${'${s % 60}'.padLeft(2, '0')}');

/// Android asks for the microphone only after the app says why (iOS shows Info.plist's text in its own prompt).
Future<bool> askMicrophone(BuildContext context, Recorder r) async {
  if (defaultTargetPlatform != TargetPlatform.android || await r.allowed()) return true;
  if (!context.mounted) return false;
  return await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(t('Allow the microphone')),
          content: Text(t('Record yourself reciting so you can compare with the reciter. Recordings stay on this device.')),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context, false), child: Text(t('Not now'))),
            TextButton(onPressed: () => Navigator.pop(context, true), child: Text(t('Continue'))),
          ],
        ),
      ) ??
      false;
}

/// The three parts a screen may lay out apart (the lesson's numbered cards): the record button with its state line,
/// the compare row (null until there is a take), and the "stay on this device" line.
typedef RecorderLayout = Widget Function(BuildContext context, Widget record, Widget? compare, Widget private);

class RecorderView extends StatefulWidget {
  const RecorderView({
    super.key,
    required this.from,
    this.to,
    required this.player,
    required this.recordings,
    this.reciter,
    this.model,
    this.onSaved,
    this.onStatus,
    this.layout,
  });
  final String from;
  final String? to;
  final Player player; // loaded with the range: Reciter plays it, Both plays it then the take
  final Recordings recordings;
  final VoidCallback? reciter; // null: no Reciter / Both buttons (e.g. offline)
  final VoidCallback? onSaved; // the store's noteRecording()
  /// Both, when it isn't "the player's range, then the take" (Say: the word clip, then the take).
  final void Function(String takePath)? model;
  /// 'saved' once a take exists (also an older one), 'off' when the microphone can't be used.
  final ValueChanged<String>? onStatus;
  final RecorderLayout? layout;

  @override
  State<RecorderView> createState() => RecorderViewState();
}

/// Public so a dev walk can drive it (record, both).
class RecorderViewState extends State<RecorderView> {
  final _rec = Recorder();
  List<Recording> _takes = [];
  String? _alert;
  Timer? _tick;
  ({Future<void> done, void Function() cancel})? _both;
  ComparePhase? _phase;

  String get _to => widget.to ?? widget.from;

  @override
  void initState() {
    super.initState();
    _rec.addListener(_changed);
    _refresh();
  }

  void _changed() {
    if (kDebugMode) debugPrint('RECORDER ${_rec.status.name}${_rec.error == null ? '' : ' ${_rec.error}'}');
    _tick?.cancel();
    if (_rec.recording) _tick = Timer.periodic(const Duration(milliseconds: 250), (_) => setState(() {}));
    if (mounted) setState(() {});
  }

  Future<void> _refresh() async {
    final xs = await widget.recordings.list(widget.from, _to);
    if (!mounted) return;
    setState(() => _takes = xs);
    if (xs.isNotEmpty) widget.onStatus?.call('saved');
  }

  Future<void> record() async {
    if (_rec.recording) return _rec.stop();
    widget.player.stop();
    _both?.cancel();
    setState(() => _alert = null);
    if (!await askMicrophone(context, _rec)) return;
    final take = await _rec.start();
    if (_rec.status == RecStatus.denied) widget.onStatus?.call('off');
    if (take == null) return;
    try {
      await widget.recordings.save(path: take.path, id: uuid(), from: widget.from, to: _to, durationMs: take.durationMs);
      widget.onSaved?.call();
    } catch (_) {
      setState(() => _alert = t("Couldn't save the recording. Your device may be out of space."));
    }
    await _refresh();
  }

  @override
  void dispose() {
    _tick?.cancel();
    _both?.cancel();
    _rec.removeListener(_changed);
    _rec.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final last = _takes.firstOrNull;
    final rec = _rec.recording;
    final secs = rec ? DateTime.now().difference(_rec.startedAt!).inSeconds : ((last?.durationMs ?? 0) / 1000).round();
    final alert = _alert ?? _rec.error;
    final path = last == null ? null : widget.recordings.pathOf(last);
    final recordUi = Column(spacing: Space.sm, children: [
          Semantics(
            button: true,
            label: rec ? t('Stop recording') : last != null ? t('Record again') : t('Record'),
            excludeSemantics: true,
            child: Material(
              color: c.error,
              shape: const CircleBorder(),
              elevation: rec ? 0 : 1,
              child: InkWell(
                customBorder: const CircleBorder(),
                onTap: record,
                child: Container(
                  width: 56,
                  height: 56,
                  decoration: rec ? BoxDecoration(shape: BoxShape.circle, border: Border.all(color: c.errorContainer, width: 4)) : null,
                  child: Icon(rec ? Icons.stop : Icons.mic, size: 28, color: c.onError),
                ),
              ),
            ),
          ),
          Semantics(
            liveRegion: true,
            child: rec
                ? Text(t('Recording {time}', {'time': _mmss(secs)}), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant))
                : last != null
                ? AppChip(tone: ChipTone.success, icon: Icons.check_circle, fill: true, label: t('Recorded {time}', {'time': _mmss(secs)}))
                : Text(t('Tap to record'), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
          ),
          if (alert != null) Text(alert, style: ty.bodyMd.copyWith(color: c.error), textAlign: TextAlign.center),
        ]);
    final compare = path == null || rec
        ? null
        : Semantics(
            label: t('Compare'),
            child: Row(spacing: Space.sm, children: [
              if (widget.reciter != null)
                Expanded(child: _btn(Icons.play_circle_outline, t('Reciter'), () {
                  _stopAll();
                  widget.reciter!();
                })),
              Expanded(child: _btn(Icons.play_circle_outline, t('Me'), () {
                _stopAll();
                playMe(widget.player, path);
              })),
              if (widget.reciter != null)
                Expanded(child: _btn(Icons.compare_arrows, t('Both'), primary: true, both)),
            ]),
          );
    final private = Row(spacing: 6, children: [
      Icon(Icons.lock_outline, size: 14, color: c.onSurfaceVariant),
      Expanded(child: Text(t('Recordings stay on this device.'), style: ty.caption.copyWith(color: c.onSurfaceVariant))),
    ]);
    final phase = _both != null && _phase != null
        ? Text(
            switch (_phase!) { ComparePhase.model || ComparePhase.silence => t('Reciter'), ComparePhase.me => t('Me'), ComparePhase.done => '' },
            textAlign: TextAlign.center,
            style: ty.label.weight(600).copyWith(color: c.primary),
          )
        : null;
    final cmp = compare == null ? null : Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.sm, children: [compare, ?phase]);
    if (widget.layout != null) return widget.layout!(context, recordUi, cmp, private);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      spacing: Space.md,
      children: [
        recordUi,
        cmp ?? Text(t('Record first, then compare.'), style: ty.bodyMd.copyWith(color: c.onSurfaceVariant)),
        private,
      ],
    );
  }

  /// Reciter, then the last take. Resolves when both have played (or were stopped).
  Future<void> both() {
    final last = _takes.firstOrNull;
    if (last == null) return Future.value();
    _stopAll();
    if (widget.model != null) {
      widget.model!(widget.recordings.pathOf(last));
      return Future.value();
    }
    final b = playModelThenMe(widget.player, widget.recordings.pathOf(last), (p) => mounted ? setState(() => _phase = p) : null);
    setState(() => _both = b);
    return b.done.whenComplete(() => mounted ? setState(() => _both = null) : null);
  }

  /// Recorder status (dev walk).
  RecStatus get status => _rec.status;

  /// The newest take, if any.
  Recording? get last => _takes.firstOrNull;

  void _stopAll() {
    _both?.cancel();
    widget.player.stop();
  }

  Widget _btn(IconData icon, String label, VoidCallback onTap, {bool primary = false}) => AppButton(
    label: label,
    icon: icon,
    variant: primary ? ButtonVariant.primary : ButtonVariant.secondary,
    onPressed: onTap,
    block: true,
  );
}
