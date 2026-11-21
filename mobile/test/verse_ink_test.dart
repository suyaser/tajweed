// The focus is coloured like the web (focus ink), as a colour-only run inside the word. The spike's finding must hold:
// the word stays joined and keeps every mark. Checked on بَرَآءَةٌ (9:1, the tanween the web once lost to a split
// highlight) and the mid-word focus in أَتُحَٰٓجُّوٓنِّى (6:80): the paragraph as shipped and the same text with the
// colour runs merged put the same ink on the focus word (same line width, ink within 1%), while dropping the tanween
// alone takes several percent. Set DUMP=<dir> to write the focus word zoomed (plain above, shipped below).
import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/quran/quran.dart';
import 'package:tajweed/quran/verse.dart';
import 'package:tajweed/ui/theme.dart';

import 'harness.dart';

Future<void> _font(String family, String asset) async => (FontLoader(family)..addFont(rootBundle.load(asset))).load();

typedef _Shot = ({ui.Image img, Uint8List alpha, TextPainter tp});

Future<_Shot> _paint(InlineSpan span, RichText like) async {
  final tp = TextPainter(text: span, textDirection: TextDirection.rtl, strutStyle: like.strutStyle, textHeightBehavior: like.textHeightBehavior)..layout();
  final rec = ui.PictureRecorder();
  tp.paint(Canvas(rec), Offset.zero);
  final img = await rec.endRecording().toImage(tp.width.ceil(), tp.height.ceil());
  final rgba = (await img.toByteData(format: ui.ImageByteFormat.rawRgba))!.buffer.asUint8List();
  return (img: img, alpha: Uint8List.fromList([for (var i = 3; i < rgba.length; i += 4) rgba[i]]), tp: tp);
}

/// Total alpha inside [box] (the focus word, padded).
int _ink(_Shot s, Rect box) {
  var sum = 0;
  final w = s.img.width;
  for (var y = box.top.floor().clamp(0, s.img.height); y < box.bottom.ceil().clamp(0, s.img.height); y++) {
    for (var x = box.left.floor().clamp(0, w); x < box.right.ceil().clamp(0, w); x++) {
      sum += s.alpha[y * w + x];
    }
  }
  return sum;
}

void main() {
  setUpAll(() async {
    await loadAll();
    await _font('Amiri Quran', 'assets/fonts/AmiriQuran-Regular.ttf');
    await _font('Amiri', 'assets/fonts/Amiri-Regular.ttf');
    await _font('Noto Naskh Arabic', 'assets/fonts/NotoNaskhArabic.ttf');
  });

  for (final (rule, key, from) in [('istiadha', '9:1', 1), ('lazim-k', '6:80', 4)]) {
    testWidgets('$key ($rule): the focus in the focus ink, joined, every mark kept', (tester) async {
      openTemp();
      final ex = content.getLesson(rule)!.examples.firstWhere((e) => e.verseKey == key && e.wordFrom == from);
      final v = (await tester.runAsync(() => getRange(key, key)))!.first;
      await tester.pumpWidget(
        MaterialApp(
          theme: buildTheme(brightness: Brightness.light, ar: true),
          home: Scaffold(
            body: VerseBlock(ayah: QAyah.of(v), wholeAyah: true, focus: (ex.wordFrom, ex.wordTo), focusText: ex.focus, tajweed: false),
          ),
        ),
      );
      final para = find.byWidgetPredicate((w) => w is RichText && w.text.style?.fontFamily == Fonts.quran);
      final rt = tester.widget<RichText>(para);
      final shipped = rt.text as TextSpan;
      final ink = Theme.of(tester.element(para)).extension<AppColors>()!.focusInk;

      // the focus is its own run, in the focus ink, and is the example's focus text
      final runs = shipped.children!.cast<TextSpan>();
      final coloured = runs.where((s) => s.style?.color == ink).map((s) => s.text!).join();
      expect(coloured, ex.focus);

      // baseline: the colours dropped and neighbouring pieces of the same font style merged (one run per font style)
      final merged = <TextSpan>[];
      for (final x in runs) {
        final st = x.style?.color == null ? x.style : (x.style!.fontSize == null ? null : TextStyle(fontSize: x.style!.fontSize));
        if (merged.isNotEmpty && merged.last.style == st) {
          merged.last = TextSpan(text: merged.last.text! + x.text!, style: st);
        } else {
          merged.add(TextSpan(text: x.text, style: st));
        }
      }
      final text = shipped.toPlainText(includeSemanticsLabels: false);
      final at = text.indexOf(ex.focus);
      final broken = merged.map((s) => TextSpan(text: s.text!.replaceAll('ٌ', ''), style: s.style)).toList(); // tanween dropped

      final (a, b, cut) = (await tester.runAsync(
        () async => (
          await _paint(shipped, rt),
          await _paint(TextSpan(style: shipped.style, children: merged), rt),
          await _paint(TextSpan(style: shipped.style, children: broken), rt),
        ),
      ))!;
      expect(a.img.width, b.img.width, reason: 'the coloured run changed the line width');
      // the focus word's box in the baseline, padded to its marks
      final boxes = b.tp.getBoxesForSelection(TextSelection(baseOffset: at, extentOffset: at + ex.focus.length));
      final r = boxes.map((x) => x.toRect()).reduce((p, q) => p.expandToInclude(q));
      final box = Rect.fromLTRB(r.left - 4, 0, r.right + 4, b.img.height.toDouble());
      final (ia, ib) = (_ink(a, box), _ink(b, box));
      expect(ib, greaterThan(20000), reason: 'real glyphs, not boxes');
      expect((ia - ib).abs() / ib, lessThan(0.01), reason: 'shipped $ia vs one run $ib: ink lost or added on the focus word');
      if (ex.focus.contains('ٌ')) {
        expect((ib - _ink(cut, box)) / ib, greaterThan(0.02), reason: 'the check must see a lost tanween');
      }

      if (Platform.environment['DUMP'] case final dir?) {
        await tester.runAsync(() async {
          final src = box.inflate(12).intersect(Offset.zero & Size(b.img.width.toDouble(), b.img.height.toDouble()));
          const z = 6.0;
          final rec = ui.PictureRecorder();
          final cv = Canvas(rec)..drawColor(const Color(0xFFFFFFFF), BlendMode.src);
          cv.drawImageRect(b.img, src, Rect.fromLTWH(0, 0, src.width * z, src.height * z), Paint());
          cv.drawImageRect(a.img, src, Rect.fromLTWH(0, src.height * z, src.width * z, src.height * z), Paint());
          final out = await rec.endRecording().toImage((src.width * z).ceil(), (src.height * z * 2).ceil());
          File('$dir/focus-${key.replaceAll(':', '_')}.png').writeAsBytesSync((await out.toByteData(format: ui.ImageByteFormat.png))!.buffer.asUint8List());
        });
      }
    });
  }
}
