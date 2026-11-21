# 19 · Google Play and App Store plan (Flutter)

Date: 2026-11-21. Branch `tailwind` at 4b0360a. Plan only: no app code written.
Scope: ship Tajweed Path (مسار التجويد) on **Google Play and the Apple App Store (iPhone)**. The owner asked for Flutter.
A sibling app, *athan* (prayer times, qibla, azkar), is being planned in parallel and is likely Flutter too. It is not in this
workspace, so nothing here depends on its code.

Effort is in person-days for one developer who knows Flutter but not this codebase, working at a normal pace. Heavy AI-assisted
porting can cut the screen work by about a third. It does not shorten store lead times, device QA or the Arabic proofreading.

---

## 0. What exists today (inventory)

| Area | Where | Size | Port notes |
|---|---|---|---|
| Routes (24, hash router) | `src/app/router.ts` | 20 screens + 3 reserved + dev | Same table in Dart (`parseHash` is pure) |
| Screens | `src/screens/*.tsx`, `study/`, `path/`, `library/`, `guide/` | ≈ 7,000 lines TSX | Rebuilt in Flutter widgets |
| Logic | `src/core` (scheduler, questions, course, day, store + migrations, ics), `src/content` (adapter, course, teach, rulemap), `src/sync` (merge, CAS sync), `src/audio` (player, recorder, compare, download), `src/quran`, `src/components/bidi.ts` | ≈ 3,000 lines TS | Ported to Dart, checked against TS fixtures (§2.8) |
| Content | `content/` rules, course, ar, glossary, mutun, pairs, videos, `teach/*.json` (58) | 1.1 MB | Read as-is (option d) |
| Constants in TS, not JSON | topics `CATS` (`src/content/index.ts`), `RECITERS` (`src/quran/data.ts`), `src/content/also.json`, Guide text (`src/screens/guide/content.tsx`), Resources links | small | Move to JSON once so both apps read them |
| UI strings | `t('English')`, Arabic in `src/i18n/ar/{common,study,library}.json` keyed by the English text | 100 kB | Same files, same `t()` contract in Dart |
| Quran data | `public/data/surah/NNN.json` (text, tajweed spans, pause marks, word timings per reciter), `meta.json`, `src/quran/surahs.json` | 11 MB | Bundled in the app: the Quran text then works offline from first launch |
| Audio | everyayah per-ayah MP3 (`src/audio/urls.ts`), word clips by quran-align timings, basmala from 001001 | streamed | `just_audio` + files on disk |
| Recording | MediaRecorder webm/opus or mp4, last 5 per range in IndexedDB, Reciter/Me/Both compare | | `record` → AAC `.m4a` files on disk |
| Backend | Supabase: `user_data`, `share_links`, `circles`, `circle_members`, `activity` (`supabase/migrations`); email link + Google sign-in (PKCE); `delete_me()` | | Unchanged schema; `supabase_flutter` |
| Tokens | `src/styles/app.css` (light `@theme`, dark block), `tokens.css` (`--t-*` muṣḥaf palette); contrast guarded by `tokens.test.ts` (docs/18 values) | | Generated into Dart (§2.6) |
| Tests | 38 Vitest files | | §2.8: content checkers stay in TS |
| Deploy | GitHub Pages (`.github/workflows/pages.yml`), repo `suyaser/tajweed` | | Unchanged; adds the privacy and account-deletion pages |

Local toolchain (checked today):

| Tool | State |
|---|---|
| Flutter | 3.38.5 stable (Dec 2025; "new version available"), Dart 3.10.4, at `/opt/homebrew/share/flutter`; fvm also has 3.22–3.38.5 |
| Android | SDK at `~/Library/Android/sdk`, platforms 34/35/36, build-tools 36.1.0, emulator and system images present, Android Studio JDK 21. **Some Android licences not accepted.** `adb`/`sdkmanager` not on PATH |
| iOS | Xcode 26.2 (17C52), CocoaPods 1.17.0. `flutter doctor` is green for Xcode |
| Flutter defaults | `compileSdk 36`, **`targetSdk 36`**, `minSdk 24` (`FlutterExtension.kt`). That meets Play's current rule |

---

## 1. Options compared

Play facts used below:
- **Target API:** since 31 Aug 2026, new apps and updates must target **Android 16 (API 36)** ([Android developers](https://developer.android.com/google/play/requirements/target-sdk)).
- **Testing before production:** personal accounts created after 13 Nov 2023 need **at least 12 testers opted in for 14 consecutive days** in a closed test before they can apply for production ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/14151465)).
- **Minimum functionality:** Play removes "webview spam", meaning apps whose main purpose is to drive traffic to a site, and apps with limited functionality ([Android Developers Blog](https://android-developers.googleblog.com/2020/10/developer-tips-and-guides-common-policy.html), [Play policy](https://support.google.com/googleplay/android-developer/answer/14983486)).

Apple facts used below ([App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)):
- **4.2:** an app must be "beyond a repackaged website". Developers on Apple's forums report 4.2 rejections for Capacitor and other WebView apps even after adding native features ([thread 812889](https://developer.apple.com/forums/thread/812889), [thread 829592](https://developer.apple.com/forums/thread/829592)).
- **4.8:** an app that offers a third-party login (Google) must also offer an equivalent private login, such as Sign in with Apple. It is exempt only if it uses its own account system *exclusively*.
- **5.1.1(v):** an app that creates accounts must let users delete them in the app. The app already has `delete_me()`. The app must also work without a login, which it does.

| | (a) TWA (Bubblewrap) | (b) Capacitor wrapper | (c) Flutter rewrite, own content copy | (d) Flutter rewrite, shared `content/` + i18n |
|---|---|---|---|---|
| Platforms | **Android only.** No iOS equivalent | Android + iOS | Android + iOS | Android + iOS |
| Effort to first store release | 3–4 d (Android only) | ≈ 20 d both stores (+0–5 d if Apple rejects under 4.2) | ≈ 75 d MVP / ≈ 93 d full | ≈ 75 d MVP / ≈ 93 d full |
| Risk | Low on Play. TWAs are Google's own recommended route and run in Chrome. Needs `/.well-known/assetlinks.json` at the **domain root** ([Chrome docs](https://developer.chrome.com/docs/android/trusted-web-activity/android-for-web-devs)). A GitHub Pages project site (`suyaser.github.io/tajweed`) can't serve that path, so it needs a custom domain or a `suyaser.github.io` user-site repo | **Medium–high on iOS (4.2).** iOS WKWebView has no service workers under `capacitor://` ([WebKit 206741](https://bugs.webkit.org/show_bug.cgi?id=206741)), so offline audio and the "Download unit" feature must be rewritten on the Filesystem plugin. Low on Play | Low store risk. High execution risk: everything is rebuilt, and Arabic shaping needs a spike (§2.5) | Same as (c) |
| Maintenance | ≈ none: the web deploy is the app | Low: one codebase plus yearly Gradle/Xcode/plugin bumps | **High:** every content fix is made twice (58 teach files × 2 languages) and drifts | **Medium:** content once; logic (scheduler, questions, merge) exists in TS and Dart, kept equal by shared fixtures |
| What the user gets | A Play listing of today's PWA, full screen. Same bugs and same features | Both stores with the same UI as the web. iOS silent switch and WebView audio quirks remain unless native plugins replace them | A native app: native audio sessions, background play, files on disk, OS backup, no web limits. Two products to keep in step | The same native app, with one place to edit content and Arabic, and a code base that can share a brand package with athan |
| Offline | Service worker, as today | Android yes. iOS: rewrite caching on Filesystem | Bundled Quran data; audio saved as files | Same |
| Mic | Chrome site permission; no `RECORD_AUDIO` in the manifest | `RECORD_AUDIO` + `NSMicrophoneUsageDescription`; WKWebView `getUserMedia` (iOS 14.3+) | Native (`record`) | Same |
| Background audio | Chrome media session | Needs a native plugin, Android 14 foreground-service type `mediaPlayback` and a Play Console declaration ([Play Help](https://support.google.com/googleplay/android-developer/answer/13392821)), iOS `UIBackgroundModes audio` | `just_audio_background`; the same Android and iOS declarations | Same |
| Shares with athan | Nothing | Nothing (unless athan is web) | Theme and Arabic utilities, by copy | A shared Dart package later (§2.9) |

**Recommendation.** If the only goal were both stores at the lowest cost, (b) Capacitor is the honest cheapest path (about a quarter of the Flutter effort). Its real risk is an Apple 4.2 rejection plus iOS audio and offline rework. The owner wants Flutter and athan is likely Flutter, so take **(d)**. It is about the same first effort as (c) and much cheaper to keep in step, because the reviewed content and Arabic (docs/04, 15, 16) are edited in one place and the TS content checkers keep guarding it.
(a) remains a 3–4 day Android-only stopgap. It is not recommended: a later switch to Flutter keeps the package id, but learners' progress is in Chrome storage and would not carry over unless they had a backup or an account.

---

## 2. Flutter plan (option d)

### 2.1 Repo layout: monorepo

Put the Flutter app in **`mobile/`** in this repo. A git submodule adds a second history to keep pinned, and a build step that
publishes content to a package adds release ceremony. A monorepo keeps one PR for "content + both apps" and one CI.

```
content/  src/i18n/ar/  public/data/          ← single source (web reads directly)
mobile/
  tool/sync_assets.sh   copies the shared files into mobile/assets/shared/ (gitignored), run before build/test
  tool/gen_tokens.mjs   app.css + tokens.css → lib/ui/tokens.g.dart
  assets/shared/        content/*.json, content/teach/, ar/*.json, also.json, surahs.json, data/surah/*.json
  assets/fonts/         Amiri Quran, Amiri, Noto Naskh Arabic, Noto Sans Arabic, Inter (+ OFL texts)
  lib/
    main.dart  app.dart          root, theme, locale/direction, Navigator with the route table
    core/                         types, day, scheduler, questions, course, store (+ migrations, backup)
    content/                      adapter over the JSON (lessons, topics, units, teach, glossary, ar overlay)
    quran/                        surah loader, tajweed spans, reciters
    audio/                        player, recorder, compare, downloads
    sync/                         supabase, merge, sync (phase 2)
    i18n/                         t(), tn(), digits, SEP, bidi isolates, carryMarks
    ui/                           tokens.g.dart, theme, type scale, kit widgets (PageHeader, StepBar, Segmented, Sheet…)
    screens/                      one file per route, mirrors src/screens
  test/                           Dart tests incl. fixtures from TS (§2.8)
```

Flutter assets must live inside the package, so a symlink to `../content` is fragile on Windows/CI. The copy step is one
`rsync`, and CI runs it before `flutter test` and `flutter build`.

### 2.2 State and navigation: no packages

The web uses one `UserData` store with `useSyncExternalStore` and no state library (decision log #1). Mirror it with one `AppStore extends
ChangeNotifier` holding `UserData`, exposed by an `InheritedNotifier` and read with `ListenableBuilder`. The player and recorder are
the same pattern (`Player`/`Recorder` classes with `subscribe` already exist in TS). Riverpod and Bloc add nothing this app needs.

Navigation: the plain `Navigator` with `onGenerateRoute` over the same route table (`parseHash` ported). That gives the Android back button and
iOS swipe-back for free. Add go_router only if deep links grow beyond the auth callback.

Persistence: `UserData` as one JSON file in the app documents dir (write to a temp file, then rename). It has **the same schema and
backup format as the web** (`exportJson`/`importJson`), so a web backup restores in the app and the other way round. Recordings are `.m4a` files plus a small
index. Android Auto Backup and iCloud device backup then cover progress for free. Exclude recordings from Auto Backup (25 MB cap).

### 2.3 Packages

| Need | Package | Why / notes |
|---|---|---|
| Audio, word clips, speed, loop | [`just_audio`](https://pub.dev/packages/just_audio) 0.10.x + `audio_session` | `setClip(start,end)` / `ClippingAudioSource` plays a word slice by quran-align timings (PAD 80/120 ms as in `player.ts`). Speed 0.75/1, position stream for the word lamp. Plays local files |
| Offline audio | `http` + `path_provider` (files on disk) | Download the unit's ayah files (`unitAyahs()` ported) to `audio/<reciter>/SSSAAA.mp3` and play the file if present. Skip `LockCachingAudioSource` (experimental, needs a local cleartext proxy) |
| Background play + lock screen | `just_audio_background` (phase 2) | Needs Android `FOREGROUND_SERVICE_MEDIA_PLAYBACK` + Play Console FGS declaration, iOS `UIBackgroundModes: audio`. Leave it out of the MVP so the declarations aren't needed yet |
| Recording | [`record`](https://pub.dev/packages/record) 7.x | `AudioEncoder.aacLc` → `.m4a` on both platforms (Opus on iOS is CAF only). 3-minute guard as on the web. Recordings never leave the device, so the web's webm files never need converting |
| Mic permission | `record.hasPermission()`; `permission_handler` only for "open Settings" after a permanent deny | |
| Backend (phase 2) | [`supabase_flutter`](https://pub.dev/packages/supabase_flutter) 2.18.x | Same tables and RLS. Publishable key via `--dart-define-from-file` (never the secret key) |
| Apple login (phase 2, only if Google is kept) | `sign_in_with_apple` + `signInWithIdToken` ([Supabase docs](https://supabase.com/docs/guides/auth/social-sign-in/auth-apple)) | Guideline 4.8 |
| Links (videos, teachers, credits) | `url_launcher` | |
| Backup file, teacher link | `share_plus`, `file_picker` | Replace `download()` and the file input |
| Daily reminder (phase 2) | `flutter_local_notifications` | Replaces the `.ics` download. Android 13+ `POST_NOTIFICATIONS` |
| Icons | Flutter's built-in `Icons` (outlined) | The web uses about 120 Material Symbols. The built-in set covers them closely, with no dependency |
| Fonts | bundled `.ttf` in `pubspec.yaml`, **not** the `google_fonts` package | Offline from first launch, no runtime fetch |

Fonts and their licences: **Amiri Quran** and **Amiri** (SIL OFL 1.1), **Noto Naskh Arabic** and **Noto Sans Arabic** (SIL OFL 1.1),
**Inter** (SIL OFL 1.1). OFL allows bundling in a paid or free app. Ship each OFL text and register it with `LicenseRegistry.addLicense`
so it appears in `showLicensePage`. Data licences stay as on the web's Credits (Resources): Tanzil (verbatim text with attribution),
cpfair/quran-tajweed and quran-align (CC BY 4.0). Keep that screen in the MVP: it is the attribution.

### 2.4 Content and i18n sharing

- The Dart adapter reads the same JSON the TS adapter reads (`src/content/index.ts`, `teach.ts`, `course.ts`). The Arabic overlay `content/ar.json` is merged the same way (`pick(en, ar)`).
- A one-time web refactor (≈ 1 d, counted in F4) moves the TS-only constants into JSON: `CATS` → `content/topics.json`, `RECITERS` → `content/reciters.json`, Guide text, Resources links. The web reads them from there too.
- UI strings: Dart keeps the web's contract `t('English text', {vars})`. It looks up the same `src/i18n/ar/*.json` (keyed by English), with `tn()` plural forms through `Intl.PluralRules` rules (port of `study/i18n.tsx`). Mobile-only strings go in `src/i18n/ar/mobile.json`, the same folder. A Dart test checks that every literal passed to `t()` in `lib/` has an Arabic entry.
- Language: per device, Arabic by default (decision log #48, #59). Switching rebuilds the `MaterialApp` with `Locale('ar')`/`TextDirection.rtl`, with no reload needed.
- `course.json` stays a *built* file (`UPDATE_COURSE=1 npx vitest …`). Dart only reads it.

### 2.5 Arabic rendering (spike in week 1)

Flutter shapes text with HarfBuzz and ICU bidi through SkParagraph, so joined Arabic and stacked marks render well **inside one
style run**. The web's fixes map like this:

| Web issue (where) | Flutter |
|---|---|
| A lone mark (the شدة in "(ّ)", a فتحة on its own) shows as a box or dotted circle → `carryMarks` puts it on a tatweel (`src/components/bidi.ts`, used by `Tx` in `src/screens/study/i18n.tsx`) | Same problem (HarfBuzz draws ◌). Port `carryMarks` as is and apply it in the `Tx` widget |
| A highlight per tajweed segment cut a letter off from its vowel mark ("the tanween of بَرَآءَةٌ vanished", `Verse.tsx` WordToken) → one highlight over the whole substring | **Never split a word into several `TextSpan`s for the focus highlight.** Draw the highlight behind one paragraph with a `CustomPainter` using `TextPainter.getBoxesForSelection(range)`. That keeps shaping intact and also gives rounded corners and the 2px ring. Colour-only span splits (muṣḥaf tajweed colours) are reported to break shaping in Flutter ([write-up](https://www.codeiva.com/updates/how-we-fixed-arabic-diacritic-rendering-in-a-flutter-quran-app-without-webview)). Lessons don't colour letters (decision #51), so colours only matter for the Legend and the reserved muṣḥaf view. Golden-test before using them |
| Arabic/Latin islands (`splitBidi`, `splitLatin`, `<bdi>`) | Wrap islands in Unicode isolates (U+2068 FSI / U+2067 RLI / U+2066 LRI … U+2069 PDI) inside one `Text`. ICU honours them. A pure string function, testable |
| Pause marks shown after the word with NBSP (`Verse.tsx`) | Same string, same NBSP |
| The middle dot read as ٠ beside Arabic digits (#15, #56) | `SEP` and the gold-dot separator carry over unchanged |
| Arabic-Indic digits forced (`ar-u-nu-arab`) | Use the ported `digits()`. Don't rely on `intl` defaults for `ar` |
| Quran line height 2.05, marks clipped at line tops | `StrutStyle(height: 2.05, forceStrutHeight: true)` + `TextHeightBehavior(applyHeightToFirstAscent: true)`. Check the first line of Amiri Quran for clipped marks |
| Fallback font misplacing marks | Set `fontFamilyFallback: ['Amiri', 'Noto Naskh Arabic']` explicitly, so a mark and its letter never come from different fonts |
| Text size Normal/Large/Larger (#53) | Multiply into `MediaQuery.textScaler`, on top of the system setting |

Spike deliverable (2 d, inside F7): one screen and golden tests in both themes and languages showing basmala, الإخلاص ١–٢, a focus
highlight inside بَرَآءَةٌ, "(ّ)", a mixed English line with an Arabic term, a pause mark, the ayah-end ﴿٥﴾, and a word clip playing
with the lamp. Go or no-go on (d) after it.

### 2.6 Theme tokens

`tool/gen_tokens.mjs` reads the `--color-*` values from `src/styles/app.css` (`@theme` = light, the `@variant dark` block = dark)
and the `--t-*` palette from `tokens.css`. It writes `tokens.g.dart` (two `ColorScheme`-like `ThemeExtension`s). So the docs/18 contrast values
just fixed (`on-surface-variant #4f4942`, `outline #686157`, `gold #94702a`, `error #b23232`, `success #176f3b`, dark
`surface-container-low #292724` / `lowest #1f1e1b`, `outline-variant #45413a`, primary text `#5fd3c2` vs fill `#23756a`) have one source,
and `tokens.test.ts` stays the only contrast check. The component rules from docs/18 carry over by convention: inputs and the off switch get
`outline` borders, progress fills use `primary`, bars are solid (no `/85` translucency), and disabled primary buttons keep a readable label.
Radii (control 14, card 18), spacing, the 48px target and the type scale (`text-caption` … `text-quran`, with Arabic never below 14px)
become `TextTheme` + constants. Theme follows the system unless set (light/dark/system, as now).

### 2.7 iOS specifics

- **Audio session:** `audio_session` category `playback` for recitation, so the silent switch does not mute it. This is a known PWA pain on iOS Safari and fixes it. Switch to `playAndRecord` with `defaultToSpeaker` and `allowBluetooth` only while the Say step records, then switch back (compare plays through the speaker, not the earpiece).
- **Mic permission strings:** `NSMicrophoneUsageDescription` in `Info.plist`, localised in `ar.lproj/InfoPlist.strings` and `en.lproj`. Suggested EN: "Record yourself reciting so you can compare with the reciter. Recordings stay on this device." Add `CFBundleLocalizations` [ar, en].
- **Background audio** (phase 2): `UIBackgroundModes` `audio` only when it ships. Guideline 2.5.4 allows audio playback.
- **Recording format:** AAC-LC `.m4a` (mono, 44.1 kHz, about 64 kbps).
- **Fonts:** bundled TTFs work the same as on Android.
- **Device family:** **iPhone only** for v1 (`TARGETED_DEVICE_FAMILY = 1`). iPad support would require 13" iPad screenshots and tablet layouts. The web's rail and two-column layouts (#72–#77) are phase 3.
- **Privacy manifest:** check that each plugin ships its `PrivacyInfo.xcprivacy`, and declare required-reason APIs used by the app (file timestamps, UserDefaults if any).
- **Export compliance:** HTTPS only → `ITSAppUsesNonExemptEncryption = NO`.
- **Build:** needs this Mac with Xcode 26.2 and CocoaPods 1.17 (present). Signing uses the Apple Developer team in Xcode (automatic signing). Archive with `flutter build ipa` and upload with Xcode Organizer or Transporter.

### 2.8 Tests: what stays in TS, what Dart gets

- **Stay in TS (one place, unchanged):** every content checker that validates JSON: `src/content/{also,ar.merge,ar,course.build,examples.check,find,teach.check}.test.ts`, `src/i18n/library.test.ts`, `src/quran/quran.test.ts`, `src/styles/tokens.test.ts`. Flutter only consumes data those tests have already passed. CI order: `npm test` → `mobile/tool/sync_assets.sh` → `flutter test`.
- **Parity fixtures:** add a Vitest file, `UPDATE_FIXTURES=1`, that runs the TS logic on fixed inputs and writes JSON to `mobile/test/fixtures/` (the same pattern as `UPDATE_COURSE`). It covers `rebuildItems`/`applyAttempt`/`buildQueue`/`levelOf`, `makeQuestion` (seeded), course unlock, `today()` 03:00 rollover, store migrations (v1 → v2 backups), `merge`, `segAt`/`segsOf`/`needsBasmala`, `unitAyahs`, `parseHash`, `carryMarks`/`splitBidi`/`splitLatin`/`arRefs`, `tn()` plural forms, and `lessonSteps`. Dart tests load the same fixtures and must produce equal output. One source of truth for behaviour, no duplicated test authoring.
- **Dart-only:** golden tests for the Arabic rendering page (§2.5), a widget test per lesson step, the `t()` coverage test, and a player test with a fake clock.
- Web-only tests with no Dart counterpart: `App.test`, `Recovery.test`, `pwa/routes`, `icon.test`, `lib/utils`.

### 2.9 Sharing with athan

Don't build a shared package now: the second user doesn't exist yet. Keep `lib/ui/` (tokens, theme, kit) and `lib/i18n/` (digits, plurals,
isolates, `carryMarks`, `SEP`) free of imports from the rest of the app. When athan starts, move them into a `packages/arabic_ui`
(git dependency or a shared repo). The owner decides whether the two apps share a brand: same palette and fonts, different accent? One
developer account publishes both on each store.

---

## 3. Screen-by-screen parity and phases

### Foundations

| # | Item | d | MVP |
|---|---|---|---|
| F1 | Project, flavours, CI (web tests → sync → flutter test/build), asset sync | 1.5 | ✓ |
| F2 | Tokens generator, theme light/dark, type scale, fonts + licences | 2 | ✓ |
| F3 | i18n: `t`, `tn`, digits, SEP, isolates, `carryMarks`, RTL switch | 2 | ✓ |
| F4 | Content adapter + moving TS constants to JSON (web refactor) | 3 | ✓ |
| F5 | Core: types, day, scheduler, questions, course, store + migrations, backup import/export | 5 | ✓ |
| F6 | Parity fixtures (TS writer + Dart tests) | 1.5 | ✓ |
| F7 | Quran: surah loader, tajweed spans, Verse/WordToken/Passage, focus painter, pause marks; **shaping spike** | 4 | ✓ |
| F8 | Player: queue, basmala, word clips, lamp, loop/gap/rate, errors and offline | 4 | ✓ |
| F9 | Recorder, recordings store (last 5 per range), compare Reciter/Me/Both | 2 | ✓ |
| F10 | Unit audio download to disk, progress, delete | 1.5 | ✓ |
| F11 | Kit widgets: buttons, cards, PageHeader, StepBar, Segmented, sheets, chips, nudges | 3 | ✓ |
| F12 | Sync: auth (email code, Apple, Google), merge, CAS writes, account switch dialog | 4.5 | phase 2 |

### Screens

| Route | Screen | What it holds | d | MVP |
|---|---|---|---|---|
| — | Shell | Bottom tabs (Today, Rules, Path; Teacher in phase 2), top bar title rule, sticky lesson bar | 1.5 | ✓ |
| `onboarding` | Onboarding | Welcome + language + restore backup → Can you read this? → How it works → lesson 1 | 1.5 | ✓ |
| `today` | Today | Continue card, Review N due, practice, routine card, one nudge | 2.5 | ✓ |
| `plan` | Plan | Course map, units path, finale | 2 | ✓ |
| `progress` | Progress | S1–S6 values, rules known | 2 | ✓ |
| `unit/:id` | Unit | Intro, lessons, finale recite + "I recited it", matn link, Download audio | 2 | ✓ |
| `learn/:id` | Lesson | Shell + step bar + Hear, Notice, Learn (Teach text, glossary fold, video link, matn lines), Say (record, compare, self-rate), Find (word taps, found/missed), Check (QuestionView), Recite (passage), Summary, CorrectionStep, Hint | 10 | ✓ |
| `review` | Review | Queue, relearn, contrast questions | 2.5 | ✓ |
| `listen/:range` | Listen | Transport, loop/gap/rate, word lamp, record | 3 | ✓ (linked from Today, Rule) |
| `rules` | Rules | Topic clusters, search | 1.5 | ✓ |
| `rules/:id` | Rule | Card, 3 examples, Learn this, sources | 2 | ✓ |
| `mutun/:id` | Mutun | Matn with lines marked | 1 | ✓ |
| `settings` | Settings | Language, theme, text size, reciter samples, study time, backup/restore; reminders, account, teacher link (phase 2) | 2.5 | ✓ (partial) |
| `resources` | Resources | Episodes, find a teacher, **credits** | 0.5 | ✓ |
| `guide` | Guide | How it works | 1 | ✓ |
| — | Recovery | Unreadable data screen | 0.5 | ✓ |
| `account` | Account | Sign in, sync state, delete account | 1.5 | 2 |
| `teacher`, `teacher/new`, `teacher/:id` | Teacher log | Sessions, plan next, corrections (≤ 4 taps) | 4 | 2 |
| `circle`, `circle/:id` | Circles | Create/join, week view | 2.5 | 2 |
| `shared/:token` | Teacher view | Read-only for a teacher with no app | 0 | stays on the web; the app shares the web link |
| `mushaf`, `drill` | reserved | not built on the web either | 0 | — |
| — | Daily reminder (local notification), background audio + lock-screen controls | | 3 | 2 |

### Phases and totals

| Phase | Contents | d |
|---|---|---|
| **P0 spike** (first week, inside F7/F8) | Arabic rendering page + goldens, word clip accuracy on a real Android phone and iPhone, record → compare session switch on iOS. Go/no-go | (in F7/F8) |
| **P1 MVP, both stores** | F1–F11 (29.5) + MVP screens (36) + release work Android 2, iOS 2.5 + device QA and Arabic proofreading 5 | **≈ 75** |
| **P2** | F12 sync (4.5), Account, Teacher, Circles, reminders, background audio (11), QA 2 | ≈ 17.5 |
| **P3** | Tablet/iPad layouts (rail, two columns), iPad screenshots, muṣḥaf view | not sized |

Full parity is about 93 d. On the calendar, the Play closed test (14 days, 12 testers) overlaps the last two weeks of P1 QA. Apple review
usually takes days, not weeks. Allow one resubmission.

**What the MVP drops and why that is safe:** every feature that needs an account (sync, circles, teacher link). The app works fully
signed out (spec), so the MVP needs no Sign in with Apple, no deep links, and no UGC moderation for circle display names. The MVP's Data
safety form and App Privacy label become "no data collected". Also dropped: the teacher log (a tab, but self-contained), reminders (the
`.ics` doesn't fit a native app), background audio (avoids the foreground-service declaration) and tablet layouts.
Cut further if needed: Guide (−1), Progress (−2, Plan stays), Mutun (−1, links hidden).

---

## 4. Release checklists

### 4.1 Both stores: decide first

- **Package / bundle id (permanent):** use one id for both, e.g. `com.<owned-domain>.tajweedpath`. It needs a domain the owner controls, which also hosts the privacy policy and the account-deletion page. `io.github.suyaser.tajweed` works without a domain.
- **Privacy policy URL**, Arabic and English, for both stores: a static `privacy.html` on the GitHub Pages site. It states: recordings never leave the device; no analytics; optional account data (email, progress, circle display name) in Supabase; how to delete.
- **Account deletion web page** (Play requires a URL once accounts ship, [Play Help](https://support.google.com/googleplay/android-developer/answer/13316080)). The web app's Account screen can serve: sign in → Delete my account.
- **Audio source terms:** everyayah publishes no terms (decision #3). Streaming and caching in a store app is the same use as the PWA, but get written permission or document the risk before submission.

### 4.2 Google Play

- [ ] Developer account (one-time US$25). A personal account created after 13 Nov 2023 needs the **closed test: ≥ 12 testers opted in for 14 consecutive days** before applying for production ([Help](https://support.google.com/googleplay/android-developer/answer/14151465)). An organisation account (needs a D-U-N-S number) is not subject to it. Recruit testers early: friends, the teacher's circle.
- [ ] Identity verification, and a contact email and address shown on the listing.
- [ ] **Play App Signing** (default for AAB): keep the upload key (`upload-keystore.jks`) and its passwords outside git, backed up. Build with `flutter build appbundle`.
- [ ] **targetSdk 36** (Flutter 3.38 default; pin it in `android/app/build.gradle.kts`). Upgrade Flutter to the current stable first.
- [ ] Permissions: `INTERNET`, `RECORD_AUDIO` (runtime, asked only on the Say step's first record tap, with an in-app line first: "To compare your recitation with the reciter. The recording stays on your phone."). Phase 2: `POST_NOTIFICATIONS`, `FOREGROUND_SERVICE` + `FOREGROUND_SERVICE_MEDIA_PLAYBACK` with the App content FGS declaration.
- [ ] **Data safety (MVP):** Data collected: none. Data shared: none. Recordings are processed on the device only (not "collected"). Audio files are fetched from everyayah.com. **Phase 2 adds:** Personal info › Email address (account management; optional), Personal info › Name (circle display name; optional), App activity › Other user-generated content / App interactions (lesson progress, sync; optional), IDs › User ID. Not shared, encrypted in transit, deletion available in app and on the web.
- [ ] **Content rating (IARC questionnaire):** education/reference, no violence, no gambling, no user interaction in the MVP → expected *Everyone / PEGI 3*. Re-answer when circles ship (users can see each other's display names).
- [ ] Target audience: 13+ or adults, *not* designed for children, to stay out of the Families policy.
- [ ] Store listing **Arabic (default) + English**: title ≤ 30 chars ("مسار التجويد" / "Tajweed Path"), short description ≤ 80, full ≤ 4000, icon 512×512, feature graphic 1024×500, at least 2 phone screenshots (Arabic and English sets).
- [ ] Tracks: internal (instant, up to 100) → closed (the 14-day test) → production with a staged rollout.

### 4.3 Apple App Store

- [ ] **Apple Developer Program** (US$99/year), individual or organisation (D-U-N-S). The seller name is shown on the listing.
- [ ] **Bundle id** registered (same string as Android). **Certificates/provisioning:** Xcode automatic signing with the team; distribution certificate and App Store profile created by Xcode.
- [ ] App Store Connect record: primary language Arabic, English localisation, category Education (secondary Reference), price free.
- [ ] **TestFlight:** internal testers (no review) right away; external testers after a short beta review. Use it for the iPhone QA pass.
- [ ] **App Privacy ("nutrition") labels:** MVP "Data Not Collected". Phase 2: Contact Info › Email, User Content › Other (progress), Identifiers › User ID, Name (circles), all *linked to the user*, *not used for tracking*.
- [ ] **Age rating questionnaire:** expected the lowest band (4+).
- [ ] **Login (guideline 4.8):** the MVP has no login, so 4.8 does not apply. **Phase 2:** the web offers Google sign-in, so on iOS either add **Sign in with Apple** (Supabase native `signInWithIdToken`) or offer email only (the app's own account system is exempt). Recommended for the app: **email with a 6-digit code** (`verifyOtp`; add `{{ .Token }}` to the Supabase email template, and the web link keeps working). It needs no deep links or universal links. Add Apple on iOS only if Google is kept. In-app account deletion already exists (5.1.1(v)).
- [ ] **UGC (phase 2, circles):** display names seen by other members. Apple expects a way to report and block in apps with user content. Add "report member" and owner removal (exists) before circles ship on iOS.
- [ ] **Screenshots:** iPhone 6.9" (1320×2868 or 1290×2796) or 6.5" (1284×2778 / 1242×2688), up to 10, Arabic and English sets ([spec](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications)). iPad not needed while iPhone-only.
- [ ] Listing: name ≤ 30, subtitle ≤ 30, keywords ≤ 100, promotional text, description, support URL, privacy policy URL, in both languages.
- [ ] **Review notes:** "No account needed; every feature works signed out. The microphone is used only on a lesson's Say step to record the learner and play it beside the reciter. Recordings stay on the device. Recitation audio streams from everyayah.com, and units can be downloaded for offline use. The Quran text is bundled (Tanzil)." Attach a 30-second screen recording of a lesson.
- [ ] Export compliance flag set. Privacy manifest present.

---

## 5. Local setup steps

1. `flutter upgrade` (or `fvm install stable && fvm global stable`). Local is 3.38.5 from Dec 2025. Use one install: brew and fvm both exist.
2. `flutter doctor --android-licenses` (the only doctor issue today).
3. Put `~/Library/Android/sdk/platform-tools` and `cmdline-tools/latest/bin` on `PATH` (for `adb` and `sdkmanager`).
4. Create an emulator (API 36 image) in Android Studio's Device Manager, and use a real Android phone for audio timing and recording.
5. iOS: `xcodebuild -downloadPlatform iOS` if no simulator runtime is installed. Sign in to the Apple team in Xcode. Test on a real iPhone (mic, silent switch, Bluetooth).
6. `flutter create --org <reverse-domain> --platforms android,ios mobile` when coding starts (not part of this plan).

---

## 6. Open decisions for the owner

1. **Path:** (d) Flutter as planned (≈ 75 d MVP), or (b) Capacitor first for both stores in ≈ 20 d with the Apple 4.2 risk, then Flutter later?
2. **Package/bundle id and domain:** buy a domain (id, privacy page, deletion page, future universal links) or use `io.github.suyaser.*`? The id is permanent.
3. **Developer accounts:** personal (12 testers × 14 days on Play; your name as seller) or organisation (D-U-N-S, no Play test gate)? Shared with athan?
4. **MVP without accounts?** It ships sooner and with "no data collected" labels. Sync, circles and the teacher log follow in P2.
5. **Login in the app:** email code only, or email + Google (+ Sign in with Apple on iOS)?
6. **everyayah audio:** ask for permission, or accept the risk as on the web?
7. **Shared brand with athan:** same palette and fonts in a shared Dart package later, or separate identities?

Sources: [Play target API](https://developer.android.com/google/play/requirements/target-sdk) ·
[Play testing requirement](https://support.google.com/googleplay/android-developer/answer/14151465) ·
[Play account deletion](https://support.google.com/googleplay/android-developer/answer/13316080) ·
[Play FGS declaration](https://support.google.com/googleplay/android-developer/answer/13392821) ·
[Play limited functionality](https://support.google.com/googleplay/android-developer/answer/14983486) ·
[Webview spam](https://android-developers.googleblog.com/2020/10/developer-tips-and-guides-common-policy.html) ·
[TWA asset links](https://developer.chrome.com/docs/android/trusted-web-activity/android-for-web-devs) ·
[App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) ·
[Apple 4.2 forum threads](https://developer.apple.com/forums/thread/812889) ·
[App Store screenshots](https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications) ·
[WKWebView service workers](https://bugs.webkit.org/show_bug.cgi?id=206741) ·
[just_audio](https://pub.dev/packages/just_audio) · [record](https://pub.dev/packages/record) ·
[supabase_flutter](https://pub.dev/packages/supabase_flutter) · [Supabase Apple sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-apple) ·
[Flutter Arabic diacritics write-up](https://www.codeiva.com/updates/how-we-fixed-arabic-diacritic-rendering-in-a-flutter-quran-app-without-webview)
