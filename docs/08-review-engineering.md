# Engineering review (pre-deploy)

Scope: `src/` (core, audio, quran, app, components, screens), `vite.config.ts`, `index.html`, `vercel.json`, `scripts/`, `package.json`, at commit `9bf5473`. No browser testing (covered by the other reviewer).

## Sanity run (fresh clone in a scratch dir)

| Step | Result |
|---|---|
| `npm ci` | ok |
| `npm run build` (`tsc -b && vite build`) | ok, 524 ms. Main chunk 418 KB (129 KB gzip), CSS 47 KB, precache 7 entries (489 KB). `tsc -b` really type-checks: an injected type error fails the build. |
| `npx vitest run` | 11 files, 112 tests, all pass |
| Build-time dependencies | none on `.cache/` or new Node features. `scripts/build-quran-data.mjs` (Node ≥ 22.18, network, `unzip`) runs only through `npm run data`, not during the build. |
| Secrets | none. The grep hits for "token" were design tokens. |

I checked these with throwaway Vitest probes:
- `migrate()` accepts `settings: {}`. The result has `teacherDays`/`reciterId` undefined and `phases: []`.
- `migrate()` accepts `sessions: [null]`.
- A `QuotaExceededError` in `commit()` is swallowed. The data exists only in memory and is gone after `reload()`.
- `today()` handles the 03:00 rollover and DST correctly.

I also checked the live everyayah.com headers. It sends `Access-Control-Allow-Origin: *` and answers `Range` requests with 206.

---

## Blocker

### B1. Audio requests hit the `/data/` cache route, so the audio rule never runs
`vite.config.ts:25` matches with `url.pathname.includes('/data/')`, and every recitation URL also contains `/data/`: `https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3`. Workbox uses the first route that matches, so all audio goes to the `quran-data` **StaleWhileRevalidate** cache. The `audio` CacheFirst rule on lines 26–27 (with `rangeRequests`, `expiration` and `cacheableResponse`) is never used. The generated `dist/sw.js` shows the same order.

What goes wrong:
- **No range handling.** `Player.start()` (`player.ts:210`) prefetches the next ayah with a plain `fetch()`, which caches a full 200 response. When that ayah plays, the `<audio>` element sends `Range: bytes=0-1` (Safari always does) and gets that cached 200 back with no 206 slicing. Safari is known to refuse media served this way by a service worker. On iOS, the main target, every ayah after the first in a range can fail to play once the SW is in control. **Check this on a real iPhone.**
- **The cache never stops growing.** There is no expiration on `quran-data`. Every ayah ever played, for each of the three reciters, stays cached forever. Under storage pressure, a non-persisted origin is evicted as a whole, and that includes `localStorage` (all progress) and the recordings in IndexedDB.
- **Every cached ayah downloads again.** SWR revalidates on each play.

Fix (one line, plus B1-related M1):
```ts
{ urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.includes('/data/'), handler: 'StaleWhileRevalidate', ... }
```
Then add a config test that runs both matchers against an everyayah URL and a `/data/surah/001.json` URL.

---

## Major

### M1. Audio is fetched without CORS, so the first ayah of a range is never cached and opaque partial responses can be stored
- `player.ts:182` creates `new Audio()` without `crossOrigin`, so media requests are `no-cors` and their responses are opaque.
- The audio rule allows status `0` (`vite.config.ts:27`), which means it will try to store opaque responses. An opaque 206 can't be range-sliced later and can't be inspected.
- Only the prefetched *next* ayah is ever cached. The first ayah of any passage, and single-ayah or word plays in Learn and Review, are never cached, so "offline listening" fails exactly where it starts.

Fix:
- In `audio()`, set `a.crossOrigin = 'anonymous'` (everyayah sends ACAO `*`).
- Change `cacheableResponse.statuses` to `[200]`.
- Prefetch the current ayah too, not only the next one: `fetch(url)` in `start()`.
- Add `purgeOnQuotaError: true` to the expiration options.

### M2. Two tabs (or the installed PWA plus a browser tab) overwrite each other
`store.ts` has no `storage` event listener. Each tab keeps its own in-memory `data`, and `commit()` writes the whole object. If tab A has been idle and then records one answer, it erases everything tab B has done since A loaded. This loss is silent. `reload()` exists (`store.ts:305`) but nothing calls it.

Fix: `window.addEventListener('storage', e => { if (e.key === STORAGE_KEY) reload() })` in `store.ts`, plus a test.

### M3. A full localStorage drops progress without any warning
`store.ts:105` catches `QuotaExceededError` and keeps the data in memory only. Everything is lost on the next launch and the learner is never told; the probe confirmed this. Growth estimate: one attempt is about 280 bytes as JSON, so 30 a day comes to about 3 MB a year. Safari's localStorage limit is about 5 MB, so a daily user reaches it within 1–2 years. Every commit also re-serialises the whole object, including the 15-second listen ticks.

Fix:
- Record the failure (`saveError`), show a banner with "Back up now", and stop pretending the data is saved.
- Later: store compact attempts (short keys, no derived `itemId`), or move attempts to IndexedDB.

### M4. A malformed backup or saved state can lock the app on a white screen
- `migrate()` (`store.ts:59-71`) only checks that the arrays exist. It accepts `settings: {}`, `phases: []` and `sessions: [null]` (probe).
- For schema v1 it never merges settings with `defaultSettings()`. Only the v0 migration does.
- There is no React error boundary anywhere in `src/`.

How it fails: a hand-edited or partly broken backup is imported through Settings → Restore, or through the onboarding import with no confirmation step. `commit()` saves it. Then a render throws, for example `s.teacherDays.includes` in Settings or `x.id` on a null session in `Session.tsx:15`. The result is a blank page **on every launch**, and fixing it requires DevTools.

Fix:
- In `migrate()`, always set `settings = { ...defaultSettings(), ...d.settings }`.
- Drop non-object array elements and require the key fields (`id`, `on`, `lessonId` …).
- Set `phases` to `lockedPhases()`-merged when it is empty.
- Add a top-level error boundary in `main.tsx` that offers "Download my data" (the raw localStorage text) and "Reset".

### M5. The recovery screen for unreadable data is behind the onboarding redirect
When the stored JSON is unreadable or comes from a newer schema, `load()` sets `loadError` and uses `defaultData()`, so `onboardedOn` is null. `main.tsx:12` and `App.tsx:24` then send every route to `#/onboarding`, and the "Your saved data could not be read / Download saved data" cards in Today and Settings can't be reached. The learner sees a fresh welcome screen and concludes the data is gone.

The newer-schema case is realistic: a stale tab or an old cached SW version opens after a newer version has migrated the data.

Fix: in `Root`, render a recovery screen (download the raw data, import, reset) whenever `getLoadError()` is set, before the onboarding gate.

### M6. The microphone can keep recording for up to 3 minutes after leaving Listen
`Recorder.start()` (`recorder.ts:24-37`) awaits `getUserMedia`. If the screen unmounts while the permission prompt is open, the cleanup in `useRecorder.ts:7` calls `stop()`, which does nothing because `this.mr` is still null. When permission is granted, recording starts on an unmounted screen and runs until the 3-minute guard ends it, with the mic indicator on. The take is then saved to IndexedDB from the stale closure (`Listen.tsx:93-103`).

Fix: add an `aborted` flag that `stop()` sets while `status === 'requesting'`. After `getUserMedia` resolves, if the flag is set, release the tracks, set the status to idle and return null.

### M7. Listen re-renders a whole long surah many times a second
- Today's "Listen" link opens the **whole surah** of the lesson's first example (`study/helpers.ts:80`, `Today.tsx:59`). Surah 2 is the most common example source (34 examples), which means 875 KB of JSON and about 6,100 words.
- `Listen.tsx:178-183` rebuilds `ayahs` on every render, and when colours are on it reruns `tajweedSpans` (quadratic in spans per verse) for every ayah.
- `Passage` (`Verse.tsx:174`) is not memoised, and it also scans `Object.entries(marks)` for each ayah.
- Renders happen on every lit-word change (about 2–4 per second while playing), every 250 ms while recording (`Listen.tsx:78-82`), and every 15 s from `addListenSeconds`.

On a mid-range phone, expect visible jank and battery drain.

Fix:
- Wrap `ayahs` and `shownColours` in `useMemo([verses, colours])`.
- Split out a `React.memo` per-ayah component, so a word change re-renders only the current ayah and the previous one.
- Move the recording clock into `RecordButton`.
- Link Today to the example's ayah plus or minus a few, or a page, instead of the whole surah.
- Cap `parseRange` (`#/listen/1-114` currently fetches all 11 MB).

### M8. Safari can delete all data after 7 idle days, and the backup nudge waits 14
Safari (ITP) deletes script-written storage for sites not on the home screen after 7 days without use. A learner who only opens the app around a weekly class is exactly that case. The backup nudge appears only after 14 days (`Today.tsx:101`), and it ranks below the install nudge.

There is also a second issue: backups use `<a download>` with a blob URL that is revoked after 1 s (`path/ui.tsx:109-120`, `Onboarding.tsx:133-139`, `Today.tsx:~250`). In iOS standalone PWAs that is unreliable, so the only safeguard may silently produce nothing. **Check on an iPhone.**

Fix:
- When not standalone, nudge for a backup after 7 days.
- Prefer `navigator.share({ files: [new File([json], name, { type: 'application/json' })] })` when `navigator.canShare` allows it, and fall back to the download link.
- Revoke the URL after about 60 s.

---

## Minor

| # | Where | Problem | Fix |
|---|---|---|---|
| m1 | `vite.config.ts:28`, `index.html:10` | The Google Fonts CSS `<link>` has no `crossorigin`, so the response is opaque. CacheFirst only caches status 200, so the CSS is never cached and fonts fall back offline. No expiration. | Add `cacheableResponse: { statuses: [0, 200] }` and `expiration` to the fonts rule, or self-host the fonts. |
| m2 | `vite.config.ts:11`, `main.tsx:15` | With `autoUpdate`, `skipWaiting` and `clientsClaim`, the page reloads as soon as a new SW takes control. A deploy during a class (InClass sheet), a recording, or typing a session note loses that UI state. Updates are checked only on load, so the risk is low. | Use `registerType: 'prompt'` with an "Update ready" nudge, or postpone the reload while recording or in focus mode. |
| m3 | `vite.config.ts:25` | `/data/*.json` is SWR: the first load after a deploy serves the old JSON to the new code. A future change to the shape of `Verse` would break that load. | Version the data path (`data/v1/…`) or check a version in `meta.json`. |
| m4 | `player.ts:203` | The `{ once: true }` `loadedmetadata` seek listener remains if `src` changes before it fires, so the next ayah seeks to the old word offset. | Inside the listener, check `a.src === url` first. |
| m5 | `Session.tsx:99-107` | If `wakeLock.request` resolves after unmount, the lock is never released. | Track `alive`; release immediately if it resolves late. |
| m6 | `Today.tsx:39`, `Review.tsx:22`, `Listen.tsx:66` | `today()` is evaluated only during render. An app left open across 03:00 keeps showing yesterday until the user interacts. | Re-render on `visibilitychange` and on a timer set for 03:00. |
| m7 | `store.ts:94` | `navigator.storage.persist()` runs at import. Firefox shows an unexplained permission prompt on the first visit. | Call it after onboarding, or with the install nudge. |
| m8 | `vite.config.ts:20`, `public/icon.svg` | The only icon is one SVG with `purpose: 'any maskable'` (combining these is discouraged). There is no PNG `apple-touch-icon`, so the iOS home-screen icon is a screenshot. The `ت` glyph needs Amiri, which isn't available when the icon is rendered. | Add 180, 192 and 512 PNGs plus a separate maskable PNG, convert the glyph to a path, and add `<link rel="apple-touch-icon">`. |
| m9 | `vercel.json` | No headers. Hashed `/assets/*` are revalidated on every load. | Add a `headers` entry: `/assets/(.*)` → `public, max-age=31536000, immutable`. Keep `sw.js` at no-cache (Vercel's default is already fine). |
| m10 | repo | `tsconfig.tsbuildinfo` is committed and every build rewrites it, so the tree is dirty after `npm run build`. | Untrack it and add it to `.gitignore`. |
| m11 | repo | There is no GitHub Pages workflow, although the base path and data URLs work under a subpath (`document.baseURI`, `./sw.js`). | Add `.github/workflows/pages.yml` (build, upload `dist`) when Pages is actually needed. |
| m12 | `src/content/index.ts:6` | The verified mutun (`content/mutun.json`, 96 KB) is not wired in. The fallback is `[]`, so the matn lines in the Rule screen are empty. | Switch the import if the verification is complete (commit 96298d5 suggests it is). |
| m13 | `App.tsx:9` | `eager: true` puts every screen and the 155 KB `rules.json` into one 418 KB chunk. It is acceptable for R1. | Lazy-load the screens other than Today when the bundle grows. |
| m14 | `vite.config.ts:12` + glob | `icon.svg` is precached twice (it comes from both `includeAssets` and `globPatterns`). It does no harm. | Remove `includeAssets`. |

## Checked, no issue found
- **Rendering and links:** no `dangerouslySetInnerHTML` anywhere. Imported strings are rendered as React text. Content links are allowed only if they match `^https?://`. External links use `rel="noopener"`.
- **Recording code:** `getUserMedia` is called only from a tap (iOS). Denied and unsupported mics have their own states. The mic stream is released on stop and on error (the exception is M6). Playback reuses a single unlocked `<audio>` element, and the "model, then me" flow resolves and restores loops and gap. Object URLs are revoked.
- **Async loads:** the `useVerse`, `useVerses`, Listen and TeacherNew loads all use an alive flag and key-check their results. A failed `loadSurah` is retried.
- **Scheduler:** `rebuildItems` and `applyAttempt` agree. The `today()` 03:00 rollover and DST cases are fine, and day arithmetic is done in UTC.
- **Deploy paths:** relative `base`, `navigateFallback` and hash routing work on Vercel and under a GitHub Pages subpath. The manifest `start_url`/`scope` are relative.

## Test gaps on critical logic
1. Store: the `storage` event / multi-tab path (M2), a quota failure being surfaced (M3), and `migrate()` with partial settings, null elements and an empty `phases` (M4).
2. Recorder: unmount during `requesting` (M6).
3. SW config: a unit test of the route matchers, so B1 can't come back. Export them from a small module that `vite.config.ts` imports.
4. Player: a `src` change before `loadedmetadata` (m4).
5. Manual, on a real iPhone (Safari and home-screen app): ayah 2+ of a range after the SW takes control (B1), offline replay of a passage (M1), and Backup now (M8).
