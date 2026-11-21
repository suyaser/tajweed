// Verse, WordToken and Passage: src/components/Verse.tsx. Quran text is ONE paragraph (RichText) per block, and every
// highlight is painted BEHIND it from the paragraph's own selection boxes: splitting a word into styled runs is what
// cut letters off their marks on the web (the tanween of 9:1). The only runs are the pause marks and brackets (smaller,
// between words) and, when asked for, the muṣḥaf tajweed colours (colour-only; golden-test before using them widely).
import 'dart:math';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

import '../content/content.dart';
import '../core/types.dart';
import '../i18n/i18n.dart';
import '../ui/theme.dart';
import 'quran.dart';

enum WordMark { lamp, lampDotted, ring, found, missed, wrong }

const _markLabel = {
  WordMark.lamp: 'playing', WordMark.lampDotted: 'playing', WordMark.ring: 'marked', //
  WordMark.found: 'found', WordMark.missed: 'missed', WordMark.wrong: 'not this rule',
};
const _pauseLabel = {
  '\u06D6': 'pause mark: continuing is better',
  '\u06D7': 'pause mark: stopping is better',
  '\u06D8': 'pause mark: stop',
  '\u06D9': 'pause mark: do not stop',
  '\u06DA': 'pause mark: stopping allowed',
  '\u06DB': 'pause mark: stop at one of the pair',
  '\u06DC': 'pause mark: sakt',
  '\u06E9': 'prostration mark',
};

/// The web's verse sizes (px, line height).
enum VerseSize {
  inline(24, 2.1),
  read(30, 2.2),
  focus(36, 2.1);

  const VerseSize(this.px, this.height);
  final double px, height;
}

typedef Range = (int, int);

/// UTF-16 offsets [start, end) of the first `text` inside words `from..to` (1-based inclusive), per word; null when
/// not found (Verse.tsx focusRanges).
Map<int, Range>? focusRanges(List<String> words, int from, int to, String text) {
  final ws = words.sublist(from - 1, to);
  final i = ws.join(' ').indexOf(text);
  if (i < 0 || text.isEmpty) return null;
  final q = <int, Range>{};
  var off = 0;
  for (var k = 0; k < ws.length; k++) {
    final a = max(i, off), b = min(i + text.length, off + ws[k].length);
    if (a < b) q[from + k] = (a - off, b - off);
    off += ws[k].length + 1;
  }
  return q;
}

/// One ayah (or an example's words) to lay out.
class QAyah {
  const QAyah({required this.key, required this.words, this.segments, this.pauses = const []});

  /// `tajweed`: carry the muṣḥaf colour segments.
  QAyah.of(Verse v, {bool tajweed = false}) : key = v.verseKey, words = v.words, segments = tajweed ? wordSegments(v) : null, pauses = v.marks;
  final VerseKey key;
  final List<String> words;
  final List<List<Segment>>? segments;
  final List<({int after, String mark})> pauses;
  int get n => int.parse(key.split(':')[1]);
}

/// The paragraph string and the ranges of its parts (UTF-16 offsets).
class QuranLayout {
  QuranLayout._(this.text, this.words, this.ayahs, this.ayahEnds, this.focus, this.pauses, this.brackets, this.colours);
  final String text;
  final Map<String, Range> words; // '2:5/3' → the word
  final Map<VerseKey, Range> ayahs, ayahEnds; // whole ayah (current-ayah tint); its \uFD3Fn\uFD3E marker
  final List<Range> focus, pauses, brackets;
  final List<(Range, String)> colours; // tajweed colour key per run
}

/// Lays ayahs out as the web does: a single verse in ﴿ … ﴾ (`brackets`), a passage with ﴿n﴾ after each ayah
/// (`ayahEnds`); pause marks after their word with NBSP (never wrap away from it); the ayah-end marker joined to the
/// last word. `focus` (1-based words of the first ayah) with `focusText`: only that substring; not found: the whole
/// words, spaces included.
QuranLayout layoutQuran(List<QAyah> ayahs, {bool brackets = false, bool ayahEnds = false, Range? focus, String? focusText}) {
  final b = StringBuffer();
  final words = <String, Range>{}, ayahR = <VerseKey, Range>{}, ends = <VerseKey, Range>{};
  final foc = <Range>[], pauses = <Range>[], br = <Range>[];
  final colours = <(Range, String)>[];
  void put(String s, List<Range> into) {
    final a = b.length;
    b.write(s);
    into.add((a, b.length));
  }

  if (brackets) {
    put('\uFD3F', br);
    b.write(' ');
  }
  for (final (ai, a) in ayahs.indexed) {
    final f = ai == 0 ? focus : null;
    final q = f != null && focusText != null ? focusRanges(a.words, f.$1, f.$2, focusText) : null;
    final a0 = b.length;
    int? wholeStart;
    for (var n = 1; n <= a.words.length; n++) {
      if (n > 1) b.write(' ');
      final at = b.length;
      final segs = a.segments?.elementAtOrNull(n - 1);
      if (segs != null && segs.map((s) => s.text).join() == a.words[n - 1]) {
        for (final s in segs) {
          final s0 = b.length;
          b.write(s.text);
          if (s.colour != null) colours.add(((s0, b.length), s.colour!));
        }
      } else {
        b.write(a.words[n - 1]);
      }
      words['${a.key}/$n'] = (at, b.length);
      final r = q?[n];
      if (r != null) foc.add((at + r.$1, at + r.$2));
      if (q == null && f != null) {
        if (n == f.$1) wholeStart = at;
        if (n == f.$2 && wholeStart != null) foc.add((wholeStart, b.length));
      }
      for (final p in a.pauses) {
        if (p.after == n) put(' ${p.mark}', pauses);
      }
    }
    if (ayahEnds) {
      b.write(' ');
      put('\uFD3F${arDigits(a.n)}\uFD3E', br);
      ends[a.key] = br.last;
    }
    ayahR[a.key] = (a0, b.length);
    if (ayahEnds && ai < ayahs.length - 1) b.write(' ');
  }
  if (brackets) {
    b.write(' ');
    put('\uFD3E', br);
  }
  return QuranLayout._(b.toString(), words, ayahR, ends, foc, pauses, br, colours);
}

Color tajweedColour(AppColors c, String key) => switch (key) {
  'clear' => c.tClear,
  'ghunnah' => c.tGhunnah,
  'silent' => c.tSilent,
  'merge' => c.tMerge,
  'madd2' => c.tMadd2, //
  'madd45' => c.tMadd45,
  'madd246' => c.tMadd246,
  'madd6' => c.tMadd6,
  'qalqalah' => c.tQalqalah,
  'heavy' => c.tHeavy,
  _ => c.tLight,
};

TextStyle quranStyle(BuildContext context, double px, {Color? color}) =>
    TextStyle(fontFamily: Fonts.quran, fontFamilyFallback: Fonts.quranFallback, fontSize: px, color: color ?? context.c.onSurface);

/// The paragraph with everything painted behind it. `marks` / `current` keyed '2:5/3'.
class QuranText extends StatefulWidget {
  const QuranText({
    super.key,
    required this.layout,
    this.size = VerseSize.inline,
    this.marks = const {},
    this.currentAyah,
    this.tajweed = false,
    this.isolate,
    this.onWord,
    this.onAyah,
    this.textAlign = TextAlign.start,
  });
  final QuranLayout layout;
  final VerseSize size;
  final Map<String, WordMark> marks;
  final VerseKey? currentAyah;
  final bool tajweed;
  final String? isolate; // Legend: only this colour, underlined
  final void Function(VerseKey key, int word, String text)? onWord;
  final void Function(VerseKey key)? onAyah;
  final TextAlign textAlign;

  @override
  State<QuranText> createState() => _QuranTextState();
}

class _QuranTextState extends State<QuranText> {
  final _para = GlobalKey();
  final _taps = <String, TapGestureRecognizer>{};

  TapGestureRecognizer _tap(String id, VoidCallback f) => (_taps[id] ??= TapGestureRecognizer())..onTap = f;

  @override
  void dispose() {
    for (final r in _taps.values) {
      r.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.c, w = widget, l = w.layout, px = w.size.px;
    final scaler = MediaQuery.textScalerOf(context);
    // Runs: words (for taps and their names), pause marks, brackets, colours. Words are cut only at their own edges,
    // and inside a word only by colour-only runs (tajweed colours, the focus ink).
    final cuts = <(Range, TextStyle?, String?)>[]; // range, style, word id
    for (final r in l.pauses) {
      cuts.add((r, TextStyle(fontSize: px * 0.8, color: c.secondary), null));
    }
    for (final r in l.brackets) {
      cuts.add((r, TextStyle(fontSize: px * 0.85, color: c.gold), null));
    }
    final words = w.onWord != null ? l.words.entries.toList() : const <MapEntry<String, Range>>[];
    final colourRuns = [
      if (w.tajweed)
        for (final (r, k) in l.colours)
          if (w.isolate == null || w.isolate == k) (r, k),
    ];
    final spans = <InlineSpan>[];
    var at = 0;
    // boundaries from every range, then one span per piece carrying its style and the word's recognizer
    final pts = <int>{
      0,
      l.text.length,
      for (final (r, _, _) in cuts) ...[r.$1, r.$2],
      for (final e in words) ...[e.value.$1, e.value.$2],
      for (final (r, _) in colourRuns) ...[r.$1, r.$2],
      for (final r in l.focus) ...[r.$1, r.$2],
    }.toList()..sort();
    for (var i = 0; i + 1 < pts.length; i++) {
      final a = pts[i], b = pts[i + 1];
      if (a >= b) continue;
      bool inR(Range r) => r.$1 <= a && b <= r.$2;
      TextStyle? style = cuts.where((x) => inR(x.$1)).firstOrNull?.$2;
      final col = colourRuns.where((x) => inR(x.$1)).firstOrNull;
      if (col != null) {
        style = TextStyle(
          color: tajweedColour(c, col.$2),
          decoration: w.isolate != null ? TextDecoration.underline : null,
          decorationColor: tajweedColour(c, col.$2),
        );
      }
      // the focus in the focus ink, as the web's mark.focus (a colour-only run: shaping across it is kept, see verse_ink_test)
      if (col == null && l.focus.any(inR)) style = (style ?? const TextStyle()).copyWith(color: c.focusInk);
      final word = words.where((e) => inR(e.value)).firstOrNull;
      GestureRecognizer? rec;
      String? label;
      if (word != null) {
        final [key, n] = word.key.split('/');
        final text = l.text.substring(word.value.$1, word.value.$2);
        rec = _tap(word.key, () => w.onWord!(key, int.parse(n), text));
        final m = w.marks[word.key];
        // one name per word: on its first piece; the other pieces of the word are silent
        label = a == word.value.$1 ? (m == null ? text : '$text${t(', ')}${t(_markLabel[m]!)}') : '';
      }
      final end = w.onAyah != null ? l.ayahEnds.entries.where((e) => inR(e.value)).firstOrNull : null;
      if (end != null) {
        rec = _tap('end ${end.key}', () => w.onAyah!(end.key));
        label = a == end.value.$1 ? t('Ayah {n}', {'n': int.parse(end.key.split(':')[1])}) : '';
      }
      final p = l.pauses.where(inR).firstOrNull;
      if (p != null && a == p.$1) label = t(_pauseLabel[l.text.substring(p.$1 + 1, p.$2)] ?? 'pause mark');
      spans.add(TextSpan(text: l.text.substring(a, b), style: style, recognizer: rec, semanticsLabel: label));
      at = b;
    }
    assert(at == l.text.length);
    final style = quranStyle(context, px);
    return CustomPaint(
      painter: _MarksPainter(_para, l, w.marks, w.currentAyah, c, scaler.scale(px)),
      child: RichText(
        key: _para,
        text: TextSpan(style: style, children: spans),
        textDirection: TextDirection.rtl,
        textAlign: w.textAlign,
        textScaler: scaler,
        strutStyle: StrutStyle(fontFamily: Fonts.quran, fontSize: px, height: w.size.height, forceStrutHeight: true),
        textHeightBehavior: const TextHeightBehavior(applyHeightToFirstAscent: true),
      ),
    );
  }
}

final _ratios = <(double, double?, double), double>{};

/// Where the baseline sits in a strut-high line (0..1), measured once per font size, line height and text scale.
double _baselineRatio(RenderParagraph rp) {
  final strut = rp.strutStyle!;
  return _ratios.putIfAbsent((strut.fontSize!, strut.height, rp.textScaler.scale(1)), () {
    final tp = TextPainter(
      text: TextSpan(text: '\u0628', style: (rp.text as TextSpan).style),
      textDirection: TextDirection.rtl,
      textScaler: rp.textScaler,
      strutStyle: strut,
      textHeightBehavior: rp.textHeightBehavior,
    )..layout();
    final lm = tp.computeLineMetrics().first;
    tp.dispose();
    return lm.baseline / lm.height;
  });
}

/// Paints focus, word marks and the current ayah behind the paragraph, from its selection boxes.
class _MarksPainter extends CustomPainter {
  _MarksPainter(this.para, this.l, this.marks, this.currentAyah, this.c, this.em);
  final GlobalKey para;
  final QuranLayout l;
  final Map<String, WordMark> marks;
  final VerseKey? currentAyah;
  final AppColors c;
  final double em;

  @override
  void paint(Canvas canvas, Size size) {
    final rp = para.currentContext?.findRenderObject() as RenderParagraph?;
    if (rp == null || !rp.hasSize) return;
    final ratio = _baselineRatio(rp);
    // The boxes are strut-high. Like the web's <mark>, cover the glyphs' own band instead: above the upper marks to
    // below the lower ones, plus a 0.12em spread. The baseline sits at the strut's own ascent (found once per line).
    Iterable<RRect> bands(Range r, {double spread = 0.12}) sync* {
      // one box per line: a range spans several runs, and their boxes overlap (stacked tints)
      // (runs of a smaller size have boxes with other tops: same line when their centres are within a line's height)
      final lines = <TextBox>[];
      for (final b in rp.getBoxesForSelection(TextSelection(baseOffset: r.$1, extentOffset: r.$2))) {
        final c = (b.top + b.bottom) / 2;
        final i = lines.indexWhere((o) => (c - (o.top + o.bottom) / 2).abs() < (o.bottom - o.top) / 2);
        if (i < 0) {
          lines.add(b);
        } else {
          final o = lines[i];
          final tall = b.bottom - b.top > o.bottom - o.top ? b : o; // the full-size run's line box
          lines[i] = TextBox.fromLTRBD(min(o.left, b.left), tall.top, max(o.right, b.right), tall.bottom, o.direction);
        }
      }
      for (final box in lines) {
        final base = box.top + (box.bottom - box.top) * ratio;
        yield RRect.fromRectAndRadius(
          Rect.fromLTRB(box.left - em * spread, base - em * 1.25, box.right + em * spread, base + em * 0.75),
          const Radius.circular(6),
        );
      }
    }

    void fill(Range r, Color col) {
      for (final b in bands(r)) {
        canvas.drawRRect(b, Paint()..color = col);
      }
    }

    void ring(Range r, Color col, {double dash = 0, double gap = 0}) {
      for (final b in bands(r, spread: 0.18)) {
        final paint = Paint()
          ..color = col
          ..style = PaintingStyle.stroke
          ..strokeWidth = 2;
        if (dash == 0) {
          canvas.drawRRect(b, paint);
        } else {
          for (final m in (Path()..addRRect(b)).computeMetrics()) {
            for (var d = 0.0; d < m.length; d += dash + gap) {
              canvas.drawPath(m.extractPath(d, min(d + dash, m.length)), paint);
            }
          }
        }
      }
    }

    final cur = currentAyah == null ? null : l.ayahs[currentAyah];
    if (cur != null) fill(cur, c.secondaryContainer.withValues(alpha: 0.45));
    for (final r in l.focus) {
      fill(r, c.focusBg);
    }
    for (final MapEntry(key: id, value: m) in marks.entries) {
      final r = l.words[id];
      if (r == null) continue;
      switch (m) {
        case WordMark.lamp:
          fill(r, c.secondaryContainer);
        case WordMark.lampDotted:
          ring(r, c.gold, dash: 2, gap: 3);
        case WordMark.ring:
          fill(r, c.focusBg);
          ring(r, c.focusInk);
        case WordMark.found:
          fill(r, c.successContainer);
          ring(r, c.success);
        case WordMark.missed:
          ring(r, c.gold, dash: 6, gap: 4);
        case WordMark.wrong:
          ring(r, c.outline, dash: 2, gap: 3);
      }
    }
  }

  @override
  bool shouldRepaint(_MarksPainter o) => o.l != l || !_sameMarks(o.marks, marks) || o.currentAyah != currentAyah || o.c != c || o.em != em;
  static bool _sameMarks(Map<String, WordMark> a, Map<String, WordMark> b) => a.length == b.length && a.entries.every((e) => b[e.key] == e.value);
}

/// One word on its own (Find chips): a tinted tile, its mark drawn around it and a labelled badge under it.
class WordToken extends StatelessWidget {
  const WordToken({super.key, required this.word, this.segments, this.mark, this.tajweed = false, this.onTap, this.size = VerseSize.inline});
  final String word;
  final List<Segment>? segments;
  final WordMark? mark;
  final bool tajweed;
  final VoidCallback? onTap;
  final VerseSize size;

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final px = size.px;
    final (Color bg, Color? border) = switch (mark) {
      WordMark.lamp => (c.secondaryContainer, null),
      WordMark.lampDotted || WordMark.missed => (c.surfaceContainerLow, c.gold),
      WordMark.ring => (c.focusBg, c.focusInk),
      WordMark.found => (c.successContainer, c.success),
      WordMark.wrong => (c.surfaceContainerLow, c.outline),
      null => (c.surfaceContainerLow, null),
    };
    final text = Text.rich(
      TextSpan(
        children: [
          if (tajweed && segments != null)
            for (final s in segments!)
              TextSpan(
                text: s.text,
                style: s.colour == null ? null : TextStyle(color: tajweedColour(c, s.colour!)),
              )
          else
            TextSpan(text: word),
        ],
      ),
      style: quranStyle(context, px),
      textDirection: TextDirection.rtl,
      strutStyle: StrutStyle(fontFamily: Fonts.quran, fontSize: px, height: 1.9, forceStrutHeight: true),
    );
    final badge = switch (mark) {
      WordMark.found => (Icons.check, 'Found', c.successContainer, c.onSuccessContainer),
      WordMark.missed => (Icons.error_outline, 'Missed', c.secondaryContainer, c.onSecondaryContainer),
      WordMark.wrong => (Icons.close, 'Not this one', c.surfaceContainerHigh, c.onSurfaceVariant),
      _ => null,
    };
    return Semantics(
      button: onTap != null,
      label: mark == null ? word : '$word${t(', ')}${t(_markLabel[mark]!)}',
      excludeSemantics: true,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Material(
            color: bg,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(6),
              side: border == null ? BorderSide.none : BorderSide(color: border, width: 2),
            ),
            child: InkWell(
              onTap: onTap,
              borderRadius: BorderRadius.circular(6),
              child: ConstrainedBox(
                constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Center(widthFactor: 1, child: text),
                ),
              ),
            ),
          ),
          if (badge != null)
            Container(
              margin: const EdgeInsets.only(top: 2, bottom: 4),
              padding: const EdgeInsetsDirectional.only(start: 4, end: 8),
              decoration: BoxDecoration(color: badge.$3, borderRadius: BorderRadius.circular(99)),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(badge.$1, size: 14, color: badge.$4),
                  const SizedBox(width: 2),
                  Text(t(badge.$2), style: ty.label.weight(600).copyWith(color: badge.$4, height: 1.7)),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

/// Surah title, and the basmala line for every surah except al-Fatiha (its ayah 1) and at-Tawba (none).
class SurahOpening extends StatelessWidget {
  const SurahOpening({super.key, required this.surah});
  final int surah;

  @override
  Widget build(BuildContext context) {
    final c = context.c;
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(vertical: 2),
            decoration: BoxDecoration(
              border: Border.symmetric(horizontal: BorderSide(color: c.secondaryContainer)),
            ),
            child: Semantics(
              header: true,
              child: Text(
                '\u0633\u0648\u0631\u0629 ${content.surahName(surah)}',
                textAlign: TextAlign.center,
                textDirection: TextDirection.rtl,
                style: TextStyle(fontFamily: Fonts.naskh, fontSize: 17.6, height: 1.6, color: c.secondary).weight(700),
              ),
            ),
          ),
          if (surah != 1 && surah != 9)
            QuranText(
              layout: layoutQuran([QAyah(key: '1:1', words: basmala.split(' '))], brackets: true),
              textAlign: TextAlign.center,
            ),
        ],
      ),
    );
  }
}

/// One verse or an example's words, in ﴿ … ﴾, with its caption (stop sign, reference, actions). `chips` lays tappable
/// words out as WordTokens (Find). Pass `verseKey` when the words are a whole ayah: ayah 1 gets the surah opening.
class VerseBlock extends StatelessWidget {
  const VerseBlock({
    super.key,
    required this.ayah,
    this.wholeAyah = false,
    this.reference,
    this.size = VerseSize.inline,
    this.tajweed = true,
    this.focus,
    this.focusText,
    this.current,
    this.marks = const {},
    this.isolate,
    this.onWord,
    this.stopping = false,
    this.actions = const [],
    this.chips = false,
  });
  final QAyah ayah;
  final bool wholeAyah;
  final String? reference;
  final VerseSize size;
  final bool tajweed;
  final Range? focus;
  final String? focusText;
  final int? current; // 1-based word now playing: lamp
  final Map<int, WordMark> marks;
  final String? isolate;
  final void Function(int word, String text)? onWord;
  final bool stopping;
  final List<Widget> actions;
  final bool chips;

  @override
  Widget build(BuildContext context) {
    final c = context.c, ty = context.type;
    final k = ayah.key;
    final m = {for (final e in marks.entries) '$k/${e.key}': e.value, if (current != null && !marks.containsKey(current)) '$k/$current': WordMark.lamp};
    final surah = int.parse(k.split(':')[0]);
    final body = chips
        ? Directionality(
            textDirection: TextDirection.rtl,
            child: Wrap(
              spacing: 4,
              runSpacing: 4,
              children: [
                for (var n = 1; n <= ayah.words.length; n++)
                  WordToken(
                    word: ayah.words[n - 1],
                    segments: ayah.segments?.elementAtOrNull(n - 1),
                    tajweed: tajweed,
                    mark: m['$k/$n'],
                    size: size,
                    onTap: onWord == null ? null : () => onWord!(n, ayah.words[n - 1]),
                  ),
              ],
            ),
          )
        : QuranText(
            layout: layoutQuran([ayah], brackets: true, focus: focus, focusText: focusText),
            size: size,
            marks: m,
            tajweed: tajweed,
            isolate: isolate,
            textAlign: size == VerseSize.focus ? TextAlign.center : TextAlign.start,
            onWord: onWord == null ? null : (_, n, text) => onWord!(n, text),
          );
    final caption = [
      if (stopping)
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 6),
          decoration: BoxDecoration(
            border: Border.all(color: c.onSurface),
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text.rich(
            TextSpan(
              children: [
                const TextSpan(text: '◼ \u0648\u0642\u0641'),
                if (!isAr)
                  TextSpan(
                    text: '$sep stopping here',
                    style: ty.label.copyWith(fontWeight: FontWeight.normal),
                  ),
              ],
            ),
            style: ty.label.weight(700).copyWith(color: c.onSurface),
          ),
        ),
      if (reference != null)
        Text(
          reference!,
          style: ty.arabicLabel.copyWith(color: c.onSurfaceVariant),
          textDirection: TextDirection.rtl,
        ),
      ...actions,
    ];
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (wholeAyah && ayah.n == 1) SurahOpening(surah: surah),
          body,
          if (caption.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Wrap(
                spacing: 12,
                runSpacing: 4,
                alignment: size == VerseSize.focus ? WrapAlignment.center : WrapAlignment.start,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: caption,
              ),
            ),
        ],
      ),
    );
  }
}

/// Several ayahs with ﴿n﴾ after each (a tap target that seeks to it when `onAyah` is set). Ayah 1 of a surah starts a
/// new paragraph after the surah opening. `marks` / `current` keyed by verse key and word.
class Passage extends StatelessWidget {
  const Passage({
    super.key,
    required this.ayahs,
    this.size = VerseSize.read,
    this.tajweed = false,
    this.currentAyah,
    this.current,
    this.marks = const {},
    this.isolate,
    this.onWord,
    this.onAyah,
  });
  final List<QAyah> ayahs;
  final VerseSize size;
  final bool tajweed;
  final VerseKey? currentAyah;
  final ({VerseKey key, int word})? current;
  final Map<String, WordMark> marks; // '2:5/3'
  final String? isolate;
  final void Function(VerseKey key, int word, String text)? onWord;
  final void Function(VerseKey key)? onAyah;

  @override
  Widget build(BuildContext context) {
    final groups = <List<QAyah>>[];
    for (final a in ayahs) {
      if (groups.isEmpty || a.n == 1) groups.add([]);
      groups.last.add(a);
    }
    final m = {...marks, if (current != null && !marks.containsKey('${current!.key}/${current!.word}')) '${current!.key}/${current!.word}': WordMark.lamp};
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final g in groups) ...[
            if (g.first.n == 1) SurahOpening(surah: int.parse(g.first.key.split(':')[0])),
            QuranText(
              layout: layoutQuran(g, ayahEnds: true),
              size: size,
              marks: m,
              currentAyah: currentAyah,
              tajweed: tajweed,
              isolate: isolate,
              onWord: onWord,
              onAyah: onAyah,
            ),
          ],
        ],
      ),
    );
  }
}
