// Port of src/core/types.ts. Every type is an extension type over its JSON map: the map IS the data, so a backup
// written here is the web's format by construction, unknown fields survive a round trip, and parity fixtures compare
// maps directly. Getters give the types; setters exist where the scheduler and store change a row.
typedef Json = Map<String, dynamic>;
typedef Day = String; // 'YYYY-MM-DD', the local day that starts at 03:00
typedef Iso = String; // ISO timestamp
typedef VerseKey = String; // '2:5'

List<T> _list<T>(Object? v, T Function(Json) f) => [for (final x in (v as List? ?? const [])) f(x as Json)];
List<String> _strings(Object? v) => (v as List? ?? const []).cast<String>();

/* ---------------- Content (bundled, read-only) ---------------- */

extension type Topic(Json j) {
  String get id => j['id'];
  String get nameAr => j['nameAr'];
  String get nameEn => j['nameEn'];
  String get intro => j['intro'];
  int get order => j['order'];
}

extension type Example(Json j) {
  String get id => j['id']; // `${lessonId}#${n}`
  String get lessonId => j['lessonId'];
  VerseKey get verseKey => j['verseKey'];
  int get wordFrom => j['wordFrom']; // 1-based, Tanzil Uthmani split on spaces, basmala removed
  int get wordTo => j['wordTo'];
  String get text => j['text'];
  String get focus => j['focus']; // substring of text that shows the rule
  bool get stopping => j['stopping'];
  String? get note => j['note'];
  List<String>? get also => (j['also'] as List?)?.cast<String>();
  String? get role => j['role']; // anchor | hear | say | notice | more
  Example? get contrast => j['contrast'] == null ? null : Example(j['contrast']);
}

extension type FactQuestion(Json j) {
  String get id => j['id'];
  String get lessonId => j['lessonId'];
  String get prompt => j['prompt'];
  List<String> get options => _strings(j['options']);
  int get answer => j['answer'];
  String get explanation => j['explanation'];
}

typedef Counts = ({int min, int max, String? note});

extension type Lesson(Json j) {
  String get id => j['id'];
  String get topicId => j['topicId'];
  int get order => j['order'];
  String get nameAr => j['nameAr'];
  String get nameEn => j['nameEn'];
  String? get colour => j['colour'];
  String get summary => j['summary'];
  String? get letters => j['letters'];
  Counts? get counts {
    final c = j['counts'] as Json?;
    return c == null ? null : (min: c['min'] as int, max: c['max'] as int, note: c['note'] as String?);
  }

  List<String>? get conditions => (j['conditions'] as List?)?.cast<String>();
  List<List<String>>? get list => (j['list'] as List?)?.map((x) => (x as List).cast<String>()).toList();
  String? get tip => j['tip'];
  List<Example> get examples => _list(j['examples'], Example.new);
  List<FactQuestion> get facts => _list(j['facts'], FactQuestion.new);
  List<String> get questionKinds => _strings(j['questionKinds']); // identify | length | fact
  List<String> get confusableWith => _strings(j['confusableWith']);
  List<({String title, String locator})> get sources => [
    for (final s in j['sources'] as List) (title: s['title'] as String, locator: s['locator'] as String),
  ];
  Json get review => j['review'];
}

extension type ConfusablePair(Json j) {
  String get id => j['id'];
  String get a => j['a'];
  String get b => j['b'];
  String get hint => j['hint'];
}

typedef Passage = ({VerseKey from, VerseKey to});

/// v2 course unit (content/course.json).
extension type Unit(Json j) {
  String get id => j['id'];
  int get n => j['n'];
  String get nameAr => j['nameAr'];
  String get nameEn => j['nameEn'];
  String get surahs => j['surahs'];
  String get intro => j['intro'];
  List<String> get lessonIds => _strings(j['lessonIds']);
  ({VerseKey from, VerseKey to, String label})? get finale {
    final f = j['finale'] as Json?;
    return f == null ? null : (from: f['from'] as String, to: f['to'] as String, label: f['label'] as String);
  }

  List<({String matn, int from, int to, String? note})> get mutun => [
    for (final m in j['mutun'] as List)
      (matn: m['matn'] as String, from: m['from'] as int, to: m['to'] as int, note: m['note'] as String?),
  ];
}

extension type CourseLesson(Json j) {
  Passage? get closing {
    final c = j['closing'] as Json?;
    return c == null ? null : (from: c['from'] as String, to: c['to'] as String);
  }

  String? get contrastWith => j['contrastWith'];
  String? get notice => j['notice'];
}

extension type MatnLine(Json j) {
  String get id => j['id']; // 'tuhfa-24'
  String get matn => j['matn']; // tuhfa | jazariyya
  int get n => j['n'];
  String get sadr => j['sadr'];
  String get ajz => j['ajz'];
  String? get page => j['page'];
  String? get url => j['url'];
  List<String> get lessonIds => _strings(j['lessonIds']);
  String? get gloss => j['gloss'];
  String get verified => j['verified'];
}

extension type Reciter(Json j) {
  String get id => j['id'];
  String get nameAr => j['nameAr'];
  String get nameEn => j['nameEn'];
  String get folder => j['folder'];
  String get style => j['style']; // muallim | murattal
  bool get hasTimings => j['hasTimings'];
}
