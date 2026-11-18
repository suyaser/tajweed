# Tajweed Path · base decisions

Status: decided (stage 0). Change only with a reason written here.

## Product in one line
A study companion for an Arabic-speaking adult learning tajweed (رواية حفص عن عاصم, طريق الشاطبية) alongside a human teacher. It plans what to study each day, drills rules with spaced review, lets the learner hear real recitation and record themselves, and logs the teacher's corrections. It never grades recitation automatically: AI recitation checks are out of scope (they cannot judge tajweed reliably yet).

## Stack
- **Vite + React + TypeScript**, a static single-page app. No server code in v1.
- **Routing:** hash routes (`#/today`, `#/rules/ikhfa`). Works on any static host, no rewrite rules.
- **Styling:** plain CSS with design tokens (carried over from the artifact: light + dark, the colour-coded muṣḥaf palette). No CSS framework.
- **Fonts:** Google Fonts — Amiri Quran (verses), Amiri (Arabic UI), Reem Kufi (Arabic display), Marcellus (Latin display), Inter (body). Self-host later if offline matters.
- **State:** one typed store persisted to `localStorage` (versioned schema, migrations). All features work signed out.
- **Sync (optional, stage 3):** Supabase (auth by email magic link + Postgres with row-level security). The local store stays the source of truth; sync pushes/pulls a small set of tables.
- **Audio:** HTML `<audio>` with recitation files from the Quran.com / Quran Foundation CDN; word-by-word audio and timings if the API provides them (verify in research).
- **Recording:** `MediaRecorder` in the browser; recordings stay on the device (IndexedDB), never uploaded in v1.
- **Installable:** PWA (manifest + service worker caching the app shell and recently used audio).
- **Tests:** Vitest for pure logic (scheduler, store migrations, tajweed text parsing). No E2E framework in v1.

## Deploy
- **Primary: Vercel** (static build, preview deploy per branch for review rounds).
- Also deployable to **GitHub Pages** unchanged (hash routing, relative `base`).

## Content sources (updated after `01-api-research.md`)
- Rule content, examples and colours: `docs/reference/artifact-v3.html` (the current artifact).
- **Quran text:** Tanzil Uthmani, bundled (verbatim, attribution + link). Pinned to the version cpfair's offsets match; basmala handled per research notes.
- **Tajweed markup:** cpfair/quran-tajweed (CC BY 4.0), bundled, split per surah. It does not mark الراء، لام الجلالة، الإظهار، البدل، السكت، قلقلة صغرى/كبرى: those come from our own hand-checked annotations for the surahs we ship in the analyser.
- **Ayah audio:** everyayah.com MP3s (Husary, Husary Muʿallim, Minshawy), loaded at runtime, cached by the service worker.
- **Word timings / word audio:** cpfair/quran-align (CC BY 4.0), bundled; a word is played as a slice of the same reciter's ayah file.
- **Quran Foundation API:** not used in v1 (new API needs a server-side secret; terms forbid bundling). Revisit only if we add a backend.
- **Mutun:** تحفة الأطفال (Shamela 9632, notes of الضباع) and المقدمة الجزرية (Shamela 581, ed. عبد المحسن القاسم). One cited edition each; every line checked before shipping.

## Decisions after spec + design (2026-11-19)
- Teacher: weekly, online. `teacherDays[]` asked in onboarding (design §, adds onboarding screens).
- Phone-only until R3 sync: accepted.
- Content accuracy: agents review every rule, example and matn line against credible sources and record the source per item (`content/`, `docs/04-content-review.md`). Unverified items carry a visible status.
- الجزرية edition: Shamela 581.
- Spec/design conflicts resolved in favour of the design: the analyser can ship a surah before our own annotations are complete, as long as the legend says honestly which rules are not shown yet; word tap (with highlighting) moves into the R1 player because the timings are bundled anyway; Progress lives in the Path tab; Today offers a "10 minutes: review only" path.
