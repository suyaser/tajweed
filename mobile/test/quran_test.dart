// Verse layout and the Quran widgets (Verse.tsx parity: focus ranges, pause marks, ayah ends, word taps).
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/i18n/i18n.dart';
import 'package:tajweed/quran/quran.dart';
import 'package:tajweed/quran/verse.dart';
import 'package:tajweed/ui/theme.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  setUpAll(() async {
    await loadArabic();
    useContent(await loadRawContent());
  });

  test('focusRanges: mid-word and across words', () {
    expect(focusRanges(['أَتُحَٰٓجُّوٓنِّى'], 1, 1, 'حَٰٓجُّوٓنِّ'), {1: (4, 16)});
    expect(focusRanges(['يَلْبَثُوٓا۟', 'إِلَّا'], 1, 2, 'وٓا۟ إِ'), {1: (8, 12), 2: (0, 2)});
    expect(focusRanges(['قُلْ'], 1, 1, 'xyz'), isNull);
  });

  test('layoutQuran: verse in brackets, focus text, pause mark after its word', () {
    final l = layoutQuran([const QAyah(key: '83:14', words: ['كَلَّا', 'بَلْ', 'رَانَ'], pauses: [(after: 2, mark: 'ۜ')])],
        brackets: true, focus: (2, 3), focusText: 'لْ');
    expect(l.text, '﴿\u00a0كَلَّا بَلْ\u00a0ۜ رَانَ\u00a0﴾');
    final (a, b) = l.focus.single;
    expect(l.text.substring(a, b), 'لْ');
    expect(l.text.substring(l.pauses.single.$1, l.pauses.single.$2), ' ۜ');
    final (w0, w1) = l.words['83:14/3']!;
    expect(l.text.substring(w0, w1), 'رَانَ');
    // focus text not found: the whole focus words, spaces included
    final whole = layoutQuran([const QAyah(key: '1:1', words: ['a', 'b', 'c'])], focus: (2, 3), focusText: 'zz');
    expect(whole.text.substring(whole.focus.single.$1, whole.focus.single.$2), 'b c');
  });

  test('layoutQuran: passage with ayah-end markers joined to the last word; tajweed colour runs', () async {
    final vs = await getRange('112:1', '112:2');
    final l = layoutQuran([for (final v in vs) QAyah.of(v, tajweed: true)], ayahEnds: true);
    expect(l.text, '${vs[0].text} ﴿١﴾ ${vs[1].text} ﴿٢﴾');
    final (e0, e1) = l.ayahEnds['112:2']!;
    expect(l.text.substring(e0, e1), '﴿٢﴾');
    // the colour runs cover exactly the coloured segments (hamzat al-wasl of ٱللَّهُ)
    expect(l.colours.map((c) => c.$2), containsAll(['silent', 'qalqalah']));
    final ((c0, c1), _) = l.colours.first;
    expect(l.text.substring(c0, c1), 'ٱ');
  });

  test('getRange crosses surahs; needsBasmala', () async {
    final r = await getRange('113:5', '114:2');
    expect(r.map((v) => v.verseKey), ['113:5', '114:1', '114:2']);
    expect([needsBasmala('1:1'), needsBasmala('9:1'), needsBasmala('112:1'), needsBasmala('112:2')], [false, false, true, false]);
  });

  Widget host(Widget child) => MaterialApp(
    theme: buildTheme(brightness: Brightness.light, ar: true),
    home: Scaffold(body: SingleChildScrollView(child: child)),
  );

  testWidgets('Passage: word taps and ayah-end taps; surah opening for ayah 1', (tester) async {
    final vs = await tester.runAsync(() => getRange('112:1', '112:4'));
    final taps = <String>[];
    final sem = tester.ensureSemantics();
    await tester.pumpWidget(host(Passage(
      ayahs: [for (final v in vs!) QAyah.of(v)],
      current: (key: '112:1', word: 3),
      currentAyah: '112:1',
      onWord: (k, n, text) => taps.add('$k/$n $text'),
      onAyah: (k) => taps.add('end $k'),
    )));
    expect(find.text('سورة ${content.surahName(112)}'), findsOneWidget);
    // the paragraph's words are semantics nodes of their own: named (the lit one with its state) and tappable
    expect(find.semantics.byLabel('${vs[0].words[2]}${t(', ')}${t('playing')}'), findsOne);
    tester.semantics.tap(find.semantics.byLabel(t('Ayah {n}', {'n': 2})));
    tester.semantics.tap(find.semantics.byLabel(vs[2].words[1]));
    sem.dispose();
    expect(taps, ['end 112:2', '112:3/2 ${vs[2].words[1]}']);
  });

  testWidgets('VerseBlock chips: WordTokens with marks and badges', (tester) async {
    final v = (await tester.runAsync(() => getVerse('114:4')))!;
    int? tapped;
    await tester.pumpWidget(host(VerseBlock(
      ayah: QAyah.of(v),
      chips: true,
      marks: const {1: WordMark.found, 2: WordMark.missed},
      onWord: (n, _) => tapped = n,
      stopping: true,
      reference: '${content.surahName(114)} ${arDigits(4)}',
    )));
    expect(find.byType(WordToken), findsNWidgets(v.words.length));
    expect(find.text(t('Found')), findsOneWidget);
    expect(find.text(t('Missed')), findsOneWidget);
    await tester.tap(find.byType(WordToken).at(2));
    expect(tapped, 3);
  });
}
