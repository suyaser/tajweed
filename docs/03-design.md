# Tajweed Path · UX/UI design

Status: design for review (stage 3). Follows `00-decisions.md` and `02-product-spec.md` (the spec wins on features, routes, scheduling and data; this doc decides how it looks, reads and feels). Visual identity carries over from `reference/artifact-v3.html`.

Contents
1. Design principles
2. Language and direction
3. Design tokens
4. Navigation and app shell
5. Screens (R1, then R2)
6. Component inventory
7. Accessibility
8. Learning-experience details
9. Decisions, trade-offs and spec changes

---

## 1. Design principles

1. **A muṣḥaf, not a game.** The app looks like a well-made study muṣḥaf with a notebook beside it: green and gold, double frames, ۞ between sections, star badges with Arabic-Indic numerals. No mascots, confetti, XP, coins, flames, levels-up animations or sound effects. The only "reward" is a quiet sentence and, at the end of the wird, تقبّل الله منك. Progress is shown as *what you can do*, never as points.

2. **Quranic text is treated with respect, always.**
   - Never cropped, truncated, ellipsised, faded at an edge, scaled to fit, or put in a fixed-height box. Long ranges wrap and the page scrolls; a passage longer than a screen is paged by ayah, never clipped mid-ayah.
   - Always framed with ﴿ ﴾ in a quote block (or shown as a full passage with ayah-end markers ﴿٥﴾ in the player and analyser).
   - Never coloured decoratively. Colour inside verse text means exactly one thing: a tajweed rule from the muṣḥaf palette, from a named source. Quiz highlights, the playing word and the learner's taps use **neutral** marks (underline, background lamp, ring), never a tajweed hue and never red/green feedback colour.
   - Never placed under an icon, inside a button label, on a photo, in a toast, or in a notification. Never rotated or animated letter by letter.
   - Never mixed into Latin type: verses are their own block, `lang="ar" dir="rtl"`, Amiri Quran, generous line height so every ḥaraka and waqf mark is clear.
   - Every verse shows its reference (surah name + Arabic-Indic ayah number).

3. **Honest about what it knows.** The app measures recognition (quiz) and records what the teacher says about recitation. It never says "you recite correctly", never shows a score for a recording, never colours a word it has no source for. Recognition and recitation live on separate panels with separate headings. Cards still in draft say so. Where data is missing, the UI says "not shown yet" instead of staying silent.

4. **The teacher is the centre; the app is the notebook between lessons.** Every screen that touches recitation ends in a path back to the teacher: "add to my next session", the session card on Today, open corrections on every relevant card. The app never competes with the teacher's judgement.

5. **قليل دائم: small, steady, no guilt.** Today shows a finite, ordered list that can be *finished*. No streaks, no red "missed" days, no countdowns, no badges for intensity. After a gap the copy welcomes, states the backlog plainly and how long it takes to clear, and moves on.

6. **One thing on screen at a time when learning; everything in reach when referencing.** Learn, Review, the player and the in-class sheet are full-screen focus modes (tab bar hidden, one primary action, thumb-reachable). The library, plan and progress are calm reference pages that can be dense on a laptop.

7. **Mixed English–Arabic lines must read as one sentence.** Every Arabic run inside English is isolated, set in Amiri and one step larger, so the eye doesn't stumble at the script boundary (see §2). This is a hard rule in every component, not a nicety.

---

## 2. Language and direction

### 2.1 Decision: LTR English shell, Arabic-forward labelling. No language toggle.

- **Shell direction: LTR.** Layout, navigation, reading order of explanations and all sentences are English, as the spec (§5, §9) decides. Tajweed explanations, rule reasons and instructions are where clarity matters most; the learner said English explanations are fine, and the existing content is written in English.
- **Arabic-forward:** every *name* is Arabic first. Screen titles, tab labels, rule names, topic names, phase names, the four wird parts and the correction tags are shown in Arabic as the primary (larger) label with a small English gloss beneath, exactly like the artifact's tabs (`الأحكام` / RULES). Tajweed terms are never transliterated and never translated in running text ("This is إخفاء", not "This is ikhfa (concealment)").
- **Arabic islands are RTL:** verse blocks, the mind map, letter tiles, the ayah scrubber, mutun couplets, the word-correction picker, and the analyser page are `dir="rtl"` components inside the LTR shell.
- **Why not RTL Arabic-first?** It would double the copy (spec cut), and its explanations would need writing and teacher review in Arabic (risk R1). The learner reads both; the shell's job is to explain, which English does for this content today.
- **Why not a toggle?** A toggle means two complete copies of every string and two layouts to test, for one learner who has not asked for it. Revisit only if other learners arrive (spec §9).

### 2.2 Bidi rules (hard rules for implementation)

| # | Rule |
|---|---|
| B1 | Every Arabic run inside Latin text is wrapped in `<bdi lang="ar" class="a">`. Content authors write plain strings; a `bidi()` pass (carried over from the artifact's regex walker, run at build time on content and at render on dynamic strings) wraps runs. A run includes Arabic letters plus spaces, ، ؛ · / ← between Arabic words, so `النون الساكنة والتنوين` is one island, not four. |
| B2 | Arabic inside Latin lines: Amiri, **1.2em**, `line-height:1` on the `bdi` so it does not push the line apart; the paragraph's line-height is 1.75 so the larger glyphs never collide. Arabic inside Latin **headings** (Marcellus): 1.1em, Amiri 700. Inside Latin **small text** (≤ 13px): 1.25em, never below 16px rendered. |
| B3 | Latin inside Arabic blocks (rare: a reciter's English name, "4/5") is wrapped in `<bdi dir="ltr">`. |
| B4 | **Numerals.** Arabic-Indic digits (٠–٩) for anything that belongs to the Arabic text world: ayah numbers, ayah-end markers ﴿٥﴾, star badges, surah references (`الضحى · ٥`), matn line numbers, phase numbers on star badges, letter-tile counts. Western digits for UI quantities in English sentences: counts ("12 reviews"), minutes (`10′`), times (`06:30`), dates, percentages. Always `font-variant-numeric: tabular-nums` for counts. A reference is never written as `93:5` on screen; it is `الضحى · ٥` (the colon form is for URLs only). |
| B5 | **Punctuation** stays with the language it belongs to. Use ، and ؛ inside Arabic runs; the English comma/period goes outside the `bdi`. Never end a `bdi` with a Latin period. Parentheses and quotes wrap the island from outside: `(<bdi>إخفاء</bdi>)`. The neutral separator is the middle dot ` · ` with spaces, which reads correctly in both directions. |
| B6 | Two adjacent Arabic islands separated only by Latin punctuation must be separate `bdi`s (`إخفاء / إدغام` as one run is fine; `إخفاء, then إدغام` is two). |
| B7 | **Mirroring.** The shell is LTR: back arrow points left, chevrons on rows point right. Inside RTL islands: "next ayah" points **left**, "previous ayah" right; the ayah scrubber fills right-to-left; the mind map grows leftward; the find-first "next" in a passage moves left. **Never mirror:** play/pause, record, speed, loop, the check mark, the clock, the star badge, media scrub direction of the *time* bar inside one ayah (time is LTR universally). |
| B8 | Inputs: the search field is `dir="auto"` so Arabic queries align right as typed. The correction note field is `dir="auto"`. |
| B9 | `lang` everywhere: `<html lang="en">`; every Arabic element gets `lang="ar"` (verses, terms, labels) so screen readers switch voice and the browser picks Arabic shaping and fonts. Mutun lines get `lang="ar"` too. |
| B10 | Truncation of Arabic UI labels: never mid-word; tab and chip labels are chosen to fit at 375px; if a rule name cannot fit (e.g. `المثلان والمتجانسان والمتقاربان`) the component wraps to two lines. Ellipsis is never used on Arabic. |

Example, rendered:

> The نْ is followed by ت, one of the fifteen letters of **إخفاء**, so hide it with غنة for 2 counts.

Markup: `The <bdi class="a" lang="ar">نْ</bdi> is followed by <bdi …>ت</bdi>, one of the fifteen letters of <b><bdi …>إخفاء</bdi></b>, so hide it with <bdi …>غنة</bdi> for 2 counts.`

---

## 3. Design tokens

All tokens are CSS custom properties on `:root`, redefined for dark under `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])` and `:root[data-theme="dark"]` (the artifact's pattern).

### 3.1 Colour: base and semantic

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f4f1e8` | `#0c1613` | page (parchment / night) |
| `--surface` | `#fffdf8` | `#13211c` | cards, sheets |
| `--soft` | `#e6efe8` | `#1b3129` | chips, selected rows. **Tajweed-coloured text never sits on `--soft`** (it fails by 0.05–0.1 in light) |
| `--ink` | `#1c2621` | `#ece6d4` | body text, Quran text |
| `--muted` | `#5b665e` | `#a3ab9e` | secondary text (5.3:1 / 7.0:1) |
| `--line` | `#e2dccb` | `#283a32` | hairlines |
| `--green` | `#0f5b45` | `#14533f` | band, rail, primary button fill. **Not a text colour in dark** (1.85:1) |
| `--on-green` | `#f5f0e1` | `#f5f0e1` | text on green (7.1 / 7.9:1) |
| `--gold` | `#a8791e` | `#d8b45c` | ornament lines, frames, focus ring, ﴿ ﴾ (graphic, ≥ 3:1) |
| `--gold-ink` **new** | `#7a5810` | `#d8b45c` | gold *text*: eyebrows, small Arabic tags (5.8 / 8.4:1) |
| `--gold-soft` | `#e7d6a8` | `#4d4128` | inner frame line, lamp under the playing word |
| `--gold-display` | `#f3d98f` | `#f3d98f` | Kufi title on the band (5.8 / 6.5:1) |
| `--link` | `#0f5b45` | `#7fd6b0` | links, active tab text |
| `--good` | `#1a7b42` (was `#1d8a4a`, 3.9:1 on bg) | `#62d68f` | "correct" icon and border only |
| `--bad` | `#c23b3b` | `#ff7d7d` | "not quite" icon and border only; error banners |
| `--rec` **new** | `#b3261e` | `#ff8a80` | the recording dot only |

Semantic rule: **`--good`/`--bad` never touch Quran text**, and never stand alone. The red of المد ٤–٥ (`#d22b2b`) and the green of الغنة are too close to bad/good to share a screen as signals; feedback is shown with a ✓/↺ glyph, a word ("Correct" / "Not quite"), and a border on the *option button*, while the verse keeps neutral marks.

### 3.2 Colour: the muṣḥaf tajweed palette (مصحف التجويد · دار المعرفة scheme)

Contrast measured (WCAG 2.x) against `--surface` / `--bg` for each theme. Target ≥ 4.5:1 on both.

| Key | Arabic legend | Light (artifact) | on surface / bg | Light **fixed** | on surface / bg | Dark | on surface / bg |
|---|---|---|---|---|---|---|---|
| `clear` | إظهار | `#6a3fb5` | 6.91 / 6.22 ✓ | — | | `#b593f2` | 6.67 / 7.39 ✓ |
| `ghunnah` | غنة · إخفاء | `#1f8f37` | 4.10 / 3.69 ✗ | `#1b7c30` | 5.20 / 4.68 | `#5fd876` | 9.17 / 10.15 ✓ |
| `silent` | حرف لا يُنطق | `#7f8984` | 3.55 / 3.20 ✗ | `#656e69` | 5.18 / 4.66 | `#97a29d` | 6.32 / 6.99 ✓ |
| `merge` | إدغام | `#b0368a` | 5.52 / 4.97 ✓ | — | | `#ef86cf` | 7.12 / 7.88 ✓ |
| `madd2` | مد حركتان | `#a8741a` | 3.99 / 3.59 ✗ | `#906316` | 5.19 / 4.67 | `#e3b763` | 8.89 / 9.84 ✓ |
| `madd45` | مد ٤–٥ | `#d22b2b` | 5.01 / 4.51 ≈ | `#ce2a2a` | 5.18 / 4.66 | `#ff6f6f` | 6.15 / 6.80 ✓ |
| `madd246` | مد ٢·٤·٦ | `#e06b12` | 3.29 / 2.96 ✗ | `#ac520e` | 5.21 / 4.69 | `#ffa45e` | 8.50 / 9.41 ✓ |
| `madd6` | مد ٦ | `#8c0f1f` | 9.38 / 8.44 ✓ | — | | `#ff5875` | 5.47 / 6.06 ✓ |
| `qalqalah` | قلقلة | `#1f7fc0` | 4.25 / 3.83 ✗ | `#1b70aa` | 5.24 / 4.71 | `#65bff5` | 8.18 / 9.06 ✓ |
| `heavy` | تفخيم | `#1c3f9e` | 9.16 / 8.25 ✓ | — | | `#8aa5ff` | 7.06 / 7.81 ✓ |
| `light` | ترقيق | `#0b8585` | 4.39 / 3.95 ✗ | `#0a7979` | 5.13 / 4.62 | `#55d8d3` | 9.63 / 10.66 ✓ |

**Failures and fixes.** In light, 7 of 11 tajweed colours plus `--gold` (as text) and `--good` failed on the parchment `--bg`. Each was darkened along its own hue (HSL lightness only) until ≥ 4.6:1 on `--bg`; hue is kept so the muṣḥaf association holds. The dark palette passes everywhere as-is; the only dark failure is `--green` used as text (handled: dark uses `--link` for green text, as the artifact already does).

**Side effect to watch:** darkening pulls `madd2` (`#906316`) and `madd246` (`#ac520e`) closer together, and `madd2` towards `--gold-ink`. Mitigations: (1) UI gold *text* never appears inside a verse block; only ﴿ ﴾ and ayah-end markers use `--gold`, as glyph ornaments; (2) the second cue in §7.4 separates the madd family by beats and pattern; (3) the legend always carries the Arabic name.

These values were computed with the WCAG 2.x relative-luminance formula, not eyeballed. Re-check any token that changes; when the app is built, a small Vitest check over the token file should assert ≥ 4.5:1 for every tajweed and text token on `--surface` and `--bg` in both themes.

### 3.3 Typography

Five families, as decided: **Amiri Quran** (verses only), **Amiri** (Arabic UI, mutun, terms), **Reem Kufi** (Arabic display: screen titles, star numerals, the app name), **Marcellus** (Latin display), **Inter** (Latin body/UI). Mutun use Amiri, not Amiri Quran, so the eye can tell a poem from the Quran.

**Latin scale** (Inter unless noted; rem at 16px):

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `--t-cap` | 12 / 16, +0.12em tracking, uppercase | 600 | eyebrows, English gloss under Arabic labels |
| `--t-sm` | 14 / 22 | 400 | meta, captions |
| `--t-body` | 16 / 28 (1.75) | 400 | body; this generous line-height is for the 1.2em Arabic islands |
| `--t-lg` | 18 / 30 | 500 | feedback sentence, card summary |
| `--t-h3` | Marcellus 20 / 26 | 400 | card subtitles |
| `--t-h2` | Marcellus 24 / 30 | 400 | section titles (English line under the Kufi title) |
| `--t-h1` | Marcellus 28 / 34 | 400 | rarely; onboarding only |

**Arabic UI scale** (Amiri unless noted). Arabic needs ~1.2× the Latin size to match x-height and keep dots clear:

| Token | Size / line-height | Use |
|---|---|---|
| `--a-sm` | 17 / 28 | chips, tags, tab labels |
| `--a-body` | 19 / 32 | inline terms are 1.2em of the Latin size; this is for Arabic-only lines |
| `--a-lg` | 22 / 34, 700 | rule names in lists, option buttons |
| `--a-h3` | 26 / 36, 700 | rule card title |
| `--k-h2` | Reem Kufi 28 / 38, 500 | screen titles (Arabic line) |
| `--k-h1` | Reem Kufi 40 / 52, 700 | band title (مسار التجويد), onboarding |

**Quran scale** (Amiri Quran). Line-height is large because of stacked ḥarakāt, shadda+kasra, small high letters (ۜ ۛ) and waqf marks:

| Token | Phone | Laptop | Line-height | Use |
|---|---|---|---|---|
| `--q-inline` | 26 | 28 | 2.1 | examples inside rule cards, correction rows |
| `--q-read` | 30 (S) · 34 (M, default) · 40 (L) | 34 · 38 · 44 | 2.2 | player, session sheet, analyser |
| `--q-focus` | 36 | 44 | 2.1 | the single verse in a question |

The "Quran text size" setting (S/M/L) scales `--q-read` and `--q-focus` together. Minimum Quran size anywhere is 26px. Tajweed colour spans keep the same weight (Amiri Quran has one weight; never fake bold).

### 3.4 Spacing, radii, elevation

- **Spacing** (4pt): `--s1 4 · --s2 8 · --s3 12 · --s4 16 · --s5 20 · --s6 24 · --s8 32 · --s12 48 · --s16 64`. Phone side gutter 16px (+ safe-area). Section gap 28px (artifact). Verse blocks get 24px top/bottom breathing room minimum.
- **Radii:** `--r-tile 7` (letter tiles, count beats 4) · `--r-ctl 10` (buttons, inputs) · `--r-card 14` · `--r-focus 18` (question card, sheets' top corners) · `--r-pill 999` (chips, tags).
- **Elevation** is mostly *frames*, not shadows (manuscript, not material):
  - `e0` flat: 1px `--line` border.
  - `e1` framed card: 1px `--line` + inset double frame `inset 0 0 0 4px var(--surface), inset 0 0 0 5px var(--gold-soft)` (artifact `.panel`).
  - `e2` focus card (question, verse in player): 1px `--gold` border + the inset frame.
  - `e3` bottom sheet / dialog: `0 -8px 24px rgb(0 0 0 / .14)` + `e1` frame; backdrop `rgb(4 20 14 / .55)`.
  - Tab bar / rail: no shadow; a 1px `--line` + 1px `--gold-soft` double rule.

### 3.5 Motion

| Token | Value | Use |
|---|---|---|
| `--m-fast` | 120ms ease-out | press states, chip toggle |
| `--m-base` | 200ms ease-out | sheet in/out, feedback reveal, step change |
| `--m-slow` | 320ms ease-in-out | phase unlock, the end-of-wird ۞ fade |
| word lamp | 80ms background fade | follow-along word highlight |

No bouncing, no spring overshoot, no confetti, no number-counting animations. `prefers-reduced-motion: reduce` sets all durations to 0, disables the recording pulse (static ring + "Recording" text remains), and disables auto-scroll smoothing in the player (jumps instead). The follow-along highlight still moves (it is information, not decoration), but without the fade.

---

## 4. Navigation and app shell

### 4.1 Destinations

Four destinations, as the spec says, with one change: **Plan and Progress become one destination, "المسار · Path"**, with two segments. Progress buried under "More" would hide the honest picture the product is built around; Path is where "where am I and what's next" lives as one idea.

| Tab | Arabic / English | Route(s) | Holds |
|---|---|---|---|
| 1 | **اليوم** Today | `#/today` | the wird; entry to Learn, Review, Listen |
| 2 | **الأحكام** Rules | `#/rules`, `#/rules/:id` | library, mind map, cards (R2: analyser and mutun entries) |
| 3 | **الشيخ** Teacher | `#/teacher`, `#/teacher/new`, `#/teacher/:id` | sessions, open corrections |
| 4 | **المسار** Path | `#/plan`, `#/progress` | segment control: Plan · Progress |

Settings is a gear in the top bar of Today and Path (`#/settings`); Resources is a row in Rules ("Resources · المصادر") and in Settings; Credits is in Settings → About.

**Focus modes** (no tab bar, top bar with ✕ "Close" and a step/position indicator): `#/learn/:id`, `#/review`, `#/listen/:range`, `#/teacher/:id` in "sheet" state, `#/drill/:pairId`, mutun memorise, analyser find-first. Leaving a focus mode mid-way keeps progress (answers are written before the next question, per spec); the ✕ never asks "Are you sure?" except while a recording is in progress.

**Mini player.** If ayah audio is playing in the player and the learner navigates away (e.g. opens a rule card from the player), a 56px bar sits above the tab bar: ayah reference, play/pause, ✕. Tap returns to the player. Listening time keeps counting for Today's "listen" part.

### 4.2 Phone (≤ 767px)

```
┌───────────────────────────────┐  status bar (safe-area, surface colour)
│ [band: green + lattice, 56px] │  top bar: Arabic Kufi title + English, gear at right
│  اليوم   Today            ⚙  │
├───────────────────────────────┤
│                               │
│   content (one column,        │
│   16px gutters)               │
│                               │
├───────────────────────────────┤  mini player (only when audio continues)
│ ▶ الضحى · ٥        ❚❚    ✕   │
├───────────────────────────────┤  bottom tab bar, 64px + safe-area
│  اليوم  │ الأحكام │ الشيخ │ المسار │  Arabic 17px Amiri 700 + English 11px caps
│  TODAY  │  RULES  │TEACHER│  PATH  │  active: gold 3px top rule + --link text
└───────────────────────────────┘
```

- Tab bar is LTR order (Today leftmost). Each tab is ≥ 44×56. No icons-only: Arabic word + English caps, the artifact's tab style; a small 8-point star glyph sits above the active label only.
- The top band is the illuminated green with the gold lattice, slim (56px) on every page; Today's band is taller (see Today) and carries the date in Hijri and Gregorian.

### 4.3 Laptop (≥ 1024px): side rail

A **left rail** replaces the spec's top tab bar. Reason: on a 1280×800 laptop, vertical space is what verse text, the player transport and the session sheet need most; the rail is also where the illuminated band lives vertically, which keeps the manuscript identity without a 150px header on every page.

```
┌────────┬──────────────────────────────────────────────────────────────┐
│ ۞      │  slim header strip (40px, surface): breadcrumb · ⚙            │
│مسار    ├──────────────────────────────────────────────────────────────┤
│التجويد │                                                              │
│        │      content: max 760px reading column,                      │
│ اليوم  │      or 2 columns (main 1fr + aside 340px) where noted       │
│ TODAY  │                                                              │
│        │                                                              │
│ الأحكام│                                                              │
│ RULES  │                                                              │
│        │                                                              │
│ الشيخ  │                                                              │
│TEACHER │                                                              │
│        │                                                              │
│ المسار │                                                              │
│ PATH   │                                                              │
│        │                                                              │
│ ⚙      │                                                              │
└────────┴──────────────────────────────────────────────────────────────┘
 rail 112px: green + lattice, gold double rule on its inner edge,
 active item: gold-ink pill on --surface with green text
```

768–1023px (tablet / small laptop window): the phone layout with the tab bar, content max-width 680px centred.

### 4.4 Route map (spec §5) mapped to shell

| Route | Shell | Tab | Release |
|---|---|---|---|
| `#/onboarding` | full screen, no chrome | — | R1 |
| `#/today` | tabbed | Today | R1 |
| `#/learn/:lessonId` | focus | (Today) | R1 |
| `#/review` | focus | (Today) | R1 |
| `#/listen/:range` | focus + mini player on exit | (origin) | R1 |
| `#/rules` | tabbed | Rules | R1 |
| `#/rules/:lessonId` | tabbed (pushed page, back arrow) | Rules | R1 |
| `#/resources` | tabbed (pushed) | Rules | R1 |
| `#/teacher` | tabbed | Teacher | R1 |
| `#/teacher/new` | tabbed (pushed) | Teacher | R1 |
| `#/teacher/:id` | tabbed; "Start class" switches to focus (sheet) | Teacher | R1 |
| `#/plan` | tabbed, segment "Plan" | Path | R1 |
| `#/progress` | tabbed, segment "Progress" | Path | R1 |
| `#/settings` | tabbed (pushed) | (origin) | R1 |
| `#/mushaf/:surah` | tabbed (pushed); find-first is focus | Rules | R2 |
| `#/mutun/:matnId` | tabbed (pushed); memorise is focus | Rules | R2 |
| `#/drill/:pairId` | focus | (Today / Review) | R2 |

---

## 5. Screens

Notation in wireframes: `[ ]` button, `( )` chip/toggle, `▣` star badge, `﴿…﴾` verse block, `۞` divider. Arabic shown where it is the label. All microcopy given is final unless marked "draft".

### 5.1 First-run onboarding `#/onboarding`

**Purpose.** Set up five things in under 2 minutes and tell the truth about what the app is. Every step has a sensible default and "Skip" keeps it; everything is changeable in Settings.

Steps (dots at top are five small 8-point stars; current one filled):
1. **Welcome** — what the app is, and what it isn't.
2. **Where you're starting** — intro course done? (pre-ticks phase 1 episode tasks).
3. **Your model reciter** — choose 1 of 3, with a 6-second sample each.
4. **المد المنفصل** — 4 or 5 counts.
5. **Your rhythm** — wird time, teacher day(s), teacher name, "Add to calendar".

(Spec says 3 screens; the brief adds reciter and teacher day. Five short screens beat three crowded ones on a phone. The microphone is **not** asked here; it is asked on first record, per spec.)

**375px, step 1**
```
┌───────────────────────────────┐
│  [tall band, lattice, 220px]  │
│        مسار التجويد           │  Reem Kufi 40, gold-display
│        TAJWEED PATH           │  Marcellus caps
│  ﴿ وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا ﴾  │  cartouche, Amiri Quran 28
│         المزمل · ٤            │
├───────────────────────────────┤
│ ★ ☆ ☆ ☆ ☆                     │
│ A companion for your study    │  Marcellus 24
│ with your teacher.            │
│                               │
│ ▣ Plans each day's wird       │
│ ▣ Brings rules back before    │
│   you forget them             │
│ ▣ Lets you listen, repeat     │
│   and record                  │
│ ▣ Keeps your teacher's        │
│   corrections                 │
│ ┌───────────────────────────┐ │
│ │ It does not grade your    │ │  e1 framed note, gold-ink eyebrow
│ │ recitation. Only a        │ │  "AN HONEST NOTE"
│ │ teacher can. Your         │ │
│ │ recordings stay on this   │ │
│ │ device.                   │ │
│ └───────────────────────────┘ │
│                               │
│ [        Begin  ابدأ        ] │  primary, full width, 52px
│   I have a backup file        │  text link → import
└───────────────────────────────┘
```

**1280px:** the same content as a centred 560px framed card on `--bg`, band across the top 240px; steps advance in place.

**Step 3 (reciter), 375px**
```
│ ★ ★ ★ ☆ ☆                  Skip │
│ القارئ القدوة                    │  Kufi 28
│ Your model reciter               │
│ You'll repeat after one voice    │
│ until it becomes your own.       │
│ ┌───────────────────────────────┐│
│ │ ◉ الحصري المعلّم      [▶ 0:06] ││  radio row, 64px tall
│ │   Pauses for you to repeat.   ││
│ │   Recommended to start.       ││
│ ├───────────────────────────────┤│
│ │ ○ الحصري مرتّل        [▶ 0:06] ││
│ │   Steady, clear murattal.     ││
│ ├───────────────────────────────┤│
│ │ ○ المنشاوي مرتّل       [▶ 0:06] ││
│ │   Warm murattal.              ││
│ └───────────────────────────────┘│
│ Sample: ﴿ ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ﴾ │  q-inline, shown while sample plays
│ [            Next             ] │
```

**Step 4 (munfasil)**
```
│ المد المنفصل                      │
│ How long is your المد المنفصل?    │
│ ﴿ إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ ﴾  │  example with the madd span underlined (neutral)
│ ( 4 counts  ▮▮▮▮ )  ( 5 counts ▮▮▮▮▮ ) │  two big toggles with count beats
│ Both are correct for حفص من طريق  │
│ الشاطبية. Ask your teacher which  │
│ they teach, then keep it the same │
│ every time. You can change it in  │
│ Settings.                         │
│ [            Next             ]   │
```
Default 4, preselected. "Not sure yet" link sets 4 and adds "Ask: المد المنفصل 4 or 5?" to the first session plan as a note.

**Step 5 (rhythm)**
```
│ الورد اليومي                      │
│ When will you study?              │
│ Wird time       [ 06:30   ▾ ]     │  native <input type="time">
│ About 40 minutes. A fixed time    │
│ makes it a habit.                 │
│ Teacher day     (Sa)(Su)(Mo)(Tu)  │  multi-select weekday chips, 44px
│                 (We)(Th)(Fr)      │
│ Teacher's name  [ الشيخ …       ]  │  optional, dir=auto
│ [ 📅 Add my wird to calendar ]    │  secondary; downloads .ics
│ [         Start my path        ]  │
```

**States.** First run only (no return path except Settings). Offline: works fully; reciter samples show "Sample needs a connection" and the radio still works. Import chosen: file picker → confirmation → lands on Today. Error on import: "This file is from a newer version of Tajweed Path. Update the app first." / "This file isn't a Tajweed Path backup."

**Done:** "Start my path" → Today, first-run state.

---

### 5.2 Today `#/today`

**Purpose.** The wird as a finite, ordered list; the one screen opened daily.

**375px, normal day**
```
┌───────────────────────────────┐
│[band 120px, lattice]       ⚙  │
│ اليوم                          │  Kufi 28, gold-display
│ Thursday 19 November          │  Inter 14, on-green
│ ٢٨ جمادى الأولى ١٤٤٨           │  Amiri 17 (Intl umalqura)
├───────────────────────────────┤
│ ┌ This week ────────────────┐ │
│ │ ● ● ● ○ ● ·  ·            │ │  7 day marks Sa→Fr; ● studied, ○ not, · future
│ │ 4 days studied this week   │ │  no fraction, no streak
│ └───────────────────────────┘ │
│ ┌ الشيخ · Teacher tomorrow ──┐ │  only if session today/tomorrow
│ │ Recite الضحى · 2 corrections│ │
│ │ to re-check   [Open plan ›]│ │
│ └───────────────────────────┘ │
│ ۞ الورد · Your wird, ~40′      │
│ ┌───────────────────────────┐ │
│ │▣١ الاستماع والترديد    10′ │ │  star badge with ١..٤; done = gold fill + ✓
│ │   Listen and repeat        │ │
│ │   الضحى · ١–١١             │ │
│ │                 [ Listen ] │ │
│ ├───────────────────────────┤ │
│ │▣٢ السبق               10′ │ │
│ │   New lesson: الإخفاء الحقيقي│ │
│ │   [ Start lesson ]  Not today│ │
│ ├───────────────────────────┤ │
│ │▣٣ التلاوة والتسجيل     15′ │ │
│ │   Recite and record        │ │
│ │   • الضحى · ٥  (new rule)  › │ │  1–3 targets, each opens player
│ │   • الفاتحة · ٧ (correction ● جلي) ›│
│ ├───────────────────────────┤ │
│ │▣٤ المراجعة              5′ │ │
│ │   سبقي 6 · منزل 4           │ │
│ │   ⚑ 1 جلي correction due    │ │
│ │                 [ Review ] │ │
│ └───────────────────────────┘ │
│   Did a part away from the app? Tick it by hand ›  │
│ ┌ quiet nudge (one at a time)┐ │
│ │ Install to home screen so  │ │
│ │ your data is kept. [How] ✕ │ │
│ └───────────────────────────┘ │
├───────────────────────────────┤
│ tab bar                        │
└───────────────────────────────┘
```

Each part row: 56px min header, the whole row is a tap target to its action; the hand-tick is a long-press (and a visible "Mark done" in a ⋯ menu per row, for accessibility). Hand-ticked parts show "Marked by hand".

**1280px**
```
┌rail┬────────────────────────────────────────────┬──────────────────────┐
│    │ [band 140px, lattice, title + dates]       │                      │
│    ├────────────────────────────────────────────┤ aside 340px          │
│    │ ۞ الورد · Your wird, ~40′                   │ ┌ This week ───────┐ │
│    │ ┌ ▣١ Listen and repeat … ───── [Listen] ┐  │ │ ● ● ● ○ ● · ·    │ │
│    │ ├ ▣٢ السبق … ─────────── [Start lesson] ┤  │ │ This month: 14   │ │
│    │ ├ ▣٣ Recite and record …               ┤  │ └──────────────────┘ │
│    │ ├ ▣٤ المراجعة … ──────────── [Review] ┘  │ ┌ Teacher tomorrow ┐ │
│    │                                            │ └──────────────────┘ │
│    │                                            │ ┌ Phase ٣ ─────────┐ │
│    │                                            │ │ النون والميم…    │ │
│    │                                            │ │ 6 of 13 lessons  │ │
│    │                                            │ └──────────────────┘ │
└────┴────────────────────────────────────────────┴──────────────────────┘
```
Note on laptop: the spec makes the phone primary for scheduling. Laptop Today is fully functional (same store) but, until sync, a one-line note appears on laptop if the store has no attempts while an export exists: "Your reviews live on your phone. Import a backup to study here."

**States and microcopy**

| State | What changes | Copy |
|---|---|---|
| First run (day 1) | Review row shows "Nothing to review yet"; سبق shows phase 1's first lesson; week shows 0 marks | Review: "Nothing to review yet. Your first lesson starts it." |
| سبق unavailable | row shows reason, no Start button | "Already learned one today. One a day keeps it sticking." · "Review backlog first: 18 due. New lessons resume when it's under 15." · "Phase milestone pending: recite الفاتحة to your teacher." · "Phase complete. Prepare the milestone." (button: Practise the milestone) |
| Skipped "Not today" | row collapses to one line | "Skipped today. No problem." [Undo] |
| Milestone 14+ days | extra link under سبق | "Teacher away? Continue without the milestone ›" |
| Corrected-before-taught | سبق row eyebrow | "Your teacher corrected this. Learn it today." |
| Part done | badge fills gold, ✓, row text muted, action becomes "Again" | — |
| All four done (done-for-today) | band shows a centred ۞; wird list collapses to four ✓ lines | "Your wird is done. تقبّل الله منك" · secondary: "10 more reviews" (only if items are due) · "Listen again" |
| Back after ≥ 7 days | one framed note above the wird | "Welcome back. 34 reviews are waiting, about 2 days at today's pace. New lessons resume after that." |
| Loading | content is local: renders at once. If the store is migrating: a framed note with a spinner-free line | "Updating your data to the new version…" |
| Offline | audio-dependent rows show a line; actions still open | Listen row: "Audio needs a connection. Recite from your muṣḥaf and tick it by hand." Recite row: "You can still record; the reciter won't play." |
| Migration error | full-width framed alert, no wird | "We couldn't update your data. Nothing was lost. [Download a backup] then reload. If it keeps happening, send the backup to yourself and wait for an update." |
| Storage not persisted / not installed | one-time nudge | "Install to home screen so your data is kept. Safari can clear sites you haven't opened for a week." [How] [✕] |
| No export in 14 days | one-line nudge (lower priority than install) | "Last backup: 16 days ago. [Back up now]" |

---

### 5.3 Learn a lesson (السبق) `#/learn/:lessonId`

**Purpose.** One lesson in ~10 minutes, test-first.

Header (focus mode): `✕ Close` · lesson name `الإخفاء الحقيقي` · four step stars labelled under them: **جرّب Guess · تعلّم Learn · تحقّق Check · طبّق Apply**.

**Step 1 · Guess (pretest), 375px**
```
┌───────────────────────────────┐
│ ✕          الإخفاء الحقيقي      │
│ ★ ☆ ☆ ☆   Guess · 1 of 2      │
├───────────────────────────────┤
│ ┌ e1 note, gold-ink ────────┐ │
│ │ You haven't learned this   │ │
│ │ yet. Guess. Guessing first │ │
│ │ helps you remember.        │ │
│ └───────────────────────────┘ │
│ ┌ e2 focus card ────────────┐ │
│ │ Which rule is the          │ │
│ │ underlined part?           │ │
│ │                            │ │
│ │ ﴿ إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ ﴾  │ │  q-focus, centred
│ │      ‾‾‾‾‾‾‾‾              │ │  neutral underline: 2px --ink, wavy gold beneath (artifact .q)
│ │        العصر · ٢        ▶  │ │
│ └───────────────────────────┘ │
│  Read it aloud, then choose.  │
│ ┌─────────────┬─────────────┐ │
│ │ الإخفاء      │ الإظهار      │ │  2×2 options, 64px min, Amiri 22
│ │ الحقيقي      │ الحلقي       │ │  + English 12 under each
│ ├─────────────┼─────────────┤ │
│ │ الإدغام بغنة │ الإقلاب      │ │
│ └─────────────┴─────────────┘ │
└───────────────────────────────┘
```
After answer (pretest): no right/wrong colour drama; it reveals the answer softly: "It's الإخفاء الحقيقي. You'll see why in a minute." [Next]. Pretest answers don't touch the schedule, and the copy says nothing about correctness beyond naming the answer.

**Step 2 · Learn (card).** The full rule card component (§5.6) in a scroll view, with each example's ▶; a sticky bottom button "I've read it · Check myself". Minimum dwell is not enforced.

**Step 3 · Check.** Same as step 1 visually, with real feedback (§5.5). Two new examples.

**Step 4 · Apply (optional).**
```
│ ★ ★ ★ ★   Apply               │
│ Now say it. Listen, repeat,    │
│ record one ayah with الإخفاء.  │
│ ﴿ … ﴾ العصر · ٢                 │
│ [ Open the player ]            │
│   Skip for today               │
```

**Lesson done screen**
```
│            ۞                   │
│ الإخفاء الحقيقي is in your سبقي. │
│ It comes back tomorrow and     │
│ every day this week.           │
│ Check: 2 of 2                  │
│ [ Back to today ]              │
```

**1280px:** a centred 680px column; on Step 2 the card's examples sit in a two-column grid; step stars live in the slim header.

**States.** Offline: ▶ buttons show "needs a connection" tooltip/label, questions still work. Fewer than 2 unused examples for the check (content gap): the check uses what's available and the content report flags it; no learner-facing error. Leaving mid-lesson: the lesson is not introduced; Today's row shows "Continue lesson" and resumes at the step left. Fact lessons (مخارج etc.): same flow, fact questions with text prompt instead of a verse; letter tiles in options where relevant.

---

### 5.4 Review session (سبقي · منزل) `#/review`

**Purpose.** Run today's queue: one question per screen, feedback, end summary.

**375px, identify question**
```
┌───────────────────────────────┐
│ ✕   المراجعة        7 of 14    │
│ ━━━━━━━━━━━━━━━───────────────│  2px gold progress, no percentages
├───────────────────────────────┤
│ منزل · last seen 7 days ago    │  eyebrow, gold-ink (or "سبقي · day 3")
│ ┌ e2 ───────────────────────┐ │
│ │ Which rule is the          │ │
│ │ underlined part?           │ │
│ │ ﴿ مِن شَرِّ مَا خَلَقَ ﴾        │ │
│ │    ‾‾‾‾‾‾‾‾‾                │ │
│ │        الفلق · ٢         ▶ │ │
│ └───────────────────────────┘ │
│  Read it aloud, then choose.  │
│ [ الإدغام بغنة  ]  [ الإخفاء    ] │
│ [ الإظهار الحلقي ] [ الإقلاب    ] │
└───────────────────────────────┘
```

**Question types** (each fits one phone screen without scrolling at text size M):

| Type | Prompt | Answer UI | Notes |
|---|---|---|---|
| identify | verse, one word range underlined (neutral) | 4 rule buttons (Arabic name + English gloss) | "You are stopping here" tag (artifact `.stop`) when the example is a stop: `◼ وقف · stopping here` |
| length | verse, madd span underlined; "How many counts here?" | 4 buttons showing **count beats** + the number: `▮▮ 2` · `▮▮▮▮ 4 or 5` · `▮▮ ▯▯ ▯▯ 2·4·6` · `▮▮▮▮▮▮ 6` | for المنفصل the learner's chosen length is the expected answer |
| fact | text prompt (e.g. "Where is the مخرج of ق?") | 4 text buttons; letter tiles when options are letters | |
| correction | verse with the corrected word ringed (neutral ring) + teacher's note + severity tag | 3 steps inline: [▶ Listen (one loop)] → [● Record] → [Model, then me] → "Did you apply the fix?" **[Applied the fix] [Not yet]** | labelled "Your own rating" under the buttons |
| matn (R2) | first word of each half-line shown | [Reveal] → **[Had it] [Missed]** | labelled "Your own rating" |
| contrast (R2) | opens the drill (§5.15) as one item | — | |

Keyboard (laptop): `1–4` choose, `Enter` next, `Space` play ayah, `O` open card.

**End summary, 375px**
```
│            ۞                   │
│ Review done.                   │
│ 14 reviewed · 12 correct       │
│ Look again at:                 │
│  ( الإقلاب ›)  ( المد المتصل ›)  │  rule chips → cards
│ Coming back:                   │
│  الإقلاب · tomorrow             │
│  المد المتصل · tomorrow          │
│  الإظهار الحلقي · 30 Nov         │
│  … 9 more ▾                    │
│ [ Back to today ]              │
│   10 more  (only if due items) │
```

**1280px:** 680px centred card; options in a 2×2 grid; on the end screen, the "coming back" list is a two-column table.

**States.** Empty queue: "Nothing due today. Your next review is on Saturday." [Back]. Stopped mid-way: Today's row shows "7 left" and Review resumes. Relearn items at the end are labelled "Once more, a different example". Offline: everything works; ▶ shows "Audio needs a connection". A correction item when offline: Listen step is skipped with a note; record and self-rate still work.

---

### 5.5 Feedback after an answer

Appears **in place** under the options (not a modal, not a toast), with `aria-live="polite"`. The verse stays visible above it. Option buttons get the marks; the verse never turns red or green.

**Correct**
```
│ [✓ الإخفاء الحقيقي ]  ← chosen button: 2px --good border, ✓ glyph, "Correct" in sr-only │
│ ┌──────────────────────────────┐ │
│ │ ✓ Correct.                   │ │  --t-lg
│ │ The نْ in مِن meets ش, one of the │ │
│ │ 15 letters of الإخفاء.         │ │
│ │ ﴿ مِن شَرِّ ﴾  ▶ hear it          │ │  the span, q-inline, now tajweed-coloured (ghunnah)
│ └──────────────────────────────┘ │
│ [ Next ]                     │  Enter
```

**Not quite (wrong)**
```
│ [↺ الإخفاء  ]  ← chosen: 2px --bad dashed border + ↺ glyph │
│ [✓ الإدغام بغنة] ← right: 2px --good solid border + ✓     │
│ ┌──────────────────────────────┐ │
│ │ Not quite. It's الإدغام بغنة.   │ │
│ │ The نْ meets ي, one of يومن, so │ │
│ │ it merges into the next letter │ │
│ │ with غنة.                       │ │
│ │ Easy to mix up: الإخفاء hides    │ │  ConfusablePair.hint, only when the
│ │ the نْ; الإدغام merges it.        │ │  chosen answer is the partner
│ │ ▶ hear it   Open card ›        │ │
│ │ This comes back at the end.    │ │
│ └──────────────────────────────┘ │
│ [ Next ]                     │
```

Feedback anatomy (always in this order, ≤ 3 lines before the links): **verdict word** (Correct / Not quite) → **the rule's name** → **the deciding reason in one clause, naming the decisive letter or sign** → (if confusable) the pair's one-line difference → actions. Never "Wrong!", never "Oops", never an exclamation mark, never "Great job!". Length questions: "It's 6 counts: the madd letter meets a شدة in the same word (ٱلضَّآلِّينَ), so it's المد اللازم." Correction self-ratings get no verdict, just "Saved. Your teacher will check it."

---

### 5.6 Rule library, rule card, mind map

**Library `#/rules`, 375px**
```
┌───────────────────────────────┐
│[band 56] الأحكام · Rules       │
├───────────────────────────────┤
│ [🔍 ابحث · search: إخفاء، مد، ghunnah ]│  dir=auto
│ ( List ) ( Map )        Colours ▾│  segment + legend disclosure
│ ⟵ (النون) (الميم) (الغنة) (اللام) …⟶│  topic chips, horizontal scroll
│ ▣٢ النون الساكنة والتنوين        │  section header, star badge
│   The next letter decides.     │
│ ┌───────────────────────────┐ │
│ │▌الإظهار الحلقي      ★ known │ │  ▌= 4px rule-colour stripe (+pattern, §7.4)
│ │  Clear noon before a throat│ │
│ │  letter                    ›│ │
│ ├───────────────────────────┤ │
│ │▌الإدغام بغنة   ◐ learning   │ │
│ │                ● correction│ │  "teacher correction open" badge
│ ├───────────────────────────┤ │
│ │▌الإقلاب          ☆ not started│ │
│ └───────────────────────────┘ │
│ …                              │
│ Resources · المصادر  ›         │
│ R2: المصحف · Ayah analyser ›    │
│ R2: المتون · Mutun ›            │
└───────────────────────────────┘
```
The artifact's "next letter is…" chooser and the madd lengths table stay at the top of their topic sections (collapsed to one line "The next letter is… ▾" on phone).

**1280px:** artifact layout: sticky topic index 230px on the left (with "3/5 known" per topic), cards in a 2-column grid on the right; Map opens as a full-width view in the main area.

**Rule card `#/rules/:lessonId`, 375px**
```
┌───────────────────────────────┐
│ ‹ Rules                        │
│ ┌ e1, 5px top border in rule colour ┐
│ │ الإخفاء الحقيقي        (غنة·إخفاء)│  Amiri 26 700 in rule colour; colour tag
│ │ Hidden noon                     │
│ │ ◐ learning · next review tomorrow│  level badge (text + icon)
│ │ ● Teacher correction open: الضحى·٨│ (link to correction)
│ │ Reviewed by الشيخ …, 2 Dec 2026  │  or: "Draft · not yet checked by a teacher"
│ │─────────────────────────────────│
│ │ Hide the نْ or تنوين with غنة for │
│ │ 2 counts, between clear and     │
│ │ merged.                         │
│ │ ┌ facts ───────────────────────┐│
│ │ │LETTERS ص ذ ث ك ج ش ق س د ط ز ف ت ض ظ││ letter tiles, RTL
│ │ │LENGTH  ▮▮ 2 counts            ││ count beats
│ │ └──────────────────────────────┘│
│ │ EXAMPLES · أمثلة ────────────── │
│ │ ﴿ إِنَّ ٱلْإِنسَٰنَ لَفِى خُسْرٍ ﴾    │  q-inline; span coloured + underlined
│ │ [▶] العصر · ٢             ›     │  ▶ plays ayah; › opens player
│ │ ┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈ │
│ │ ﴿ … ﴾ [▶] الكوثر · ٣         ›   │
│ │ ! tip: Heavier غنة before …     │
│ │ Easy to mix up with:            │
│ │ (الإدغام بغنة) (الإقلاب)          │  rule chips
│ │ R2: تحفة الأطفال · ١٤–١٦ ›       │  mutun lines with numbers
│ └─────────────────────────────────┘
│ [ Practise this rule ]           │  early review (spec "review done before due")
```
"Practise this rule" only for introduced lessons; for not-started lessons it reads "Learn this lesson" only when it is today's سبق, otherwise "You'll learn this in phase ٣" (reading never introduces, per spec).

**Mind map** (Map segment): the artifact's right-to-left tree on laptop; vertical indented list on phone. Leaves show the level glyph instead of the old ✓. Colour stripe + Arabic name on every leaf.

**States.** Search empty: "Nothing matches “ghunah”. Try the Arabic name, or a letter." Offline: ▶ buttons labelled "needs a connection". Draft card: a framed gold-ink notice at the top: "Draft. Not yet checked by a teacher. Read it with your teacher before relying on it."

---

### 5.7 Listen · repeat · record (التلقي) `#/listen/:range`

**Purpose.** Hear the model, repeat in the gap, record, compare "model, then me".

Decision: in R1 the player shows **plain Uthmani text, no tajweed colours** (colours without our annotations would be incomplete; that's the R2 analyser's job, with its honest legend). Current ayah has a soft `--gold-soft` lamp; current word (when timings exist) has a stronger lamp underneath the glyphs.

**375px**
```
┌───────────────────────────────┐
│ ✕  الضحى · ١–١١   الحصري المعلّم ▾│  reciter switch is in Settings; ▾ shows info only
├───────────────────────────────┤
│                                │
│ ﴿ وَٱلضُّحَىٰ ﴿١﴾ وَٱلَّيْلِ إِذَا سَجَىٰ ﴿٢﴾ │  q-read, RTL, justified right,
│ مَا وَدَّعَكَ رَبُّكَ وَمَا قَلَىٰ ﴿٣﴾ …     │  scrolls; current ayah lamp;
│ ░░░░░ current word lamp ░░░░   │  auto-scrolls to keep it in view
│                                │
├───────────────────────────────┤  transport, docked (thumb zone)
│ ◀━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  ayah scrubber: 11 segments RTL, current filled gold
│  ١١ ………………… ٣ ٢ ١             │
│ (Loop ×3) (Speed 0.75×) (Gap on)│  labelled toggle chips, 44px
│                                │
│   [⏭ next]   [ ▶  64px ]  [⏮ prev]│  next is on the LEFT (RTL reading)
│                                │
│ ┌───────────────────────────┐  │
│ │ [● Record]   [Model, then me]│  record 56px circle --rec dot + label
│ │ Recordings ▾ 3 · latest 0:42 │  │
│ └───────────────────────────┘  │
└───────────────────────────────┘
```

**Pause-to-repeat (gap on).** After each ayah, the ayah-end marker shows a draining gold ring and the transport shows **"Your turn · ردّد · 6s"** (ayah length + 1s, counting down). Tap anywhere on the verse to skip the gap. No sound cue.

**Word tap.** Tap a word: plays that word's slice (quran-align timings), lamp on the word for its duration. Words with no timing (the ~1%): plays the whole ayah, and the word shows a dotted lamp. Long-press a word (R2, analyser only): rule sheet.

**Recording.**
- First tap: an explanation sheet before the browser prompt: **"Your recordings stay on this device. They are never uploaded. Allow the microphone to record yourself."** [Allow microphone] [Not now].
- While recording: model audio is stopped; the button becomes ■ Stop with "Recording 0:12" and a pulsing `--rec` ring (static ring with reduced motion); the verse stays visible with the *range* lamp so the learner reads from it.
- After stop: "Saved · 0:42" and **Model, then me** becomes primary.
- **Model, then me:** plays the reciter's ayah (with word lamp; label "الحصري المعلّم"), 600ms silence, then the recording (label "You", the ayah gets an outlined lamp because there are no timings for the learner's voice). The labels switch in the transport so it's always clear whose voice is playing.
- Recordings list (expand): `19 Nov · 0:42  [▶ Me] [Model, then me] [🗑]`, newest first, "Keeps your last 5 for this passage."
- **"Not sure? Ask your teacher"** under the list: adds this range to the next session plan with reason "question" (see §9).

**1280px**
```
┌rail┬───────────────────────────────────────────┬────────────────────────┐
│    │ ‹ back   الضحى · ١–١١                      │ Transport (sticky)     │
│    │                                           │ [   ▶   ]              │
│    │  ﴿ verse text, q-read 38, 680px column ﴾   │ (Loop ×3)(0.75×)(Gap)  │
│    │                                           │ ayah scrubber          │
│    │                                           │ ─────────────          │
│    │                                           │ [● Record]             │
│    │                                           │ [Model, then me]       │
│    │                                           │ Recordings (5)         │
│    │                                           │  … list …              │
│    │                                           │ Open on Quran.com ↗    │
└────┴───────────────────────────────────────────┴────────────────────────┘
```
Keyboard: `Space` play/pause, `R` record/stop, `M` model-then-me, `L` cycle loop, `G` gap, `S` speed, `←` next ayah / `→` previous ayah (matches the RTL text), `?` shortcuts.

**States and copy**

| State | Copy |
|---|---|
| Loading audio | Play button shows a thin gold progress ring; "Loading الضحى · ١…" (sr) |
| Offline, not cached | above transport: "Audio needs a connection. The text is here; recording still works." Play disabled with that label |
| Audio failed (network error) | "Couldn't load the recitation. [Try again]" |
| Mic refused | Record button replaced by "Recording is off. You can turn the microphone on in your browser's site settings." Player keeps working |
| Recording not supported | "This browser can't record. Try Safari or Chrome." |
| Storage nearly full | "Recordings are using 180 MB. Older ones are deleted automatically; [manage in Settings]." |
| Listen part done (≥ 3 min) | a small ✓ in the top bar: "Listening counted for today" |

---

### 5.8 Teacher sessions (العرض على الشيخ)

#### 5.8.1 Sessions list `#/teacher`, 375px
```
┌───────────────────────────────┐
│[band] الشيخ · Teacher           │
├───────────────────────────────┤
│ ┌ Next session · Thu 20 Nov ──┐│
│ │ الشيخ أحمد · 3 passages      ││
│ │ [ Open plan ]  [ Start class ]││
│ └────────────────────────────┘│
│ ( All ) ( Open corrections 5 ) │
│ ۞ History                       │
│ ┌────────────────────────────┐│
│ │ Thu 13 Nov   ■ 1 جلي  □ 3 خفي ›││  جلي/خفي tag components
│ │ Thu 6 Nov    ■ 2 جلي  □ 1 خفي ›││
│ └────────────────────────────┘│
│ [ + Plan a session ]           │
└───────────────────────────────┘
```
Empty state: "No sessions yet. Plan your first one: the app suggests what to recite." [Plan a session]

#### 5.8.2 Session plan `#/teacher/new`
```
│ ‹ Teacher        Plan a session │
│ Date      [ Thu 20 Nov ▾ ]      │  defaults to next teacher day
│ Teacher   [ الشيخ أحمد      ]    │  remembered
│ To recite                       │
│ ┌────────────────────────────┐ │
│ │ ◆ Milestone · الفاتحة        │ │  reason chip: milestone / correction / recent / question
│ │ ↺ Re-check · الضحى · ٨  ■جلي  │ │
│ │ ↺ Re-check · العصر · ٢  □خفي  │ │
│ │ ○ Since last time · الضحى ١–١١│ │
│ │ ? You asked · الكوثر · ١      │ │
│ └ each row: drag handle, ✕ ──┘ │
│ [ + Add a passage ]             │  surah picker + ayah range
│ Note to self  [ ask about ر in مصر ]│
│ [ Save plan ]                   │
```

#### 5.8.3 In-class sheet `#/teacher/:id` (focus), 375px

Built for one-handed use while the teacher listens. Screen Wake Lock on. Large text. No tab bar.

```
┌───────────────────────────────┐
│ ✕  In class · الشيخ أحمد  [Done]│
│ Passage 1 of 4 · Milestone      │
├───────────────────────────────┤
│ الفاتحة                          │
│ ﴿ بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ﴿١﴾  │  q-read L; every word a tap target
│ ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ ﴿٢﴾ …   │
│   (‼ whole ayah) at each ayah end │  small chip after each ayah marker
├───────────────────────────────┤
│ Milestone: الفاتحة               │
│ [ Passed ]   [ Not yet ]        │
├───────────────────────────────┤
│ Open corrections here           │
│ ٧ · ٱلضَّآلِّينَ ■جلي "madd 6"      │
│ [✓ Correct now] [↺ Still wrong] │
├───────────────────────────────┤
│   ‹ prev passage   next ›       │
└───────────────────────────────┘
```

**Quick correction (≤ 4 taps once the ayah is on screen):**
1. Tap the word (or the ayah's "whole ayah" chip). A bottom sheet rises; the word gets a ring.
2. Tap **■ جلي** or **□ خفي** (two 64px buttons, the only things above the fold of the sheet).
3. The sheet shows **rule suggestions**: the 4 most recently introduced lessons as chips + "Other / not a rule" + 🔍. Tap one (optional).
4. Tap **Save** (or, if step 3 was skipped, Save is already enabled after step 2: that's 3 taps).

```
 sheet ────────────────────────────
│ ٱلضَّآلِّينَ  · الفاتحة · ٧          │
│ [■ جلي  clear error] [□ خفي  fine detail]│
│ Rule (optional)                  │
│ (المد اللازم)(الإخفاء)(الغنة)(Other)🔍│
│ Note  [                       ]  │  collapsed "+ note"
│ [ Save ]                         │
```
After save: the word keeps a small neutral ring and the sheet closes; a quiet line at the bottom: "Saved · ■ جلي · Undo".

**Done (after class) → summary**
```
│ Session saved.                   │
│ 3 corrections added to review.   │
│ الإخفاء and المد المتصل come back  │
│ tomorrow.                         │
│ 1 correction has no rule. [Tag it]│
│ Milestone: الفاتحة passed. ▣٢     │
│ Phase ٢ · المخارج والصفات starts   │
│ tomorrow.                         │
│ [ Back ]                          │
```

**1280px:** sheet becomes a two-pane view: passage text (left, 1fr) and the session log (right, 360px: milestone results, corrections added this session, open corrections with re-check buttons). Clicking a word opens the correction form in the right pane, not a sheet.

**States.** No plan for today but tapping Start class: a plan is created on the fly from the suggestions. Offline: fully works. Accidental ✕ during class: nothing lost (every correction is saved on tap); returning resumes the same passage. Correction on a word in an ayah outside the planned passages: [+ Add a passage] in the sheet header.

---

### 5.9 Phase plan and milestone `#/plan` (Path tab, "Plan" segment)

**375px**
```
┌───────────────────────────────┐
│[band] المسار · Path       ⚙     │
│ ( Plan ) ( Progress )           │
├───────────────────────────────┤
│ ▣١ التأسيس · Foundations  ✓ passed 12 Nov │ collapsed, gold-filled star
│ ┊                               │ dotted gold timeline (artifact)
│ ▣٢ المخارج والصفات       ● active│ expanded
│ ┊ Weeks 3–6 · Every letter from │
│ ┊ its right place.              │
│ ┊ Lessons 4 of 11 introduced    │
│ ┊ (الجوف ★)(الحلق ◐)(أقصى اللسان ◐)…│ rule chips with level glyphs
│ ┊ ┌ Milestone · عرض المرحلة ──┐ │
│ ┊ │ □ Letter drill أَبْ، أَتْ…  │ │ per passage: □ not yet / ■ passed + date
│ ┊ │ □ الفاتحة                 │ │
│ ┊ │ □ الإخلاص to الناس          │ │
│ ┊ │ This is a milestone check, │ │
│ ┊ │ not an ijazah. An ijazah is│ │
│ ┊ │ given by a teacher with a  │ │
│ ┊ │ sanad after a full khatma. │ │
│ ┊ │ [ Practise the milestone ] │ │
│ ┊ └───────────────────────────┘ │
│ ┊ Tasks (not counted toward     │
│ ┊ mastery)                      │
│ ┊ ☑ Learn the 5 areas …         │
│ ▣٣ النون والميم والغنة  🔒 locked │ muted, outline star
│ …                               │
└───────────────────────────────┘
```
**1280px:** timeline on the left 1fr, a sticky aside with "Current phase" summary and the milestone card.

**States.**
- `milestone` (all lessons introduced): the phase header says "Ready for the milestone" and Today's سبق row points here.
- After 14 days in `milestone`: link "Continue without the milestone" → sheet: "Why? (a short reason)" [ teacher away ] → "The milestone stays on every session plan until you pass it." [Continue to phase ٣]. Skipped phase shows "↷ skipped · teacher away" and stays listed.
- Passed: "Passed with الشيخ أحمد on 12 Nov" — no celebration beyond the gold star fill and a ۞ line.

---

### 5.10 Progress `#/progress` (Path tab, "Progress" segment)

Two panels with **separate titles**, in this order on phone: recitation first (it's the one that matters), then recognition, then consistency, then 16-week goals (collapsed).

**375px**
```
│ ( Plan ) ( Progress )            │
│ ┌ How you recite ─────────────┐ │  eyebrow: "FROM YOUR TEACHER"
│ │ Corrections per session      │ │
│ │ 13 Nov ■■ □□□                │ │  ■ solid = جلي, □ hatched = خفي
│ │ 6 Nov  ■■■ □                 │ │  bars with counts as text
│ │ 30 Oct ■■■■ □□               │ │
│ │ Open 5 · Resolved 12         │ │
│ │ Corrected most: الإخفاء (4),   │ │
│ │ المد المتصل (3)                 │ │
│ └─────────────────────────────┘ │
│ ┌ What you can recognise ─────┐ │  eyebrow: "FROM THE QUIZ"
│ │ ★ strong 6  ● known 9         │ │
│ │ ◐ learning 7  ☆ not started 27│ │
│ │ Slipping: الإقلاب (3 lapses) › │ │
│ │ [ See all rules ▾ ]           │ │  expands to the rules table
│ │ This shows you can name a    │ │
│ │ rule. Only your teacher can  │ │
│ │ tell you if you recite it.   │ │
│ └─────────────────────────────┘ │
│ ┌ Consistency ────────────────┐ │
│ │ 16 weeks × 7 days of dots    │ │  ● studied, · not; no red
│ │ Studied 5+ days in 9 of 12   │ │
│ │ weeks                        │ │
│ └─────────────────────────────┘ │
│ 16-week goals ▾                 │  S1–S6, plain text values
```
Rules table (expanded / laptop): columns Rule · Level · Every (interval) · Lapses · Last 5 · Next. Sorted by lapses. On phone each row is a two-line list item, not a scrolling table.

**1280px:** recitation and recognition side by side (equal width, so neither looks primary-by-size), consistency full width below, goals as a 3×2 grid of plain text tiles.

**Empty states.** Recitation: "Your teacher's corrections will show here after your first session." Recognition: "Levels start after your first lesson." Consistency: shows the current week only.

---

### 5.11 Settings, backup, export `#/settings`

Grouped list, each row ≥ 52px.

```
│ ‹      Settings · الإعدادات       │
│ YOUR WIRD                        │
│  Wird time               06:30 › │
│  Add to calendar (.ics)        › │
│  Teacher day(s)       Thu      › │
│  Teacher's name     الشيخ أحمد › │
│ RECITATION                       │
│  Model reciter   الحصري المعلّم › │
│  المد المنفصل          4 counts › │
│ READING                          │
│  Quran text size   (S)(M)(L)     │  live preview verse below
│  ﴿ قُلْ هُوَ ٱللَّهُ أَحَدٌ ﴾          │
│  Theme      (Light)(Dark)(System)│
│  Tajweed patterns (R2)    [off]  │  §7.4
│ YOUR DATA                        │
│  Last backup: 3 days ago         │
│  [ Back up now ]                 │  downloads JSON
│  ☐ Include recordings (42 MB)    │
│  [ Restore from a backup ]       │
│  Recordings: 42 MB  [Delete all] │
│ ABOUT                            │
│  Credits and sources           › │
│  Resources                     › │
│  Reset everything              › │  destructive, bottom, needs typing "reset"
```
**Restore confirmation:** "Restore from this backup? It replaces everything on this device: 214 reviews, 9 sessions, settings. This can't be undone. [Back up current data first] [Replace]". **Reset:** "This deletes all your progress, sessions and recordings on this device. Type reset to confirm." Changing المد المنفصل: "From now on, questions expect 5 counts. Keep it the same every time; tell your teacher you changed it."

---

### 5.12 R2 · Ayah analyser `#/mushaf/:surah`

**Purpose.** Apply rules to whole surahs: coloured text, tap a word for its rules, and a find-first test.

**375px, reveal mode**
```
┌───────────────────────────────┐
│ ‹ المصحف    سورة الضحى      ▶   │  ▶ = play surah with word follow
│ ( Read ) ( Find first )        │
│ Legend ▾  6 rules not shown yet│  honest summary, always visible
├───────────────────────────────┤
│ ﴿ وَٱلضُّحَىٰ ﴿١﴾ وَٱلَّيْلِ إِذَا سَجَىٰ ﴾ │  q-read, tajweed colours ON
│ …                              │
└───────────────────────────────┘
```
**Legend sheet** (also the "isolate one rule" control, §7.4):
```
│ Shown on this surah             │
│ (● إخفاء)(● إدغام)(● غنة)(● قلقلة)│  tap = isolate that rule
│ (● مد ٢)(● مد ٤–٥)(● مد ٢·٤·٦)(● مد ٦)│
│ Shown from our checked notes    │
│ (● الراء)(● لام الجلالة)(● الإظهار) │  "checked by الشيخ أحمد"
│ Not shown on this surah yet     │
│ مد البدل · السكت · القلقلة الصغرى/الكبرى│  plain ink, no dot
│ Plain text here doesn't mean "no│
│ rule": it may be one we haven't │
│ marked yet.                     │
```

**Tap a word → sheet**
```
│ مِن شَرِّ   ▶ (word)                 │
│ ● الإخفاء الحقيقي                  │
│   نْ before ش: hide it, 2 counts.  │
│   Open card ›                     │
│ (one row per rule on the word)    │
│ Not marked on this word yet:      │
│   الراء (tafkhim/tarqiq)          │  shown when that rule is unannotated for the surah
│ Source: Collin Fair dataset ·     │
│ our notes, checked                │
```
Honesty rules: (1) a rule we have no source for on this surah is never coloured; (2) it is listed under "Not shown on this surah yet" in the legend; (3) the tap sheet repeats it for words where it could apply only if it's a word-specific rule we know applies (e.g. a ر for الراء) — otherwise the general note suffices; (4) the merged dataset classes are explained where they show: madd2 on a صلة word says "Also الصلة الصغرى"; إخفاء says "Heavy or light غنة isn't marked: it follows the next letter (card ›)".

**Find-first mode, 375px**
```
│ ( Read ) ( Find first )         │
│ Find every: [ الإخفاء ▾ ]        │  only rules fully marked on this surah
│ in ayat ١–٥                      │
│ ﴿ text in ink only, no colours ﴾ │
│ tapped words: gold ring ◯        │
│ Tapped 3        [ Reveal ]       │
```
After Reveal (shapes, not only colour):
```
│ ✓ found (rule colour + solid ring + ✓ above) │
│ ◌ missed (rule colour + dashed ring + "missed") │
│ ✕ not this rule (ink + struck ring + ✕)        │
│ Found 4 of 5 · 1 not this rule                   │
│ This counts as a review of الإخفاء: not quite.   │  only once per rule per day
│ [ Try ayat ٦–١١ ]  [ Read mode ]                │
```
**1280px:** text 760px column with legend as a persistent right aside (isolate toggles always visible); word sheet becomes a popover anchored to the word.

**States.** Surah not available: "This surah isn't in the analyser yet. Available: الفاتحة and جزء عمّ, from الناس back to …". Offline: text and colours work; word ▶ "needs a connection" unless cached. A rule not fully marked on this surah is absent from the find-first picker, with a footnote "Some rules aren't fully marked here yet, so they can't be tested."

### 5.13 R2 · Mutun memorise `#/mutun/:matnId`

**List:** sections by topic, each line as a couplet (صدر right, عجز left, on laptop side by side; on phone stacked, عجز indented), line number in a small star badge (Arabic-Indic), edition footnote "تحفة الأطفال · ط. الضباع · ص ٣ · checked ✓✓".

**Memorise (focus), 375px**
```
│ ✕  تحفة الأطفال · ١٤–١٦   ● ● ○ ○ ○ │  5 stage dots
│ Stage 2 · every 3rd word hidden    │
│ ┌ e2 ─────────────────────────┐  │
│ │ ▣١٤  وَعِنْدَ حَرْفِ ٱلْبَاءِ ‥‥‥‥  │  │  hidden words = gold dotted
│ │       قَلْبٌ ‥‥‥‥ بِغُنَّةٍ …     │  │  blanks of the same width
│ └─────────────────────────────┘  │
│ Say the lines aloud, then reveal. │
│ [ Reveal ]                        │
│ → [ Had it ] [ Missed ]           │  "Your own rating"
│ Two "had it" in a row moves on.   │
```
Stage 5 done: "These lines are in your review now." Copy never says "memorised".

### 5.14 R2 · Contrast drill `#/drill/:pairId`

```
│ ✕  الإخفاء or الإدغام بغنة?   3 of 8 │
│ ● ● ○ ○ ○ ○ ○ ○                  │
│ ┌ e2 ─────────────────────────┐ │
│ │ ﴿ … underlined span … ﴾   ▶   │ │
│ └─────────────────────────────┘ │
│ [   الإخفاء الحقيقي   ]            │  two full-width 72px buttons
│ [   الإدغام بغنة      ]            │
│ feedback (§5.5) with the pair's  │
│ one-line difference every time   │
```
End: "7 of 8. This pair comes back in 3 days." / "5 of 8. Let's try this pair again tomorrow." Before the first question, one framed line: the pair hint, e.g. "الإخفاء hides the نْ; الإدغام merges it into ي ن م و."

---

## 6. Component inventory

| Component | Spec |
|---|---|
| **Verse block** | `<figure lang="ar" dir="rtl">`; Amiri Quran at `--q-*`; ﴿ ﴾ in `--gold` at 0.85em; caption below, right-aligned: surah name + Arabic-Indic ayah, ▶, › (open player). Never `overflow:hidden`, never fixed height, no `text-overflow`. Highlight modes: `none` · `tajweed` (coloured spans + §7.4 cue) · `question` (neutral underline: 2px `--ink` + wavy `--gold` 14px offset, as artifact `.q`) · `ring` (correction/tap: 2px `--gold` rounded ring with 2px padding) · `lamp` (playing: `--gold-soft` background, radius 6). Stop tag `◼ وقف · stopping here`. |
| **Passage** | multi-ayah verse block with inline ayah-end markers `﴿٥﴾` (Amiri Quran end glyph if available), each a 44px tap target that seeks to that ayah. |
| **Word token** | each word a `<span role="button" tabindex="-1">` inside a roving-tabindex passage; min hit area 44×44 via padding (inline padding doesn't change the layout because the line-height already gives the vertical room); states: idle, lamp, ring, found ✓, missed ◌, wrong ✕. `aria-label` = the word itself + state. |
| **Rule chip** | pill, `--surface` bg, 1px `--line` border, 9px dot in rule colour + Arabic name (Amiri 17); optional level glyph at the end. Selected (isolate): border in rule colour, 2px. Min 44px tall hit area. |
| **Rule row** | 4px left stripe in rule colour (with pattern, §7.4), Arabic name `--a-lg` in ink (not colour, for legibility), English gloss, level badge, correction badge, chevron. |
| **Letter tile** | artifact `.tile`: 34×36 min, radius 7, Amiri Quran 22, border in rule colour; inside a `dir="rtl"` flex row. Wide tiles for digraphs. As answer options: 56×56. |
| **Count beats** | 6 squares 16px (artifact `.beats`): solid = required, striped = allowed; `aria-label="2 to 6 counts"`. Used in cards, length questions, munfasil choice. |
| **Audio transport** | docked; play 64px circle (`--green` fill, `--on-green` icon, gold 1px ring); prev/next 48px; toggle chips with **text** values (Loop ×1/3/5/10, Speed 0.75×/1×, Gap on/off); ayah scrubber RTL segments; "Your turn" countdown ring. Media Session API sets lock-screen metadata: title "الضحى · ٥", artist = reciter. |
| **Record button** | 56px circle, `--surface` with 2px `--rec` ring and a 18px `--rec` dot; label "Record" beside it (never icon-only); recording: square stop glyph, "Recording 0:12", pulsing ring. Separated from Play by ≥ 24px and on its own row to avoid mis-taps. |
| **Model-then-me button** | secondary button; while playing, shows which voice: "الحصري المعلّم…" → "You…". |
| **Scheduler level badge** | glyph + word, never glyph alone: ☆ not started · ◐ learning · ● known · ★ strong (★ is an 8-point star in `--gold`). Optional detail "every 14 days". |
| **Correction badge** | ink pill "● correction open" on cards and rows. |
| **Correction tag جلي/خفي** | hue-free by design: **جلي** = filled ink pill (`--ink` bg, `--surface` text, ■) · **خفي** = outlined pill (1px `--ink`, □). English gloss on first appearance per screen: "clear error" / "fine detail". In charts: solid vs hatched. |
| **Star badge** | artifact `.star` (two rotated squares, green fill, gold border), Kufi Arabic-Indic numeral; sizes 32/44/52/60; states: outline (locked), green (active), gold fill (done/passed). Decorative star is `aria-hidden`; the number is in the accessible name of its row. |
| **Ornament divider** | `۞` in Amiri Quran, `--gold`, with `--gold-soft` hairlines either side (artifact `.orn`). `aria-hidden`. Max one per screen section; never inside a verse block. |
| **Band** | green + gold 8-point lattice SVG (artifact), 3px double gold bottom border. Heights: 56 (default), 120 (Today), 220 (onboarding); vertical in the laptop rail. |
| **Framed card** | `e1`: surface, line border, inset gold-soft frame, radius 14. Focus card `e2`. |
| **Bottom sheet** | radius 18 top, grab handle, `e3`; max 86vh; focus trapped; Esc/back closes; content scrolls inside, the verse context stays visible above where possible. |
| **Option button** | 64px min, Arabic name `--a-lg` + English 12; states idle / hover (gold border) / chosen-correct (✓ + solid `--good` border) / chosen-wrong (↺ + dashed `--bad` border) / correct-revealed (✓ + solid `--good`). Never fills with red/green. |
| **Day marks** | 7 dots, Sat→Fri (configurable week start: Saturday default for this learner), filled gold for studied; today has a ring. |
| **Nudge** | single framed line with one action and ✕; at most one on Today at a time, priority: migration error > welcome back > install > backup. |
| **Segment control** | two or three pills, 44px, active = `--green` fill. |

---

## 7. Accessibility

### 7.1 Keyboard and focus
- Everything reachable by Tab in reading order; the focus ring is 2px `--gold` with 2px offset (artifact) and also a 1px `--ink` outer ring on gold-ish backgrounds so it's visible on the band.
- Passages use a **roving tabindex**: Tab enters the passage at the current word, `←`/`→` move word by word in visual order (left = next in RTL), `Enter` taps the word, `Esc` leaves.
- Focus modes: on step change, focus moves to the new question heading; after answering, focus moves to the feedback; `Enter` = Next.
- Sheets/dialogs trap focus and return it to the opener.
- Shortcuts are listed under `?` in focus modes and never fire while typing in a field.

### 7.2 Screen readers and Arabic
- `lang="ar"` on every Arabic node (§2 B9) so VoiceOver/TalkBack switch to an Arabic voice; `dir="rtl"` on Arabic blocks.
- Verse blocks have an accessible name with the reference read in Arabic: `aria-label` is **not** used on the verse itself (it would replace the text); instead the `figcaption` holds "سورة الضحى، الآية ٥" and `aria-describedby` links it.
- Uthmani small signs (ۜ ۛ ۖ) are read poorly by TTS; we do not alter the text (Tanzil verbatim rule). The player's audio is the true reading; the tap-word button gives the word audio.
- Highlighted spans are wrapped in `<mark>` with a visually hidden suffix "(underlined)" in English, so "which rule is the underlined part?" is answerable without sight.
- Tajweed colour spans carry `data-rule` and a visually hidden rule name **only in the analyser's isolate mode and the tap sheet**; reading every rule inline in a passage would be noise.
- Feedback, "Saved", recording start/stop and "Your turn" countdown start are announced in a polite live region; the countdown itself is not read every second.

### 7.3 Touch targets and layout
- All targets ≥ 44×44 (tab items 56 tall; option buttons 64; play 64; record 56; jali/khafi 64).
- Primary actions in the bottom third on phone (transport, Next, Save).
- Works at 200% zoom and 320px width; no horizontal scroll except the explicit topic-chip row and the laptop mind map.
- Respect `prefers-reduced-motion`, `prefers-color-scheme`, and `forced-colors` (in forced colours, the verse keeps system text colour and the §7.4 patterns become the only rule cue, which is why they exist).

### 7.4 Colour is never the only signal — the tajweed second cue

Proposed: **three layers**, so the muṣḥaf stays clean by default.

1. **Always:** every colour appears with its Arabic name somewhere one tap away. Legends and chips never show a dot without the name. Tap any coloured word → the sheet names the rule(s).
2. **Isolate (default way to read colours precisely):** tapping a legend chip dims every other colour to ink and draws an underline under that rule's spans. Anyone who can't tell `madd2` from `madd246` isolates one, then the other. This is also an excellent teaching tool for sighted learners ("show me every غنة on this page").
3. **Patterns (setting "Tajweed patterns", off by default; forced on in `forced-colors`):** an underline style per rule family, placed 0.45em below the baseline so it clears kasra marks (the artifact quiz already uses a 14px underline offset):

| Family | Rules | Underline |
|---|---|---|
| Nasal | ghunnah/إخفاء, merge/إدغام, iqlab | wavy |
| Madd | madd2 · madd45 · madd246 · madd6 | solid, thickness by length: 1px · 2px · dashed 2px · double 3px |
| Silent | silent, همزة الوصل | dotted |
| Clear | إظهار | none (absence of mark is the rule; colour + name in sheet) |
| Echo | qalqalah | short dash-dot |
| Weight | heavy / light | under the letter only: heavy = thick 3px solid, light = thin 1px solid |

Rule stripes on rows and cards reuse the same patterns (the 4px stripe becomes a patterned stripe).

Other non-colour signals already in the design: ✓/↺/✕ glyphs plus words for answers; جلي/خفي are filled vs outlined; levels have glyph + word; find-first uses ring shapes.

### 7.5 Captions for audio controls
- Every audio control has a visible text label or value (Loop ×3, Speed 0.75×, Gap on, Record, Model, then me); icons never stand alone. `aria-pressed` on toggles, `aria-label` adds the context ("Play الضحى, ayah 5").
- The verse text on screen is the caption of the recitation; the follow-along lamp is the "current caption" marker, and the transport text line states who is speaking (reciter / You) and which ayah.
- The recording state is announced and shown in text ("Recording 0:12"), not only by the red dot.

---

## 8. Learning-experience details

### 8.1 Pacing within a session
- **Today is ordered, not timed.** Minutes are guidance beside each part, no countdown (spec cut). The four parts can be done in any order, but the list reads top to bottom.
- **Learn:** 2 guesses → card → 2 checks → optional apply. Never more than 2 questions in a row before the card. Check questions use new examples so success means transfer, not recall of the guess.
- **Review:** one question per screen, ≤ 20 items (~8–10 min). The progress line shows position, not percentage. Wrong items come back once at the end ("Once more, a different example"), so a session always ends on a retrieval, not on a failure. After the 10th question, if the session runs long, a single gentle line appears: "Halfway. You can stop here; the rest stays due." The learner chooses.
- **Correction items** are spread: never two correction items back-to-back if a lesson item can sit between them (they're longer: listen, record, compare).
- **Short day path** (new, see §9): a link on Today "Only 10 minutes? Do the review." The review alone counts the day as studied (spec already).

### 8.2 How feedback is phrased
- Kind, specific, references the rule and the **deciding letter or sign** (§5.5 anatomy). Template: `[Correct / Not quite.] [It's <rule>.] <The decisive thing> <so what happens>.`
- Never blame words ("wrong", "mistake", "failed"), never praise inflation ("Amazing!"). Plain "Correct." is enough.
- Confusions use the pair's authored hint, the same sentence every time, so it becomes the learner's own rule of thumb.
- Every feedback offers ▶ "hear it": the learner closes the loop with sound, not just the label.
- Teacher-related copy uses "your teacher" (not "the teacher"), and the stored name where helpful ("Ask الشيخ أحمد").

### 8.3 Encouraging the teacher
- Teacher tab is one of four primary destinations.
- Today shows the session card the day before and the day of; the plan auto-fills, so preparing takes one tap.
- Every correction appears on its rule card and on Today's recite targets until the teacher resolves it. Only the teacher can close it; self-ratings are capped (spec).
- "Not sure? Ask your teacher" in the player and on any card adds the passage to the next session with reason "question".
- Progress puts the teacher's panel first.
- Milestones are framed as "recite to your teacher", with the ijazah disclaimer.
- No copy anywhere suggests the app can tell whether a recitation is right.

### 8.4 Avoiding recognition-only learning
- Every question screen says "Read it aloud, then choose." and every answer offers the audio.
- The largest wird part (15′) is recite-and-record, and Today lists its concrete targets.
- Correction items require listen → record → compare before the self-rating.
- Examples never repeat back-to-back; the prompt verse is chosen from ≥ 6 verified examples (spec C3).
- Progress labels the quiz panel "What you can recognise" and adds: "This shows you can name a rule. Only your teacher can tell you if you recite it."
- Levels are called learning/known/strong *for recognition*; the word "mastered" is not used anywhere.
- In R2, find-first moves recognition to real, unseen pages.

---

## 9. Decisions, trade-offs, and spec changes

### 9.1 Decided here, with reasons
| Decision | Reason | Trade-off accepted |
|---|---|---|
| LTR English shell, Arabic-forward labels, no toggle | Clear explanations for this learner; Arabic names stay primary; no doubled copy | A future Arabic-only learner would need a real Arabic UI |
| Side rail on laptop instead of top tabs | Vertical space for verse text and transport; the rail carries the band identity | Departs from artifact layout on desktop |
| Plan + Progress merged into "Path" tab | Progress shouldn't hide under "More" | Two segments under one tab |
| R1 player shows plain text, no colours | Colours without our annotations would be incomplete (no ر, لام الجلالة, إظهار); honesty belongs in the R2 analyser with its legend | Player is less colourful in R1 |
| Quiz highlights are neutral, never tajweed colour | Colour would give away the answer and train colour-matching instead of rules | — |
| Feedback colour never touches verses; option borders + glyphs | `--bad`/`--good` collide with مد ٤–٥ red and غنة green | Feedback is less "loud" |
| جلي/خفي tags are hue-free (filled vs outlined) | No red-alarm; reads in any theme and in forced colours | Less instantly "urgent" |
| Light tajweed palette darkened (7 colours) | 4.5:1 on parchment | Slightly less vivid than the printed muṣḥaf; madd2/madd246 closer |
| Second cue = isolate + optional patterns | Keeps the page muṣḥaf-clean by default, still accessible | Patterns off by default |
| Week shown as 7 dots, no "x/7" | A fraction implies 7/7 is the goal; S5 is 5 days | — |
| Hijri date on Today | Cheap (native `Intl` with `islamic-umalqura`), fits the learner's frame of time | — |
| Week starts Saturday | Common in the learner's region; setting can change | Assumption; confirm |
| Five onboarding steps | Brief needs reciter and teacher day; one decision per screen on a phone | Spec says 3 |

### 9.2 Where I think the spec is wrong for the experience (proposed changes)
1. **Add `teacherDays[]` (and keep `teacherName`) to `Settings`, and ask in onboarding.** Today's session card and the default session date depend on knowing the teacher's day; the spec only knows a session once one is planned (open question §10.1 confirms the gap).
2. **Progress shouldn't sit under Plan → "More".** Make Plan and Progress one tab ("Path"); Settings via a gear.
3. **Desktop top tab bar → side rail** (above).
4. **Add a "question" reason for planned passages** (`plannedPassages[].reason: question`) and the "Not sure? Ask your teacher" action. Without it, the learner's doubts from recording have nowhere to go except a note; this is the cheapest bridge from self-practice to the teacher.
5. **Add a short-day path** ("Only 10 minutes? Do the review"). With the fixed order listen → سبق → recite → review, a busy day ends before the only part that moves the schedule.
6. **Word tap and follow-along in the R1 player.** The spec lists word timings for R2 only, but the per-surah bundle already carries them (§8.2) and the brief asks for word tap. Fall back to ayah-level if a surah's timings aren't bundled.
7. **"x/7 days" on Today → seven day marks without a fraction** (above).
8. **F10 contradiction:** "a surah ships in the analyser only when its annotations are reviewed" vs "until then the legend says not shown on this surah yet". I designed for the second (ship cpfair-coloured surahs early with an honest legend; find-first limited to fully marked rules), because waiting for all 38 surahs' ر annotations delays the analyser by weeks and the honest legend handles the gap. Pick one in the spec.
9. **S1–S6 targets on the Progress screen** read like a KPI dashboard to the learner. Keep them, collapsed under "16-week goals", in plain sentences, below the three honest panels.

### 9.3 Open questions (defaults chosen; change if wrong)
| Question | Default |
|---|---|
| Week start: Saturday or Sunday? | Saturday |
| Show Hijri date? | Yes, under the Gregorian |
| Is "تقبّل الله منك" welcome at the end of the wird? | Yes (it's the only religious phrase the app adds) |
| Should patterns (§7.4) default on? | Off; on automatically in forced-colors |
| Is a session sheet with wake-lock OK in class (screen stays on)? | Yes, only while the sheet is open |
| Is the R1 player without colours acceptable to the learner, who likes the coloured examples? | Yes; colours remain on rule-card examples (those spans are hand-verified) |
