// Port of src/screens/Learn.tsx (#/learn/:lessonId): a lesson in one shell (header, step bar, instruction, one primary
// in the pinned bottom bar): Hear → Notice → Learn → Say → Find → Check → Recite. Step state is device-local
// (lessonSteps.ts in localStorage on the web, Local here); attempts and the finished lesson go through the store.
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../app/router.dart';
import '../app/services.dart';
import '../app/shell.dart';
import '../audio/compare.dart';
import '../content/content.dart';
import '../content/rulemap.dart';
import '../core/course.dart';
import '../core/day.dart';
import '../core/lesson_steps.dart';
import '../core/questions.dart';
import '../core/scheduler.dart';
import '../core/types.dart' hide Passage;
import '../i18n/i18n.dart';
import '../quran/quran.dart';
import '../quran/verse.dart';
import '../ui/kit.dart';
import '../ui/theme.dart';
import 'lesson_parts.dart';
import 'study.dart';

const _next = {
  'hear': 'Next: Hear the examples', 'notice': 'Next: Notice the difference', 'learn': 'Next: Learn the rule', //
  'say': 'Next: Say it yourself', 'find': 'Next: Find it in an ayah', 'check': 'Next: Check what you know',
  'recite': 'Next: Recite the passage',
};

/// The course's "Listen for" note without its own leading "Listen to / for" (the label already says it).
String listenFor(String s) {
  final r = s.replaceFirst(RegExp(r'^\s*(listen\s+(to|for)|\u0627\u0633\u062a\u0645\u0639\s+(\u0625\u0644\u0649|\u0644)|\u0627\u0646\u062a\u0628\u0647\s+(\u0625\u0644\u0649|\u0644))\s*:?\s*', caseSensitive: false), '');
  return r.isEmpty ? r : r[0].toUpperCase() + r.substring(1);
}

typedef ExampleSets = ({List<Example> hear, List<Example> say, Example learn, Example notice});

/// Which examples each step shows (Learn.tsx exampleSets): with roles, each step its own; else Hear the first three and
/// the others start elsewhere so the same word doesn't open every step.
ExampleSets exampleSets(List<Example> xs) {
  if (xs.any((x) => x.role != null)) {
    List<Example> by(String r) => xs.where((x) => x.role == r).toList();
    final anchor = by('anchor').firstOrNull ?? xs.first;
    final say = by('say');
    final core = [anchor, ...by('hear')].take(3).toList();
    return (hear: core, say: say.isNotEmpty ? say : core, learn: anchor, notice: by('notice').firstOrNull ?? anchor);
  }
  final hear = xs.take(3).toList();
  final say = xs.length >= 6 ? xs.sublist(3, 6) : [...hear.skip(1), ...hear.take(1)];
  Example? fresh(List<Example?> not) => [...xs.skip(3), ...xs.skip(1).take(2), ...xs.take(1)].where((x) => !not.contains(x)).firstOrNull;
  final learn = fresh([hear.firstOrNull, say.firstOrNull]) ?? fresh([hear.firstOrNull]) ?? xs.first;
  final notice = fresh([hear.firstOrNull, say.firstOrNull, learn]) ?? fresh([hear.firstOrNull]) ?? xs.first;
  return (hear: hear, say: say, learn: learn, notice: notice);
}

String _skeleton(String s) => s.replaceAll(RegExp('[\u064b-\u0652\u0670\u06d6-\u06ed]'), '').replaceAll('\u0671', '\u0627');

/// The same word with and without the rule (مَٰلِكِ / مَلِكِ): the clearest contrast.
(Example, Example)? minimalPair(List<Example> mine, List<Example> theirs) {
  for (final a in mine) {
    for (final b in theirs) {
      if (a.text != b.text && _skeleton(a.text) == _skeleton(b.text)) return (a, b);
    }
  }
  return null;
}

typedef FindPick = ({Verse v, List<int> targets, List<int> neutral});

/// The ayah for Find, checked against the tajweed data: the closing passage first, then the examples' ayahs; prefers
/// one where the rule isn't only on the last (stop) word. pick null + unknown false: the data finds it nowhere.
Future<({FindPick? pick, bool unknown})> pickFindAyah(Lesson lesson, String? closing) async {
  final keys = {?closing, for (final e in lesson.examples) e.verseKey};
  FindPick? fallback;
  var unknown = false;
  for (final k in keys) {
    Verse? v;
    try {
      v = await getVerse(k);
    } catch (_) {}
    if (v == null) {
      unknown = true;
      continue;
    }
    final targets = findTargets(v, lesson.id);
    final last = v.words.length;
    // stopping turns a final طبيعي into عارض: that word is a sub-case, neither right nor wrong
    final neutral = lesson.id == 'tabii' && !targets.contains(last) && findTargets(v, 'arid').contains(last) ? [last] : <int>[];
    if (targets.isEmpty) continue;
    final f = (v: v, targets: targets, neutral: neutral);
    if (targets.any((n) => n < last)) return (pick: f, unknown: false);
    fallback ??= f;
  }
  return (pick: fallback, unknown: fallback == null && unknown);
}

class Learn extends StatelessWidget {
  const Learn({super.key, required this.lessonId});
  final String lessonId;
  @override
  Widget build(BuildContext context) {
    final lesson = content.getLesson(lessonId);
    if (lesson != null) return LessonFlow(key: ValueKey(lessonId), lesson: lesson);
    return PageBody(items: [
      EmptyState(
        icon: Icons.search_off,
        title: t("This lesson isn't in the library."),
        body: t('The link may be from an older version.'),
        action: AppButton(label: t('Back to today'), onPressed: () => go(context, 'today')),
      ),
    ]);
  }
}

/// Title block: `Lesson 16 of 58 · Unit 2`, the Arabic name, the English gloss; outside a step the unit's surahs and
/// the divider. [action]: the Rule chip.
class LessonHeader extends StatelessWidget {
  const LessonHeader({super.key, required this.lesson, this.step = false, this.action});
  final Lesson lesson;
  final bool step;
  final Widget? action;
  @override
  Widget build(BuildContext context) {
    final unit = content.unitOf(lesson.id);
    final n = content.courseOrder.indexOf(lesson.id) + 1;
    final where = unit != null && !step ? (unit.surahs.isNotEmpty && unit.surahs != '\u2014' ? unit.surahs : unit.nameAr) : '';
    return PageHeader(
      stacked: true,
      plain: step,
      en: lesson.nameEn,
      ar: lesson.nameAr,
      actions: [?action],
      eyebrow: n > 0 ? [t('Lesson {n} of {m}', {'n': n, 'm': content.courseOrder.length}), if (unit != null) t('Unit {n}', {'n': unit.n})] : null,
      detail: [where],
    );
  }
}

/// What every step gets.
class StepProps {
  const StepProps({required this.lesson, required this.audio, required this.nextLabel, required this.onNext, required this.onDone, required this.wasDone, required this.head});
  final Lesson lesson;
  final StudyAudio audio;
  final String nextLabel;
  final VoidCallback onNext, onDone;
  final bool wasDone;
  final List<Widget> head; // header, step bar, done line, instruction
}

class LessonFlow extends StatefulWidget {
  const LessonFlow({super.key, required this.lesson});
  final Lesson lesson;
  @override
  State<LessonFlow> createState() => _LessonFlowState();
}

class _LessonFlowState extends State<LessonFlow> {
  final audio = StudyAudio();
  late final Lesson lesson = widget.lesson;
  late final CourseLesson course = content.courseLesson(lesson.id);
  late final Day day = today();
  late final bool already = store.data.introductions.any((i) => i.lessonId == lesson.id);
  late final List<Question> qs = checkQuestions(
    lesson,
    content.lessons,
    [for (final i in store.data.introductions) if (i.lessonId != lesson.id) i.lessonId],
    store.data.settings.munfasilLength,
  );
  late final Lesson? other = course.contrastWith == null ? null : content.getLesson(course.contrastWith!);
  late final bool hasNotice = (other?.examples.isNotEmpty ?? false) && lesson.examples.isNotEmpty;
  late final ExampleSets sets = exampleSets(lesson.examples);
  late final Json? saved = local.getSteps(lesson.id);
  late final bool startedToday = saved?['on'] == day;

  bool _findLoaded = false;
  FindPick? _findPick;
  late Json st;
  bool _finished = false;
  String? _arrived; // the step just left with the primary: its done line

  bool? get findOk => _findLoaded ? _findPick != null : saved?['find'] as bool?;
  bool exists(String id) =>
      !((id == 'hear' && lesson.examples.isEmpty) || (id == 'notice' && !hasNotice) || (id == 'check' && qs.isEmpty) || (id == 'find' && findOk == false));
  String get firstStep => stepIds.firstWhere(exists, orElse: () => 'learn');
  String? nextOf(String id) => stepIds.skip(stepIds.indexOf(id) + 1).where(exists).firstOrNull;
  String get step => st['current'] as String;

  /// A new lesson only when it is unlocked and today's pace allows (spec §4); replays and today's resume open.
  String? get gate => !already && !startedToday && !_finished ? lessonGate(store.data, content.units, lesson.id, day) : null;

  void _set(Json s) {
    setState(() => st = s);
    if (gate == null) local.saveSteps(lesson.id, s);
  }

  @override
  void initState() {
    super.initState();
    final s = saved;
    st = s != null && exists(s['current'] as String) ? visitStep(s, s['current'] as String, day) : freshSteps(firstStep, day);
    if (gate == null) local.saveSteps(lesson.id, st);
    pickFindAyah(lesson, course.closing?.from).then((f) {
      if (!mounted) return;
      setState(() {
        _findLoaded = true;
        _findPick = f.pick; // unknown (offline): no Find this visit, nothing remembered
      });
      if (!f.unknown && st['find'] != (f.pick != null)) _set({...st, 'find': f.pick != null});
      if (!exists(step)) {
        final n = nextOf(step);
        if (n != null) goStep(n);
      }
    });
  }

  @override
  void dispose() {
    audio.dispose();
    super.dispose();
  }

  void goStep(String id, [String? from]) {
    audio.stop();
    audio.setSlow(false); // Slower and Loop are per step
    audio.setLoop(false);
    _arrived = from;
    _set(visitStep(st, id, day));
  }

  void complete(String id) => _set(completeStep(st, id, day));
  void advance() {
    final n = nextOf(step);
    if (n != null) goStep(n, step);
  }

  void finish() {
    audio.stop();
    store.introduceLesson(lesson.id);
    _finished = true;
    _set({...completeStep(st, 'recite', day), 'current': firstStep});
  }

  @override
  Widget build(BuildContext context) {
    final g = gate;
    if (g != null) return _gate(context, g);
    if (_finished) return _done(context);
    final s = step;
    final next = nextOf(s);
    final nextLabel = next == null ? t('Finish lesson') : next == 'find' && findOk == null ? t('Next') : t(_next[next]!);
    final score = checkScore(st);
    final n3 = lesson.examples.length < 3 ? lesson.examples.length : 3;
    final doneCopy = <String, String?>{
      'hear': tn('You heard {n} word.', 'You heard {n} words.', n3),
      'notice': t('You compared two sounds.'),
      'learn': '${t('You read the rule.')} ${t('A good place to pause: your place is saved.')}',
      'say': tn('You said {n} word.', 'You said {n} words.', n3),
      'find': t('You found it in an ayah.'),
      'check': t('{n} of {m} right. They come back in review.', {'n': score.n, 'm': score.m}),
      'recite': null,
    };
    final cl = course.closing;
    final instruction = <String, String?>{
      'hear': t('Listen to each word. What do they have in common?'),
      'notice': t('Play both. Which one has the sound you just heard?'),
      'learn': t('Read each part, top to bottom. Play the example.'),
      'say': t('Play it, say it the same way, then record and compare.'),
      'find': t('Tap every word that has {x}. Then tap Check.', {'x': lesson.nameAr}),
      'check': null, // Check numbers its own question
      'recite': cl != null ? t('Recite {x}: listen, record, compare.', {'x': rangeRef(cl.from, cl.to)}) : t('Say these words aloud, one after another, the way the reciter does.'),
    };
    String mark(String id) => !exists(id)
        ? 'skipped'
        : id == s
        ? 'current'
        : id == 'find' && findOk == null
        ? 'pending'
        : (st['done'] as List).contains(id)
        ? 'done'
        : (st['visited'] as List).contains(id)
        ? 'visited'
        : 'new';
    final arrived = _arrived;
    final head = <Widget>[
      LessonHeader(
        step: true,
        lesson: lesson,
        action: ['say', 'find', 'recite'].contains(s)
            ? AppChip(
                icon: Icons.menu_book_outlined,
                tone: ChipTone.gold,
                label: t('Rule'),
                onTap: () => showAppSheet(context, title: lesson.nameAr, builder: (_) => RuleBody(lesson: lesson, audio: audio)),
              )
            : null,
      ),
      StepBar(
        stateOf: (id) => switch (mark(id)) {
          'current' => StepMark.current,
          'done' => StepMark.done,
          'visited' => StepMark.visited,
          'pending' => StepMark.pending,
          'skipped' => StepMark.skipped,
          _ => StepMark.fresh,
        },
        onGo: (id) => id != s ? goStep(id) : null,
      ),
      if (arrived != null && (st['done'] as List).contains(arrived) && doneCopy[arrived] != null) _OnceLine(key: ValueKey(arrived), text: doneCopy[arrived]!),
      if (instruction[s] != null) Instruction(icon: stepIcons[s]!, text: instruction[s]!),
    ];
    final p = StepProps(
      lesson: lesson,
      audio: audio,
      nextLabel: nextLabel,
      onNext: advance,
      onDone: () => complete(s),
      wasDone: (st['done'] as List).contains(s),
      head: head,
    );
    final notice = course.notice;
    return switch (s) {
      'hear' => _Hear(key: const ValueKey('hear'), p: p, exs: sets.hear, notice: notice == null || notice.isEmpty ? null : listenFor(notice)),
      'notice' => _Notice(key: const ValueKey('notice'), p: p, other: other!, ex: sets.notice),
      'learn' => _LearnStep(key: const ValueKey('learn'), p: p, ex: sets.learn),
      'say' => _Say(key: const ValueKey('say'), p: p, exs: sets.say),
      'find' => _findPick != null
          ? _Find(key: const ValueKey('find'), p: p, found: _findPick!)
          : PageBody(key: const ValueKey('find-loading'), items: [...head, Panel(children: [for (var i = 0; i < 2; i++) const Skeleton(height: 40)])]),
      'check' => _Check(key: const ValueKey('check'), p: p, qs: qs, onScore: (r) => _set(scoreCheck(st, r, day))),
      _ => _Recite(
        key: const ValueKey('recite'),
        p: p,
        closing: cl,
        missing: missingSteps(st, exists, 'recite'),
        onMissing: () => goStep(missingSteps(st, exists, 'recite').first),
        onFinish: finish,
      ),
    };
  }

  Widget _gate(BuildContext context, String g) {
    final data = store.data;
    final unit = content.unitOf(lesson.id);
    final introduced = {for (final i in data.introductions) i.lessonId};
    // locked inside an open unit: name the lesson that comes first (UX minor 7)
    final firstId = g == 'locked' && unit != null && CourseProgress.of(data, content.units).open(unit)
        ? unit.lessonIds.take(unit.lessonIds.indexOf(lesson.id)).where((id) => !introduced.contains(id)).firstOrNull
        : null;
    final firstName = firstId == null ? '' : content.getLesson(firstId)?.nameAr ?? '';
    final q = buildQueue(data, content.units, day);
    final due = q.sabqi.length + q.manzil.length > 0; // never send them to an empty review (UX minor 8)
    final reviewFirst = g == 'backlog' || (g == 'pace' && due);
    final title = g == 'backlog'
        ? t('Review first.')
        : g == 'pace'
        ? t('Come back tomorrow for this lesson.')
        : firstId != null
        ? bidi(t('Finish {x} first.', {'x': firstName}))
        : unit != null
        ? bidi(t('This lesson opens later, in unit {n} \u00b7 {name}.', {'n': unit.n, 'name': unit.nameAr}))
        : t('This lesson is not in the course yet.');
    final body = g == 'backlog'
        ? t('More than 15 reviews are overdue. New lessons resume when you catch up.')
        : g == 'pace'
        ? '${t('Two new lessons a day is the pace that sticks.')} ${due ? t('Do your review today.') : t('Nothing is due: recite your recent passages from Today, or come back tomorrow.')}'
        : t("Lessons open one after another. You can read the card now; reading it doesn't add it to your reviews.");
    return PageBody(items: [
      LessonHeader(lesson: lesson),
      EmptyState(
        icon: g == 'pace' ? Icons.bedtime_outlined : g == 'backlog' ? Icons.history : Icons.lock_outline,
        title: title,
        body: body,
        action: Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.sm, children: [
          if (reviewFirst) AppButton(label: t('Review'), onPressed: () => go(context, 'review?go=1')),
          if (firstId != null) AppButton(label: bidi(t('Go to {x}', {'x': firstName})), onPressed: () => go(context, href('learn', firstId), replace: true)),
          AppButton(
            label: t('Read the card'),
            variant: reviewFirst || firstId != null ? ButtonVariant.secondary : ButtonVariant.primary,
            onPressed: () => go(context, href('rules', lesson.id)),
          ),
        ]),
      ),
    ]);
  }

  Widget _done(BuildContext context) {
    final c = context.c, ty = context.type;
    final after = buildQueue(store.data, content.units, day);
    final firstTime = store.data.introductions.where((i) => i.lessonId == lesson.id).firstOrNull?.on == day;
    final nextId = after.sabaq != null && after.sabaq != lesson.id ? after.sabaq : null;
    final score = checkScore(st);
    final cl = course.closing;
    return PageBody(items: [
      LessonHeader(lesson: lesson),
      Panel(children: [
        Center(
          child: Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(color: c.secondaryContainer, shape: BoxShape.circle),
            child: Icon(Icons.star, size: 32, color: c.onSecondaryContainer),
          ),
        ),
        Semantics(
          header: true,
          liveRegion: true,
          child: Tx(
            firstTime ? t('{x} is done. It comes back in your review tomorrow.', {'x': lesson.nameAr}) : t('{x}: practised again.', {'x': lesson.nameAr}),
            textAlign: TextAlign.center,
            style: ty.headlineMd.copyWith(color: c.onSurface),
          ),
        ),
        Wrap(alignment: WrapAlignment.center, spacing: Space.sm, runSpacing: Space.sm, children: [
          if (cl != null) AppChip(icon: Icons.verified_outlined, label: bidi(t('Recited {x}', {'x': rangeRef(cl.from, cl.to)}))),
          if (score.m > 0) AppChip(icon: Icons.fact_check_outlined, tone: ChipTone.primary, label: t('Checks: {n} of {m}', {'n': score.n, 'm': score.m})),
        ]),
      ]),
      Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.sm, children: [
        if (nextId != null)
          AppButton(
            label: bidi(t('Next lesson: {x}', {'x': content.getLesson(nextId)?.nameAr ?? ''})),
            iconEnd: Icons.arrow_forward,
            size: ButtonSize.lg,
            onPressed: () => go(context, href('learn', nextId), replace: true),
          ),
        AppButton(
          label: t('Back to today'),
          size: nextId != null ? ButtonSize.normal : ButtonSize.lg,
          variant: nextId != null ? ButtonVariant.secondary : ButtonVariant.primary,
          onPressed: () => go(context, 'today'),
        ),
      ]),
    ]);
  }
}

/// The done line, gone on the first tap (LessonShell DoneLine).
class _OnceLine extends StatefulWidget {
  const _OnceLine({super.key, required this.text});
  final String text;
  @override
  State<_OnceLine> createState() => _OnceLineState();
}

class _OnceLineState extends State<_OnceLine> {
  bool _shown = true;
  @override
  Widget build(BuildContext context) => !_shown
      ? const SizedBox.shrink()
      : Listener(behavior: HitTestBehavior.translucent, onPointerDown: (_) => setState(() => _shown = false), child: DoneLine(text: widget.text));
}

Widget _bottom(BuildContext context, {String? hint, required Widget child}) => BottomBar(hint: hint, child: child);

Widget _nextButton(String label, VoidCallback? onPressed) =>
    AppButton(label: label, iconEnd: Icons.arrow_forward, size: ButtonSize.lg, block: true, onPressed: onPressed);

/* ---------------- Hear ---------------- */

class _Hear extends StatefulWidget {
  const _Hear({super.key, required this.p, required this.exs, this.notice});
  final StepProps p;
  final List<Example> exs;
  final String? notice;
  @override
  State<_Hear> createState() => _HearState();
}

class _HearState extends State<_Hear> {
  late final sp = ExStepper(widget.exs.length);
  @override
  Widget build(BuildContext context) {
    final p = widget.p, ex = widget.exs[sp.at];
    final ok = sp.played(sp.at) || p.wasDone;
    return PageBody(
      items: [
        ...p.head,
        ExampleCard(
          key: ValueKey(ex.id),
          ex: ex,
          audio: p.audio,
          stepper: sp,
          onGo: (i) => setState(() => sp.go(i)),
          played: sp.played(sp.at),
          onPlayed: () {
            final at = sp.at;
            setState(() => sp.markPlayed(at));
            if (sp.allPlayed) p.onDone();
          },
        ),
        if (widget.notice != null) Callout(kind: CalloutKind.listenFor, title: t('Listen for'), child: Tx(widget.notice!)),
      ],
      bottom: _bottom(
        context,
        hint: ok ? null : (sp.last ? tn('Play the word to continue.', 'Play all {n} words to continue.', widget.exs.length) : t('Play this word to continue.')),
        child: _nextButton(
          sp.last ? p.nextLabel : t('Next word'),
          !ok
              ? null
              : () {
                  if (sp.last) return p.onNext();
                  p.audio.stop();
                  setState(() => sp.go(sp.at + 1));
                },
        ),
      ),
    );
  }
}

/* ---------------- Notice ---------------- */

class _Notice extends StatefulWidget {
  const _Notice({super.key, required this.p, required this.other, required this.ex});
  final StepProps p;
  final Lesson other;
  final Example ex;
  @override
  State<_Notice> createState() => _NoticeState();
}

class _NoticeState extends State<_Notice> {
  late final List<Example> pair = () {
    final ex = widget.ex, lesson = widget.p.lesson;
    final mp = minimalPair(lesson.examples, widget.other.examples);
    final xs = ex.contrast != null ? [ex, ex.contrast!] : mp != null ? [mp.$1, mp.$2] : [ex, widget.other.examples.first];
    return lesson.id.length.isOdd ? xs : xs.reversed.toList(); // fixed per lesson, not always first
  }();
  final _played = <int>{};
  int? _picked;

  @override
  Widget build(BuildContext context) {
    final p = widget.p, c = context.c, ty = context.type;
    final answer = pair.indexWhere((e) => e.lessonId == p.lesson.id);
    final both = _played.length >= 2;
    return PageBody(
      items: [
        ...p.head,
        for (final (i, ex) in pair.indexed)
          ExampleCard(
            key: ValueKey(ex.id),
            ex: ex,
            audio: p.audio,
            hidden: _picked == null,
            played: _played.contains(i),
            onPlayed: () => setState(() => _played.add(i)),
            eyebrow: '${i == 0 ? t('Sound A') : t('Sound B')}${_picked == i ? t(' \u00b7 your pick') : ''}',
            children: [
              if (_picked == null)
                if (both)
                  AppButton(
                    label: t('This one'),
                    icon: Icons.touch_app_outlined,
                    variant: ButtonVariant.secondary,
                    onPressed: () {
                      setState(() => _picked = i);
                      p.onDone();
                    },
                  )
                else
                  const SizedBox.shrink()
              else if (i == answer)
                Callout(kind: CalloutKind.tip, icon: Icons.check_circle_outline, title: t('Has the sound.'), child: Tx(t('This is {x}, the rule you learn next.', {'x': p.lesson.nameAr})))
              else
                Callout(icon: Icons.remove, title: t("Doesn't have it."), child: Tx(t('This is {x}, an earlier rule.', {'x': widget.other.nameAr}))),
            ],
          ),
        if (_picked != null)
          Semantics(
            liveRegion: true,
            child: Text(
              _picked == answer ? t('Yes, you heard it.') : t('Not this time. Play both again now that you can see them.'),
              textAlign: TextAlign.center,
              style: ty.bodyLg.weight(500).copyWith(color: c.onSurface),
            ),
          ),
      ],
      bottom: _bottom(
        context,
        hint: _picked == null && !p.wasDone ? (both ? t('Pick the one with the sound to continue.') : t('Play both sounds, then pick one.')) : null,
        child: _nextButton(p.nextLabel, _picked == null && !p.wasDone ? null : p.onNext),
      ),
    );
  }
}

/* ---------------- Learn ---------------- */

class _LearnStep extends StatelessWidget {
  const _LearnStep({super.key, required this.p, required this.ex});
  final StepProps p;
  final Example? ex;
  @override
  Widget build(BuildContext context) => PageBody(
    items: [
      ...p.head,
      ?_videoLink(context, p.lesson.id),
      TeachView(lesson: p.lesson, anchor: ex, audio: p.audio),
    ],
    bottom: _bottom(context, child: _nextButton(p.nextLabel, () {
      p.onDone();
      p.onNext();
    })),
  );
}

/// Where م. علاء حامد explains this rule in his course (content/videos.json): a small link at the top end of the step.
Widget? _videoLink(BuildContext context, String lessonId) {
  final videos = content.raw['videos'] as Json;
  final v = (videos['lessons'] as Json)[lessonId] as Json?;
  if (v == null) return null;
  final ep = v['ep'] as int, secs = v['t'] as int;
  final id = (videos['episodes'] as List)[ep - 1];
  final c = context.c;
  return Align(
    alignment: AlignmentDirectional.centerEnd,
    child: InkWell(
      borderRadius: BorderRadius.circular(Radii.control),
      onTap: () => launchUrl(Uri.parse('https://www.youtube.com/watch?v=$id&t=${secs}s'), mode: LaunchMode.externalApplication),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: 44),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: Space.sm),
          child: Row(mainAxisSize: MainAxisSize.min, spacing: 6, children: [
            Icon(Icons.smart_display_outlined, size: 20, color: c.primary),
            Text(t('Watch it explained'), style: context.type.label.weight(600).copyWith(color: c.primary)),
            Icon(Icons.open_in_new, size: 14, color: c.outline),
          ]),
        ),
      ),
    ),
  );
}

/* ---------------- Say ---------------- */

class _Say extends StatefulWidget {
  const _Say({super.key, required this.p, required this.exs});
  final StepProps p;
  final List<Example> exs;
  @override
  State<_Say> createState() => _SayState();
}

class _SayState extends State<_Say> {
  late final sp = ExStepper(widget.exs.length);
  final _rated = <int, bool>{};
  final _recorded = <int>{}; // one attempt per word: a double tap never logs twice

  void _rate(bool same) {
    final p = widget.p, ex = widget.exs[sp.at];
    if (_recorded.add(sp.at)) {
      store.recordAttempt({
        'kind': 'lesson', 'refId': p.lesson.id, 'source': 'selfrate', 'exampleId': ex.id, //
        'chosen': same ? 'same' : 'not-yet', 'correct': same, 'countsForSchedule': false,
      });
    }
    p.audio.stop();
    setState(() {
      _rated[sp.at] = same;
      if (!sp.last) sp.go(sp.at + 1);
    });
    if (_rated.length >= widget.exs.length) p.onDone();
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.p;
    final drill = drillFor(p.lesson).isNotEmpty;
    if (widget.exs.isEmpty) {
      return PageBody(
        items: [
          ...p.head,
          if (drill) Drill(lesson: p.lesson, audio: p.audio) else Text(t('Say the examples on the card aloud, slowly.'), style: context.type.bodyLg),
        ],
        bottom: _bottom(context, child: _nextButton(p.nextLabel, () {
          p.onDone();
          p.onNext();
        })),
      );
    }
    final ex = widget.exs[sp.at];
    final prev = sp.at > 0 ? _rated[sp.at - 1] : null;
    final ok = sp.played(sp.at);
    final mine = _rated[sp.at];
    final canGo = _rated.length >= widget.exs.length || p.wasDone;
    final c = context.c;
    return PageBody(
      items: [
        ...p.head,
        if (drill && sp.at == 0)
          Column(crossAxisAlignment: CrossAxisAlignment.stretch, spacing: Space.sm, children: [
            Text(t('Warm-up \u00b7 say each one slowly'), style: context.type.label.weight(600).copyWith(color: c.secondary)),
            Drill(lesson: p.lesson, audio: p.audio),
          ]),
        if (prev != null && mine == null)
          _OnceLine(
            key: ValueKey('rated${sp.at}'),
            text: [
              t('Rated. Word {n} of {m}.', {'n': sp.at + 1, 'm': widget.exs.length}),
              if (!prev) t('Play the reciter again and listen for the highlighted part.'),
            ].join(' '),
          ),
        ExampleCard(
          key: ValueKey(ex.id),
          ex: ex,
          audio: p.audio,
          stepper: sp,
          onGo: (i) => setState(() => sp.go(i)),
          played: sp.played(sp.at),
          onPlayed: () {
            final at = sp.at;
            setState(() => sp.markPlayed(at));
          },
        ),
        VersesOf(
          key: ValueKey('rows:${ex.id}'),
          from: ex.verseKey,
          builder: (context, vs, _) => recorderCards(
            from: 'say:${ex.id}',
            audio: p.audio,
            recordN: 1,
            hideCompareUntilTake: true,
            reciter: vs == null || p.audio.offline ? null : () => p.audio.exampleThen(vs.first, ex, () {}),
            model: vs == null ? null : (path) => p.audio.exampleThen(vs.first, ex, () => playMe(p.audio.player, path)),
          ),
        ),
      ],
      bottom: canGo
          ? _bottom(context, child: _nextButton(p.nextLabel, p.onNext))
          : _bottom(
              context,
              hint: ok ? t('Did it sound the same?') : t('Play the reciter first, then rate yourself.'),
              child: Row(spacing: Space.sm, children: [
                Expanded(
                  child: AppButton(
                    label: t('Not yet'),
                    icon: Icons.replay,
                    variant: ButtonVariant.secondary,
                    size: ButtonSize.lg,
                    onPressed: ok ? () => _rate(false) : null,
                  ),
                ),
                Expanded(
                  child: AppButton(label: t('Sounds the same'), icon: Icons.done_all, size: ButtonSize.lg, onPressed: ok ? () => _rate(true) : null),
                ),
              ]),
            ),
    );
  }
}

/* ---------------- Find ---------------- */

class _Find extends StatefulWidget {
  const _Find({super.key, required this.p, required this.found});
  final StepProps p;
  final FindPick found;
  @override
  State<_Find> createState() => _FindState();
}

class _FindState extends State<_Find> {
  final _picked = <int>[];
  bool _checked = false;

  @override
  Widget build(BuildContext context) {
    final p = widget.p, c = context.c, ty = context.type;
    final (:v, :targets, :neutral) = widget.found;
    final marks = <int, WordMark>{};
    if (!_checked) {
      for (final n in _picked) {
        marks[n] = WordMark.ring;
      }
    } else {
      for (final n in targets) {
        marks[n] = _picked.contains(n) ? WordMark.found : WordMark.missed;
      }
      for (final n in _picked) {
        if (!targets.contains(n) && !neutral.contains(n)) marks[n] = WordMark.wrong;
      }
    }
    final missed = targets.where((n) => !_picked.contains(n)).length;
    final extra = _picked.where((n) => !targets.contains(n) && !neutral.contains(n)).length;
    return PageBody(
      items: [
        ...p.head,
        Panel(children: [
          Wrap(alignment: WrapAlignment.spaceBetween, crossAxisAlignment: WrapCrossAlignment.center, spacing: Space.sm, runSpacing: Space.sm, children: [
            AppChip(icon: Icons.bookmark_outline, label: verseRef(v.verseKey)),
            PlayButton(audio: p.audio, label: verseRef(v.verseKey), text: t('Play the ayah'), onTap: () => p.audio.ayah(v)),
          ]),
          VerseBlock(
            ayah: QAyah.of(v),
            size: VerseSize.focus,
            tajweed: false,
            chips: true,
            marks: marks,
            onWord: (n, _) => _checked ? null : setState(() => _picked.contains(n) ? _picked.remove(n) : _picked.add(n)),
          ),
          Text(t('Checked against tajweed data, which can miss a rule that depends on stopping.'), style: ty.caption.copyWith(color: c.onSurfaceVariant)),
        ]),
        if (_checked)
          Semantics(
            liveRegion: true,
            child: Text(
              missed == 0 && extra == 0
                  ? t('All found.')
                  : [if (missed > 0) t('{n} missed', {'n': missed}), if (extra > 0) t('{n} not this one', {'n': extra})].join(sep),
              textAlign: TextAlign.center,
              style: ty.bodyLg.weight(500).copyWith(color: c.onSurface),
            ),
          ),
        if (_checked && neutral.any(_picked.contains))
          Callout(child: Tx(t('The last word is not counted either way: stopping on it makes its \u0645\u062f an \u0639\u0627\u0631\u0636 \u0644\u0644\u0633\u0643\u0648\u0646, which you learn next.'))),
      ],
      bottom: _bottom(
        context,
        hint: !_checked && _picked.isEmpty ? t('Tap at least one word to check.') : null,
        child: _checked
            ? _nextButton(p.nextLabel, p.onNext)
            : AppButton(
                label: t('Check ({n} picked)', {'n': _picked.length}),
                icon: Icons.fact_check_outlined,
                size: ButtonSize.lg,
                block: true,
                onPressed: _picked.isEmpty
                    ? null
                    : () {
                        setState(() => _checked = true);
                        p.onDone();
                      },
              ),
      ),
    );
  }
}

/* ---------------- Check ---------------- */

class _Check extends StatefulWidget {
  const _Check({super.key, required this.p, required this.qs, required this.onScore});
  final StepProps p;
  final List<Question> qs;
  final ValueChanged<List<bool>> onScore;
  @override
  State<_Check> createState() => _CheckState();
}

class _CheckState extends State<_Check> {
  int _qi = 0;
  final _res = <bool>[];

  @override
  Widget build(BuildContext context) {
    final p = widget.p;
    final q = widget.qs[_qi];
    final last = _qi + 1 >= widget.qs.length;
    return PageBody(
      key: ValueKey('q$_qi'),
      items: [
        ...p.head,
        Instruction(icon: Icons.fact_check_outlined, text: t('Question {n} of {m}. Read it, then choose one answer.', {'n': _qi + 1, 'm': widget.qs.length})),
        QuestionView(
          key: ValueKey('chk$_qi'),
          q: q,
          mode: QMode.check,
          audio: p.audio,
          nextLabel: last ? p.nextLabel : t('Next question'),
          onAnswer: (chosen, correct) {
            store.recordAttempt({
              'kind': 'lesson', 'refId': q.lessonId, 'source': 'learn', 'questionKind': q.kind, 'exampleId': q.exampleId, //
              'chosen': chosen, 'correct': correct, 'countsForSchedule': false,
            });
            while (_res.length <= _qi) {
              _res.add(false);
            }
            _res[_qi] = correct;
            if (last) widget.onScore([..._res]);
          },
          onNext: () {
            if (last) return p.onNext();
            p.audio.stop();
            setState(() => _qi++);
          },
        ),
      ],
    );
  }
}

/* ---------------- Recite ---------------- */

class _Recite extends StatefulWidget {
  const _Recite({super.key, required this.p, required this.closing, required this.missing, required this.onMissing, required this.onFinish});
  final StepProps p;
  final ({String from, String to})? closing;
  final List<String> missing;
  final VoidCallback onMissing, onFinish;
  @override
  State<_Recite> createState() => _ReciteState();
}

class _ReciteState extends State<_Recite> {
  late bool _ready = widget.p.wasDone;
  void _markReady() => _ready ? null : setState(() => _ready = true);

  @override
  Widget build(BuildContext context) {
    final p = widget.p, cl = widget.closing;
    return PageBody(
      items: [
        ...p.head,
        if (cl != null) PassageRecite(from: cl.from, to: cl.to, audio: p.audio, onReady: _markReady) else _SayAll(lesson: p.lesson, audio: p.audio, onReady: _markReady),
      ],
      bottom: widget.missing.isNotEmpty
          ? _bottom(
              context,
              hint: t('Finishing needs every required step.'),
              child: _nextButton(
                tn('{n} step left: {x}', '{n} steps left: {x}', widget.missing.length, {'x': widget.missing.map(stepName).join(isAr ? '\u060c ' : ', ')}),
                widget.onMissing,
              ),
            )
          : _bottom(
              context,
              hint: _ready ? null : t('Listen or record first, then finish.'),
              child: AppButton(label: t('Finish lesson'), icon: Icons.check_circle_outline, size: ButtonSize.lg, block: true, onPressed: _ready ? widget.onFinish : null),
            ),
    );
  }
}

/// Recite fallback when the lesson has no closing passage: the first 5 examples, one at a time, with a recorder.
class _SayAll extends StatefulWidget {
  const _SayAll({required this.lesson, required this.audio, required this.onReady});
  final Lesson lesson;
  final StudyAudio audio;
  final VoidCallback onReady;
  @override
  State<_SayAll> createState() => _SayAllState();
}

class _SayAllState extends State<_SayAll> {
  late final List<Example> exs = () {
    final xs = widget.lesson.examples.take(5).toList();
    return xs.length > 2 ? [...xs.skip(2), ...xs.take(2)] : xs; // not Hear's first again
  }();
  late final sp = ExStepper(exs.length);

  @override
  void initState() {
    super.initState();
    if (exs.isEmpty) WidgetsBinding.instance.addPostFrameCallback((_) => widget.onReady());
  }

  @override
  Widget build(BuildContext context) {
    if (exs.isEmpty) return Drill(lesson: widget.lesson, audio: widget.audio);
    final ex = exs[sp.at], a = widget.audio;
    return ExampleCard(
      key: ValueKey(ex.id),
      ex: ex,
      audio: a,
      stepper: sp,
      goForward: true,
      onGo: (i) => setState(() => sp.go(i)),
      played: sp.played(sp.at),
      onPlayed: () {
        final at = sp.at;
        setState(() => sp.markPlayed(at));
        widget.onReady();
      },
      children: [
        VersesOf(
          from: ex.verseKey,
          builder: (context, vs, _) => recorderCards(
            key: ValueKey('rec:${ex.id}'),
            from: 'say:${ex.id}',
            audio: a,
            recordN: 1,
            reciter: vs == null || a.offline ? null : () => a.exampleThen(vs.first, ex, () {}),
            model: vs == null ? null : (path) => a.exampleThen(vs.first, ex, () => playMe(a.player, path)),
            onStatus: (_) => widget.onReady(),
          ),
        ),
      ],
    );
  }
}
