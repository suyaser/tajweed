// Port of src/content/rulemap.ts: cpfair rule names \u2192 lesson ids, and which other lessons also show in some words
// (Find step targets, closing passages). Arabic in the patterns is written as \u escapes (never typed: see README).
import '../core/types.dart';

/// cpfair / our rule names \u2192 lesson ids. First id is the usual one.
const ruleLessons = <String, List<String>>{
  'ghunnah': ['ghunnah'], 'ikhfa': ['ikhfa'], 'ikhfa_shafawi': ['m-ikhfa'], 'iqlab': ['iqlab'], 'idghaam_ghunnah': ['idgh-g'],
  'idghaam_shafawi': ['m-idgham'], 'idghaam_no_ghunnah': ['idgh-n'], 'idghaam_mutajanisayn': ['mutajanisayn'],
  'idghaam_mutaqaribayn': ['mutaqaribayn'], 'lam_shamsiyyah': ['lam-s'], 'hamzat_wasl': ['ibtida'], 'madd_2': ['tabii'],
  'madd_muttasil': ['muttasil'], 'madd_munfasil': ['munfasil', 'silah-k'], 'madd_246': ['arid', 'lin'], 'madd_6': ['lazim-k', 'lazim-h'],
  'qalqalah': ['qal-s', 'qal-k'],
};

int _len(String s) => s.runes.length;

/// Code-point [start, end) of 1-based word `n` in verse.text.
(int, int) wordSpan(Verse v, int n) {
  final w = v.words;
  var start = 0;
  for (var i = 0; i < n - 1; i++) {
    start += _len(w.elementAtOrNull(i) ?? '') + 1;
  }
  return (start, start + _len(w.elementAtOrNull(n - 1) ?? ''));
}

final _haraka = RegExp('[\u064E-\u0650]');
const _shadda = '\u0651', _sukun = '\u0652', _dagger = '\u0670';
final _letter = RegExp('[\u0621-\u063A\u0641-\u064A\u0671]');
bool _isLetter(String c) => _letter.hasMatch(c);
const _hamza = '(?:[\u0621\u0623\u0625\u0624\u0626]|\u0640\u0654)';

/// [letter, its marks] of one word.
List<(String, String)> _units(String word) {
  final out = <(String, String)>[];
  for (final r in word.runes) {
    final c = String.fromCharCode(r);
    if (_isLetter(c)) {
      out.add((c, ''));
    } else if (out.isNotEmpty) {
      out.last = (out.last.$1, out.last.$2 + c);
    }
  }
  return out;
}

final _allah = RegExp('\u0644([\u0650\u0651]*)\u0644\u0651\u064E\u0647[\u064E-\u0650](?:\u0645\u0651\u064E)?\$');
String? _lastVowel(String s) => RegExp('[\u064B-\u0650](?=[^\u064B-\u0650]*\$)').firstMatch(s)?[0];
// A word that ends in a sukun and takes a vowel before hamzat al-wasl; + ta' at-ta'nith.
final _moved = RegExp(
  '^(?:[\u0648\u0641]\u064E)?(\u0642\u064F\u0644\u0650|\u0642\u064F\u0645\u0650|\u0623\u064E\u0646\u0650|\u0625\u0650\u0646\u0650|'
  '\u0645\u064E\u0646\u0650|\u0639\u064E\u0646\u0650|\u0645\u0650\u0646\u064E|\u0642\u064E\u062F\u0650|\u0644\u064E\u0642\u064E\u062F\u0650|'
  '\u0623\u064E\u0648\u0650|\u0644\u064E\u0648\u0650|\u064A\u064E\u0643\u064F\u0646\u0650|\u062A\u064E\u0643\u064F\u0646\u0650|\u0625\u0650\u0630\u0650|'
  '\u0628\u064E\u0644\u0650|\u0644\u0651?\u064E\u0670\u0643\u0650\u0646\u0650)\$|[^\u0627\u0670]\u064E\u062A\u0650\$',
);

/// The lam of the name Allah in `word`: light after a kasra (in the word or `prev`), else heavy.
String? _allahLam(String word, String? prev) {
  final m = _allah.firstMatch(word);
  if (m == null) return null;
  if (m[1]!.contains('\u0650')) return 'lam-jl';
  final before = word.substring(0, m.start).replaceFirst(RegExp('\u0671\$'), '');
  final v = before.isNotEmpty ? _lastVowel(before) ?? '\u064E' : prev != null ? _lastVowel(prev) : null;
  return v != null && RegExp('[\u064C\u064D\u0650\u064B]').hasMatch(v) ? 'lam-jl' : 'lam-jh';
}

final _natural = RegExp('\u064E\u0627(?!\u0653)|\u0670(?!\u0653)|\u064F\u0648(?![\u064B-\u0653\u06E1])|\u0650\u064A(?![\u064B-\u0653\u06E1])');
final _sakinaynEnd = RegExp('([\u0627\u0649\u0648][\u06DF\u0670]?|[\u064B-\u064D][\u0627\u0649]?|[\u0647\u0643\u062A][\u064F\u0650]\u0645\u064F)\$');
final _silah = RegExp('\u0647[\u064F\u0650][\u06E5\u06E6]\$');
final _hamzaStart = RegExp('^[\u0621\u0623\u0625\u0624\u0626\u0671]');
final _mithlLast = RegExp('[\u0628-\u0644\u0647-\u064A]');
final _badal = RegExp('$_hamza(?:\u064E[\u0627\u0670]|\u064F\u0648|\u0650[\u064A\u0649])(?![\u064B-\u0653\u06DF])');
final _aqwa = RegExp('$_hamza(?:\u064E\u0622|[\u064E-\u0650][\u0627\u0648\u064A\u0670]\u0653)');
final _tafkhim = RegExp('[\u062E\u0635\u0636\u063A\u0637\u0642\u0638]');
final _dadZha = RegExp('[\u0636\u0638]');
final _silentLetters = RegExp('[\u06DF\u06E0]');
final _izhar = RegExp('(\u0646\u0652|[\u064B-\u064D]\\S*)\\s*[\u0621\u0623\u0625\u0624\u0626\u0647\u0639\u062D\u063A\u062E]');
final _mIzhar = RegExp('\u0645\u0652\\s*[\u0621-\u0627\u0629-\u063A\u0641-\u0644\u0646-\u064A]');
final _hamzaLetter = RegExp('[\u0621\u0623\u0625\u0624\u0626]');
final _iwad = RegExp('[\u064B]\u0627?\$');

/// Rules the text shows that cpfair leaves unmarked, or that depend on stopping (see rulemap.ts textLessons).
List<String> _textLessons(String t, bool stopping, String? prev, String? next) {
  final out = <String>[];
  final words = t.split(' ');
  for (final (i, w) in words.indexed) {
    final p = i > 0 ? words[i - 1] : prev;
    final nx = i < words.length - 1 ? words[i + 1] : stopping ? null : next;
    final lam = _allahLam(w, p);
    if (lam != null) out.add(lam);
    final us = _units(w);
    final body = nx == null && stopping ? us.sublist(0, (us.length - 2).clamp(0, us.length)).map((u) => u.$1 + u.$2).join() : w;
    if (_natural.hasMatch(body)) out.add('tabii');
    if (nx == null) continue;
    if (nx.startsWith('\u0671') && (_sakinaynEnd.hasMatch(w) || _moved.hasMatch(w))) out.add('sakinayn');
    if (_silah.hasMatch(w) && !_hamzaStart.hasMatch(nx)) out.add('silah-s');
    final last = w.isEmpty ? '' : w.substring(w.length - 1);
    if (_mithlLast.hasMatch(last) && nx.startsWith('$last$_shadda')) out.add('mithlayn');
  }
  if (_badal.hasMatch(t)) out.add('badal');
  if (_aqwa.hasMatch(t)) out.add('aqwa-maddayn');
  if (_tafkhim.hasMatch(t)) out.add('tafkhim');
  if (_dadZha.hasMatch(t)) out.add('dad-zha');
  if (_silentLetters.hasMatch(t)) out.add('silent-letters');
  if (t.contains('\u06EA')) out.add('imalah');
  if (t.contains('\u06EB')) out.add('ishmam');
  if (t.contains('\u06EC')) out.add('tashil');
  if (_izhar.hasMatch(t)) out.add('izhar');
  if (_mIzhar.hasMatch(t)) out.add('m-izhar');
  if (t.contains('\u0671\u0644\u0652')) out.add('lam-q');
  if (stopping) {
    final u = _units(t.split(' ').last);
    final prev = u.length >= 2 ? u[u.length - 2] : null, last = u.lastOrNull;
    if (prev != null && last != null && last.$1 != '\u0627' && last.$1 != '\u0649') {
      final (l, m) = prev;
      if (m.contains(_dagger) || l == '\u0627' || ((l == '\u0648' || l == '\u064A' || l == '\u0649') && !_haraka.hasMatch(m) && !m.contains(_shadda))) {
        out.add(m.contains(_sukun) && (l == '\u0648' || l == '\u064A') ? 'lin' : 'arid');
      }
      if ('\u0642\u0637\u0628\u062C\u062F'.contains(last.$1)) out.add('qal-k');
      final h = u.length >= 3 ? u[u.length - 3] : null;
      if ('\u0627\u0648\u064A'.contains(l) && h != null && (_hamzaLetter.hasMatch(h.$1) || h.$2.contains('\u0654'))) out.add('aqwa-maddayn');
    }
    if (_iwad.hasMatch(t)) out.add('iwad');
  }
  return out;
}

/// One span \u2192 the lesson it shows, where cpfair's rule name covers several lessons.
String? _spanLesson(String rule, String span, bool stoppedOn) {
  if (rule == 'madd_246') return span.contains(_sukun) ? 'lin' : 'arid';
  if (rule == 'madd_6') return RegExp('[\u0646\u0642\u0635\u0639\u0633\u0644\u0643\u0645]\u0653').hasMatch(span) ? 'lazim-h' : 'lazim-k';
  if (rule == 'madd_munfasil') return RegExp('[\u06E5\u06E6]').hasMatch(span) ? 'silah-k' : 'munfasil';
  if (rule == 'qalqalah') return stoppedOn ? 'qal-k' : 'qal-s';
  return ruleLessons[rule]?.first;
}

/// Lesson ids, other than the example's own, whose rule also shows in the example's words: from the verse's tajweed
/// spans on those words, from the text itself, and any lesson that lists the same words (`others`).
List<String> alsoLessons(Example ex, Verse? verse, List<Example> others, {bool startOnly = false}) {
  final w = verse?.words;
  String? at(int i) => w != null && i >= 0 && i < w.length ? w[i] : null;
  final ids = <String>{
    ..._textLessons(ex.text, ex.stopping, at(ex.wordFrom - 2), at(ex.wordTo)),
  };
  if (verse != null) {
    final a = wordSpan(verse, ex.wordFrom).$1, b = wordSpan(verse, ex.wordTo).$2;
    final cps = verse.text.runes.map(String.fromCharCode).toList();
    List<String> slice(int x, int y) => cps.sublist(x.clamp(0, cps.length), y.clamp(x.clamp(0, cps.length), cps.length));
    for (final s in verse.tajweed) {
      if (s.start >= b || s.end <= a || (startOnly && s.start < a)) continue;
      final span = slice(s.start, s.end + 1).join(); // + the mark after: a span can stop before its sukun
      final atEnd = !slice(s.end, b).any(_isLetter);
      ids.add(_spanLesson(s.rule, span, ex.stopping && atEnd) ?? '');
    }
    ids.remove('');
  }
  for (final o in others) {
    if (o.verseKey == ex.verseKey && o.wordFrom <= ex.wordTo && o.wordTo >= ex.wordFrom) ids.add(o.lessonId);
  }
  ids.remove(ex.lessonId);
  return ids.toList()..sort();
}

Example _wordEx(Verse v, int from, int to) => Example({
  'id': '', 'lessonId': '', 'verseKey': v.verseKey, 'wordFrom': from, 'wordTo': to, //
  'text': v.words.sublist(from - 1, to).join(' '), 'focus': '', 'stopping': to == v.words.length,
});

/// Lesson ids whose rule shows anywhere in the ayah, read with a stop at its end (closing passages).
List<String> lessonsInAyah(Verse v) => alsoLessons(_wordEx(v, 1, v.words.length), v, const []);

/// 1-based word numbers in the ayah that show `lessonId` (Find step). Empty when the data can't detect it.
List<int> findTargets(Verse v, String lessonId) => [
  for (var n = 1; n <= v.words.length; n++)
    if (alsoLessons(_wordEx(v, n, n), v, const [], startOnly: true).contains(lessonId)) n,
];
