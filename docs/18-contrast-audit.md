# 18. Colour contrast audit (light and dark)

Date: 2026-11-21. Branch `tailwind` at e8e9648. Report only; no source files changed.

Method: WCAG 2.x relative luminance, computed from the tokens in `src/styles/app.css` (light `@theme`, dark `@variant dark`) and `src/styles/tokens.css` (muṣḥaf palette), with alpha modifiers (`/70`, `/80`, `opacity-80`) composited over the real background. Usages from grepping `src/**/*.tsx`. Screens checked at 390×844 @2x in light and dark (Playwright `colorScheme`, onboarding clicked through in Arabic, no localStorage edits): Today, Unit, lesson Hear / Learn / Check (quiz) / Recite, Rules, Settings. Script and PNGs: `scratchpad/contrast/` (session scratchpad, not committed).

Thresholds: 4.5:1 body text; 3:1 large text (≥24px, or ≥18.66px bold) and for UI components, icons and boundaries that carry meaning (1.4.11).

## Verdict

The core text tokens are fine and already guarded by `src/styles/tokens.test.ts`: `on-surface`, `on-surface-variant`, `primary`, `secondary`, `error`, `success` all reach 4.5:1 on the page and on cards in both themes. The muṣḥaf palette passes on every surface it is actually drawn on.

The user is still right that it is hard to see, for three reasons the test does not cover:

1. **Dark mode is flat.** Card, page, tile and hairline differ by 1.04 to 1.32:1. Cards only separate from the page through a 1px border at 1.21:1. The glossary tiles in Learn (`surface-container-low` on a `surface-container-lowest` card) sit at 1.04:1, so they can't be seen at all. Every progress track, rail and inactive dot (`surface-container-highest`) is 1.3 to 1.5:1.
2. **`text-outline` is used as text.** It was meant for icons at 3:1. It sits on tinted fills, at 3.5 to 4.4:1 in both themes, on the most-seen labels: the lesson step names (لاحظ, استخرج), the digits in locked or to-do nodes, and the locked-unit label.
3. **Light mode has many small grey labels.** 225 `text-on-surface-variant` uses, mostly 14px Noto Sans Arabic at weight 400. They pass at 6.4:1, but with `opacity-80` or `/70` on top they drop below 4.5. The light boundaries (inputs, switch track, dashed "locked" cards, rails) are 1.25 to 1.36:1, so they almost disappear.

Fix: change 15 token values (7 light, 8 dark) plus 5 small component edits (class swaps). Hues stay the same. Only lightness moves.

## Failing pairs

Ratios are current → proposed. "Req." is the threshold that applies.

| Theme | fg | bg | Ratio | Req. | Where (file:line) | Proposed token | New ratio |
|---|---|---|---|---|---|---|---|
| both | `outline` (text) | `surface-container-high` | L 3.74 / D 3.81 | 4.5 | step circles new/pending `src/screens/study/LessonShell.tsx:37-38` | L `outline #686157`, D `outline #a39c90` (D high → `#36332e`) | L 4.83 / D 4.62 |
| both | `outline` (text) | `surface-container` | L 3.99 / D 4.18 | 4.5 | locked node digits `src/screens/path/blocks.tsx:143,173`, to-do nodes `src/components/kit/lesson.tsx:154` | same | L 5.15 / D 5.12 |
| both | `outline` (text, 14px caption) | card / page | L 4.74 / 4.35 · D 4.59 / 5.03 | 4.5 | step labels `src/screens/study/LessonShell.tsx:74`, locked "Unit n" `src/screens/Plan.tsx:85` | same | L 6.11 / 5.62 · D 6.12 / 6.93 |
| light | `on-surface-variant/80` | page / card / `surface-container` | 4.04 / 4.28 / 3.81 | 4.5 | `opacity-80` detail text: `src/screens/Learn.tsx:268`, `src/screens/path/blocks.tsx:116`, `src/screens/library/ui.tsx:19`, nav sublabel `src/app/Shell.tsx:279` | `on-surface-variant #4f4942` | 4.82 / 5.09 / 4.54 |
| both | placeholder `on-surface-variant/70` | card | L 3.42 / D 4.06 | 4.5 | `src/components/Controls.tsx:180`, `src/screens/Rules.tsx:62` | token change alone gives L 3.94 / D 4.51, so also drop `/70` (component) | L 8.88 / D 7.77 |
| dark | `on-primary/80` | `primary-fill` | 4.16 | 4.5 | active sidebar item sublabel `src/app/Shell.tsx:302` | drop `/80` (component) | 5.49 |
| light | `gold` (ayah-end number, ornaments, 0.85em Quran ≈ 24px) | page / card / `surface-container` | 3.32 / 3.61 / 3.04 | 3 (large); weak | `src/components/Verse.tsx:48`, `.br` brackets `Verse.tsx:24`, `src/components/kit/layout.tsx:78`, `src/screens/Mutun.tsx:75`, `src/screens/study/RuleBody.tsx:119` | `gold #94702a` | 4.19 / 4.56 / 3.84 |
| light | `error` | `error-container` | 4.34 | 4.5 | record button hover `src/components/Controls.tsx:303` | `error #b23232` | 5.09 |
| light | `error` | `surface-container`…`-high` | 4.44…4.17 | 4.5 | ghost "delete" buttons hover `bg-surface-container` (`src/screens/Settings.tsx:222,329`, `src/screens/Session.tsx:84`, `src/screens/Circle.tsx:190,247`) | same | 5.2…4.89 |
| light | `success` | `surface-container`…`-high`; `success-container` | 4.47…4.20; 4.53 | 4.5 | check icons/text on tinted rows `src/screens/study/Teach.tsx:121`, `src/screens/Listen.tsx:218` | `success #176f3b` | 5.2…4.92; 5.31 |
| light | `outline-variant` input border | card | 1.36 | 3 | `src/components/Controls.tsx:180`, `src/components/ui/input.tsx:11`, `src/screens/Rules.tsx:62` | `outline-variant #d6cdbc` (1.58) is not enough for an input; a border is required, so use `border-outline` on inputs (component) | 6.11 |
| light | switch track (off) `surface-container-highest` | card; white thumb on track | 1.36; 1.36 | 3 | `src/components/ui/switch.tsx:17` | add `data-[state=unchecked]:border-outline` (component) | 6.11 (border) |
| dark | `outline-variant` (card border, the only card/page separator) | page / card | 1.32 / 1.21 | 3 for inputs; visibility for cards | 79 uses of `border-outline-variant` | `outline-variant #45413a` | 1.86 / 1.64 |
| dark | `surface-container-low` tile | `surface-container-lowest` card | 1.04 | n/a (visibility) | Learn glossary tiles `src/screens/study/Teach.tsx`, Today lesson inset | low `#292724`, lowest `#1f1e1b` | 1.12 (+ border 1.64) |
| dark | `primary-fill` progress fill | `surface-container-highest` track | 2.36 | 3 | `src/components/ui/progress.tsx:21`, `src/screens/Review.tsx:165`, `src/components/Controls.tsx:258`, `src/screens/Today.tsx:70`, `src/components/kit/lesson.tsx:22` | use `bg-primary` for fills (component, see edit 5) | 5.6 |
| both | `surface-container-highest` tracks, rails, inactive dots | card | L 1.36 / D 1.33 | 3 for the inactive carousel dots and the Today step bar (they show state) | `src/screens/Today.tsx:70`, `src/components/kit/lesson.tsx:22`, `src/components/ui/progress.tsx:14`, `src/screens/study/LessonShell.tsx:63`, `src/components/Controls.tsx:258` | L `#d6cdbc`, D `#45413a` | L 1.58 / D 1.64 (better, still below 3; see below) |

Pairs that pass and were checked: `on-surface` everywhere ≥ 13:1. `primary` and `secondary` on every surface ≥ 4.9 light, ≥ 7 dark. All `on-*-container` on their containers ≥ 5.1. `focus-ink` on `focus-bg` 5.16 in both themes (the lesson's focus highlight on the Quran letter). Text on primary fills: 7.6 light, 5.49 dark.

**Tajweed palette (`--t-*`).** Lessons don't colour letters; they use the focus highlight. The `.tj-*` classes appear only in the legend, colour dots and the reserved muṣḥaf view. On page, card and `surface-container-low` the lowest values are 4.56 (light `--t-light`) and 4.90 (dark `--t-madd6` on the proposed low). So it passes, but light has almost no margin. If the muṣḥaf view ever draws tajweed colours inside a `focus-bg` highlight, 8 light colours fall to 4.39–4.48 and dark `--t-madd6` falls to 4.06. Either don't combine the two, or move light `focus-bg` lighter (e.g. `#e9f3f1`) at that point. The harakat are hairline strokes, so treat 4.5 as the floor for them, not 3.

## Visual issues beyond ratios (from the screenshots)

- **Dark cards don't separate from the page.** On Today, Learn and Quiz the cards are visible only through a hairline at 1.2:1. The shadow (`rgb(0 0 0 / .3)`) can't be seen on #121110. Learn's "New words" section is a card holding tiles holding text, and in dark the nesting is invisible: the tiles look like loose paragraphs.
- **Small grey labels.** The step names under the lesson stepper are 14px Arabic in `text-outline`: لاحظ, استخرج, the to-do steps. The week-day dots on Today and the empty progress segments are close to invisible in light mode as well. The inactive carousel dots are worse: `disabled:opacity-40` on top of an already-faint track (`src/components/kit/lesson.tsx:26`).
- **Disabled primary CTA.** On Hear, "الكلمة التالية" is disabled with `opacity-50`, which gives white on faded teal at 2.45:1. Disabled controls are exempt, but this is the main button on the screen and reads as broken rather than as "not yet". Consider an `outline` style when disabled, or keep the label at full opacity.
- **Translucent bars.** The top bar (`bg-surface/85`, `src/app/Shell.tsx:85`) and the bottom nav and lesson footer (`bg-surface/90`, `Shell.tsx:263`, `src/components/kit/layout.tsx:174`) let scrolled text show through. In the headless captures the text under the lesson title was readable, which competes with the title. With real backdrop blur it is softer, but /85 is still busy behind a 14px subtitle. Use /95, or make the bars solid.
- **Dashed hairlines.** The locked-lesson card, skipped steps and "before" days use `border-dashed border-outline-variant`. At 1.25:1, with gaps, the dashed border is barely there in light mode.
- **Weight.** Body text is Noto Sans Arabic 400 at 16px, labels 14px. That is fine in `on-surface`. In grey it is the main reason things look washed out. Darkening `on-surface-variant` (below) is a better fix than adding weight everywhere.

## Minimal fix

15 token values, all in `src/styles/app.css`. Each colour keeps its hue and only lightness changes. The existing `tokens.test.ts` stays green: every pair it checks still reaches ≥ 4.5, and `primary` is unchanged.

```diff
--- a/src/styles/app.css
+++ b/src/styles/app.css
@@ @theme {
-  --color-surface-container-highest: #e3dccf; /* rails, inactive dots */
-  --color-on-surface-variant: #5f5850;      /* muted ink */
-  --color-outline: #7a7268;                 /* inactive icons, ≥3:1 */
-  --color-outline-variant: #e3dccf;         /* 1px hairlines */
+  --color-surface-container-highest: #d6cdbc; /* rails, inactive dots */
+  --color-on-surface-variant: #4f4942;      /* muted ink, 8.2:1 on page; /80 still ≥4.5 */
+  --color-outline: #686157;                 /* inactive icons AND small labels: ≥4.5 on every container */
+  --color-outline-variant: #d6cdbc;         /* 1px hairlines */
@@
-  --color-gold: #a9802e;                    /* gold graphics only: edges, rings, pips, ornaments */
+  --color-gold: #94702a;                    /* gold graphics and ayah-end numerals: ≥4:1 on page */
@@
-  --color-error: #c23b3b;
+  --color-error: #b23232;
@@
-  --color-success: #1a7b42;
+  --color-success: #176f3b;
@@ @variant dark {
-  --color-surface-container-lowest: #1c1b19;
-  --color-surface-container-low: #201e1c;
-  --color-surface-container: #252320;
-  --color-surface-container-high: #2d2a26;
-  --color-surface-container-highest: #34312c;
-  --color-on-surface-variant: #aba398;
-  --color-outline: #8a8378;
-  --color-outline-variant: #2d2a26;
+  --color-surface-container-lowest: #1f1e1b;
+  --color-surface-container-low: #292724;
+  --color-surface-container: #2e2c28;
+  --color-surface-container-high: #36332e;
+  --color-surface-container-highest: #45413a;
+  --color-on-surface-variant: #b8b0a4;
+  --color-outline: #a39c90;
+  --color-outline-variant: #45413a;
```

Optional, light only: `--shadow-card: 0 4px 20px -2px rgb(28 26 23 / 0.08);` (from 0.05) helps white cards lift off the sand page (1.09:1).

Component edits that tokens can't fix (one class each):

1. `src/components/Controls.tsx:180`, `src/components/ui/input.tsx:11`, `src/screens/Rules.tsx:62`: `border-outline-variant` → `border-outline` (input boundary at 3:1), and `placeholder:text-on-surface-variant/70` → `placeholder:text-on-surface-variant`.
2. `src/components/ui/switch.tsx:17`: add `data-[state=unchecked]:border-outline` (the off switch is 1.36:1 today).
3. `src/app/Shell.tsx:302`: `text-on-primary/80` → `text-on-primary`.
4. `src/components/kit/lesson.tsx:26`: `disabled:opacity-40` → `disabled:opacity-70`, so dots you haven't reached yet still show how many there are.

Also extend `tokens.test.ts` so this doesn't regress: `outline` ≥ 4.5 on `surface-container` and `surface-container-high`, and `on-surface-variant` at 80% ≥ 4.5 on `background`.

5. Progress fills on a track, `bg-primary-fill` → `bg-primary`: `src/components/ui/progress.tsx:21`, `src/screens/Review.tsx:165`, `src/components/Controls.tsx:258`, `src/screens/Today.tsx:70`, `src/components/kit/lesson.tsx:22`, `src/screens/Onboarding.tsx:29`. In dark, `primary-fill` (#23756a) against the track is **2.36:1 today** and 1.85 with the lifted track. That fails 1.4.11, because the filled part is the information. `primary` (#5fd3c2) gives 5.6. In light the two tokens are the same colour, so nothing changes there.

Not proposed: raising tracks and rails themselves to 3:1. That would make the stepper rail and every hairline heavy. The state is carried by the filled segment, which with edit 5 is ≥ 4.8:1 against the track in both themes. The empty track only has to be visible. The one exception is the gold "current step" segment on Today (`Today.tsx:70`): gold on the track is 2.65 light today and 2.89 with the new values. It sits next to a teal segment and is labelled, so it is acceptable, but `bg-secondary` there would give ≥ 4:1.
