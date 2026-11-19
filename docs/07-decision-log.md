# Decisions made on the learner's behalf (overnight build, 2026-11-19 → 20)

The learner approved R1 and asked me to decide and keep going. Each decision here is reversible; review together.

| # | Decision | Why | Easy to change? |
|---|---|---|---|
| 1 | Vite 5 + React 18 + TypeScript, no router/state/CSS libraries; `idb-keyval` for recordings | Smallest stack that covers the spec; fewer moving parts to maintain | Yes |
| 2 | Hash routing, `base: './'` | Same build on Vercel and GitHub Pages, no rewrites | Yes |
| 3 | PWA via vite-plugin-pwa; audio cached max 7 days / 400 files | everyayah publishes no terms; keep cache short (spec U1) | Yes |
| 4 | Content review done by agents against published references, each item with its source and a status; items they can't settle are `needs-teacher` and show a badge | Learner asked for an agent review instead of a teacher review | — |
| 5 | Build order: R1 complete first; R2 only if time remains after the review round | "Ready for deployment" means R1 solid, not R2 half-done | — |
| 6 | Analyser colours: إدغام بغنة and الإدغام الشفوي are green (ghunnah), like the Dar al-Maarifah muṣḥaf; only المتجانسين/المتقاربين use the "merge" colour | Match the printed muṣḥaf the learner reads, and the rule cards | One line in `src/quran/index.ts` |
| 7 | Husary murattal uses the 64 kbps timings with the 128 kbps audio (same recording, verified durations) | quran-align has no 128k timings | Yes |
| 8 | Quran data (≈11 MB, per-surah JSON) is committed to `public/data`; `npm run data` regenerates it; deploy doesn't run the pipeline | Faster, reproducible deploys; no network at build | Yes |
| 9 | Review round findings are all fixed before deploy, in three batches: engineering (B1, M1–M8), Quran/tajweed fidelity + learning design, then UX | Reviewers found real blockers in each area | — |
| 10 | Stop and sakt marks: keep Tanzil text verbatim for offsets, but take the pause marks from the Tanzil "with pause marks" edition and store them per word (`Verse.marks`), rendered after the word | Tanzil requires verbatim text; word indices must stay aligned with timings and examples | Yes |
| 11 | Basmala: shown as a heading at the start of every surah except التوبة (and part of الفاتحة 1:1), and played from 001001 before ayah 1 | Required in Hafs at the start of a surah; per-ayah audio files don't include it | Yes |
| 12 | New lessons: at most 4 a week (spec said 1/day), and the next phase may open once half the milestone passages are passed | Learning review showed 1/day outruns the 16-week plan and creates 40-day milestone stalls | One constant |
| 13 | A lesson leaves its first week at the 3-day step (not 7), and "strong" needs the 30-day step plus 3 correct in a row on different examples | Early answers are easy to guess; levels were inflated in simulation | Constants in scheduler |
| 14 | Final visual pass (learner's request): the site must feel like a real app, not an artifact page — app chrome, page headers, laptop layout, transitions — while the identity (palette, fonts, lattice, gold frames, star badges) is copied from the last artifact (`docs/reference/artifact-v3.html`) | Learner asked after the review round | — |
| 15 | Ayah references render as `الفاتحة ١–٧` / `البقرة ٥` (no `·` between name and number) | In Amiri the middle dot reads as Arabic zero (`الكوثر · ١` looked like `الكوثر ١٠`) | Yes, `src/components` |
| 16 | Static splash in `index.html` (green band, Kufi title) until the app loads | No blank white flash on slow phones | Yes |
| 17 | Style B "Sand and ink" (learner chose it from a side-by-side of three looks): sand/ink palette with deep teal, Figtree + IBM Plex Sans Arabic for the interface, Noto Naskh Arabic headings, Amiri Quran unchanged for the Quran, no lattice or gold frames, outlined step numbers, drawn icons, 48px targets; tajweed colours unchanged | Learner asked for a modern Islamic feel; a design agent compared Quran.com, Muslim Pro, Pillars and others | Tokens in `src/styles/tokens.css` |

## v2 (overnight build, 2026-11-20 → 21). The learner asked me to build v2, the backend and push; these are for review.

| # | Decision | Why | Easy to change? |
|---|---|---|---|
| 18 | v2 is a course: 58 lessons in units 0–9 (spec `09-v2-spec.md`), units follow the YouTube course's surah order, each lesson closes on a real passage containing only learned rules | Agreed in conversation | — |
| 19 | 9 new lessons: basics, الاستعاذة والبسملة, التفخيم والترقيق (heavy letters), التقاء الساكنين, letters written but not read, أقوى المدين, الض والظ, الروم والإشمام في الوقف, مراتب القراءة | Gaps found when mapping v1 to units | Yes, `content/` |
| 20 | لام لفظ الجلالة moved to unit 1 (not 5) | الله appears in almost every passage (and the basmala); closing passages could not be found otherwise | Yes, `content/course.json` |
| 21 | Heavy letters (`tafkhim`) in unit 1 cover ر at a basic level; the full ر rules stay in unit 5 | ر is in nearly every ayah | Yes |
| 22 | Pace: at most 2 new lessons a day, sequential unlock, new lessons pause when >15 reviews are overdue; the weekly cap and phases are retired | A course needs momentum; spacing still comes from review and the daily cap | One constant |
| 23 | A unit's finale (self-checked recitation of a whole surah or passage) opens the next unit | Practical milestone without needing a teacher | Yes |
| 24 | Lesson steps: Hear → Notice → Learn → Say → Find → Check → Recite; the v1 "guess first" pretest is replaced by Hear and Notice | Practical first | Yes |
