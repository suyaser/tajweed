// Port of src/quran/index.ts and data.ts: the surah loader over the synced data (assets/shared/data/surah/NNN.json)
// and the tajweed colour segments. Offsets in the data are code points, so text is cut by runes, never by UTF-16 units.
import 'dart:convert';

import 'package:flutter/services.dart';

import '../core/types.dart';

/// Basmala as it prefixes ayah 1 in the pinned Tanzil text (escaped: editors reorder shadda and fatha).
const basmalaPrefix =
    '\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064E\u0647\u0650 \u0671\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650 ';
final basmala = basmalaPrefix.trim();

final _cache = <int, Future<List<Verse>>>{};

/// Tests: each test runs in its own zone, and a future cached by an earlier one never completes in the next.
void clearSurahCache() => _cache.clear();

/// Surah `n`'s verses. Memoised; a failed load is retried next call.
Future<List<Verse>> loadSurah(int n, [AssetBundle? bundle]) => _cache.putIfAbsent(n, () {
  final f = (bundle ?? rootBundle)
      .loadString('assets/shared/data/surah/${'$n'.padLeft(3, '0')}.json')
      .then((s) => [for (final v in jsonDecode(s) as List) Verse(v as Json)]);
  f.then((_) {}, onError: (Object _) => _cache.remove(n));
  return f;
});

(int, int) _parse(VerseKey k) {
  final [s, a] = k.split(':');
  return (int.parse(s), int.parse(a));
}

Future<Verse?> getVerse(VerseKey key) async {
  final (s, a) = _parse(key);
  return (await loadSurah(s)).elementAtOrNull(a - 1);
}

/// Verses from..to inclusive, across surah boundaries.
Future<List<Verse>> getRange(VerseKey from, VerseKey to) async {
  final (s1, a1) = _parse(from);
  final (s2, a2) = _parse(to);
  final all = await Future.wait([for (var s = s1; s <= s2; s++) loadSurah(s)]);
  return [
    for (final (i, vs) in all.indexed) ...vs.sublist(s1 + i == s1 ? a1 - 1 : 0, s1 + i == s2 ? a2 : vs.length),
  ];
}

/// cpfair rule \u2192 palette key (design \u00A73.2), as RULE_COLOUR in src/quran/index.ts.
const ruleColours = {
  'ghunnah': 'ghunnah', 'ikhfa': 'ghunnah', 'ikhfa_shafawi': 'ghunnah', 'iqlab': 'ghunnah', //
  'idghaam_ghunnah': 'ghunnah', 'idghaam_shafawi': 'ghunnah', 'idghaam_mutajanisayn': 'merge', 'idghaam_mutaqaribayn': 'merge',
  'idghaam_no_ghunnah': 'silent', 'lam_shamsiyyah': 'silent', 'hamzat_wasl': 'silent', 'silent': 'silent',
  'madd_2': 'madd2', 'madd_muttasil': 'madd45', 'madd_munfasil': 'madd45', 'madd_246': 'madd246', 'madd_6': 'madd6',
  'qalqalah': 'qalqalah',
};
const colourKeys = {'clear', 'ghunnah', 'silent', 'merge', 'madd2', 'madd45', 'madd246', 'madd6', 'qalqalah', 'heavy', 'light'};
String? ruleColour(String rule) => ruleColours[rule] ?? (colourKeys.contains(rule) ? rule : null);

class Segment {
  Segment(this.text, [this.rule]) : colour = rule == null ? null : ruleColour(rule);
  Segment._(this.text, this.rule, this.colour);
  String text;
  final String? rule, colour;
  Map<String, Object> toJson() => {'text': text, 'rule': ?rule, 'colour': ?colour};
}

/// verse.text split into consecutive segments covering it exactly. Where spans overlap the shortest covering span
/// wins (ties: the later one, so 'ours' after 'cpfair').
List<Segment> tajweedSpans(Verse v) {
  final cps = v.text.runes.toList();
  final spans = v.tajweed;
  final pts = {0, cps.length, for (final s in spans) ...[s.start.clamp(0, cps.length), s.end.clamp(0, cps.length)]}.toList()..sort();
  final out = <Segment>[];
  for (var i = 0; i + 1 < pts.length; i++) {
    final a = pts[i], b = pts[i + 1];
    TajweedSpan? best;
    for (final s in spans) {
      if (s.start <= a && s.end >= b && (best == null || s.end - s.start <= best.end - best.start)) best = s;
    }
    final text = String.fromCharCodes(cps.sublist(a, b));
    final last = out.lastOrNull;
    if (last != null && last.rule == best?.rule) {
      last.text += text;
    } else {
      out.add(Segment(text, best?.rule));
    }
  }
  return out;
}

/// tajweedSpans grouped per word (verse.words order); spans crossing a space are split at it.
List<List<Segment>> wordSegments(Verse v) {
  final words = <List<Segment>>[[]];
  for (final seg in tajweedSpans(v)) {
    for (final (i, part) in seg.text.split(' ').indexed) {
      if (i > 0) words.add([]);
      if (part.isNotEmpty) words.last.add(Segment._(part, seg.rule, seg.colour));
    }
  }
  return words;
}

/// Ayah 1 of every surah but al-Fatiha (its ayah 1 is the basmala) and at-Tawba (none) is preceded by the basmala.
bool needsBasmala(VerseKey k) {
  final (s, a) = _parse(k);
  return a == 1 && s != 1 && s != 9;
}
