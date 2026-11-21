// UI language (port of src/i18n/index.ts, src/screens/study/i18n.tsx tn, src/components/bidi.ts).
// The web's contract: t('English text', {vars}) looks the English key up in src/i18n/ar/*.json (synced to
// assets/shared/i18n/ar/). One language at a time; switching rebuilds the app (TajweedApp), like the web's reload.
// Free of app imports (docs/19 §2.9). No Arabic literals here: editors normalise them, so they are \u escapes.
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

enum Lang { en, ar }

/// The language in use. Arabic by default (decision log #48, #59).
final lang = ValueNotifier<Lang>(Lang.ar);
bool get isAr => lang.value == Lang.ar;

/// Arabic dictionary, keyed by the exact English text.
final Map<String, String> ar = {};

/// Loads every src/i18n/ar/*.json (synced) into [ar]. Call once before the first frame.
Future<void> loadArabic([AssetBundle? bundle]) async {
  final b = bundle ?? rootBundle;
  final files = (await AssetManifest.loadFromAssetBundle(b))
      .listAssets()
      .where((a) => a.startsWith('assets/shared/i18n/ar/') && a.endsWith('.json'));
  for (final f in files) {
    ar.addAll((jsonDecode(await b.loadString(f)) as Map).cast<String, String>());
  }
}

const _arDigits = '\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669';

/// Arabic-Indic digits (always), for ayah numbers and references.
String arDigits(Object n) => n.toString().replaceAllMapped(RegExp(r'\d'), (m) => _arDigits[int.parse(m[0]!)]);

/// Arabic-Indic digits in the Arabic UI; unchanged in English.
String digits(Object s) => isAr ? arDigits(s) : s.toString();

/// Separator between items in a plain string: the Arabic comma in Arabic (a "·" reads as ٠ beside Arabic digits).
String get sep => isAr ? '\u060c ' : ' \u00b7 ';

/// The app's one riwayah, shown in Arabic in both UIs.
const riwayah = '\u0631\u0648\u0627\u064a\u0629 \u062d\u0641\u0635 \u0639\u0646 \u0639\u0627\u0635\u0645';

String _fill(String s, Map<String, Object>? vars) {
  if (vars == null) return s;
  for (final MapEntry(:key, :value) in vars.entries) {
    s = s.split('{$key}').join(value is num ? digits(value) : value.toString());
  }
  return s;
}

/// Translate a UI string; `{name}` placeholders from [vars] (numbers get Arabic-Indic digits in Arabic).
/// Missing translations fall back to English.
String t(String en, [Map<String, Object>? vars]) => _fill(isAr ? ar[en] ?? en : en, vars);

/// Pick between an English and an Arabic value (content fields that carry both).
T pick<T>(T en, T? arValue) => isAr && arValue != null && arValue != '' ? arValue : en;

/// CLDR plural category of an integer in Arabic (Intl.PluralRules('ar')).
String arPlural(num n) {
  if (n != n.truncate()) return 'other';
  final i = n.toInt(), h = i % 100;
  return i == 0
      ? 'zero'
      : i == 1
      ? 'one'
      : i == 2
      ? 'two'
      : h >= 3 && h <= 10
      ? 'few'
      : h >= 11 && h <= 99
      ? 'many'
      : 'other';
}

/// A counted phrase (port of study/i18n.tsx tn). English: [one] for 1, else [other]. Arabic: [other]'s value may hold
/// 'two|few|many|other' (with [one]'s value for 1) or 'one|two|few|many|other'; a single form serves every count.
String tn(String one, String other, num n, [Map<String, Object>? vars]) {
  final v = <String, Object>{'n': n, ...?vars};
  if (!isAr || (n == 1 && one != other)) return t(n == 1 ? one : other, v);
  final forms = (ar[other] ?? other).split('|');
  final cat = const {'one': 0, 'two': 1, 'zero': 2, 'few': 2, 'many': 3}[arPlural(n)] ?? 4;
  final s = forms.length == 5
      ? forms[cat]
      : forms.length == 4
      ? forms[cat - 1 < 0 ? 0 : cat - 1]
      : forms[0];
  return _fill(s, v);
}

/* ---------------- bidi (src/components/bidi.ts) ---------------- */

const _ar = r'\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff';
// A parenthesised Arabic group (a reference, a gloss) is one token, so its brackets stay balanced inside the island.
const _tok = '(?:[$_ar]+|\\([$_ar\\s\u00b7\u2013\u060c]+\\))';
final _run = RegExp('$_tok(?:[\\s\u060c\u061b\u2190\u00b7/\u2013\\-.]+$_tok)*');
final _arLetter = RegExp('[$_ar]');
final _latinLetter = RegExp('[A-Za-z]');

/// Content references `(16:125)`, `(7:111، 26:36)` become `(النحل ١٢٥)` (B4). [surahName] is 1-based.
String arRefs(String s, String Function(int) surahName) => s.replaceAllMapped(
  RegExp(r'\((\d{1,3}:\d{1,3}(?:[\u060c,]\s*\d{1,3}:\d{1,3})*)\)'),
  (m) =>
      '(${m[1]!.split(RegExp(r'[\u060c,]\s*')).map((k) {
        final [su, a] = k.split(':').map(int.parse).toList();
        return su >= 1 && su <= 114 ? '${surahName(su)} ${arDigits(a)}' : k;
      }).join('\u060c ')})',
);

/// True when a line has no Latin letters: its own RTL line, not an island in an LTR sentence.
bool isArabicLine(String s) => !_latinLetter.hasMatch(s) && _arLetter.hasMatch(s);

typedef Part = ({String text, bool island});

List<Part> _split(String s, RegExp re) {
  final out = <Part>[];
  var last = 0;
  for (final m in re.allMatches(s)) {
    if (m.start > last) out.add((text: s.substring(last, m.start), island: false));
    out.add((text: m[0]!, island: true));
    last = m.end;
  }
  if (last < s.length) out.add((text: s.substring(last), island: false));
  return out;
}

/// Arabic runs (island = Arabic) in an English line.
List<Part> splitBidi(String s) => _split(s, _run);

const _lw = r"[A-Za-z](?:[A-Za-z0-9'\u2019.\-@_/]*[A-Za-z0-9])?";
final _latin = RegExp('$_lw(?:[\\s,:&+]+(?:$_lw|\\d+(?:\\.\\d+)?))*');

/// Latin runs (island = Latin) in an Arabic line.
List<Part> splitLatin(String s) => _split(s, _latin);

/// A vowel mark with no letter under it (فتحة َ, the شدة in "(ّ)") sits on a tatweel, or it renders as ◌.
String carryMarks(String s) =>
    s.replaceAllMapped(RegExp('(^|[\\s(\u00ab"\'])([\u064b-\u0652\u0670])'), (m) => '${m[1]}\u0640${m[2]}');

/// Unicode isolates (ICU honours them inside one Text, docs/19 §2.5).
const lri = '\u2066', rli = '\u2067', fsi = '\u2068', pdi = '\u2069';

final _arChar = RegExp('[\u0600-\u06ff]');
bool _latinLine(String s) => _latinLetter.allMatches(s).length > _arChar.allMatches(s).length;

/// Mixed English–Arabic text as one string (the web's `T`): in English every Arabic run is an RTL isolate; in Arabic
/// every Latin run is an LTR isolate and digits are Arabic-Indic; an untranslated English line inside the Arabic UI
/// stays one LTR isolate with Arabic islands. [surahName] turns `(16:125)` references into surah names.
String bidi(String s, {String Function(int)? surahName}) {
  final c = carryMarks(surahName == null ? s : arRefs(s, surahName));
  String arIslands(String x) => splitBidi(x).map((p) => p.island ? '$rli${p.text}$pdi' : p.text).join();
  if (isAr && _latinLine(c)) return '$lri${arIslands(c)}$pdi';
  if (isAr) return splitLatin(digits(c)).map((p) => p.island ? '$lri${p.text}$pdi' : p.text).join();
  return arIslands(c);
}
