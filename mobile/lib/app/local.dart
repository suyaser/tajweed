// Device-local conveniences, never schedule state: the web keeps these in localStorage beside UserData
// (lessonSteps.ts `tajweed-path:lesson-steps`, study/helpers.ts `tajweed-path:study` mem, Onboarding ROUTINE_KEY).
// One small JSON file next to userdata.json; a lost or torn file only forgets them.
import 'dart:convert';
import 'dart:io';

import '../core/types.dart';

class Local {
  Local(this.file) {
    try {
      j = (jsonDecode(file.readAsStringSync()) as Map).cast<String, dynamic>();
    } catch (_) {
      j = {};
    }
  }
  final File file;
  late Json j;

  void _save() {
    try {
      final tmp = File('${file.path}.tmp');
      tmp.writeAsStringSync(jsonEncode(j));
      tmp.renameSync(file.path);
    } on FileSystemException {
      // storage full: this session only, as the web with storage blocked
    }
  }

  /* lesson steps (lessonSteps.ts getSteps / saveSteps / clearSteps) */
  Json get _steps => (j['lesson-steps'] as Map?)?.cast<String, dynamic>() ?? {};
  Json? getSteps(String lessonId) => (_steps[lessonId] as Map?)?.cast<String, dynamic>();
  void saveSteps(String lessonId, Json s) {
    j['lesson-steps'] = {..._steps, lessonId: s};
    _save();
  }

  /* study memory (helpers.ts mem / setMem): dismissed nudges and hints, by key → day */
  Json get mem => (j['study'] as Map?)?.cast<String, dynamic>() ?? {};
  void setMem(Json patch) {
    j['study'] = {...mem, ...patch};
    _save();
  }

  Map<String, String> get dismissed => ((mem['dismissed'] as Map?) ?? {}).cast<String, String>();
  void dismiss(String key, Day on) => setMem({'dismissed': {...dismissed, key: on}});

  /* the routine card (Onboarding ROUTINE_KEY): offered once to learners who onboarded with the short flow */
  bool get routinePending => j['routine-card'] == 'pending';
  set routinePending(bool on) {
    on ? j['routine-card'] = 'pending' : j.remove('routine-card');
    _save();
  }
}
