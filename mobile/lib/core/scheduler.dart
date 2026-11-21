// Port of src/core/scheduler.ts. Spec §6: سبق · سبقي · منزل. Pure functions; `items` is a cache rebuilt from history.
import 'course.dart';
import 'day.dart';
import 'types.dart';

const ladder = [1, 3, 7, 14, 30, 60, 120]; // step → days
const dailyCap = 20;
const backlogLimit = 15;
const newPerDay = 2; // decision 22: at most 2 new lessons a study day
const _sabqiDays = 7;

String itemIdOf(String kind, String refId) => '$kind:$refId';

int _capOf(ReviewItem it) => it.kind == 'correction' ? (it.severity == 'jali' ? 1 : 3) : 6;
Day correctionDay(Correction c) => c.on ?? today(DateTime.parse(c.createdAt).toLocal());

typedef _Items = Map<String, ReviewItem>;

void _resetLinkedLessons(_Items items, List<String> lessonIds, Day on, String at) {
  for (final id in lessonIds) {
    final it = items[itemIdOf('lesson', id)];
    if (it?.state == 'manzil') it!.j.addAll({'step': 0, 'dueOn': addDays(on, 1), 'updatedAt': at}); // sabqi is daily
  }
}

/// One schedule-counting attempt (§6.3). Mutates [items].
void _applyOne(_Items items, Attempt a) {
  if (!a.countsForSchedule) return;
  final it = items[itemIdOf(a.kind, a.refId)];
  if (it == null || it.state == 'closed' || it.state == 'suspended') return;
  it.j['updatedAt'] = a.at;

  if (a.source == 'teacher') {
    // re-check by the teacher: "correct now" closes, "still wrong" is a lapse
    if (a.correct) {
      it.state = 'closed';
    } else {
      it.j.addAll({'step': 0, 'dueOn': addDays(a.on, 1), 'lapses': it.lapses + 1});
      _resetLinkedLessons(items, it.linkedLessonIds ?? const [], a.on, a.at);
    }
    return;
  }

  it.j['reps'] = it.reps + 1;
  it.j['lastReviewedOn'] = a.on;
  if (a.exampleId != null && a.exampleId!.isNotEmpty) it.j['lastExampleId'] = a.exampleId;

  if (it.state == 'sabqi') {
    final correct = (it.sabqiCorrect ?? 0) + (a.correct ? 1 : 0);
    it.j['sabqiCorrect'] = correct;
    if (diffDays(a.on, it.introducedOn) < _sabqiDays) {
      it.dueOn = addDays(a.on, 1);
    } else {
      // graduation: this answer is the last sabqi answer; a pass starts at the 3-day step (decision 13)
      final pass = correct >= 4 && a.correct;
      it.j.addAll({'state': 'manzil', 'step': pass ? 1 : 0, 'dueOn': addDays(a.on, ladder[pass ? 1 : 0])});
    }
    return;
  }

  if (!a.correct) {
    it.j.addAll({'step': 0, 'dueOn': addDays(a.on, 1), 'lapses': it.lapses + 1});
  } else if (a.on.compareTo(it.dueOn) >= 0) {
    // on time or late: the interval counts from the answer day
    it.step = (it.step + 1).clamp(0, _capOf(it));
    it.dueOn = addDays(a.on, ladder[it.step]);
  } // correct before due: no change
}

ReviewItem _blank(String kind, String refId, Day on, String at) => ReviewItem({
  'id': itemIdOf(kind, refId), 'kind': kind, 'refId': refId, 'state': kind == 'lesson' ? 'sabqi' : 'manzil', //
  'introducedOn': on, 'step': 0, 'dueOn': addDays(on, 1), 'lastReviewedOn': null, 'lastExampleId': null, 'reps': 0,
  'lapses': 0, 'createdAt': at, 'updatedAt': at, 'deletedAt': null,
});

/// Replays introductions, corrections and attempts in time order through §6.3. Pure.
List<ReviewItem> rebuildItems(List<Introduction> introductions, List<Attempt> attempts, List<Correction> corrections, Day today) {
  final live = corrections.where((c) => c.deletedAt == null).toList();
  // (t, at, on, row): t 0 introduction, 1 correction, 2 attempt
  final evs = <(int, String, Day, Json)>[
    for (final i in introductions) (0, i.at, i.on, i.j),
    for (final c in live) (1, c.createdAt, correctionDay(c), c.j),
    for (final a in attempts)
      if (a.countsForSchedule) (2, a.at, a.on, a.j),
  ].where((e) => e.$3.compareTo(today) <= 0).toList();
  stableSort(evs, (x, y) {
    final c = x.$2.compareTo(y.$2);
    return c != 0 ? c : x.$1 - y.$1;
  });

  final items = <String, ReviewItem>{};
  final correctedEarly = <String>{};
  for (final (t, at, on, row) in evs) {
    if (t == 0) {
      final lessonId = Introduction(row).lessonId;
      final id = itemIdOf('lesson', lessonId);
      final prev = items[id];
      final it = _blank('lesson', lessonId, on, at);
      if (prev != null) {
        it.j.addAll({'createdAt': prev.j['createdAt'], 'reps': prev.reps, 'lapses': prev.lapses, 'lastExampleId': prev.lastExampleId});
      }
      if (correctedEarly.contains(lessonId)) it.j['correctedBeforeTaught'] = true;
      items[id] = it;
    } else if (t == 1) {
      final c = Correction(row);
      items[itemIdOf('correction', c.id)] = ReviewItem({
        ..._blank('correction', c.id, on, at).j,
        'severity': c.severity,
        'linkedLessonIds': c.lessonIds,
      });
      for (final l in c.lessonIds) {
        if (!items.containsKey(itemIdOf('lesson', l))) correctedEarly.add(l);
      }
      _resetLinkedLessons(items, c.lessonIds, on, at);
    } else {
      _applyOne(items, Attempt(row));
    }
  }
  // a resolved correction is closed even if the teacher attempt is missing (e.g. hand-edited import)
  for (final c in live) {
    final it = items[itemIdOf('correction', c.id)];
    if (it != null && c.status == 'resolved') it.state = 'closed';
  }
  return items.values.toList();
}

/// Incremental version of rebuildItems for one new attempt (must give the same result).
List<ReviewItem> applyAttempt(List<ReviewItem> items, Attempt attempt) {
  final map = {for (final i in items) i.id: ReviewItem(Map.of(i.j))};
  _applyOne(map, attempt);
  return map.values.toList();
}

/* ---------------- Daily queue (\u00a76.5\u20136.6) ---------------- */

/// Today's queue. [sabaqReason] (pace | backlog | finale | done) says why [sabaq] is null.
class Queue {
  Queue({required this.sabqi, required this.manzil, required this.overflowCount});
  String? sabaq;
  String? sabaqReason;
  String? finaleUnit; // sabaqReason 'finale': the unit whose finale is next
  final List<ReviewItem> sabqi, manzil;
  final int overflowCount; // due manzil items left for later
  ({int due, int daysToCatchUp})? welcomeBack;

  /// The web's Queue object (parity fixtures).
  Json toJson() => {
    'sabaq': sabaq,
    'sabaqReason': ?sabaqReason,
    'finaleUnit': ?finaleUnit,
    'sabqi': [for (final i in sabqi) i.j],
    'manzil': [for (final i in manzil) i.j],
    'overflowCount': overflowCount,
    if (welcomeBack case final w?) 'welcomeBack': {'due': w.due, 'daysToCatchUp': w.daysToCatchUp},
  };
}

/// [extra] raises today's cap ("10 more"). Items already reviewed today count toward the cap.
Queue buildQueue(UserData data, List<Unit> units, Day today, [int extra = 0]) {
  bool le(Day a) => a.compareTo(today) <= 0;
  final live = data.items.where((i) => i.deletedAt == null).toList();
  final sabqi = live.where((i) => i.state == 'sabqi' && le(i.dueOn)).toList();
  final recentCorrected = {
    for (final c in data.corrections)
      if (c.deletedAt == null && diffDays(today, correctionDay(c)) < 7) ...c.lessonIds,
  };
  int group(ReviewItem i) => i.kind == 'correction'
      ? (i.severity == 'jali' ? 0 : 1)
      : i.kind == 'lesson' && recentCorrected.contains(i.refId)
      ? 2
      : 3;
  final due = live.where((i) => i.state == 'manzil' && le(i.dueOn)).toList();
  stableSort(due, (a, b) {
    final g = group(a) - group(b);
    if (g != 0) return g;
    final d = a.dueOn.compareTo(b.dueOn);
    if (d != 0) return d;
    final s = a.step - b.step;
    return s != 0 ? s : (a.id.compareTo(b.id) < 0 ? -1 : 1);
  });

  final reviewedToday = {
    for (final a in data.attempts)
      if (a.on == today && a.countsForSchedule && a.source != 'teacher') itemIdOf(a.kind, a.refId),
  }.length;
  final room = (dailyCap + extra - sabqi.length - reviewedToday).clamp(0, 1 << 30);
  final jali = due.where((i) => group(i) == 0).toList(); // never cut
  final manzil = [...jali, ...due.skip(jali.length).take((room - jali.length).clamp(0, 1 << 30))];

  final q = Queue(sabqi: sabqi, manzil: manzil, overflowCount: due.length - manzil.length);

  // سبق: the next lesson in course order (spec §4)
  final next = CourseProgress.of(data, units).next;
  if (next.kind == 'done') {
    q.sabaqReason = 'done';
  } else if (next.kind == 'finale') {
    q
      ..sabaqReason = 'finale'
      ..finaleUnit = next.unit!.id;
  } else {
    final gate = lessonGate(data, units, next.id!, today);
    if (gate != null) {
      q.sabaqReason = gate;
    } else {
      q.sabaq = next.id;
    }
  }

  // welcome back after ≥ 7 days away
  final activeDays = [
    for (final a in data.attempts) a.on,
    for (final i in data.introductions) i.on,
    for (final d in data.days)
      if (d.parts['sabaq'] != null || d.parts['review'] != null) d.id,
  ].where((d) => d.compareTo(today) < 0).toList()..sort();
  if (activeDays.isNotEmpty && diffDays(today, activeDays.last) >= 7) {
    final n = sabqi.length + due.length;
    q.welcomeBack = (due: n, daysToCatchUp: (n / dailyCap).ceil().clamp(1, 1 << 30));
  }
  return q;
}

/// Can this lesson be started today (spec §4)? null = yes; else locked | pace | backlog.
String? lessonGate(UserData data, List<Unit> units, String lessonId, Day today) {
  final p = CourseProgress.of(data, units);
  if (p.done.contains(lessonId)) return null;
  if (!p.unlocked(lessonId)) return 'locked';
  if (data.introductions.where((i) => i.on == today).length >= newPerDay) return 'pace';
  final overdue = data.items.where((i) => i.deletedAt == null && i.state == 'manzil' && i.dueOn.compareTo(today) <= 0);
  if (overdue.length > backlogLimit) return 'backlog';
  return null;
}

/* ---------------- Levels (\u00a76.7) ---------------- */

/// not-started | learning | known | strong. Decision 13: strong = the 30-day step and the last 3 answers correct,
/// each on a different example.
String levelOf(ReviewItem? item, List<Attempt> attempts) {
  if (item == null) return 'not-started';
  if (item.state == 'sabqi' || item.step <= 1) return 'learning';
  if (item.step < 4) return 'known';
  final mine = attempts
      .where((a) => a.kind == item.kind && a.refId == item.refId && a.countsForSchedule && a.source != 'teacher')
      .toList();
  stableSort(mine, (x, y) => x.at.compareTo(y.at));
  final last3 = mine.skip(mine.length < 3 ? 0 : mine.length - 3).toList();
  final strong = last3.length == 3 && last3.every((a) => a.correct) && {for (final a in last3) a.exampleId}.length == 3;
  return strong ? 'strong' : 'known';
}

/// "teacher correction open" badge (§6.7).
bool hasOpenCorrection(String lessonId, List<Correction> corrections) =>
    corrections.any((c) => c.deletedAt == null && c.status == 'open' && c.lessonIds.contains(lessonId));
