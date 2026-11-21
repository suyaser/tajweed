// Port of src/screens/study/lessonSteps.ts: per-lesson step state (docs/10 "Step bar"). Plain JSON maps, as the web
// keeps them in localStorage: {done, visited, current, on, find?, check?}.
import 'types.dart';

const stepIds = ['hear', 'notice', 'learn', 'say', 'find', 'check', 'recite'];

/// How long a lesson takes, as onboarding tells learners.
const lessonMinutes = 15;

/// Steps a lesson can't be finished without (when it has them). Notice and Find are recommended only.
const requiredSteps = ['hear', 'learn', 'say', 'check', 'recite'];

typedef LessonSteps = Json;

LessonSteps freshSteps(String current, Day on) => {'done': <String>[], 'visited': [current], 'current': current, 'on': on};

List<String> _add(Object? xs, String id) {
  final l = (xs as List).cast<String>();
  return l.contains(id) ? l : [...l, id];
}

/// Open a step: it becomes current and visited, never done.
LessonSteps visitStep(LessonSteps s, String id, Day on) => {...s, 'visited': _add(s['visited'], id), 'current': id, 'on': on};

/// A step's minimum was met.
LessonSteps completeStep(LessonSteps s, String id, Day on) =>
    (s['done'] as List).contains(id) ? s : {...s, 'done': _add(s['done'], id), 'visited': _add(s['visited'], id), 'on': on};

/// Check finished: the score is replaced only by a complete set of answers.
LessonSteps scoreCheck(LessonSteps s, List<bool> results, Day on) => {...completeStep(s, 'check', on), 'check': results};

({int n, int m}) checkScore(LessonSteps s) {
  final c = (s['check'] as List?)?.cast<bool>();
  return (n: c?.where((x) => x).length ?? 0, m: c?.length ?? 0);
}

/// Required steps, in order, that exist for this lesson and aren't done; `except` is the step finishing now.
List<String> missingSteps(LessonSteps s, bool Function(String) exists, [String? except]) =>
    [for (final id in requiredSteps) if (id != except && exists(id) && !(s['done'] as List).contains(id)) id];
