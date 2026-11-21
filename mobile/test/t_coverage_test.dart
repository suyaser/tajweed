// Every t('…') / tn('…', '…') literal in lib/ has an Arabic entry in src/i18n/ar/*.json (synced; docs/19 §2.4).
// lib/dev/ (the dev gallery) is English only. Mobile-only strings go in src/i18n/ar/mobile.json.
import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

const _str = r"'((?:[^'\\]|\\.)*)'" '|' r'"((?:[^"\\]|\\.)*)"';
final _call = RegExp('\\btn?\\(\\s*(?:$_str)(?:\\s*,\\s*(?:$_str))?');

// Dart escapes: \uXXXX (Arabic is never typed, see lib/i18n/i18n.dart), then \x → x.
String _unescape(String s) => s
    .replaceAllMapped(RegExp(r'\\u([0-9a-fA-F]{4})'), (x) => String.fromCharCode(int.parse(x[1]!, radix: 16)))
    .replaceAllMapped(RegExp(r'\\(.)'), (x) => x[1]!);

List<String> keys(String code) => [
  for (final m in _call.allMatches(code)) ...[
    _unescape((m[1] ?? m[2])!),
    if (m[0]!.startsWith('tn') && (m[3] ?? m[4]) != null) _unescape((m[3] ?? m[4])!),
  ],
];

void main() {
  arabicIsEscaped();
  test('finds keys (sanity)', () {
    expect(keys(r"""t('a'), tn('{n} day', "{n} days", n), t("it's"), t('don\'t')"""), ['a', '{n} day', '{n} days', "it's", "don't"]);
  });

  test('every t() literal in lib/ has an Arabic entry', () {
    final ar = <String, dynamic>{};
    for (final f in Directory('assets/shared/i18n/ar').listSync().whereType<File>().where((f) => f.path.endsWith('.json'))) {
      ar.addAll(jsonDecode(f.readAsStringSync()) as Map<String, dynamic>);
    }
    expect(ar.length, greaterThan(500), reason: 'run tool/sync_assets.sh');
    final missing = <String>[];
    for (final f in Directory('lib').listSync(recursive: true).whereType<File>()) {
      if (!f.path.endsWith('.dart') || f.path.startsWith('lib/dev/') || f.path.endsWith('i18n.dart')) continue;
      missing.addAll(keys(f.readAsStringSync()).where((k) => !ar.containsKey(k)).map((k) => '${f.path}: $k'));
    }
    expect(missing, isEmpty);
  });
}

/// Arabic typed into code gets normalised by editors (and some tools turn \u escapes into characters): code lines in
/// lib/ must hold Arabic only as \u escapes. Comments may show it.
void arabicIsEscaped() => test('no Arabic characters in lib/ code (only \\u escapes)', () {
  final arabic = RegExp('[\u0600-\u06ff\u0750-\u077f\u08a0-\u08ff\ufb50-\ufdff\ufe70-\ufeff]');
  final bad = <String>[];
  for (final f in Directory('lib').listSync(recursive: true).whereType<File>().where((f) => f.path.endsWith('.dart'))) {
    for (final (i, line) in f.readAsLinesSync().indexed) {
      final code = line.trimLeft().startsWith('//') ? '' : line.split(RegExp(r'\s//')).first;
      if (arabic.hasMatch(code)) bad.add('${f.path}:${i + 1}');
    }
  }
  expect(bad, isEmpty);
});
