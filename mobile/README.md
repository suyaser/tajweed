# Tajweed Path, mobile (Flutter)

The iOS and Android app (docs/19-play-store-plan.md, option d). It reads the web repo's content; nothing is copied by hand.
Foundations F1–F11 are in (docs/19 §3): tokens and theme (`lib/ui/`), i18n (`lib/i18n/`), the content adapter
and rulemap (`lib/content/`), core logic and the store (`lib/core/`), the kit widgets (`lib/ui/kit.dart`), the Quran
text (`lib/quran/`), audio (`lib/audio/`). Every MVP screen is ported (`lib/screens/`, routed by `lib/app/`): Shell
(tabs Today, Rules, Path; Recovery), Onboarding, Today, Plan, Progress, Unit, the Lesson with every step, Review,
Listen, Rules, Rule, Mutun, Settings (MVP part), Resources and Guide. The phase-2 routes (account, teacher, circles)
and the reserved ones (mushaf, drill) have no links in the app; opened directly they show "Not built yet". The dev
pages open with `--dart-define=DEV_PAGE=gallery|quran`.

## App shell and navigation

`lib/app/router.dart` ports the web's hash routes (`parseHash`, parity fixture `router.json`) and Shell META, so a link
in content (`#/rules/ikhfa`, `#/unit/u1?finale=1`) opens the same screen: `go(context, path)`. One `Navigator`: a tab
root starts a fresh stack, everything else is pushed (Android back, iOS swipe-back). Services are globals opened before
the first frame (`lib/app/services.dart`: store, device-local prefs, recordings, downloads). Device-local conveniences
the web keeps in localStorage (lesson step state, dismissed nudges, the routine card) are `local.json` (`lib/app/local.dart`).

A new learner's walk on a device, with a screenshot per step (onboarding, lesson 1 with real audio, Today, Path, unit):

```sh
tool/walk_shots.sh ios <sim-udid> <dir> ar light      # or android <serial>; en | dark
tool/walk_shots.sh ios <sim-udid> <dir> ar light integration_test/screens_test.dart   # a learner five lessons in:
                                                      # Today, Review, Listen, Rules, Rule, Mutun, Progress, Settings, Resources, Guide
```

**Never type Arabic in Dart source**: editors normalise it (composed آ, shadda reordered). Take it from the data or
the dictionaries, or write `\u` escapes.

## Quran text

`lib/quran/verse.dart` lays a verse or passage out as ONE `RichText` paragraph and paints every highlight (focus,
lamp, Find marks, current ayah) behind it from the paragraph's selection boxes: a highlight background is never a styled run (on the web
that cut letters off their marks). Pause marks and brackets are their own smaller runs;
tajweed colours and the focus ink (teal, as the web) are colour-only runs; tajweed colours stay off except where asked
(`tajweed: true`). A colour-only run keeps the word joined with all its marks: `test/verse_ink_test.dart` checks 9:1
and the mid-word focus of 6:80 against the same text as one run. Each word is a semantics node
with a tap action when `onWord` is set. The dev page `lib/dev/quran_page.dart` shows them with real data:

```sh
flutter run --dart-define=DEV_PAGE=quran                       # open the Quran/player/recorder page directly
tool/dev_shots.sh ios <sim-udid> <dir>                         # the page walks itself; screenshots per step
```

## Audio

`lib/audio/player.dart` ports `src/audio/player.ts`: a queue for one reciter, the basmala (1:1) before a surah's first
ayah, word clips as `ClippingAudioSource` slices (PAD_BEFORE 80 ms, PAD_AFTER 120 ms, the ayah's first word from 0),
the word lamp from the quran-align timings (polled ~30×/s), loop, repeat gap and rate, and errors (offline when DNS
for the audio host fails). The engine sits behind `AudioOut`, so `test/player_test.dart` runs on a fake engine and a
fake clock. The audio session is `playback`/speech (`configurePlaybackSession()` in `main.dart`): the iOS silent switch
doesn't mute recitation.

Recording (`lib/audio/recorder.dart`, `record` plugin): AAC-LC `.m4a`, mono 44.1 kHz 64 kbps, 3-minute guard, an
8-second start timeout. On iOS the app owns the session: `playAndRecord` (speaker, Bluetooth) only while recording, then
back to `playback`. Takes go to `<app support>/recordings/` with an index, the last 5 per range
(`lib/audio/recordings.dart`); `RecorderView` is the record button and the Reciter / Me / Both row
(`lib/audio/compare.dart`). Mic permission: `NSMicrophoneUsageDescription` in `Info.plist`, localised in
`ios/Runner/{en,ar}.lproj/InfoPlist.strings`; Android `RECORD_AUDIO` with the app's rationale dialog first
(`askMicrophone`). Android Auto Backup leaves `recordings/` and `audio/` out (`res/xml/*_rules.xml`).

Offline audio (`lib/audio/downloads.dart`): a unit's ayahs (`content.unitAyahs`) saved to
`<app support>/audio/<reciter>/SSSAAA.mp3`, 4 at a time through `.part` files; `Player.source = downloads.source`
plays a saved file before the network. `OfflineAudio` is the Unit screen's panel (download, progress, failures, delete).

## Content sync

The web files stay the single source. Copy them into `assets/shared/` (git-ignored) before running, testing or building:

```sh
mobile/tool/sync_assets.sh
```

It copies `content/*.json`, `content/teach/`, `src/i18n/ar/`, `src/content/also.json`, `src/quran/surahs.json` and
`public/data/` (≈ 12 MB). Run it again after any content change.

`lib/content/content.dart` adapts that JSON exactly as `src/content/{index,course,teach}.ts` do (Arabic overlay
included); the topic list and the reciters are JSON (`content/topics.json`, `content/reciters.json`) read by both apps.
The Guide and Resources texts are JSON too (`content/guide.json`, `content/resources.json`); entries marked
`"app": false` need an account or the teacher log and are hidden on the phone until phase 2.

## Run

```sh
cd mobile
flutter run                      # pick the iOS simulator or Android emulator
flutter run --dart-define=SPIKE_AUTORUN=true     # plays every word clip on launch, logs timings ("SPIKE …")
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

## Release builds

```sh
flutter build appbundle --release          # Android: build/app/outputs/bundle/release/app-release.aab
flutter build ipa                          # iOS, once the Apple team is set in Xcode (CI check: build ios --release --no-codesign)
```

Android signs with the upload key in `android/key.properties`; without that file a release build is signed with
the debug key (it runs, but Play rejects it). R8 shrinks code and resources (`android/app/build.gradle.kts`; the
plugins ship their own keep rules). To create the upload key once (keep the `.jks` and both passwords backed up
outside git: losing them means asking Play support for a key reset):

```sh
keytool -genkeypair -v -keystore ~/keys/tajweed-upload.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
cat > mobile/android/key.properties <<'EOF'
storePassword=<the keystore password>
keyPassword=<the key password>
keyAlias=upload
storeFile=/Users/<you>/keys/tajweed-upload.jks
EOF
```

`key.properties`, `*.jks` and `*.keystore` are git-ignored (`android/.gitignore`). Use Play App Signing (the default):
Google keeps the app signing key, this is only the upload key.

Icon and splash: `flutter test tool/gen_icons.dart` draws them from the web's `public/icon.svg` design (Android
legacy and adaptive icons, the pre-12 splash image; the iOS 1024 icon, opaque, and the launch image). The splash
background is the page colour (`color-background`, light and dark). Display name: "Tajweed Path", "مسار التجويد" in
Arabic (`res/values-ar/strings.xml`, `ios/Runner/ar.lproj/InfoPlist.strings`).

Store texts, Data safety and App Privacy answers: `docs/store/tajweed-path.md`; privacy policy:
`docs/store/privacy-tajweed-path.md`.

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
