import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/audio/word_clip.dart';
import 'package:tajweed/quran/verse_text.dart';

void main() {
  test('focusRanges: mid-word and across words (Verse.tsx parity)', () {
    expect(focusRanges(['أَتُحَٰٓجُّوٓنِّى'], 1, 1, 'حَٰٓجُّوٓنِّ'), {1: (4, 16)});
    expect(focusRanges(['يَلْبَثُوٓا۟', 'إِلَّا'], 1, 2, 'وٓا۟ إِ'), {1: (8, 12), 2: (0, 2)});
    expect(focusRanges(['قُلْ'], 1, 1, 'xyz'), isNull);
  });

  test('layoutVerse: highlighted range is the focus text, pause mark after its word', () {
    final v = layoutVerse(['كَلَّا', 'بَلْ', 'رَانَ'], pauses: {2: 'ۜ'}, focus: (2, 3), focusText: 'لْ');
    expect(v.text, '﴿ كَلَّا بَلْ ۜ رَانَ ﴾');
    final (a, b) = v.ranges.single;
    expect(v.text.substring(a, b), 'لْ');
  });

  test('wordSlice: PAD_BEFORE/AFTER, first word from 0, untimed = whole ayah (player.ts)', () {
    const t = [[1, 1, 250, 1420], [2, 2, 1430, 2150], [3, 3, 3000, 3820]];
    expect(wordSlice(t, 2, 3), (startMs: 1350, endMs: 3940));
    expect(wordSlice(t, 1, 1), (startMs: 0, endMs: 1540));
    expect(wordSlice(t, 4, 4), (startMs: 0, endMs: null));
    expect(ayahUrl('Husary_Muallim_128kbps', '9:1'), 'https://everyayah.com/data/Husary_Muallim_128kbps/009001.mp3');
  });
}
