// Port of src/core/course.ts: v2 course progress (spec §4). A lesson is done when introduced; a unit opens when the
// previous unit's finale is done. A unit without a finale counts its finale as done once its lessons are.
import 'types.dart';

/// kind: lesson (with [id] and [unit]) | finale (with [unit]) | done.
class CourseNext {
  const CourseNext(this.kind, {this.id, this.unit});
  final String kind;
  final String? id;
  final Unit? unit;
}

class CourseProgress {
  CourseProgress(List<String> lessonIntroduced, List<String> finaleUnits, this.units)
    : done = {...lessonIntroduced},
      finales = {...finaleUnits} {
    for (final u in units) {
      // a unit with its finale recorded is passed: its open lessons are catch-up, never the frontier
      if (!open(u) || finales.contains(u.id)) continue;
      final id = u.lessonIds.where((x) => !done.contains(x)).firstOrNull;
      if (id != null) {
        next = CourseNext('lesson', id: id, unit: u);
        break;
      }
      if (!finaleDone(u)) {
        next = CourseNext('finale', unit: u);
        break;
      }
    }
  }

  factory CourseProgress.of(UserData d, List<Unit> units) =>
      CourseProgress([for (final i in d.introductions) i.lessonId], [for (final f in d.finales) f.unitId], units);

  final List<Unit> units;
  final Set<String> done, finales;
  CourseNext next = const CourseNext('done');

  bool lessonsDone(Unit u) => u.lessonIds.every(done.contains);
  bool finaleDone(Unit u) => finales.contains(u.id) || (u.finale == null && lessonsDone(u));
  bool open(Unit u) {
    final i = units.indexWhere((x) => x.id == u.id);
    return i <= 0 || finaleDone(units[i - 1]);
  }

  /// A lesson not done in a passed unit (v1 learners: the lessons v2 added to units they had finished).
  bool catchUp(String lessonId) =>
      !done.contains(lessonId) && units.any((u) => finales.contains(u.id) && u.lessonIds.contains(lessonId));

  /// Lessons can be started when done (replay), next in the course, or catch-up.
  bool unlocked(String lessonId) =>
      done.contains(lessonId) || (next.kind == 'lesson' && next.id == lessonId) || catchUp(lessonId);
}

/// The 49 lesson ids of v1 (content/rules.json minus the 9 lessons v2 added).
const v1Lessons = {
  'ibtida', 'makharij-jawf', 'makharij-halq', 'makharij-aqsa', 'makharij-wasat', 'makharij-taraf', 'makharij-shafatan',
  'sifat-hams', 'sifat-shidda', 'sifat-istila', 'sifat-safir', 'sifat-inhiraf', 'izhar', 'idgh-g', 'idgh-n', 'iqlab', 'ikhfa',
  'm-ikhfa', 'm-idgham', 'm-izhar', 'ghunnah', 'lam-q', 'lam-s', 'lam-jh', 'lam-jl', 'ra-h', 'ra-l', 'qal-s', 'qal-k', 'tabii',
  'iwad', 'silah-s', 'badal', 'muttasil', 'munfasil', 'silah-k', 'arid', 'lin', 'lazim-k', 'lazim-h', 'mithlayn',
  'mutajanisayn', 'mutaqaribayn', 'waqf-signs', 'waqf-how', 'sakt', 'imalah', 'ishmam', 'tashil', //
};

/// v1 → v2 migration (engineering review M4): a unit is passed when every lesson of it that existed in v1 is done.
/// A unit with no v1 lessons is passed when the next unit that has some is.
List<Json> migratedFinales(List<Json> introductions, List<Unit> units) {
  final on = {for (final i in introductions) i['lessonId'] as String: i['on'] as String};
  final out = <Json>[];
  String? after;
  for (final u in units.reversed) {
    final v1 = u.lessonIds.where(v1Lessons.contains).toList();
    final String? day;
    if (v1.isEmpty) {
      day = after;
    } else {
      day = v1.every(on.containsKey) ? (v1.map((id) => on[id]!).toList()..sort()).last : null;
      after = day;
    }
    if (day != null) out.insert(0, {'unitId': u.id, 'on': day});
  }
  return out;
}
