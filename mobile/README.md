# Tajweed Path, mobile (Flutter)

The iOS and Android app (docs/19-play-store-plan.md, option d). It reads the web repo's content; nothing is copied by hand.
Foundations F1–F6 and F11 are in (docs/19 §3): tokens and theme (`lib/ui/`), i18n (`lib/i18n/`), the content adapter
(`lib/content/`), core logic and the store (`lib/core/`), and the kit widgets (`lib/ui/kit.dart`). No screens yet: the app
opens on the dev gallery (`lib/dev/gallery.dart`, every kit widget with real content; AR/EN and light/dark at the top),
with the week-1 spike (`lib/spike.dart`) one tap away.

**Never type Arabic in Dart source**: editors normalise it (composed آ, shadda reordered). Take it from the data or
the dictionaries, or write `\u` escapes.

## Content sync

The web files stay the single source. Copy them into `assets/shared/` (git-ignored) before running, testing or building:

```sh
mobile/tool/sync_assets.sh
```

It copies `content/*.json`, `content/teach/`, `src/i18n/ar/`, `src/content/also.json`, `src/quran/surahs.json` and
`public/data/` (≈ 12 MB). Run it again after any content change.

`lib/content/content.dart` adapts that JSON exactly as `src/content/{index,course,teach}.ts` do (Arabic overlay
included); the topic list and the reciters are JSON (`content/topics.json`, `content/reciters.json`) read by both apps.
Guide and Resources texts still live in their web screens; they move to JSON when those screens are ported.

## Run

```sh
cd mobile
flutter run                      # pick the iOS simulator or Android emulator
flutter run --dart-define=SPIKE_AUTORUN=true     # plays every word clip on launch, logs timings ("SPIKE …")
flutter run --dart-define=SPIKE_INK_SPLIT=true   # focus ink as a colour-only TextSpan split
flutter analyze && flutter test
```

Gallery screenshots, Arabic/English × light/dark: `tool/gallery_shots.sh ios <sim-udid> <dir>` or
`tool/gallery_shots.sh android emulator-5554 <dir>`.

The whole check, in CI order (web tests and `tsc -b` → sync → analyze → Dart tests): `mobile/tool/check.sh`.

## Parity with the web

`src/parity.test.ts` runs the web's logic on fixed inputs (content adapter and i18n in both languages, day, a simulated
learner through the scheduler and course, seeded questions, store migrations) and writes inputs and outputs to
`mobile/test/fixtures/`. `test/parity_test.dart` must produce the same outputs. When web logic changes:

```sh
UPDATE_FIXTURES=1 npx vitest run src/parity.test.ts   # then make the Dart side pass
```

Without `UPDATE_FIXTURES` the web test fails if the committed fixtures are stale, so neither side can drift silently.

## App id (placeholder)

The iOS bundle id and Android applicationId are set in ONE place: `mobile/app_id.xcconfig` (`APP_ID = app.placeholder.tajweed`).
`ios/Flutter/{Debug,Release}.xcconfig` include it and `android/app/build.gradle.kts` reads it.
**Replace it with the owned domain's reverse id before the first upload to either store: the id is permanent once uploaded.**
The Android `namespace` (Kotlin package of MainActivity) is not the store id and need not change.

## Theme tokens

`lib/ui/tokens.g.dart` is generated from `src/styles/app.css` (light `@theme`, dark block) and `tokens.css` (muṣḥaf palette):

```sh
node mobile/tool/gen_tokens.mjs          # after any colour, spacing, radius or shadow change on the web
```

`tool/check.sh` fails when it is out of date. `src/styles/tokens.test.ts` stays the only contrast check.
`lib/ui/theme.dart` maps the roles onto `ThemeData` and holds the type scale (`context.type.bodyMd`, `context.c.primary`).

## Fonts

`assets/fonts/`: Amiri Quran, Amiri, Noto Naskh Arabic, Noto Sans Arabic and Inter (the web's `--font-*` stacks, from
google/fonts), each with its SIL OFL 1.1 text, registered in `main.dart` so they show on the Licences page. Noto Naskh,
Noto Sans Arabic and Inter are variable fonts: set weights with `style.weight(600)` (it sets the `wght` axis too).
