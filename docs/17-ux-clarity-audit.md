# 17 — UX clarity audit: "screens are distracting, not clear what to do"

Audit of the running app (branch `tailwind`, commit e8e9648) at 390×844 (Arabic, RTL) with a desktop pass at 1280×800 and an English spot-check. Two learners were driven through the real onboarding: a fresh one (lesson 1, `basics`) and a mid-course one (16 lessons done, on lesson 17 `ikhfa`). Screenshots: `/private/tmp/claude-501/-Users-suyaser-orca-workspaces-tajweed-tajweed/c7c50110-f367-4736-a48e-730f3d538dc3/scratchpad/ux/shots/` (`*_fold.png` = what the phone shows first; `*_full.png` = whole page; `_desk` / `_en` suffixes). Scratch scripts are next to them (`shoot2.js`, `shoot3.js`). The scratchpad is temporary: copy the shots out if you want to keep them.

"Screens" below = page height ÷ 844 px (one phone screen).

## Verdict

1. **Chrome eats the fold.** Every lesson step spends ~460 px (55% of the phone) on top bar + lesson title block + step bar + instruction box before any content. Tab screens spend ~200 px on an ornamental header and then a dismissable "tip" card.
2. **Learn is a reading wall, and in lesson 1 it is a glossary.** Lesson 1's Learn step is 6.6 screens (8.6 with the summary open), 16 term cards included, many of which the lesson never uses (رواية، حفص، مخرج، وقف، وصل).
3. **Too many equal-weight things around the one action.** Today stacks four nudge cards between the lesson and Review; the Unit page puts the whole matn under the lessons and has no "continue" button; the Rule page has 22 play buttons before its CTA.
4. **The "do this now" control is often below the fold or in a different card from the thing it acts on** (Say: the rating that unlocks Next is 1.8 screens down; the play button isn't on the word).
5. **Jargon before teaching**: سبقي / منزل on Today and Review, المد المنفصل in Settings, "Not yet reviewed by a teacher" warnings.

---

## Per screen

### Onboarding — `onb1/onb2/onb3_fold.png`, `src/screens/Onboarding.tsx`
Primary action: **Begin / Next / Start lesson 1.**

- **MAJOR — Welcome's "Begin" is below the fold** (page 1.5 screens). Above it are a logo, an ayah card, a language picker, a step dot row, a heading and four feature cards. *Fix:* remove the four feature cards (step 3 "How it works" says the same thing again), or move them under the button. Keep ayah + language + Begin.
- **MINOR — step 3 "How it works" is four paragraphs**, including the review interval list "3, 7, 14, 30, 60, 120 days". A beginner doesn't need the schedule. *Fix:* cut each card to one line; drop the interval numbers (they belong in Guide).
- **MINOR — "TAJWEED PATH" Latin subtitle** under the Arabic name in Arabic mode. Remove in `ar`.
- Fine: step 2 ("Can you read this?") is a model of one question, one answer, one button.

### Today — `fresh_today_full.png`, `mid_today_fold.png`, `mid_today_full.png`, `mid_today_desk_fold.png`, `src/screens/Today.tsx`
Primary action: **Start / Continue lesson** (or Review when due). The button is at y≈740 on a phone: just above the bottom nav, visible but last in the fold.

- **MAJOR — the lesson card carries ~10 facts and 3 actions.** Unit label + surahs, a row of 9 unit-progress dots, "Lesson 17 of 58", "Lessons done 4 of 8", the lesson's name and a 3-line rule summary (truncated with "…"), "Step 7 of 7 · done 6 · ~15 min", a 7-segment step meter, a "Resume at step: Recite" chip, a "Recite An-Nas 3–4" inset, then Continue, Open unit, Course map. Several say the same thing three ways (dots, "4 of 8", the meter). *Fix (Today.tsx `section aria-label="Continue"`):* keep lesson name, one progress line ("Step 7 of 7 · about 5 min left"), and the button. Remove the unit dots row, the rule summary paragraph (it teaches before the lesson does), the "Recite" inset and the "Resume at step" chip (the progress line says it). Fold "Open the unit" and "Course map" into a single tertiary link, or drop both (the Path tab is one tap away).
- **MAJOR — four nudge cards stack between the lesson and Review** for a new learner: "Set up your routine" (3 rows + hide), "How it works" tip, sign-in nudge (`SignInNudge`, two buttons), install-to-home-screen card. Each has its own dismiss. They push Review — the second thing the learner must do daily — to ~1.8 screens. *Fix:* show **at most one** nudge at a time, ranked (install > routine > sign-in > tip), and render it *after* Review and Recitation. Drop the "How it works" tip entirely: the `?` icon in the top bar is the same link.
- **MAJOR — Review is styled as a secondary, outlined button inside a side card** even when 16 items are due (desktop: right column, small). If the learner should review daily, it reads optional. *Fix:* when `due > 0` and the lesson is done for today, make Review the primary; otherwise put the due count on the button ("Review · 16").
- **MAJOR — "السبقي (هذا الأسبوع) ١٦، المنزل (الأقدم)" is jargon** on the most-visited screen. *Fix:* "16 due" only; keep سبقي/منزل in Guide.
- **MINOR — header ornament + Gregorian + Hijri date** take ~200 px before the card. *Fix:* one line date, no ornament, on Today.
- **MINOR — "This week" calendar strip** for a learner with 0 days is a row of empty circles. Hide it until there is a day to show.
- **MINOR — top bar has `?`, `EN`, ⚙ on every tab** (`Shell.tsx` `TabHeader`). Language is set once; move `EN` into Settings only.

### Path / Plan — `plan_full.png`, `mid_plan_full.png`, `src/screens/Plan.tsx`, `src/screens/path/*`
Primary action: **open the current unit / continue its lesson.**

- **MAJOR — the expanded current unit repeats its own header**: the card shows "Unit 2 · الناس، الفلق، الإخلاص · 4 of 8 · progress bar", and the expanded body below repeats "Unit 2 · الناس، الفلق، الإخلاص · Lessons done 4 of 8 · progress bar". *Fix (`path/blocks.tsx`):* drop the repeated heading block in the expanded body.
- **MINOR — the expanded unit has no "Continue" button**; the current lesson is a row with a small play icon, then "Open the unit" link. *Fix:* make the current lesson row the visual primary (filled), or one primary "Continue: الإخفاء الحقيقي" under the list.
- **MINOR — intro tip card** ("The path is unit by unit…" + More + ✕) at the top of the tab, plus a header with 4 stats ("10 units · 16 of 58 done · رواية حفص عن عاصم"). *Fix:* remove the riwāya line from the header (it's in Settings and Resources) and the tip card (the Path itself shows it).
- **MINOR — locked units show chevrons** (expandable) that open a list of locked lessons. Fine for curiosity; remove the chevron weight so locked units read as quiet.

### Unit — `mid_unit_fold.png`, `mid_unit_full.png`, `src/screens/Unit.tsx`
Primary action: **continue the current lesson.**

- **MAJOR — no primary button at all.** The current lesson is a highlighted row with a small round play icon. 4.4 screens, of which ~3 are the full matn text (`<Mutun>` at Unit.tsx:72): every تحفة and جزرية line for the unit, each in a card with an explanation and rule chips, plus a "Memorise" button. *Fix:* add nothing new — fold `<Mutun>` into a `<details>` "Mutun for this unit (14 lines)" or replace it with one link to `#/mutun/tuhfa?from=…&to=…` (that screen already exists and does this better). Make the current-lesson row a filled primary.
- **MINOR — every done lesson row says "حان موعد مراجعته" (due for review)** in grey. Four identical grey notes. Remove from the row; the Review count on Today covers it.
- **MINOR — top bar shows ⚙ and `?` beside Back** on every pushed screen (`Shell.tsx` ~187). Remove on pushed screens; they're reachable from the tabs.

### Lesson shell (all steps) — `ikhfa_*_fold.png`, `basics_*_fold.png`, `src/screens/study/LessonShell.tsx`
- **BLOCKER — content starts at y≈465 on every step.** Top bar (step name + Close, 64 px) + `LessonHeader` (eyebrow "Lesson 17 of 58 · Unit 2", title, surahs line, ornament divider ≈ 190 px) + `StepNav` (80 px) + `Instruction` (80 px). The top bar's title *is* the step name, which the step bar also shows in bold, and the instruction box shows a third time via its icon. *Fix:* in `LessonHeader` drop the surahs `detail` and the ornament divider while in a step (keep them on the gate/done screens); move "Lesson 17 of 58" into the top bar subtitle; drop the step name from the top bar (`Shell.tsx` focus bar) since the step bar has it. That recovers ~150 px — the word card and its play button come into the fold on Hear/Say.
- **MAJOR — skipped steps are still drawn.** In lesson 1, لاحظ and استخرج are dashed "–" nodes: two of seven nodes are dead. *Fix (`StepNav`):* don't render `skipped` steps.
- **MINOR — the Rule chip (gold) sits in the title block** on Say/Find/Recite. It's the most colourful thing on the screen and competes with the step's own action. Make it a quiet icon button in the top bar.

### Hear — `basics_hear_full.png`, `ikhfa_hear_full.png`
Primary: **play each word, then Next word.** Clear. 1.4 screens.
- **MINOR — the example card has 3 audio controls (loop, slower, play) + "show full ayah" + pager arrows + dots**, and the sticky bar has "Next word". Two ways to move to the next word (pager and button). *Fix:* remove the pager arrows on Hear (the button drives it); hide Loop on Hear/Notice (useful only on Say).
- **MINOR — "Listen for" callout sits under the card, below the fold**, i.e. after the learner has already played the word. Move it above the card or into the instruction line.

### Notice — `ikhfa_notice_full.png`
Primary: **play both, pick one.** Clear and focused. 1.5 screens.
- **MINOR — the pick buttons ("هذه" / "This one") are disabled grey** until both played; reads as broken. Hide them until both are played instead of disabling.

### Learn — `basics_learn_full.png` (6.6 screens), `basics_learn_open_full.png` (8.6), `ikhfa_learn_full.png` (3.8), `src/screens/study/Teach.tsx`, `Learn.tsx` `LearnStep`
Primary: **read, then Next: Say it.** The Next button is sticky from the first second, so the screen says "tap Next" while the content says "read six sections".

- **BLOCKER — lesson 1's "New words" section is a 16-card glossary** (تجويد، حركة، فتحة، ضمة، كسرة، سكون، شدة، تنوين، حرف مد، مد، همزة، وقف، وصل، مخرج، رواية، حفص), ~2.5 screens, each with a definition and a "literally" line. The learner hits it as section 2, before "what happens". رواية، حفص، مخرج، وقف، وصل are not needed to read the vowel-marks lesson. *Fix (`Teach.tsx` section "New words" + teach content):* cap New words at 3–4 per lesson; show the term + one line; move "Literally:" behind a tap; move the rest to the lesson where they're first needed (or to the "Words from other lessons" fold).
- **MAJOR — Learn ends with three more things after the 6 sections**: "Words from other lessons (15)" fold, "Summary: the rule in short" fold (opens a second copy of the rule with its own player and letters grid, +2 screens), and "Watch it explained" YouTube card. Three equal-weight cards right above the Next button. *Fix:* remove the Summary fold from Learn (it's on the Rule chip in Say/Find/Recite and on the Rules tab — the code comment already says "so the lesson isn't read twice"); move the video link into section 1's header as a small icon link; keep "Words from other lessons" only when n ≤ ~5, else drop (glossary terms can open from tappable words).
- **MAJOR — the instruction "Read each part, top to bottom. Play the example." is accurate but the step has no reading progress.** At 3.8–6.6 screens the learner can't tell how far they are. *Fix:* number is there (1–6); show "1 of 6" in each section header, or collapse sections 3–6 into `<details>` with section 1 and 2 open.
- **MINOR — English: each section header is bilingual** ("IN PLAIN WORDS بكلمات بسيطة"). Drop the Arabic duplicate in `en`.

### Say — `ikhfa_say_full.png`, `basics_say_full.png` (2.1 screens)
Primary: **play, say, record, then rate "Did it sound the same?"** — the rating is what unlocks Next.

- **MAJOR — the action that unlocks Next is 1.8 screens down.** Order on the page: word card (with pager), card 1 Listen (the play button — not on the word), card 2 Record, card 3 Compare (empty placeholder "record first, then compare"), Listen-for callout, *then* "Did it sound like it?" with Not yet / Sounds the same. The sticky hint says "Rate each word to continue" but the rating is off screen. *Fix (`Learn.tsx` Say + `SayRows`):* put the play button on the word card (as in Hear) and remove card 1; hide card 3 until there's a recording; move the rate buttons into the sticky bottom bar in place of the disabled Next (Not yet / Sounds the same → advance). Drop the Listen-for callout here (it was on Hear).
- **MAJOR — the "Listen for" callout names words that aren't on screen.** On lesson 1 Say, the word shown is يُوَسْوِسُ, the callout talks about مَلِكِ، قُلْ، بِرَبِّ (Hear's words). Confusing. Same fix: remove the callout from Say.
- **MINOR — two ways to change word** (pager arrows/dots on the card vs. rating advancing). Keep one.

### Find — `ikhfa_find_full.png` (1.0 screen)
Primary: **tap the words, then Check.** Clear, compact. Good.
- **MINOR — the disclaimer "Checked against tajweed data, which can miss rules that depend on stopping"** is shown before the learner tries. Show it only after Check if a stop-word is involved.

### Check — `ikhfa_check_full.png`, `basics_check_full.png`
Primary: **choose one answer.** Clear.
- **MINOR — three instructions for one question**: the instruction box ("Question 1 of 3. Read it, then choose one answer."), the question itself, and "Read it aloud, then choose." under the ayah. *Fix:* instruction box = "Question 1 of 3"; drop the second sentence; keep the one under the ayah.

### Recite — `ikhfa_recite_full.png` (1.6 screens)
Primary: **listen, record, Finish lesson.**
- **MINOR — "Open in player" link sits beside Listen**, an exit out of the lesson at the last step. Remove from Recite.
- **MINOR — Compare card is an empty placeholder** before recording (same as Say).
- Finish/done screen (code-read, `Learn.tsx` `finished`): one primary "Next lesson: …" + "Back to today". Clear. But after a new lesson the pace gate ("Come back tomorrow") is only discovered by tapping Next lesson on the 3rd lesson; fine.

### Review — `mid_review_go_full.png`, `src/screens/Review.tsx`
Primary: **answer.** The cleanest screen in the app: progress, one question, four answers.
- **MINOR — "السبقي، دروس هذا الأسبوع" label** above the question. Jargon; drop it or say "This week's lessons".

### Rules — `rules_fold.png`, `rules_full.png` (7.7 screens), `src/screens/Rules.tsx`
Primary: **find a rule and open it.**
- **MAJOR — before the list:** header with 3 stats, a 5-line tip card ("cards, mind map, similar rules… colours match the muṣḥaf" + More + ✕), search, List/Map toggle, "Colours" toggle, then a horizontal chip row of 11 chapters, and each chapter has a heading + description + a "the next letter…" fold. Every rule row has a status chip ("Not started" / "Learning"). 58 "Not started" chips on a fresh account are pure noise. *Fix:* remove the tip card; hide status chips for "not started" (show only Learning/Known); move the Colours toggle into Settings (it's already there as "Tajweed colouring").
- **MINOR — the Resources link is hidden in the chapter chip row** (Rules.tsx:96). Fine as is, but it's the only entry to Resources from a tab.

### Rule page — `rule_ikhfa_full.png` (5.2 screens), `src/screens/Rule.tsx`
Primary: depends — for a not-yet-learned rule, **"Learn this rule"** (at the very bottom, 5 screens down); otherwise, read.
- **MAJOR — 11 examples, each with "Play" and "Muṣḥaf" buttons** = 22 buttons + "tap any word to hear it alone". *Fix:* show 3 examples, fold the rest behind "More examples (8)"; make the whole card tap-to-play and drop the separate Play button.
- **MAJOR — "Checked against at least two sources… Not yet reviewed by a teacher."** at the top of every card (Rule.tsx:135). For a beginner this says "don't trust this". *Fix:* move it into the "Sources (5)" fold at the bottom.
- **MINOR — the "Learn this rule" CTA is 5 screens down.** Put it under the definition (section 1) when the rule isn't learned.

### Mutun — `mutun_full.png` (12.9 screens), `src/screens/Mutun.tsx`
Primary: **read the asked-for lines** (scrolled to and highlighted). Works. 
- **MINOR — the asked-for range is highlighted but the rest of the matn is full strength around it**, so the learner can't tell when "their" lines end. Dim the lines outside `from..to`, or show only the range with "Show the whole matn".

### Resources — `resources_full.png` (4.7 screens), `src/screens/Resources.tsx`
Primary: none (reference). Acceptable as a library.
- **MINOR — ~1 screen of credits/licences ("شكر وإسناد")** at the bottom, also duplicated in Settings → "الإسناد والمصادر". Keep it in one place (Settings, folded).
- **MINOR — top bar ⚙ and `?`** beside Back (see Unit).

### Settings — `settings_full.png` (4.0 screens), `src/screens/Settings.tsx`
- **MAJOR — "مقدار المد المنفصل" (2/4/5 counts) is shown to every learner** before المد المنفصل is taught; changing it changes lessons and questions. *Fix:* fold under "Advanced", or show only after the lesson that teaches it.
- **MINOR — "Circles" (الحلقات) and calendar export** in the main settings flow for a solo beginner. Fold under "Teacher and circles".
- **MINOR — the reciter list has a "Sample" button per row**; fine.

### Teacher tab — `teacher_full.png`
- **MINOR — tip card + "Next session" card with two buttons (Plan / Start now) + All/Open tabs + empty state** for someone who said they have no teacher. If onboarding knows "no teacher", show only the empty state with one "Find a teacher" link to Resources.

### Progress — `mid_progress_full.png`
- **MINOR — the "Not backed up" badge** sits at the top of the progress page, unrelated to progress. Remove; Today's backup nudge covers it.

### Desktop (1280×800)
Same patterns, less severe: Today puts Review in the right column as a small outlined button (`mid_today_desk_fold.png`); lesson steps split word/controls into two columns, which works. The rail has Help / Language / Settings — fine there.

---

## Top 10 changes by impact ÷ effort

| # | Change | Where | Effort |
|---|--------|-------|--------|
| 1 | **Shrink the lesson chrome**: in steps, drop the surahs line and ornament from `LessonHeader`, drop the step name from the focus top bar, and stop drawing skipped steps in `StepNav`. Brings the word and its play button into the fold on every step. | `study/LessonShell.tsx`, `app/Shell.tsx` | S |
| 2 | **Cap "New words" at 3–4 per lesson** (lesson 1 has 16); move the rest to where they're first needed. | `content/teach*`, `study/Teach.tsx` | M (content) |
| 3 | **Remove the Summary fold from Learn** (it's already one tap away on Say/Find/Recite and on Rules); move the video link to a small icon in section 1. | `Learn.tsx` `LearnStep` | S |
| 4 | **Today: one nudge at a time, below Review.** Drop the "How it works" tip (duplicate of `?`). | `Today.tsx` ~L163–198 | S |
| 5 | **Today lesson card: name + one progress line + one button.** Remove unit dots, rule summary, Recite inset, Resume chip; one tertiary link at most. | `Today.tsx` `section[aria-label=Continue]` | S |
| 6 | **Say: rating in the sticky bar, play on the word card**, hide Compare until recorded, drop the Listen-for callout from Say. | `Learn.tsx` `Say`, `SayRows` | M |
| 7 | **Unit page: fold or link out the mutun**, make the current lesson a filled primary. | `Unit.tsx:72`, `Mutun` | S |
| 8 | **Jargon out of daily screens**: سبقي/منزل on Today and Review → "N due"; المد المنفصل setting under Advanced. | `Today.tsx:211`, `Review.tsx`, `Settings.tsx` | S |
| 9 | **Rule page: 3 examples + "More examples", trust note into Sources, "Learn this rule" under the definition.** | `Rule.tsx` | S–M |
| 10 | **Remove the dismissable tip cards from tab screens** (Path, Rules, Teacher) and ⚙/`?` from pushed-screen top bars; `EN` only in Settings. | `Plan.tsx`, `Rules.tsx`, `Teacher.tsx`, `Shell.tsx` | S |

Not recommended: adding coach marks, tours or more instructions. The screens that already work (onboarding step 2, Notice, Find, Check, Review) work because they show one question and one control; the fix elsewhere is to get back to that by removing, not by explaining more.
