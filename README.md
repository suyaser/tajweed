# Tajweed Path · مسار التجويد

A self-contained tajweed course (رواية حفص عن عاصم من طريق الشاطبية): 58 practical lessons in 10 units that follow the short surahs from الناس to الضحى, then الفاتحة and beyond جزء عمّ. Each lesson goes hear → notice → learn → say → find → check → recite, and closes on a real passage that contains only rules already learned. A سبق · سبقي · منزل review cycle keeps rules fresh. It never grades recitation automatically; a teacher is optional.

Static single-page app (Vite + React + TypeScript), installable as a PWA. Progress lives on the device (localStorage; recordings in IndexedDB) and works fully offline. Optional sign-in (Supabase: email link or Google) backs it up and syncs devices, adds a read-only teacher link and private study circles. Recordings never leave the device.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest
npm run build      # type-check + production build into dist/
npm run preview    # serve dist/
```

Node 22.18+ is needed only for `npm run data` (rebuilding the Quran data); the app build itself has no such requirement.

## Deploy

### Vercel (recommended)
1. Push the repo to GitHub.
2. In Vercel: **Add New → Project → Import** the repo. Framework is detected as Vite; `vercel.json` sets `npm run build` and `dist`.
3. Deploy. No environment variables are needed.

### GitHub Pages
The build uses relative paths and hash routing, so it works under `https://<user>.github.io/<repo>/` unchanged. Enable **Settings → Pages → Source: GitHub Actions** and use the workflow in `.github/workflows/pages.yml`.

## Backend (optional)
Supabase project settings live in `.env` (public URL and publishable key only). Schema, row-level security and functions are in `supabase/migrations/`; apply with `supabase db push --remote` after `supabase link`. Without `.env` the app runs local-only.

## Data and content

| What | Where | Source and licence |
|---|---|---|
| Quran text (Uthmani) | `public/data/surah/*.json` | [Tanzil](https://tanzil.net) — verbatim copy, credit and link required |
| Tajweed markup | same files | Collin Fair, [quran-tajweed](https://github.com/cpfair/quran-tajweed), CC BY 4.0 |
| Word timings | same files | Collin Fair, [quran-align](https://github.com/cpfair/quran-align), CC BY 4.0 |
| Recitation audio | streamed at runtime | [everyayah.com](https://everyayah.com) (الحصري، الحصري المعلم، المنشاوي) |
| Course (units, lesson order, closing passages, finales, mutun placement) | `content/course.json` | Closing passages computed and checked by `src/content/course.build.test.ts` (`UPDATE_COURSE=1` to regenerate) |
| Rule lessons, examples, questions | `content/rules.json`, `content/pairs.json` | Reviewed against published references; see `docs/04-content-review.md` |
| تحفة الأطفال، المقدمة الجزرية | `content/mutun.json` | Shamela 9632 and 581; see `docs/05-mutun-verification.md` |

Rebuild the Quran data with `npm run data` (downloads into `.cache/`). Check content with `node scripts/check-content.mjs .cache/quran-uthmani.txt`.

## Docs
`docs/00-decisions.md` (stack and sources) · `01-api-research.md` · `02-product-spec.md` · `03-design.md` · `04-content-review.md` · `05-mutun-verification.md` · `06-architecture.md` · `07-decision-log.md` (decisions made during the build) · `08-review-*.md` (critique round) · `09-v2-spec.md` (the v2 course and backend).
