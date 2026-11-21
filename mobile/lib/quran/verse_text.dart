import 'dart:math';

import 'package:flutter/material.dart';

/// Port of `focusRanges` (src/components/Verse.tsx): UTF-16 offsets [start, end) of the first `text`
/// inside words `from..to` (1-based inclusive), per word. Null when not found.
Map<int, (int, int)>? focusRanges(List<String> words, int from, int to, String text) {
  final ws = words.sublist(from - 1, to);
  final i = ws.join(' ').indexOf(text);
  if (i < 0 || text.isEmpty) return null;
  final q = <int, (int, int)>{};
  var off = 0;
  for (var k = 0; k < ws.length; k++) {
    final a = max(i, off), b = min(i + text.length, off + ws[k].length);
    if (a < b) q[from + k] = (a - off, b - off);
    off += ws[k].length + 1;
  }
  return q;
}

/// One paragraph string for a verse, as the web's VerseBlock lays it out (﴿ words ﴾, pause marks after their
/// word with NBSP), plus the UTF-16 ranges of that string to highlight and of the pause marks.
({String text, List<(int, int)> ranges, List<(int, int)> pauses}) layoutVerse(
  List<String> words, {
  Map<int, String> pauses = const {}, // 1-based word -> mark
  (int, int)? focus,
  String? focusText,
}) {
  final q = focus != null && focusText != null ? focusRanges(words, focus.$1, focus.$2, focusText) : null;
  final b = StringBuffer('\ufd3f\u00a0');
  final ranges = <(int, int)>[], pauseRanges = <(int, int)>[];
  int? wholeStart;
  for (var n = 1; n <= words.length; n++) {
    if (n > 1) b.write(' ');
    final at = b.length;
    b.write(words[n - 1]);
    final r = q?[n];
    if (r != null) ranges.add((at + r.$1, at + r.$2));
    // focusText not found: the whole focus words, spaces included (the web's <mark> around the tokens)
    if (q == null && focus != null) {
      if (n == focus.$1) wholeStart = at;
      if (n == focus.$2) ranges.add((wholeStart!, b.length));
    }
    if (pauses[n] != null) {
      pauseRanges.add((b.length, b.length + 1 + pauses[n]!.length));
      b.write('\u00a0${pauses[n]}');
    }
  }
  b.write('\u00a0\ufd3e');
  return (text: b.toString(), ranges: ranges, pauses: pauseRanges);
}

/// Quran text in ONE style run, with the focus drawn behind it by a painter from `getBoxesForSelection`:
/// splitting a word into styled runs is what lost marks on the web (Verse.tsx WordToken). `inkSplit` turns on
/// the web's focus-ink colour as a colour-only TextSpan split, to test whether that alone hurts shaping.
class VerseText extends StatelessWidget {
  const VerseText({
    super.key,
    required this.text,
    required this.ranges,
    this.pauses = const [],
    required this.ink,
    required this.pauseInk,
    required this.focusBg,
    required this.focusInk,
    this.fontSize = 30,
    this.inkSplit = false,
  });

  final String text;
  final List<(int, int)> ranges, pauses;
  final Color ink, pauseInk, focusBg, focusInk;
  final double fontSize;
  final bool inkSplit;

  @override
  Widget build(BuildContext context) {
    final style = TextStyle(
      fontFamily: 'Amiri Quran',
      fontFamilyFallback: const ['Amiri', 'Noto Naskh Arabic'],
      fontSize: fontSize,
      color: ink,
    );
    return LayoutBuilder(builder: (context, c) {
      final tp = TextPainter(
        text: TextSpan(style: style, children: _spans()),
        textDirection: TextDirection.rtl,
        textAlign: TextAlign.start,
        textScaler: MediaQuery.textScalerOf(context),
        strutStyle: StrutStyle(fontFamily: 'Amiri Quran', fontSize: fontSize, height: 2.05, forceStrutHeight: true),
        textHeightBehavior: const TextHeightBehavior(applyHeightToFirstAscent: true),
      )..layout(maxWidth: c.maxWidth);
      return Semantics(
        label: text,
        child: CustomPaint(size: tp.size, painter: _FocusPainter(tp, ranges, focusBg, fontSize)),
      );
    });
  }

  /// Words stay whole: the only runs are the pause marks (between words, as the web's span.pause: 0.8em,
  /// secondary) and, with `inkSplit`, the focus ink.
  List<TextSpan> _spans() {
    final runs = [
      for (final r in pauses) (r, TextStyle(fontSize: fontSize * 0.8, color: pauseInk)),
      if (inkSplit) for (final r in ranges) (r, TextStyle(color: focusInk)),
    ]..sort((x, y) => x.$1.$1 - y.$1.$1);
    final out = <TextSpan>[];
    var at = 0;
    for (final ((a, b), style) in runs) {
      out.add(TextSpan(text: text.substring(at, a)));
      out.add(TextSpan(text: text.substring(a, b), style: style));
      at = b;
    }
    out.add(TextSpan(text: text.substring(at)));
    return out;
  }
}

class _FocusPainter extends CustomPainter {
  _FocusPainter(this.tp, this.ranges, this.bg, this.fontSize);
  final TextPainter tp;
  final List<(int, int)> ranges;
  final Color bg;
  final double fontSize;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = bg;
    final lines = tp.computeLineMetrics();
    for (final (a, b) in ranges) {
      for (final box in tp.getBoxesForSelection(TextSelection(baseOffset: a, extentOffset: b))) {
        // The boxes are strut-high (2.05em). Like the web's <mark>, cover the glyphs' own band instead:
        // above the upper marks to below the lower ones, plus the 0.12em spread, rounded like rounded-md.
        final mid = (box.top + box.bottom) / 2;
        final line = lines.firstWhere((l) => mid <= l.baseline + l.descent, orElse: () => lines.last);
        final em = fontSize;
        final r = Rect.fromLTRB(box.left - em * 0.12, line.baseline - em * 1.25, box.right + em * 0.12, line.baseline + em * 0.75);
        canvas.drawRRect(RRect.fromRectAndRadius(r, const Radius.circular(6)), paint);
      }
    }
    tp.paint(canvas, Offset.zero);
  }

  @override
  bool shouldRepaint(_FocusPainter old) => old.tp != tp || old.bg != bg;
}
