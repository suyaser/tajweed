// Port of src/app/router.ts (the web's hash routes) and Shell.tsx META: the same paths, so a link written in content or a
// backup (`#/rules/ikhfa`, `#/unit/u1?finale=1`) opens the same screen. Navigation is the plain Navigator (docs/19 §2.2).
const routes = {
  'onboarding': 'onboarding',
  'today': 'today',
  'learn': 'learn/:lessonId',
  'review': 'review',
  'listen': 'listen/:range',
  'rules': 'rules',
  'rule': 'rules/:lessonId',
  'resources': 'resources',
  'teacher': 'teacher',
  'teacherNew': 'teacher/new',
  'session': 'teacher/:id',
  'plan': 'plan',
  'unit': 'unit/:unitId',
  'progress': 'progress',
  'settings': 'settings',
  'guide': 'guide',
  'account': 'account',
  'shared': 'shared/:token',
  'circle': 'circle',
  'circleView': 'circle/:id',
  'mushaf': 'mushaf/:surah',
  'mutun': 'mutun/:matnId',
  'drill': 'drill/:pairId',
};

class AppRoute {
  const AppRoute(this.name, this.params, this.path);
  final String name; // a key of [routes], or 'notFound'
  final Map<String, String> params; // path params plus the query
  final String path; // without the query
  @override
  String toString() => path;
}

// literal segments before :params (router.ts TABLE)
final _table = [for (final e in routes.entries) (name: e.key, segs: e.value.split('/'))]
  ..sort((a, b) => b.segs.where((s) => !s.startsWith(':')).length - a.segs.where((s) => !s.startsWith(':')).length);

String _decode(String s) {
  try {
    return Uri.decodeComponent(s);
  } catch (_) {
    return s;
  }
}

/// `#/teacher/4?sheet=1` → teacher… { id: '4', sheet: '1' }. Empty → today.
AppRoute parseRoute(String hash) {
  final raw = hash.replaceFirst(RegExp(r'^#?/?'), '');
  final q = raw.indexOf('?');
  final pathPart = q < 0 ? raw : raw.substring(0, q);
  final query = q < 0 ? <String, String>{} : Uri.splitQueryString(raw.substring(q + 1));
  var path = pathPart.replaceFirst(RegExp(r'/+$'), '');
  if (path.isEmpty) path = 'today';
  final segs = path.split('/');
  for (final r in _table) {
    if (r.segs.length != segs.length) continue;
    final params = {...query};
    var ok = true;
    for (final (i, s) in r.segs.indexed) {
      if (s.startsWith(':')) {
        params[s.substring(1)] = _decode(segs[i]);
      } else if (s != segs[i]) {
        ok = false;
      }
    }
    if (ok) return AppRoute(r.name, params, path);
  }
  return AppRoute('notFound', const {}, path);
}

/// `href('rules', 'ikhfa')` → 'rules/ikhfa' (the app's route name for the Navigator; the web adds `#/`).
String href(String a, [Object? b]) => b == null ? a : '$a/${Uri.encodeComponent('$b')}';

enum ShellKind { tab, pushed, focus, bare }

enum AppTab { today, rules, path }

/// Design §4.4 (Shell.tsx META): shell kind, owning tab, title, and where ✕ / ‹ go. Arabic titles are \u escapes.
typedef Meta = ({ShellKind kind, AppTab? tab, String ar, String en, String? parent});

const _bare = ShellKind.bare, _tab = ShellKind.tab, _pushed = ShellKind.pushed, _focus = ShellKind.focus;
const Map<String, Meta> meta = {
  'onboarding': (kind: _bare, tab: null, ar: '\u0645\u0633\u0627\u0631 \u0627\u0644\u062a\u062c\u0648\u064a\u062f', en: 'Tajweed Path', parent: null),
  'today': (kind: _tab, tab: AppTab.today, ar: '\u0627\u0644\u064a\u0648\u0645', en: 'Today', parent: null),
  'learn': (kind: _focus, tab: AppTab.today, ar: '\u0627\u0644\u0633\u0628\u0642', en: 'New lesson', parent: 'today'),
  'review': (kind: _focus, tab: AppTab.today, ar: '\u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629', en: 'Review', parent: 'today'),
  'listen': (kind: _focus, tab: AppTab.today, ar: '\u0627\u0644\u062a\u0644\u0642\u064a', en: 'Listen', parent: 'today'),
  'rules': (kind: _tab, tab: AppTab.rules, ar: '\u0627\u0644\u0623\u062d\u0643\u0627\u0645', en: 'Rules', parent: null),
  'rule': (kind: _pushed, tab: AppTab.rules, ar: '\u0627\u0644\u0623\u062d\u0643\u0627\u0645', en: 'Rules', parent: 'rules'),
  'resources': (kind: _pushed, tab: AppTab.rules, ar: '\u0627\u0644\u0645\u0635\u0627\u062f\u0631', en: 'Resources', parent: 'rules'),
  'teacher': (kind: _pushed, tab: null, ar: '\u0627\u0644\u0634\u064a\u062e', en: 'Teacher', parent: 'today'),
  'teacherNew': (kind: _pushed, tab: null, ar: '\u062c\u0644\u0633\u0629 \u062c\u062f\u064a\u062f\u0629', en: 'Plan a session', parent: 'teacher'),
  'session': (kind: _pushed, tab: null, ar: '\u0627\u0644\u062c\u0644\u0633\u0629', en: 'Session', parent: 'teacher'),
  'plan': (kind: _tab, tab: AppTab.path, ar: '\u0627\u0644\u0645\u0633\u0627\u0631', en: 'Path', parent: null),
  'progress': (kind: _tab, tab: AppTab.path, ar: '\u0627\u0644\u0645\u0633\u0627\u0631', en: 'Path', parent: null),
  'unit': (kind: _pushed, tab: AppTab.path, ar: '\u0627\u0644\u0648\u062d\u062f\u0629', en: 'Unit', parent: 'plan'),
  'settings': (kind: _pushed, tab: null, ar: '\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a', en: 'Settings', parent: 'today'),
  'guide': (kind: _pushed, tab: null, ar: '\u0643\u064a\u0641 \u064a\u0639\u0645\u0644', en: 'How it works', parent: 'today'),
  'account': (kind: _pushed, tab: null, ar: '\u0627\u0644\u062d\u0633\u0627\u0628', en: 'Account and backup', parent: 'settings'),
  'shared': (kind: _bare, tab: null, ar: '\u0645\u0633\u0627\u0631 \u0627\u0644\u062a\u062c\u0648\u064a\u062f', en: 'Shared progress', parent: null),
  'circle': (kind: _pushed, tab: null, ar: '\u0627\u0644\u062d\u0644\u0642\u0629', en: 'Circles', parent: 'settings'),
  'circleView': (kind: _pushed, tab: null, ar: '\u0627\u0644\u062d\u0644\u0642\u0629', en: 'Circle', parent: 'circle'),
  'mushaf': (kind: _pushed, tab: AppTab.rules, ar: '\u0627\u0644\u0645\u0635\u062d\u0641', en: 'Ayah analyser', parent: 'rules'),
  'mutun': (kind: _pushed, tab: AppTab.rules, ar: '\u0627\u0644\u0645\u062a\u0648\u0646', en: 'Mutun', parent: 'rules'),
  'drill': (kind: _focus, tab: AppTab.today, ar: '\u062a\u0645\u064a\u064a\u0632', en: 'Contrast drill', parent: 'review'),
  'notFound': (kind: _tab, tab: null, ar: '\u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f', en: 'Not found', parent: null),
};

/// The tab roots: opening one starts a fresh stack (the web's tab links).
const tabRoots = {'today', 'rules', 'plan', 'progress'};
