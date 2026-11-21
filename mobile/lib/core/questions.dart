// Port of src/core/questions.ts. Spec §6.4: identify · length · fact.
import 'dart:math';

import '../i18n/i18n.dart';
import 'types.dart';

/// '4–5 counts' · Arabic 'حركتان' / '٤–٥ حركات'.
String countsText(Object x) => !isAr
    ? '$x counts'
    : '$x' == '2' || '$x' == '\u0662'
    ? '\u062d\u0631\u0643\u062a\u0627\u0646'
    : '${digits(x)} \u062d\u0631\u0643\u0627\u062a';

/// {id, labelAr, labelEn}
extension type Option(Json j) {
  String get id => j['id'];
  String get labelAr => j['labelAr'];
  String get labelEn => j['labelEn'];
}

/// The web's Question object. answerId: a lesson id (identify), a length id (length), an option index (fact).
extension type Question(Json j) {
  String get kind => j['kind'];
  String get lessonId => j['lessonId'];
  String get exampleId => j['exampleId']; // example or fact id; log it as Attempt.exampleId
  Example? get example => j['example'] == null ? null : Example(j['example']);
  FactQuestion? get fact => j['fact'] == null ? null : FactQuestion(j['fact']);
  String get prompt => j['prompt'];
  List<Option> get options => [for (final o in j['options'] as List) Option(o)];
  String get answerId => j['answerId'];
  bool? get stopping => j['stopping'];
  String get explanation => j['explanation'];
}

typedef Rng = double Function();

class QuestionCtx {
  QuestionCtx({
    required this.lessons,
    required Iterable<String> introduced,
    required this.munfasilLength,
    this.rng,
    this.kind,
    this.pretest = false,
    this.excludeExampleIds = const [],
    this.include,
    this.vs,
  }) : introduced = introduced.toList();
  final List<Lesson> lessons;
  final List<String> introduced; // lesson ids already introduced
  final int munfasilLength; // 4 | 5
  final Rng? rng; // inject a seeded one for determinism
  final String? kind; // force a kind (e.g. learn steps)
  final bool pretest;
  final List<String> excludeExampleIds; // e.g. examples already used in the lesson's pretest
  final String? include; // a lesson id that must be among the options (Learn's discrimination check)
  final String? vs; // contrast: exactly two options, this lesson and `vs` (relearn after a confusion)

  QuestionCtx copyWith({String? kind, List<String>? excludeExampleIds, String? include}) => QuestionCtx(
    lessons: lessons,
    introduced: introduced,
    munfasilLength: munfasilLength,
    rng: rng,
    kind: kind ?? this.kind,
    pretest: pretest,
    excludeExampleIds: excludeExampleIds ?? this.excludeExampleIds,
    include: include ?? this.include,
    vs: vs,
  );
}

int _imul(int a, int b) => (a * b).toSigned(32);

/// Small seeded PRNG (mulberry32), bit for bit the web's.
Rng seeded(int seed) {
  var s = seed.toSigned(32);
  return () {
    s = (s + 0x6d2b79f5).toSigned(32);
    var t = _imul(s ^ ((s & 0xffffffff) >> 15), 1 | s);
    t = ((t + _imul(t ^ ((t & 0xffffffff) >> 7), 61 | t)).toSigned(32) ^ t).toSigned(32);
    return ((t ^ ((t & 0xffffffff) >> 14)) & 0xffffffff) / 4294967296;
  };
}

final _random = Random();

List<T> shuffle<T>(List<T> a, Rng rng) {
  final r = [...a];
  for (var i = r.length - 1; i > 0; i--) {
    final j = (rng() * (i + 1)).floor();
    final x = r[i];
    r[i] = r[j];
    r[j] = x;
  }
  return r;
}

/// Never the last one; avoid [exclude] when possible; reuse only if the pool is that small.
T? _pick<T>(List<T> pool, String Function(T) id, String? last, List<String> exclude, Rng rng) {
  final notLast = pool.where((x) => id(x) != last).toList();
  final fresh = notLast.where((x) => !exclude.contains(id(x))).toList();
  final from = fresh.isNotEmpty ? fresh : (notLast.isNotEmpty ? notLast : pool);
  if (from.isEmpty) {
    rng(); // the web draws even from an empty pool
    return null;
  }
  return from[(rng() * from.length).floor()];
}

const lengths = [
  {'id': '2', 'labelAr': '\u0662', 'labelEn': '2'},
  {'id': '45', 'labelAr': '\u0664 \u0623\u0648 \u0665', 'labelEn': '4 or 5'},
  {'id': '246', 'labelAr': '\u0662 \u0623\u0648 \u0664 \u0623\u0648 \u0666', 'labelEn': '2, 4 or 6'},
  {'id': '6', 'labelAr': '\u0666', 'labelEn': '6'},
];
// Read at the same length in حفص من الشاطبية (المتصل = المنفصل); الصلة الكبرى follows the المنفصل.
const _munfasilLike = ['munfasil', 'muttasil', 'silah-k'];
String _lengthId(Counts c) => c.min == c.max ? '${c.min}' : (c.min == 2 && c.max == 6 ? '246' : '45');
final _letter = RegExp(r'[\u0621-\u063a\u0641-\u064a]');
List<String> _letters(String s) => [for (final r in s.runes) String.fromCharCode(r)].where(_letter.hasMatch).toList();

/// A length question needs one مد under the underline: not several opening letters at once (كٓهيعٓصٓ).
bool _lengthOk(Lesson lesson, Example ex) => lesson.id != 'lazim-h' || _letters(ex.focus).length == 1;

/// The deciding reason for one example (design §8.2): its own note, else a line built from the rule and the letter.
String reasonFor(Lesson lesson, Example ex) {
  if (ex.note != null && ex.note!.isNotEmpty) return ex.note!;
  final ls = _letters(ex.focus);
  final name = lesson.nameAr;
  if (ls.isNotEmpty) {
    final l = ls.last; // the letter after نْ / مْ / ال is the last one underlined
    if (lesson.topicId == 'nun') {
      final x = RegExp(r'[\u064b-\u064d]').hasMatch(ex.focus) ? '\u062a\u0646\u0648\u064a\u0646' : '\u0646\u0652';
      return t('{x} then {L} \u2192 {name}.', {'x': x, 'L': l, 'name': name});
    }
    if (lesson.topicId == 'meem') return t('{x} then {L} \u2192 {name}.', {'x': '\u0645\u0652', 'L': l, 'name': name});
    if (lesson.id == 'lam-q') return t('\u0627\u0644 then {L}, a moon letter: the \u0644 is said \u2192 {name}.', {'L': l, 'name': name});
    if (lesson.id == 'lam-s') return t('\u0627\u0644 then {L}, a sun letter: the \u0644 merges into it \u2192 {name}.', {'L': l, 'name': name});
    if (lesson.id == 'qal-s') return t('{x} with \u0633\u0643\u0648\u0646 \u2192 {name}.', {'x': ls[0], 'name': name});
    if (lesson.id == 'qal-k') return t('Stopping on {L} \u2192 {name}.', {'L': l, 'name': name});
    if (lesson.id == 'ghunnah') return t('{x} with \u0634\u062f\u0629: hold the \u063a\u0646\u0629 2 counts \u2192 {name}.', {'x': ls[0], 'name': name});
  }
  final c = lesson.counts;
  if (c != null) {
    final note = c.note;
    return note != null && note.isNotEmpty && RegExp('counts|\u062d\u0631\u0643').hasMatch(note)
        ? '$name: $note.'
        : t('{name}: {counts}. {more}', {
            'name': name,
            'counts': countsText(c.min == c.max ? c.min : '${c.min}\u2013${c.max}'),
            'more': note ?? lesson.summary,
          }); // no "2 counts. 2 counts"
  }
  return lesson.summary;
}

/// Distractors in order: confusable partners → same topic → any; within a tier, random. Never a lesson the words
/// also show.
List<Lesson> distractors(Lesson lesson, QuestionCtx ctx, Rng rng, [Example? example]) {
  final allowed = {...ctx.introduced};
  final also = {...?example?.also};
  final pool = ctx.lessons
      .where((l) => l.id != lesson.id && l.questionKinds.contains('identify') && !also.contains(l.id))
      .toList();
  if (ctx.vs != null) return pool.where((l) => l.id == ctx.vs).toList();
  final cw = lesson.confusableWith;
  final tiers = [
    pool.where((l) => cw.contains(l.id)).toList(),
    pool.where((l) => !cw.contains(l.id) && l.topicId == lesson.topicId).toList(),
    pool.where((l) => !cw.contains(l.id) && l.topicId != lesson.topicId).toList(),
  ].map((tier) => shuffle(tier, rng)).toList();
  final ordered = tiers.expand((x) => x).toList();
  final out = ordered.where((l) => l.id == ctx.include).toList();
  bool has(Lesson l) => out.any((o) => o.id == l.id);
  // pretest: one unfamiliar same-topic name besides the answer, so "the one I don't know" is not a giveaway
  if (ctx.pretest) {
    out.addAll(ordered.where((l) => !allowed.contains(l.id) && l.topicId == lesson.topicId && !has(l)).take(1));
  }
  for (final l in ordered) {
    if (out.length < 3 && allowed.contains(l.id) && !has(l)) out.add(l);
  }
  // ponytail: early on too few lessons are introduced; fill from the rest so there are always 4 options
  for (final l in ordered) {
    if (out.length < 3 && !has(l)) out.add(l);
  }
  return out;
}

Question? makeQuestion(String refId, QuestionCtx ctx, {String? lastExampleId, int? reps}) {
  final rng = ctx.rng ?? _random.nextDouble;
  final lesson = ctx.lessons.where((l) => l.id == refId).firstOrNull;
  if (lesson == null || lesson.questionKinds.isEmpty) return null;
  final kinds = lesson.questionKinds;
  final both = kinds.contains('identify') && kinds.contains('length');
  var kind = ctx.vs != null
      ? 'identify'
      : ctx.kind != null && kinds.contains(ctx.kind)
      ? ctx.kind!
      : both
      ? ((reps ?? 0) % 2 == 1 ? 'length' : 'identify')
      : kinds[0];
  final exclude = ctx.excludeExampleIds;

  if (kind == 'fact') {
    final fact = _pick(lesson.facts, (f) => f.id, lastExampleId, exclude, rng);
    if (fact == null) return null;
    // option ids stay the authored index, so the answer mapping survives the shuffle
    final options = shuffle([
      for (final (i, o) in fact.options.indexed) {'id': '$i', 'labelAr': o, 'labelEn': o},
    ], rng);
    return Question({
      'kind': kind, 'lessonId': lesson.id, 'exampleId': fact.id, 'fact': fact.j, 'prompt': fact.prompt, //
      'options': options, 'answerId': '${fact.answer}', 'explanation': fact.explanation,
    });
  }

  final example = _pick(lesson.examples, (e) => e.id, lastExampleId, exclude, rng);
  if (example == null) return null;
  final base = {'lessonId': lesson.id, 'exampleId': example.id, 'example': example.j, 'stopping': example.stopping};
  if (kind == 'length' && !_lengthOk(lesson, example)) kind = 'identify';

  final counts = lesson.counts;
  if (kind == 'length' && counts != null) {
    final n = ctx.munfasilLength;
    final munfasil = _munfasilLike.contains(lesson.id);
    final options = [
      for (final o in lengths)
        munfasil && o['id'] == '45' ? {'id': o['id'], 'labelAr': n == 4 ? '\u0664' : '\u0665', 'labelEn': '$n'} : o,
    ];
    final answer = options.firstWhere((o) => o['id'] == _lengthId(counts));
    final why = example.note ?? counts.note ?? lesson.summary;
    final explanation = munfasil
        ? t(
                "It's {n} counts, the length you chose for \u0627\u0644\u0645\u0646\u0641\u0635\u0644; \u0627\u0644\u0645\u062a\u0635\u0644 is read the same. {m} is also correct for \u062d\u0641\u0635 \u0645\u0646 \u0637\u0631\u064a\u0642 \u0627\u0644\u0634\u0627\u0637\u0628\u064a\u0629; keep one length throughout.",
                {'n': n, 'm': n == 4 ? 5 : 4},
              ) +
              (lesson.id == 'muttasil' ? t(' 6 is also allowed when you stop on a final \u0647\u0645\u0632\u0629.') : '') +
              (example.note != null && example.note!.isNotEmpty ? ' ${example.note}' : '')
        : RegExp(r'^[\d\u0660-\u0669]').hasMatch(why)
        ? t("It's {x}.", {'x': why})
        : t("It's {counts}: {why}", {'counts': countsText(pick(answer['labelEn']!, answer['labelAr'])), 'why': why});
    return Question({
      ...base, 'kind': kind, 'prompt': t('How many counts on the highlighted \u0645\u062f?'), //
      'options': options, 'answerId': answer['id'], 'explanation': explanation,
    });
  }

  final options = [
    for (final l in shuffle([lesson, ...distractors(lesson, ctx, rng, example)], rng))
      {'id': l.id, 'labelAr': l.nameAr, 'labelEn': l.nameEn},
  ];
  return Question({
    ...base,
    'kind': 'identify',
    'prompt': ctx.vs != null ? t('Which of the two is the highlighted part?') : t('Which rule is the highlighted part?'),
    'options': options,
    'answerId': lesson.id,
    'explanation': reasonFor(lesson, example),
  });
}

/// A lesson's Check step (v2 spec §3.6): up to 2 questions on different examples, plus a discrimination question.
/// Identify options come only from lessons already learned plus this one; never the same question twice.
List<Question> checkQuestions(Lesson lesson, List<Lesson> all, List<String> introduced, int munfasilLength, [Rng? rng]) {
  final known = {...introduced, lesson.id};
  final ctx = QuestionCtx(
    lessons: all.where((l) => known.contains(l.id)).toList(),
    introduced: introduced,
    munfasilLength: munfasilLength,
    rng: rng ?? _random.nextDouble,
  );
  bool fair(Question? q) => q != null && (q.kind != 'identify' || q.options.length >= 3);
  final qs = <Question>[];
  final seen = <String>{};
  void add(Question? q) {
    if (!fair(q)) return;
    final ex = q!.example;
    final key = '${q.kind}|${q.answerId}|${q.prompt}|${ex != null ? '${ex.text}|${ex.focus}' : q.exampleId}';
    if (seen.add(key)) qs.add(q);
  }

  final kind = lesson.questionKinds
      .where((k) => k != 'identify' || fair(makeQuestion(lesson.id, ctx.copyWith(kind: k))))
      .firstOrNull;
  if (kind != null) {
    for (var tries = 0; tries < 4 && qs.length < 2; tries++) {
      add(makeQuestion(
        lesson.id,
        ctx.copyWith(kind: kind, excludeExampleIds: [for (final q in qs) q.exampleId]),
        lastExampleId: qs.lastOrNull?.exampleId,
      ));
    }
  }
  String? older(List<String> ids) => ids
      .where((id) => introduced.contains(id) && (all.where((l) => l.id == id).firstOrNull?.questionKinds.contains('identify') ?? false))
      .firstOrNull;
  final partner = kind == 'identify'
      ? older(lesson.confusableWith) ??
            older([for (final l in all) if (l.topicId == lesson.topicId && l.id != lesson.id) l.id])
      : null;
  final contrast = partner != null ? makeQuestion(partner, ctx.copyWith(kind: 'identify', include: lesson.id)) : null;
  if (contrast?.options.any((o) => o.id == lesson.id) ?? false) add(contrast);
  return qs;
}
