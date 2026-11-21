// Port of src/audio/recorder.ts over the `record` plugin: AAC-LC .m4a (mono, 44.1 kHz, 64 kbps), a 3-minute guard,
// and the iOS audio session switched to playAndRecord (speaker, Bluetooth) only while recording, then back to playback
// so compare plays through the speaker and the silent switch still doesn't mute it.
import 'dart:async';
import 'dart:io';

import 'package:audio_session/audio_session.dart';
import 'package:flutter/foundation.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';

import '../i18n/i18n.dart';
import 'player.dart';

const maxRecording = Duration(minutes: 3);

enum RecStatus { idle, requesting, recording, denied, error }

typedef RecResult = ({String path, int durationMs});

Future<void> configureRecordSession() async {
  final s = await AudioSession.instance;
  await s.configure(AudioSessionConfiguration(
    avAudioSessionCategory: AVAudioSessionCategory.playAndRecord,
    avAudioSessionCategoryOptions: AVAudioSessionCategoryOptions.defaultToSpeaker | AVAudioSessionCategoryOptions.allowBluetooth,
    avAudioSessionMode: AVAudioSessionMode.defaultMode,
    androidAudioAttributes: const AndroidAudioAttributes(contentType: AndroidAudioContentType.speech, usage: AndroidAudioUsage.media),
    androidAudioFocusGainType: AndroidAudioFocusGainType.gainTransientExclusive,
  ));
  await s.setActive(true);
}

class Recorder extends ChangeNotifier {
  Recorder({AudioRecorder? rec}) : _rec = rec ?? AudioRecorder();
  final AudioRecorder _rec;
  RecStatus status = RecStatus.idle;
  DateTime? startedAt;
  String? error;
  Completer<RecResult?>? _take;
  Timer? _guard;
  bool _aborted = false; // stop() while the permission prompt is open

  void _set(RecStatus s, {String? err}) {
    status = s;
    error = err;
    notifyListeners();
  }

  bool get recording => status == RecStatus.recording;

  /// Whether the mic may be used, without asking.
  Future<bool> allowed() => _rec.hasPermission(request: false);

  /// Resolves when recording stops (stop(), the 3-minute guard, dispose) with the take, or null if none.
  Future<RecResult?> start() async {
    if (_take != null || status == RecStatus.requesting) return null;
    _aborted = false;
    _set(RecStatus.requesting);
    if (!await _rec.hasPermission()) {
      _set(RecStatus.denied, err: t('The microphone is blocked. Allow it in Settings.'));
      return null;
    }
    if (_aborted) {
      _set(RecStatus.idle);
      return null;
    }
    final path = '${(await getTemporaryDirectory()).path}/take-${DateTime.now().microsecondsSinceEpoch}.m4a';
    try {
      await configureRecordSession();
      if (Platform.isIOS) await _rec.ios?.manageAudioSession(false); // the session is ours (switched back after)
      await _rec.start(
        const RecordConfig(
          encoder: AudioEncoder.aacLc,
          sampleRate: 44100,
          numChannels: 1,
          bitRate: 64000,
        ),
        path: path,
      ).timeout(const Duration(seconds: 8)); // a mic that never opens (seen: the iOS simulator) must not hang the UI
    } catch (e) {
      debugPrint('recorder: $e');
      unawaited(_rec.cancel().catchError((Object _) {}));
      await configurePlaybackSession();
      _set(RecStatus.error, err: t('Recording failed.'));
      return null;
    }
    startedAt = DateTime.now();
    _take = Completer();
    _guard = Timer(maxRecording, stop);
    _set(RecStatus.recording);
    return _take!.future;
  }

  Future<void> stop() async {
    if (status == RecStatus.requesting) _aborted = true;
    final take = _take;
    if (take == null) return;
    _take = null;
    _guard?.cancel();
    final ms = DateTime.now().difference(startedAt!).inMilliseconds;
    String? path;
    try {
      path = await _rec.stop();
    } catch (_) {}
    await configurePlaybackSession();
    startedAt = null;
    final ok = path != null && await File(path).exists() && await File(path).length() > 0;
    _set(ok ? RecStatus.idle : RecStatus.error, err: ok ? null : t('Recording failed.'));
    take.complete(ok ? (path: path, durationMs: ms) : null);
  }

  @override
  void dispose() {
    stop();
    _rec.dispose();
    super.dispose();
  }
}
