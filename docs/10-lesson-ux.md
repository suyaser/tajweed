# Lesson UX: structure, examples, highlight (v2.1)

Applies to `#/learn/:lessonId` (spec 09 §3). Replaces the lesson parts of 03-design §5.3 and the "neutral underline" rule in §1.2. Answers the learner's feedback of 2026-11-20: examples have no order, tajweed colours confuse, the underline is unclear, the Learn card is a wall of text, and no step says what to do next.

All English strings below go through `t()` and get an entry in `src/i18n/ar/learn.json`. Numbers go through `digits()`.

## 1. Global rules

1. **No tajweed colours in lessons.** Hear, Notice, Learn, Say, Find, Check, Recite, feedback and the done screen pass `tajweed={false}`. The rule card in the library, Review and Today use the same components, so they lose colours too. Letter tiles, count beats and card stripes stop using `lesson.colour` and switch to neutral ink on `--soft`. The player (Listen) keeps colours as an opt-in: **off by default**. Persist the choice as `settings.tajweedColours` (today it is a `useState(false)` that resets).
2. **One highlight, and it means "look here".** The focus letters or words use colour, a tinted background and faux-bold, never an underline. See §2.
3. **One instruction, one primary action.** Every step opens with one instruction line and ends with one primary button that names what comes next. Secondary actions are text or outline buttons, never filled.
4. **Separation.** Steps, example cards and Learn sections are separate blocks: `--section-gap` (28px) between blocks, a 1px `--line` rule between Learn sections, 16px card padding on phone and 20px from 768px up. Never put two cards side by side on phone.
5. **Line length.** UI text is at most 60ch in English and 50ch in Arabic. The lesson column is at most 640px, centred. Paragraphs are at most 2 sentences. Anything longer goes into a list or behind "More".
6. **Targets.** Everything tappable is at least 48px (`--target`). Play is 64px, Record 56px, and the primary button is 52px tall and full width on phone.
7. **Copy tone.** Imperative, short, kind: "Play it", "Say it the same way". No "wrong", no "great job!". "Correct." and "Not quite." are enough (03 §8.2).
8. **RTL.** In Arabic the shell mirrors: the step bar runs right to left, the back chevron is `›`, and the "Next" arrow is `←`. ▶, ❚❚ and ● are never mirrored. Verse text is always `dir="rtl"`. In the English UI, Arabic runs inside sentences stay isolated (`<T>`).
9. **Accessibility.** The focus highlight is not colour alone: it also has a background and weight, and the sr-only text reads "(highlighted: …)". Every state change in a step (played, recorded, correct) is said in a `role="status"` line. `prefers-reduced-motion` removes the step-advance slide.

## 2. Focus highlight tokens

Add to `src/styles/tokens.css`:

| Token | Light | Dark | Contrast |
|---|---|---|---|
| `--focus-ink` | `#0b6e63` | `#5fd3c2` | 6.1:1 on surface (light); 9.5:1 (dark) |
| `--focus-bg` | `#e2eeec` | `#273834` | text on it: 5.2:1 (light), 6.8:1 (dark) |

The focus colour is the brand's deep green, so it reads as "the app is pointing here". It is different from the playing-word lamp (gold, `--gold-soft`), and gold stays for "now playing" only.

```css
mark.focus { color: var(--focus-ink); background: var(--focus-bg); border-radius: 6px; padding-inline: 2px;
  -webkit-text-stroke: 0.025em currentColor; /* Amiri Quran has no bold: faux weight */ }
@media (forced-colors: active) { mark.focus { forced-color-adjust: none; outline: 2px solid CanvasText; } }
```

Delete `mark.q` (the underline and gold wave). If `focusText` isn't found in the span, highlight the whole focus words (today's fallback, with the new style).

## 3. Lesson shell (every step)

From top to bottom, on phone:

1. **Header** (sticky, 56px): `‹ Close` (back to the unit) · title `الإخفاء الحقيقي` (`--a-h3`, centred) · subtitle `Hidden noon` (`--t-sm`, muted). Second line, muted `--t-cap`: `Lesson 16 of 58 · Unit 2 · الناس · الفلق · الإخلاص`. n = index in `courseOrder` + 1.
2. **Step bar** (§3.1): 7 segments, with the label `Step 3 of 7 · Learn` under it.
3. **Done line** (only on arrival from the previous step): `✓ You heard 3 words.` It is `role="status"`, `--good` glyph with ink text, and goes away on the first tap or scroll. The copy is per step, see §4.
4. **Instruction**: one line in `--t-lg`, the exact string per step in §4. It is the step's `<h2>`.
5. **Step content.**
6. **Bottom bar** (sticky on phone above the safe area, inline on laptop): one primary button. It is disabled until the step's minimum is done, and then a muted hint above it says what is missing (e.g. `Play all 3 words to continue`). Its label always names the next step: `Next: Notice the difference`, `Next: Learn the rule`, `Next: Say it yourself`, `Next: Find it in an ayah`, `Next: Check what you know`, `Next: Recite the passage`, `Finish lesson`. A skipped next step means the button names the one after it.

### 3.1 Step bar: navigation and states

It is a `<nav aria-label="Lesson steps">` holding an `<ol>` of 7 `<button>`s, each with a short label under it (`اسمع Hear`…). Every non-skipped step is clickable, backward or forward. Steps that can't happen for this lesson (no contrast lesson, nothing to find, no questions) are not buttons.

| State | Visual (style B) | a11y name |
|---|---|---|
| Current | filled `--green` star, white numeral, label in bold ink, `aria-current="step"` | `Learn, step 3 of 7, current` |
| Done | `--green` outline star with ✓, label in ink | `Hear, done` |
| Visited, not done | `--gold` dashed outline star, numeral in `--gold-ink`, a small dot under it | `Notice, visited, not finished` |
| Not visited | `--line` outline star, numeral in `--muted` | `Say, not started` |
| Skipped (no content) | `–` in `--muted`, not focusable | `Find, not in this lesson` |

- **Done means completed**, never just visited or jumped past. The criteria per step:
  - Hear: all 3 words played.
  - Notice: a pick made.
  - Learn: the Remember section scrolled into view, or the primary tapped.
  - Say: every word rated.
  - Find: Check tapped.
  - Check: every question answered.
  - Recite: `Finish lesson` tapped.
- **Required to finish:** Hear, Learn, Say, Check and Recite (the ones that exist for the lesson). Notice and Find are recommended but not required, because they are already absent from some lessons.
- **Jumping ahead** is allowed. On Recite, if a required step isn't done, the primary reads `2 steps left: Say, Check` and goes to the first missing one. `introduceLesson` runs only when every required step is done.
- **Persist** `{ done: number[], visited: number[] }` per lesson id, not per day, in the `mem()` store as `steps[lessonId]`. It survives reloads. A replay keeps the ✓ marks, and Recite's `Finish lesson` is available.
- **Keyboard:** Tab reaches each button and Enter or Space opens the step. ← and → move focus in visual order: in RTL, ← goes to the next step.
- **RTL:** step 1 sits at the right.

## 4. Steps

### 4.1 Example card (shared by Hear, Say and the Learn example)

```
┌ Example 1 of 3 ─────────── الفاتحة ٤ ┐   eyebrow (start) · reference (end), --t-cap muted
│                                        │
│         ﴿ مَٰلِكِ ﴾                      │   q-focus, centred, the example words only, focus = mark.focus
│                                        │
│       heavy غنة before ط               │   ex.note, optional, --t-sm muted, 1 line
│        [ ▶ Play ]   ✓ Played           │   64px; ▶ Play / ❚❚ Stop / ↻ Play again
│        Show the whole ayah ▾           │   text button; expands the ayah, focus highlighted
└────────────────────────────────────────┘
```

- **Stepper:** one card at a time on every width. Under the card is a dot row `● ○ ○` with each dot a 48px button to go back to an earlier word. Moving forward happens only with the primary button. The order is the content order, fixed.
- The `Example 1 of 3` eyebrow and the dots are the only sequence cues, so they must not be hidden.
- **Played state:** after audio ends, the card shows `✓ Played` and the dot fills. If `ExampleVerse spanOnly` loads a verse that has no timings, Play plays the whole ayah (as today).
- **Offline:** `Audio needs a connection. Read it aloud instead.` The card counts as played, so the learner is never blocked.

### 4.2 Hear (اسمع)

- Instruction: `Listen to each word. What do they have in common?` The course `notice` text sits under it in a muted `Listen for:` note when present.
- Content: the example stepper with 3 cards.
- Primary: `Next word` (disabled until this card has played). On the last card it becomes `Next: Notice the difference`.
- Done line on the next step: `✓ You heard 3 words.`

### 4.3 Notice (لاحظ)

- Instruction: `Play both. Which one has the sound you just heard?`
- Content: two stacked cards labelled `Sound A` and `Sound B`, with the words hidden: each shows only `[ ▶ Play ]` and `✓ Played`. Under each card is an outline button `This one`, enabled once both cards have played.
- After a pick, both texts are revealed with the focus highlighted.
  - Right card: `Has the sound. This is الإخفاء الحقيقي, the rule you learn next.`
  - Other card: `Doesn't have it. This is الإظهار الحلقي, an earlier rule.`
- Status line: `Yes, you heard it.` / `Not this time. Play both again now that you can see them.`
- Primary: `Next: Learn the rule` (disabled until a pick is made).
- Done line on the next step: `✓ You compared two sounds.`

### 4.4 Learn (تعلّم)

- Instruction: `Read each part, top to bottom. Play the example.`
- Content: one scroll page of numbered sections. Each section heading is a 24px numbered circle (`--green` outline) plus the heading text in `--t-h3`. Sections with no content are omitted and the numbers close up.
- If `review.status !== 'verified'`, a badge at the top reads `Draft · check with your teacher`.

| # | Heading | Content field | Rendering |
|---|---|---|---|
| 1 | `What happens` | `definition` (first sentence) | one sentence, `--t-lg` |
| 2 | `Which letters` | `letters` | neutral `LetterTiles`, plus a count line: `15 letters` |
| 3 | `How long` | `counts` | `CountBeats` and `2 counts`, then `counts.note` muted |
| 4 | `When it applies` | `conditions` | numbered list, up to 3 shown; `Show 2 more` expands the rest |
| 5 | `Example` | `examples[0]` | one example card (§4.1), without the stepper |
| 6 | `Remember` | `tip` | callout: `--gold-soft` background, 💡-free, with a bold `Remember` label |
| — | `More ▾` (`<details>`, closed) | rest of `definition` (`In detail`); `list` (2-column table); `examples[1..]` (`More examples (8)`, each with ▶); `confusableWith` (`Easy to mix up with` chips, no colour); `group`; `sources`; `review.notes` | sub-headings in `--t-cap` |

- `facts` is not shown here; it feeds Check.
- Long term, add a `short` field to rules.json and ar.json for section 1. Until then, the first sentence is split off at `. ` or `.`.
- Primary: `Next: Say it yourself` (always enabled, since dwell time is not enforced).
- Done line on the next step: `✓ You read the rule.`

### 4.5 Say (ردّد)

- Instruction: `Play it, say it the same way, then record and compare.`
- **Warm-up (مخارج and صفات lessons only):** for lessons with `drillFor`, a warm-up card comes first, `Warm-up · say each one slowly`, with the drill syllables and a recorder.
- Each example card (stepper, 3 cards) carries 4 numbered rows inside it:
  1. `Listen` (▶)
  2. `Record yourself` (● 56px)
  3. `Compare` (`▶ Reciter, then me`)
  4. `Did it sound the same?`
- Recorder states:
  - Idle: `● Record`.
  - Recording: `■ Stop · 0:04`, `--rec` dot, announced.
  - Saved: `✓ Recorded 0:04` with `↻ Record again`.
  - Off (no mic): `Recording isn't available here. Say it aloud, then rate yourself.`
- Bottom bar: before rating, `Same` (primary) and `Not yet` (outline), enabled once Listen has played. Rating records the attempt and moves to the next card. The done line on the next card reads `✓ Rated. Word 2 of 3.`
  - `Not yet` adds the muted hint `Play the reciter again and listen for the highlighted part.` and still moves on.
- After the last card, the primary is `Next: Find it in an ayah`.
- Done line on the next step: `✓ You said 3 words.`

### 4.6 Find (استخرج)

- Instruction: `Tap every word that has الإخفاء الحقيقي. Then tap Check.`
- Content: one ayah at `--q-focus` with no colours, ever. Under it are a secondary `▶ Play the ayah` and a muted note: `Checked against tajweed data, which can miss a rule that depends on stopping.`
- States:
  - Tapped word: `ring` plus `--focus-bg`.
  - After check, found: green ring and ✓.
  - Missed: dashed gold outline plus the label `missed`.
  - Tapped without the rule: dotted muted outline and ✕.
- Primary: `Check (2 picked)` (disabled at 0).
- Status after the check: `All found.`, or `1 missed (dashed) · 1 without it (✕)`. The `arid` last-word note stays.
- After the check, the primary becomes `Next: Check what you know`.
- Done line on the next step: `✓ You found it in an ayah.`

### 4.7 Check (تحقّق)

- Instruction: `Question 1 of 3. Read it, then choose one answer.`
- Content: the question card (verse with focus highlighted, ▶) and the 2×2 options (`QuestionView`).
- States: idle, correct (✓ and the word `Correct.`), wrong (✕, `Not quite. It's …`), and revealed (the right option outlined).
- Feedback order is unchanged (03 §5.5), but the feedback example uses the focus highlight with no colours.
- Primary: hidden until an answer is chosen, then `Next question`. On the last question it becomes `Next: Recite the passage`.
- Done line on the next step: `✓ 2 of 3 right. They come back in review.`

### 4.8 Recite (اقرأ)

- Instruction: `Recite الناس ١–٣ in four steps.`
- Content: the passage (no colours), then numbered rows:
  1. `Listen to the reciter` (▶ Listen, `Open in the player ›`)
  2. `Record yourself`
  3. `Compare` (`▶ Reciter, then me`)
  4. `Mark it done`
- Primary: `Finish lesson`. It is enabled once Listen has finished or a recording exists, and immediately if both audio and the mic are unavailable. If a required step is missing, the label is `2 steps left: Say, Check`.
- Without a closing passage, the `SayAll` fallback uses the same 4 rows over the first 5 examples (a stepper).

### 4.9 Done

- The ۞ ornament.
- `الإخفاء الحقيقي is done. It comes back in your review tomorrow.`
- `Checks: 2 of 3`.
- Primary: `Next lesson: الإقلاب`. Secondary: `Back to today`.

## 5. Build list

| File | Change |
|---|---|
| `src/styles/tokens.css` | add `--focus-ink` and `--focus-bg` (light and dark, both dark blocks) |
| `src/styles/components.css` | add `mark.focus`; delete `mark.q`; neutral `.tile` and `.beat` styles |
| `src/components/Verse.tsx` | `mark.q` → `mark.focus`; sr-only text `(highlighted: …)` |
| `src/screens/study/verse.tsx` | `ExampleVerse spanOnly` accepts `focusText` (offset the ranges by `wordFrom`); remove `coloured`; new `ExampleCard` (eyebrow, ref, words, note, Play / Played, whole-ayah toggle) and `ExampleStepper` (dots, `onAllPlayed`) |
| `src/screens/study/LessonShell.tsx` (new) | `LessonHeader`, `StepNav` (§3.1), `DoneLine`, `Instruction`, `BottomBar` (sticky primary, disabled hint) |
| `src/screens/Learn.tsx` | use the shell; `steps[lessonId]` done/visited state in `mem()`; required-step gate before `introduceLesson`; Hear/Notice/Say/Find/Recite per §4; Find `tajweed={false}` |
| `src/screens/study/RuleBody.tsx` | rewrite as numbered sections plus `More` (§4.4); used by the Rule library too |
| `src/screens/study/QuestionView.tsx` | feedback without colour; `nextLabel` from the shell |
| `src/screens/study/Recorder.tsx` | `PassageRecite` gets `tajweed={false}` and the numbered rows; Recorder state copy per §4.5 |
| `src/core/types.ts`, `Settings.tsx`, `Listen.tsx` | `settings.tajweedColours` (default false), the toggle persisted |
| `src/content/course.ts` | `lessonNumber(id)` = `courseOrder.indexOf(id) + 1` |
| `src/i18n/ar/learn.json` (new) | every string in this doc |

Tests: the step-done reducer (done only on completion, the required-step gate, persistence round trip) and `focusRanges` for spans (with `wordFrom` > 1).
