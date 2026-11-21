import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/audio/word_clip.dart';

void main() {
  test('wordSlice: PAD_BEFORE/AFTER, first word from 0, untimed = whole ayah (player.ts)', () {
    const t = [[1, 1, 250, 1420], [2, 2, 1430, 2150], [3, 3, 3000, 3820]];
    expect(wordSlice(t, 2, 3), (startMs: 1350, endMs: 3940));
    expect(wordSlice(t, 1, 1), (startMs: 0, endMs: 1540));
    expect(wordSlice(t, 4, 4), (startMs: 0, endMs: null));
    expect(ayahUrl('Husary_Muallim_128kbps', '9:1'), 'https://everyayah.com/data/Husary_Muallim_128kbps/009001.mp3');
  });
}
