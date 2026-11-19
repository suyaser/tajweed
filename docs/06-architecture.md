# Architecture and module ownership

Stack and sources: `00-decisions.md`. Features: `02-product-spec.md`. Screens and tokens: `03-design.md`. Shared types: `src/core/types.ts` (the contract; add fields, don't rename).

Ponytail rules for everyone: no new dependencies beyond package.json (react, react-dom, idb-keyval, vite, vite-plugin-pwa, vitest, jsdom); no router or state library; no CSS framework; smallest code that meets the spec. One Vitest file per module with real logic.

## Modules and public APIs

| Dir | Owner (phase 1) | Public API |
|---|---|---|
| `scripts/build-quran-data.mjs`, `public/data/`, `src/quran/` | data | `npm run data` builds `public/data/surah/NNN.json` (`Verse[]`) + `public/data/meta.json`. `src/quran/index.ts`: `loadSurah(n): Promise<Verse[]>`, `getVerse(key)`, `getRange(from, to): Promise<Verse[]>`, `surahName(n)`, `toArabicDigits(n)`, `RECITERS: Reciter[]`, `tajweedSpans(verse)` → segments of text with rule keys mapped to `ColourKey` |
| `src/core/` (not types.ts), `src/content/` | core | `day.ts` (`today(now)`, 03:00 rollover, `addDays`, `diffDays`); `scheduler.ts` (`rebuildItems`, `applyAttempt`, `buildQueue`, `levelOf`); `questions.ts` (`makeQuestion`, distractors per spec §6.4); `store.ts` (`useData()` via useSyncExternalStore, actions, localStorage persist with versioned migrations, `exportJson`, `importJson`, `navigator.storage.persist()`); `ics.ts` (daily wird reminder file); `src/content/index.ts` (`lessons`, `topics`, `phases`, `pairs`, `mutun`, `getLesson`) adapting `content/*.json` |
| `src/audio/` | audio | `ayahUrl(reciterId, key)`; `usePlayer()` — queue of verses, play/pause, loop range, rate (0.75/1), pause-to-repeat gap, current word from timings, `playWord(key, wordIdx)` as a slice; `useRecorder()` — MediaRecorder with iOS mime fallback; `recordings.ts` (idb-keyval, last 5 per range) |
| `src/styles/`, `src/components/`, `src/app/`, `src/main.tsx` | ui-system | tokens.css (light/dark, tajweed palette with design §3 contrast fixes), base.css, `Shell` (bottom tabs ≤767px, side rail ≥1024px), hash router (`useRoute`, `navigate`, `link`), components from design §6 (VerseBlock, WordToken, RuleChip, LetterTile, CountBeats, StarBadge, Ornament, AudioTransport, RecordButton, LevelBadge, CorrectionTag, Bdi helper, Sheet/Dialog, SegmentedControl, EmptyState), placeholder screens per route |
| `src/screens/` | screens (phase 2) | One file per route in spec §5 / design §5 |

## Data flow
Content JSON (bundled) + Quran per-surah JSON (fetched, cached by SW) are read-only. All user state lives in one `UserData` object in localStorage (`tajweed-path:v1`), recordings in IndexedDB. Scheduling state (`items`) is a cache rebuilt by the pure `rebuildItems(introductions, attempts, corrections, today)`.
