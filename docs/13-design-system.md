# 13 · Design system (Tailwind + shadcn/ui + kit)

The visual reference is `docs/reference/stitch/` (DESIGN.md "Sand & Ink", plus `*/code.html` and `screen.png`).
This doc is the contract for migrating screens off the legacy CSS.

## Stack

| Piece | Where |
|---|---|
| Tailwind v4 (`@tailwindcss/vite`) | `src/styles/app.css` is the only CSS entry (imported by `main.tsx`) |
| Tokens (`@theme`) | `src/styles/app.css` |
| shadcn/ui primitives (Radix, style "new-york", restyled) | `src/components/ui/*` (`components.json`) |
| App building blocks | `src/components/kit/*` (import from `@/components/kit`) |
| Icons | `src/components/ui/icon.tsx` (Material Symbols Outlined, Google Fonts) |
| `cn()` | `src/lib/utils.ts` (tailwind-merge taught our token names) |
| Gallery | `#/dev/components` (dev only): EN/AR × light/dark frames, phone 390 or wide |

Path alias: `@/` → `src/`. Radix reads direction from `Direction.Provider` in `main.tsx` (a Tooltip needs its own `TooltipProvider`).

### Cascade layers

`theme < base (Tailwind preflight + app.css base rules) < legacy < components < utilities`. The only CSS outside
`app.css` is the muṣḥaf tajweed palette: `tokens.css` (`--t-*`, both themes) and `components.css` (the `.tj-*` word
classes and their pattern cue), imported into `legacy`. Nothing there can beat a utility.

## Tokens

Colours exist only as these roles (Tailwind's palette is removed: `bg-red-500` does not exist). Each switches with
the theme: `[data-theme="dark"]`, or the system preference unless `[data-theme="light"]`. The `dark:` variant follows
the same rule, but you should rarely need it.

| Role | Use |
|---|---|
| `background`, `surface` | page canvas (sand / obsidian) |
| `surface-container-lowest` | cards, sheets, dialogs (white / charcoal) |
| `surface-container-low` · `surface-container` · `-high` · `-highest` | insets, chips, tracks, rails (light → stronger) |
| `on-surface` · `on-surface-variant` | ink · muted ink |
| `outline` · `outline-variant` | inactive icons / control borders · 1px hairlines |
| `primary` | teal **text**, icons, borders, focus outline (light #115e57, dark #5fd3c2: ≥4.5:1) |
| `primary-fill` · `primary-hover` · `on-primary` | teal **fill** (`bg-primary-fill`, dark #23756a), its hover, text on it |
| `primary-container` · `on-primary-container` | tinted teal fill + its text (selected, played) |
| `secondary` | gold **text** (eyebrows, Arabic labels) |
| `gold` | gold **graphics only**: callout edge, current-dot ring, pips, ornaments |
| `secondary-container` · `on-secondary-container` | gold tinted fill + text |
| `focus-ink` · `focus-bg` | the lesson focus highlight (the letters under study) |
| `error` · `on-error` · `error-container` · `on-error-container` | destructive, errors |
| `success` · `on-success` · `success-container` · `on-success-container` | done / known |
| `inverse-surface` · `inverse-on-surface` · `scrim` | tooltips · modal backdrop |

shadcn aliases (`foreground`, `card`, `popover`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, …) map onto
these; prefer the role names in new code.

**Type scale** (each sets family, size, line height and the role's weight; `font-*`, `leading-*`, `tracking-*` still
override). Under `:lang(ar)` the small sizes grow so Arabic is never below 14px.

| Class | Latin | Arabic UI |
|---|---|---|
| `text-caption` | 11/16 | 14/20 |
| `text-label` | 12/18 · 500 · 0.02em | 14/22 |
| `text-body-md` | 14/22 | 16/28 |
| `text-body-lg` | 16/26 | 18/30 |
| `text-headline-md` | 20/28 · 600 · −0.01em | 20/32 |
| `text-headline-lg` | 24/32 · 600 · −0.02em, 30/38 from 640px | 24/38 |
| `text-arabic-label` | Noto Sans Arabic 14/22 · 500 | |
| `text-arabic-body` | Noto Sans Arabic 16/28 | |
| `text-arabic-headline` | Noto Naskh 22/34 · 700, 28/42 from 640px | |
| `text-quran` | Amiri Quran 28, 36 from 640px, line height 2.05 | |

**Hierarchy** (measured from Stitch's `code.html`; use these, not ad-hoc sizes):

| Role | Class |
|---|---|
| Page title | `PageHeader` (headline-lg; Arabic in naskh beside it) |
| Card / panel title, numbered row card ("1 Listen") | `text-body-lg font-semibold` |
| Hero lesson name | Arabic `text-arabic-headline`, English `text-body-lg font-semibold` |
| List row name | Arabic as before, English `text-body-md font-medium`; facts under it `text-label font-normal` |
| Settings row | label `text-body-md font-semibold rtl:text-body-lg`, hint `text-label font-normal rtl:text-body-md` |
| Eyebrow / section label | `text-label font-semibold uppercase tracking-wider` |
| UI body | `text-body-md` |
| Lesson reading text | `text-body-lg leading-relaxed` (kept at 16px: it is what is studied) |

Arabic never gets smaller than it was: when an English role steps down a size, add the old size under `rtl:`.

**Families**: `font-ui` (Inter, or Noto Sans Arabic first under `:lang(ar)`; also the default `font-sans`),
`font-arabic`, `font-naskh`, `font-quran`.

**Spacing**: `space-xs` 4 · `space-sm` 8 · `space-md` 16 · `space-lg` 24 · `space-xl` 40 · `gutter` 16 ·
`gutter-md` 32 · `gutter-lg` 56 · `target` 48 (e.g. `p-space-md`, `gap-space-lg`, `min-h-target`). The numeric
scale (`p-4`) still works for small in-component nudges.

**Radii**: `rounded-control` 14px (buttons, inputs, chips) · `rounded-card` 18px (cards, panels) · `rounded-full`
(step nodes, dots). **Shadows**: `shadow-card` (the one resting shadow) · `shadow-bar` (bottom bar) · `shadow-top` (under every top
bar, with its `border-outline-variant` hairline). Depth otherwise
comes from surface steps and `border-outline-variant` hairlines.

**Focus**: global `:focus-visible` = 2px `primary` outline, 2px offset, no blur ring. Don't add `outline-none` to
interactive elements.

## Icons

`<Icon name="headphones" size={24} fill={false} rtlFlip={false} />` renders an `aria-hidden` ligature span (class
`ms-icon`, base layer, so `hidden`, sizes and alignment utilities win); label the control around it. `rtlFlip` mirrors in RTL: use it for `arrow_forward`, `arrow_back`, `chevron_left/right`,
`navigate_next/before`, `undo/redo`-style direction icons, never for media glyphs (`play_arrow` stays).
The font is fetched with `display=block` (no ligature text flash) and only the icons in `&icon_names=` (index.html,
sorted): **add a new icon's name there**, or `icon.test.ts` fails. The service worker caches it (`isFont`).

| Concept | Icon |
|---|---|
| Steps: Hear · Notice · Learn · Say · Find · Check · Recite | `headphones` · `visibility` · `menu_book` · `record_voice_over` · `search` · `fact_check` · `verified` |
| Done · current · not started | `check` / `check_circle` · `radio_button_checked` · `radio_button_unchecked` |
| Play · pause · loop · slower | `play_arrow` · `pause` · `repeat` · `speed` |
| Listen for · tip · note | `hearing` · `lightbulb` · `info` |
| Reference · finale · settings · help · close | `bookmark` · `star` · `settings` · `help` · `close` |
| Next / back | `arrow_forward` / `arrow_back` (with `rtlFlip`) |

## ui components (`@/components/ui/*`)

button, card, badge, separator, sheet, dialog, tabs, toggle, toggle-group, switch, progress, scroll-area, tooltip,
radio-group, checkbox, input, label, select, accordion, skeleton, icon. Restyled to DESIGN.md:

- `Button` variants `primary` (default; teal, white, h-12, 14px radius, px-6) · `secondary` (hairline outline) ·
  `tertiary` (teal text) · `ghost` · `destructive`; sizes `default` (48) · `sm` (40, dense rows only) · `lg` (52) ·
  `icon` (48×48 round). `type="button"` by default. Button, Badge, Toggle and Input forward refs (React 18 + `asChild`).
- `Button` `sm` is 44px (still a touch target).
- `Badge` variants `default` · `primary` · `secondary` (gold) · `success` · `destructive` · `outline`, 28px tall.
- `SheetContent side` is `bottom` (default, rounded top, safe area) · `top` · `start` · `end` (logical).
- When adding more with `npx shadcn add`, replace any lucide import with `Icon`, drop `dark:` classes and
  focus-ring classes, use logical sides, and keep `lucide-react` out of `package.json`.

## kit components (`@/components/kit`)

- `Page {width?: 'narrow'|'default'|'wide'}`: centred column (680/760/1120), safe-area gutters, 24px rhythm. Tabs
  (Today, Rules, Teacher, Path) and lessons are `wide`, pushed pages `default`, review/onboarding `narrow`.
- `PageHeader {en, ar?, detail?, eyebrow?, actions?, stacked?}`: **the page header**. A gold ۞ ornament (omitted
  with an eyebrow), the title (EN: "English · Arabic" with the Arabic in naskh teal; AR: Arabic only), a detail line
  (`detail` items joined by `Sep`), then `Divider` (thin gold rules, small star). Centred on phones; from lg it sits
  at the start, ornament and divider hidden, `actions` at the end. `stacked`: Arabic title, English gloss under it
  (the lesson header). **Every detail is real data** (counts, dates, names, the riwayah `RIWAYAH` from `@/i18n`);
  never a placeholder. Used on Today, Path (Plan and Progress share `PathHeader`), Rules, Teacher, Settings,
  Resources, Shared, and every lesson (`LessonHeader`).
- `Divider`: the gold rule with a star, on its own.
- `SectionCard {n?, en, ar?, children}`: numbered card; EN: label at the start, Arabic at the end; AR: Arabic only.
- `Callout {variant: 'listen-for'|'tip'|'note', title?, icon?, children}`: gold edge on the inline start.
- `Chip {tone?: 'neutral'|'primary'|'gold'|'success'|'error'|'outline', icon?, fill?, pressed?, onClick?, label?}`:
  28px pill; a 44px toggle button when `onClick`.
- `Panel {title?, ar?, icon?, aside?, as?}`: the white card (hairline, `rounded-card`, padding). Use it instead of
  repeating the card classes.
- `Sep`: separator between items on one line (a small gold dot; screen readers hear a comma). Never type "·" between
  items: next to Arabic-Indic digits it reads as ٠. In a plain string use `SEP` from `@/i18n` (، in Arabic).
- `StatusChip {status: 'done'|'current'|'info'|'todo'|'warning', children}`.
- `SegmentedControl {value, onChange, options: {value, label, icon?}[], label, size?}`. `size="sm"`: 40px, 36px
  segments with an outset hit area to 48px, for settings rows.
- `Group` / `Row` (`@/components`): the grouped list. Row: 36px icon tile, 12px block padding, label and hint as in
  the hierarchy table; a control sits beside a hint-less label and wraps under a long hint.
- `STEP_ICONS` maps step → icon. The step bar is `StepNav` in `screens/study/LessonShell.tsx` (the only one).
- `ExampleCard {index, total, reference?, children, controls?, onPrev?, onNext?, onPick?}` (0-based index).
  `PagerDots {index, total, onPick?, reached?, played?}` on its own (44px dots; past `reached` disabled).
- `AudioControls {playing, onPlay, played?, slow?, onSlow?, loop?, onLoop?, disabled?}`: 56px play; chips appear
  only when their handler is given.
- `LetterTile {letter, name?, selected?, onClick?}` · `CountBeats {min, max?, active?}` (numbered beats; solid =
  required, dashed = allowed).
- `UnitPath {lessons: {state: 'done'|'current'|'todo', label, href?}[], finale?}`: dots + finale star.
- `BottomBar {children}`: sticky on phones (safe area, blur, `shadow-bar`), inline from `lg`. Give the content
  `pb-28` on phones if the bar covers it.
- `EmptyState {icon?, title, children?, action?}`.

Kit strings go through `t()`; their Arabic is in `src/i18n/ar/library.json` (the library test scans `kit/` and `ui/`).

## Layouts

- **Top bars** (tab, pushed, focus) all have the hairline and `shadow-top`. A pushed screen whose page has its own
  `PageHeader` shows its bar title only once that header has scrolled away (`BarTitle`), like the lesson bar.
- **Lessons**: phones keep the focus layout (✕ Close bar, no tab bar, sticky bottom bar). From lg a lesson is a
  normal page: side rail, a top bar with "← Today", the step and the position. The header and step bar run the
  full width; steps with a word or ayah use `Split` (`Learn.tsx`): that card at the start, sticky under the bar, the
  step's work beside it. Check and Recite stay one 760px column. On phones both `Split` columns are
  `display: contents`, so the order and the sticky bottom bar are unchanged. The primary button sits at the end,
  448px wide, from lg.
- **Learn / rule sheet** (`RuleBody`): from lg the explanation (What happens, How long, When it applies, the
  example, Remember) is the main column and Which letters plus In the matn sit beside it; with nothing to put
  beside it, the example goes there. Each section has an `order`, so phones read one column in the old order. Arabic
  terms in the explanation are emphasised (teal, semibold) by CSS on their islands; content is never edited.
- **Rule card** (`Rule.tsx`): side list of every topic, the current one open; title across the card (English at the
  start, Arabic at the end in the English UI); definition beside the reminder; facts in two columns; examples in a
  two-column grid. Phones: one column, `max-lg:order-*` keeps the reading order.
- **Rules list**: search and view in one row from lg; rule rows become a two-column grid of cards with their letters,
  counts and unit.
- **Lesson cards** show only real facts: definition (first sentence), step meter and "Step n of 7", about 15 min
  (`LESSON_MINUTES`, the onboarding figure), lesson number, review state, closing passage, unit finale.

## Usage rules

1. **One primary button per screen**; everything else is secondary, tertiary or ghost. On phones it lives in `BottomBar`.
2. **Numbered sections** in lessons and rule cards: `SectionCard n={…}`.
3. **No tajweed colours in lessons**: use the `focus-ink`/`focus-bg` highlight for the letters under study.
   Tajweed colours stay only in the muṣḥaf/colours views (legacy `--t-*` tokens until those screens migrate).
4. **Focus highlight**: `<mark className="rounded-md bg-focus-bg px-1.5 text-focus-ink">`.
5. **48px targets** for everything tappable (`size-12`, `min-h-12`, or an outset hit area like `Chip`).
6. Arabic text sits in `lang="ar"` (and `dir="rtl"` when inside an LTR line); it inherits ≥14px from the type scale.

## Migration rules for screen agents

- Build screens from `kit` + `ui`. If a pattern repeats across two screens, add it to `kit` (with a gallery entry).
- Tailwind utilities with **token names only**: no raw hex, no `[#…]`, no inline colour styles, no new `.css` files.
- **Logical properties only**: `ms/me/ps/pe/start/end/border-s/rounded-s/text-start`, never `ml/mr/pl/pr/left/right`.
  Mirror directional icons with `rtlFlip`.
- Strings via `t()`/`pick()` as today; add Arabic for any new string.
- Don't change behaviour: same routes, data, and accessible names (tests rely on them).
- No new `.css` files; the legacy screen stylesheets are gone. Shared legacy components (`src/components/*.tsx`) go
  when their last user goes.
- Check the screen in EN/AR × light/dark at 390px and wide before handing over.
