import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/app.dart';
import 'package:tajweed/i18n/i18n.dart';

// Arabic is written as \u escapes (editors normalise typed Arabic). Bidi and tn cases from the web are in the parity
// fixtures (parity_test.dart); these cover the contract.
const shadda = '\u0651', fatha = '\u064e', tatweel = '\u0640', lam = '\u0644';

void main() {
  tearDown(() {
    lang.value = Lang.ar;
    ar.clear();
  });

  test('t: dictionary by English key, placeholders, Arabic digits, English fallback', () {
    ar['{n} days'] = 'X {n}';
    lang.value = Lang.en;
    expect(t('{n} days', {'n': 3}), '3 days');
    expect(t('Untranslated'), 'Untranslated');
    expect(pick('a', 'b'), 'a');
    lang.value = Lang.ar;
    expect(t('{n} days', {'n': 12}), 'X \u0661\u0662');
    expect(t('Untranslated'), 'Untranslated');
    expect(pick('a', 'b'), 'b');
    expect(pick('a', ''), 'a');
    expect(sep, '\u060c ');
    expect(digits('2:5'), '\u0662:\u0665');
  });

  test('tn: English one/other; Arabic CLDR forms (4 and 5 forms, single form)', () {
    ar['{n} day'] = 'one';
    ar['{n} days'] = 'two {n}|few {n}|many {n}|other {n}';
    ar['{n} x'] = 'one|two|few|many|other';
    lang.value = Lang.en;
    expect([tn('{n} day', '{n} days', 1), tn('{n} day', '{n} days', 2)], ['1 day', '2 days']);
    lang.value = Lang.ar;
    String d(int n) => tn('{n} day', '{n} days', n);
    expect(d(1), 'one');
    expect(d(2), 'two \u0662');
    expect(d(0), 'few \u0660');
    expect(d(3), 'few \u0663');
    expect(d(10), 'few \u0661\u0660');
    expect(d(11), 'many \u0661\u0661');
    expect(d(99), 'many \u0669\u0669');
    expect(d(100), 'other \u0661\u0660\u0660');
    expect(d(103), 'few \u0661\u0660\u0663');
    expect([0, 1, 2, 5, 20, 101].map((n) => tn('{n} x', '{n} x', n)), ['few', 'one', 'two', 'few', 'many', 'other']);
  });

  test('carryMarks: a lone mark rides a tatweel, "(\u0651)" included; marks on letters untouched', () {
    expect(carryMarks('a ($shadda)'), 'a ($tatweel$shadda)');
    expect(carryMarks(fatha), '$tatweel$fatha');
    expect(carryMarks('$lam$shadda$fatha'), '$lam$shadda$fatha');
  });

  test('bidi: Arabic islands isolated in English, Latin islands in Arabic', () {
    const word = '\u0625\u062f\u063a\u0627\u0645';
    lang.value = Lang.en;
    expect(bidi('then $word.'), 'then $rli$word$pdi.');
    lang.value = Lang.ar;
    // digits first, as the web's <T>: "4.0" becomes Arabic-Indic and leaves the Latin island
    expect(bidi('$word CC BY 4.0 5'), '$word ${lri}CC BY$pdi \u0664.\u0660 \u0665');
    expect(bidi('Mostly English with $word'), '${lri}Mostly English with $rli$word$pdi$pdi');
  });

  testWidgets('RTL in Arabic, LTR in English; switching rebuilds', (tester) async {
    late TextDirection dir;
    await tester.pumpWidget(TajweedApp(home: (c) {
      dir = Directionality.of(c);
      return const SizedBox();
    }));
    expect(dir, TextDirection.rtl);
    lang.value = Lang.en;
    await tester.pumpAndSettle();
    expect(dir, TextDirection.ltr);
  });
}
