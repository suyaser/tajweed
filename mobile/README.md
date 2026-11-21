# Tajweed Path, mobile (Flutter)

The iOS and Android app (docs/19-play-store-plan.md, option d). It reads the web repo's content; nothing is copied by hand.
Right now it holds only the week-1 spike screen (`lib/spike.dart`): Arabic rendering with the focus highlight, and word clips.

## Content sync

The web files stay the single source. Copy them into `assets/shared/` (git-ignored) before running, testing or building:

```sh
mobile/tool/sync_assets.sh
```

It copies `content/*.json`, `content/teach/`, `src/i18n/ar/`, `src/content/also.json`, `src/quran/surahs.json` and
`public/data/` (≈ 12 MB). Run it again after any content change.

## Run

```sh
cd mobile
flutter run                      # pick the iOS simulator or Android emulator
flutter run --dart-define=SPIKE_AUTORUN=true     # plays every word clip on launch, logs timings ("SPIKE …")
flutter run --dart-define=SPIKE_INK_SPLIT=true   # focus ink as a colour-only TextSpan split
flutter analyze && flutter test
```

The whole check, in CI order (web tests → sync → analyze → Dart tests): `mobile/tool/check.sh`.

## App id (placeholder)

The iOS bundle id and Android applicationId are set in ONE place: `mobile/app_id.xcconfig` (`APP_ID = app.placeholder.tajweed`).
`ios/Flutter/{Debug,Release}.xcconfig` include it and `android/app/build.gradle.kts` reads it.
**Replace it with the owned domain's reverse id before the first upload to either store: the id is permanent once uploaded.**
The Android `namespace` (Kotlin package of MainActivity) is not the store id and need not change.

## Fonts

`assets/fonts/`: Amiri Quran, Amiri, Noto Naskh Arabic (the web's `--font-quran` stack), each with its SIL OFL 1.1 text,
registered in `main.dart` so they show on the Licences page. Noto Sans Arabic and Inter come with the UI work (F2).
