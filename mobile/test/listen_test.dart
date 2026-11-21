// Listen: range parsing as range.ts, the passage and transport (play, loop, gap, a word tap), listening counted.
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app/services.dart';
import 'package:tajweed/audio/player.dart';
import 'package:tajweed/i18n/i18n.dart';
import 'package:tajweed/quran/verse.dart';
import 'package:tajweed/screens/listen.dart';

import 'harness.dart';

void main() {
  setUpAll(loadAll);
  setUp(() => makePlayer = () => Player(out: InstantOut(), online: () async => true));
  tearDown(() => lang.value = Lang.ar);

  test('parseRange / capRange (range.ts)', () {
    openTemp();
    expect(parseRange('1:1-1:7'), (from: '1:1', to: '1:7'));
    expect(parseRange('93:5'), (from: '93:5', to: '93:5'));
    expect(parseRange('93:1-5'), (from: '93:1', to: '93:5'));
    expect(parseRange('112'), (from: '112:1', to: '112:4'));
    expect(parseRange('112:1-114:6'), (from: '112:1', to: '114:6'));
    for (final bad in ['93-5', '115', '1:8', '2:5-2:3', 'x', null]) {
      expect(parseRange(bad), isNull, reason: '$bad');
    }
    expect(capRange((from: '2:1', to: '3:20')), (from: '2:1', to: '3:14')); // 286 + 14 = 300
  });

  for (final l in Lang.values) {
    testWidgets('112 (${l.name}): text, play, loop and gap, a word', (tester) async {
      openTemp(language: l);
      seedLearner(1);
      await open(tester, 'listen/112');
      expect(find.byType(Passage), findsOneWidget);
      expect(find.text(t('Recitation player')), findsNothing); // a semantics label, not text
      await tap(tester, find.bySemanticsLabel(RegExp('^${RegExp.escape(t('Play'))} ')));
      await tap(tester, find.textContaining(t('Loop')));
      expect(find.textContaining(digits('×3')), findsOneWidget);
      await tap(tester, find.textContaining(t('Gap')));
      await tap(tester, find.textContaining(t('Colours')));
      expect(store.data.settings.tajweedColours, true);
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('a bad link says so and opens al-Fatihah', (tester) async {
    openTemp();
    seedLearner(1);
    await open(tester, 'listen/999');
    expect(find.textContaining(t("That passage link isn't valid, so here is {label}.", {'label': ''}).split('{').first.trim().substring(0, 8)), findsOneWidget);
  });
}
