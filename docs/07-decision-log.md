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
| 25 | Lesson order changes made by the content build: `tafkhim` before `ibtida`/`lam-q`/`lam-s` (unit 1); `sakinayn` moved to the end of unit 2; `mutajanisayn` moved to unit 4 | Without them those lessons, or unit 2's finale, had no closing passage of learned rules only | Yes, `content/course.json` + `UPDATE_COURSE=1 npx vitest run src/content/course.build.test.ts` |
| 26 | ر is not detected from text for closing passages | It is in almost every ayah; basic ر is taught in `tafkhim` (unit 1), full ر rules in unit 5 | Yes, `src/content/rulemap.ts` |
| 27 | Some closing passages come from outside جزء عمّ (e.g. آل عمران ١٢١–١٢٢ for المتجانسين, الشورى ١–٢ for الحرفي, المؤمنون ٩٣–٩٧ for المتقاربين); unit 3's finale is الكافرون ١–٢ only | Nothing inside جزء عمّ shows those rules with only learned rules around them | Yes |
| 28 | `NEW_PER_DAY = 2`; a unit with no finale counts as finished when its lessons are done; backlog blocks new lessons, never the finale; strict course order (no "teacher corrected it, learn it first") | Engine build | Constants in `src/core/course.ts` |
| 29 | v1 phases and phase tasks removed from content and screens; `UserData.phases` kept only so old backups load; a finale planned in a teacher session is stored as a milestone result and "Passed" completes the finale | Units replace phases | — |
| 30 | Today's 40-minute four-part wird list replaced by Continue / Review / Practice / Unit cards; onboarding says about 20 minutes a day | v2 Today design | Yes |
| 31 | Backend: generic merge (union by id/lessonId/unitId, newer timestamp wins; day logs merged field by field), compare-and-swap writes with 3 retries; activity only for today (±1 day); owner leaving deletes the circle; circles capped at 20; "delete my data" removes data, links, owned circles and activity, then signs out (the auth account itself is removed on request) | Backend build | — |
| 32 | Sign-in nudge on Today after the first finished lesson (Later hides it for 7 days); "Backed up / Not backed up" badge on Progress and Settings; the file-backup nudge hides when signed in | Learner asked to encourage sign-in honestly | Yes |
| 33 | Deferred: sharing recordings with the teacher, push reminders, renaming a circle in the app, automatic auth-account deletion | Time; not essential for launch | — |
| 34 | Review round 1 fixes (3 reviewers: tajweed, learner UX, engineering/security); all blockers and majors fixed — see `08-review-*` notes below | — | — |
| 35 | First sync on a device with no progress takes the account copy (settings included); a device with progress merges but keeps the account's settings; a different account signing in on a device pauses sync and asks: use account / merge / cancel | Prevent settings loss and progress leaking between accounts on a shared device | Yes, `src/sync/sync.ts` |
| 36 | "Reset everything" while signed in signs out first and keeps the account copy; "Restore" while signed in replaces the account copy (no merge) after a confirm; "Delete my account" deletes the sign-in itself (`delete_me()`), other devices sign out on their next sync | Make reset/restore/delete mean what they say | Yes |
| 37 | Circle invite codes are 12 characters (60 bits); 10 wrong codes an hour blocks joining; owners can rename, change the code and remove members; circle-mates see only the last 8 days of activity. Existing invite codes were replaced | Security review: 32-bit codes were guessable | Yes, migration |
| 38 | v1 → v2 migration counts a unit passed when all its v1 lessons are done; the 9 new lessons in passed units become optional catch-up lessons (a "New in this version" card) and never block | v1 learners shouldn't restart at basics | Yes |
| 39 | Check questions use only already-learned rules as wrong answers; with fewer than 2 learned, length/fact questions instead | First lessons were trivially guessable | Yes |
| 40 | `aqwa-maddayn` moved to the end of unit 6 (needs المد اللازم); الجزرية 34–36 and 62 moved to unit 1; ض/ظ no longer restrict closing passages; hand-picked closing passages for undetectable lessons (ra-l, sakt, waqf-signs, waqf-how, rawm-ishmam, some مخارج/صفات), each checked to contain only learned rules | Tajweed review | Yes, `content/course.json` `closingOverride` |
| 41 | `basics` and `istiadha` have no closing passage (every ayah needs later rules); their Recite step says the examples | Keeps the "only learned rules" promise honest | — |
| 42 | الإشمام and الروم notices say "watch a teacher's lips" (not heard in the bundled reciters); with الروم only المد العارض returns to 2 | Tajweed review | — |
| 43 | Onboarding: intro-course question removed (5 steps), ends in lesson 1; "Not sure yet" for المنفصل only adds a teacher-session reminder if teacher days are set | UX review | Yes |
| 44 | New lessons hide the rule's name until the Learn step | Practical first: hear and notice before naming | Yes |
