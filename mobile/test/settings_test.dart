// Settings: text size, theme, reciter, the folded munfasil length, teacher days, reset; ?s=wird scrolls there.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app/services.dart';
import 'package:tajweed/audio/player.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/i18n/i18n.dart';

import 'harness.dart';

void main() {
  setUpAll(loadAll);
  setUp(() => makePlayer = () => Player(out: InstantOut(), online: () async => true));
  tearDown(() => lang.value = Lang.ar);

  for (final l in Lang.values) {
    testWidgets('settings (${l.name})', (tester) async {
      openTemp(language: l);
      seedLearner(2);
      await open(tester, 'settings');
      await tap(tester, find.text(t('Large')));
      expect(store.data.settings.textSize, 'l');
      await tap(tester, find.text(t('Dark')));
      expect(store.data.settings.theme, 'dark');
      final other = content.reciters[1];
      await tap(tester, find.text(other.nameAr));
      expect(store.data.settings.reciterId, other.id);
      await tap(tester, find.bySemanticsLabel(t('Play a sample of {name}', {'name': other.nameAr})));
      await tap(tester, find.text(t('Advanced')));
      await tap(tester, find.text(t('{n} counts', {'n': 5})));
      expect(store.data.settings.munfasilLength, 5);
      await tap(tester, find.bySemanticsLabel(t('Saturday')));
      expect(store.data.settings.teacherDays, contains(6));
      await tap(tester, find.text(t('Reset everything')).last);
      await tester.enterText(find.byType(TextField).last, t('reset'));
      await settle(tester);
      await tap(tester, find.text(t('Delete everything')));
      expect(store.data.introductions, isEmpty);
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('?s=wird opens at Study time', (tester) async {
    openTemp();
    seedLearner(1);
    await open(tester, 'settings?s=wird');
    expect(tester.getTopLeft(find.text(t('Wird time'))).dy, lessThan(500));
  });
}
