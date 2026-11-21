// Smoke test of the content adapter; the full objects are compared with the web's in parity_test.dart.
import 'package:flutter_test/flutter_test.dart';
import 'package:tajweed/content/content.dart';
import 'package:tajweed/i18n/i18n.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late RawContent raw;
  setUpAll(() async => raw = await loadRawContent());
  tearDown(() => lang.value = Lang.ar);

  test('lessons, topics, units and course order', () {
    lang.value = Lang.en;
    useContent(raw);
    expect(content.lessons.length, (raw['rules'] as List).length);
    expect(content.topics.map((t) => t.id).take(3), ['found', 'nun', 'meem']);
    expect(content.topics.first.nameEn, 'Foundations');
    expect(content.courseOrder.toSet().length, content.courseOrder.length);
    expect(content.courseOrder.every((id) => content.getLesson(id) != null), isTrue);
    expect(content.unitOf(content.courseOrder.first)!.id, content.units.first.id);
    expect(content.reciters.first.id, 'husary-muallim');
    final ikhfa = content.getLesson('ikhfa')!;
    expect(ikhfa.questionKinds, contains('identify'));
    expect(ikhfa.examples.first.id, 'ikhfa#1');
    expect(content.getLesson('makharij-halq')!.questionKinds, isNot(contains('identify')));
    expect(content.surahName(1), isNotEmpty);
  });

  test('Arabic overlay replaces English fields only in Arabic', () {
    lang.value = Lang.en;
    useContent(raw);
    final en = content.topics.first.nameEn;
    lang.value = Lang.ar;
    useContent(raw);
    expect(content.topics.first.nameEn, isNot(en));
  });

  test('drill and glossary matching', () async {
    useContent(raw);
    expect(drillFor(content.getLesson('makharij-jawf')!).length, 3);
    expect(drillFor(content.getLesson('ikhfa')!), isEmpty);
    final g = content.glossary.first;
    expect(termsIn('x ${g.term} y', content.glossary).map((t) => t.term), contains(g.term));
    final teach = await loadTeach('ikhfa');
    expect(teach!.text.how, isNotEmpty);
    expect(await loadTeach('no-such-lesson'), isNull);
  });
}
