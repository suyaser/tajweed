# 08 · UX / UI, accessibility and Arabic/RTL review

Reviewer: independent UX/UI, a11y and Arabic/RTL pass, browser-driven.
Build reviewed: `HEAD` 9bf5473 (exported with `git archive` and served with `vite build && vite preview`, because the live worktree was being edited and hot-reloaded during the review; early observations from the dev server are only kept where they reproduced on the HEAD build).
How: fresh origin (localStorage cleared), full onboarding as a new learner, then Today → Learn (`ibtida`) → Review (state seeded by back-dating introductions so a queue existed) → Rules list / map / cards (`makharij-jawf`, `ikhfa`) → Listen (Fātiḥa, al-Baqarah 1–5) → Teacher (plan, in-class sheet, log a correction, re-check next session) → Plan / Progress → Settings → Resources → 404 and bad-link states.
Viewports: phone 390×844 (same-origin iframe, window resize was refused), laptop ~1512×794. Themes: dark (system) and light; Quran size XL; tajweed patterns on.
Not exercised: real recording (would need the browser mic prompt; the in-app pre-prompt sheet was checked), backup download / restore (file download), offline mode, screen reader voice output.
Console: no errors or warnings on any screen.

Severity: **blocker** = wrong or unreadable for the core job; **major** = a learner will be confused, misled, or blocked often; **minor** = polish, consistency, edge.

---

## Blockers

None. Nothing stops a learner from completing the daily loop, and no Quran text was ever clipped, truncated or coloured without a source.

## Major

### M1. References with a range are scrambled inside English lines (bidi)
- **Where:** Today (Recite part link, Teacher card, Sabaq "milestone pending" line), Listen bad-link notice, everywhere `refLabel` lands inside a sentence. Phone and laptop, both themes.
- **Seen:** `Recite الفاتحة · ١–٧` renders as **`Recite ١ · الفاتحة–٧`**; "Phase milestone pending: recite الفاتحة · ١–٧ to your teacher." wraps as `recite · الفاتحة` / `١–٧ to your teacher`. A reader sees "١ the Fātiḥa – ٧".
- **Cause:** `splitBidi` RUN joiners are `\s ، ؛ ← · /`; the en dash `–` is not one, so the island stops at `١` and `–٧` falls into the LTR run.
- **Fix:** add `–` and `-` to the joiner class in `src/components/bidi.ts` (`[\s،؛←·/–-]`), and add a test case for `Recite الفاتحة · ١–٧ ›`. Better still, have `refLabel` return a pre-isolated `<bdi lang="ar" dir="rtl">` so references never depend on the splitter.

### M2. Abbreviations and Latin punctuation split Arabic names (bidi, B6)
- **Where:** Onboarding step 2, Plan → phase 1 tasks.
- **Seen:** `the six episodes of م. علاء حامد` renders with `م.` on the **left** of `علاء حامد`, so an Arabic reader reads "علاء حامد .م". The same in "Watch the 6 episodes of م. علاء حامد's course".
- **Fix:** spell the title out (`م. علاء حامد` → `المهندس علاء حامد`) so the name is one run, or allow `.` as a joiner in `splitBidi` when it sits between Arabic letters and a space. Keep `'s` off Arabic names ("the course by …").

### M3. Lesson example lines read in two different directions on the same card
- **Where:** Learn step "Learn" and rule card for `ibtida` (and the other 11 lessons that contain `(n:n)` references).
- **Seen:** one line is a single RTL island (`ٱلْحَمْدُ ← اَلْحَمْدُ`, written form on the right) and the next is `ٱدْعُ (16:125) ← اُدْعُ` as two islands in an LTR line, so the written form is on the **left**, the reference sits between them, and the arrow means the opposite. The colon references (`16:125`, `1:6`, `38:6`) also break B4 ("never `93:5` on screen"). The Guess question shows `(38:6)` too.
- **Fix:** render example transformations as their own `dir="rtl"` line (`<p lang="ar" dir="rtl">ٱدْعُ ← اُدْعُ</p>`) with the reference as a separate small `النحل · ١٢٥` label after it; run the content check to reject `\(\d+:\d+\)` in display strings.

### M4. Non-tajweed lessons wear the إظهار colour and label
- **Where:** Rules list (purple stripe), mind map, rule card chip, "Look again at" chips in Review summary.
- **Seen:** الجوف shows a purple **إظهار** chip at the top of its card. 21 lessons have `color: "clear"` as a default: all makharij and ṣifāt, `ibtida`, waqf, sakt, imālah, ishmām, tashīl. A learner is told الجوف "is" إظهار. That contradicts principle 3 ("never colours … it has no source for").
- **Fix:** allow `color: null` in `content/rules.json` for lessons with no muṣḥaf colour; render a neutral gold/ink stripe and no colour chip. Only show the chip when the lesson maps to a palette key.

### M5. Letter tiles: glyphs sit at the bottom edge and descenders spill out; parenthetical splits into tiles
- **Where:** Rule cards "Letters" row (seen on `ikhfa`, `makharij-jawf`), both themes.
- **Seen:** ح ط ظ ز ض hang below the tile border; the glyph is not centred. On الجوف the string `ا و ي (حروف المد)` became five tiles, two of them `(حروف` and `المد)` with mirrored, broken parentheses.
- **Cause:** `.tile { height:36px; line-height:1; font-family: var(--f-quran) }` – Amiri Quran's ascent/descent are much larger than 1em; `LetterTiles` splits on spaces.
- **Fix:** `.tile { height:auto; min-height:40px; line-height:1.6; padding:2px 8px 6px; font-family: var(--f-ar) }` (Amiri, not Amiri Quran, for isolated letters), and move the gloss out of the data: `letters: "ا و ي", lettersNote: "حروف المد"`. Add a content check that tile tokens contain no brackets.

### M6. The legend label `مد ٢·٤·٦` reads as a number
- **Where:** Rules → Colours legend, any colour chip for `arid`/`lin`.
- **Seen:** the middle dot between Arabic-Indic digits is visually the same as Arabic zero `٠`, so it reads "٦٠٤٠٢".
- **Fix:** in `src/components/Marks.tsx` use `مد ٢ أو ٤ أو ٦` (or `٢ / ٤ / ٦` with spaces). Never put `·` between two Arabic-Indic digits anywhere (also `الفاتحة · ١` is fine because a letter precedes it).

### M7. Listen: the transport is far below the passage on phone
- **Where:** Listen, phone, every theme; worse at XL.
- **Seen:** with الفاتحة at M the Play button is ~900px down; with البقرة ١–٥ at XL it is three screens down. While audio plays and the learner follows the lamp at the top, Pause / Loop / Next are out of reach. (On laptop the two-column layout with the side transport is good.)
- **Fix:** on ≤767px make the transport card `position: sticky; bottom: 0` (above safe-area) with the reciter/Loop/Speed/Gap row collapsible, or a compact sticky bar (Prev · Play · Next · Loop) with the full card below. Design §1 principle 6 asks for thumb-reachable primary action.

### M8. Correction rows never show the corrected word; re-check doesn't mark it
- **Where:** Session summary ("Corrections this session"), Teacher → Open corrections, plan "Re-check" row, in-class re-check card.
- **Seen:** I tapped نَسْتَعِينُ and saved. Every later view shows only `الفاتحة · ٥` + rule + جلي. In the next class the ayah is shown with **no ring** on the word, so neither learner nor teacher can tell what was corrected.
- **Fix:** store and render `word` (and word index) with each correction: row title `نَسْتَعِينُ · الفاتحة · ٥`; in the sheet, apply the same neutral ring used when logging to every word with an open correction.

### M9. Severity buttons look selected before anything is selected
- **Where:** Correction picker (in-class sheet), Progress chart, correction rows.
- **Seen:** the جلي badge is a cream-filled pill with ■, خفي an outlined pill with □. Inside the picker, جلي looks already chosen; Save is disabled with no hint why. After choosing, the only change is a thin green outer border.
- **Fix:** keep the badge styling for *display*, but make the picker a proper radio group: plain buttons with the badge inside, `aria-pressed`, selected = filled `--soft` background + 2px gold border + ✓; add a line under Save when disabled: "Choose جلي or خفي".

### M10. Leaving Review mid-way loses the queue and the promise "this comes back at the end"
- **Where:** Review, any viewport.
- **Seen:** answered wrong → feedback says "This comes back at the end." → tapped **Open card ›** → browser Back. The review restarted as "1 of 3" (was "2 of 7"); the re-ask was gone.
- **Fix:** persist the in-progress run (entries, idx, re-asks) in `sessionStorage` keyed by day, restore it on mount; or open the card in a bottom sheet over the question instead of navigating away.

### M11. Quiz options give the answer away by length
- **Where:** Learn (Guess and Check), Review.
- **Seen:** "Where should you start again after a stop?" — the right option is the only long, specific one ("From a word where the meaning is sound and complete"). Guess 2: the right option is "كسرة, because the ضمة on ش is not original" next to bare ضمة / فتحة / سكون. Learners will pick the longest option.
- **Fix:** in `core/questions.ts` / content: options must be parallel in form and length; move the "because …" into the feedback text. Add a content check that flags an option > 1.8× the median option length.

### M12. Learn shows four steps but ends after three
- **Where:** Learn `ibtida`.
- **Seen:** stepper shows جرّب · تعلّم · تحقّق · **طبّق**; after Check 2 of 2 the lesson ends ("is in your سبقي"). Apply never appeared and the stepper is gone on the end screen.
- **Fix:** build the stepper from the steps this lesson actually has, or always include an Apply step (one passage tap or a listen-and-find from the lesson's examples). Show the stepper, all done, on the end screen.

### M13. "Today" disagrees with itself between midnight and 03:00
- **Where:** Today header, Teacher card, session dates.
- **Seen:** at 01:47 local the header says **Thursday 19 November**, the teacher-day card says **TEACHER TOMORROW** (teacher day is Thursday), and a class started at that time and planned for Thu 19 was saved as **Wed 18 Nov**. The 03:00 day boundary in `core/day.ts` is sensible, but the screen shows the calendar date.
- **Fix:** derive the header from `today()` and, when the clock is past midnight, add a muted line "Still Wednesday's wird until 03:00". Use the planned date (not `today()`) for a session that is started from a plan.

## Minor

| # | Screen · viewport/theme | What's wrong (evidence) | Fix |
|---|---|---|---|
| m1 | Learn, Review · all | ✓/↺ glyph is absolutely positioned and overlaps the first word of multi-line options ("✓From a word…", "↺The وْ after…"). | Put the glyph in flow: `display:flex; gap:8px` with the glyph as the first flex item, or reserve `padding-inline-start: 28px`. |
| m2 | Learn Guess · all | The learner's own wrong guess is not marked (state `idle`); only the answer is. | Mark the chosen option `data-state="picked"` with a neutral ring and "Your guess". |
| m3 | Review · all | Progress jumps "1 of 5" → "1 of 6" after a miss; the bar moves backwards. | Count re-asks separately: "2 of 5 · 1 to look at again". |
| m4 | Review/Learn summary · all | Ornament divider renders as hairline / ۞ / second hairline stacked, not a single rule with a centred star. | `.divider { display:flex; align-items:center; gap:12px } .divider::before,.divider::after { content:""; flex:1; border-top:1px solid var(--gold-soft) }`. |
| m5 | Learn end · all | "Check: 1 of 2" is cold and unclear. | "You answered 1 of 2 checks. It comes back tomorrow." |
| m6 | Today · all | "New lesson" printed twice ("New lesson" / "New lesson: …"). Recite part has a text link + Mark done while the others have a primary button. | Drop the second "New lesson:"; give Recite a primary "Recite" button. |
| m7 | Today · phone | Recite link is 132×17px; "Open plan ›" 28px tall; rule-card source links 17px tall; "Open on Quran.com" 17px. | `min-height:44px; display:inline-flex; align-items:center` on inline action links. |
| m8 | Today · all | "Open plan ›" goes to *plan a new session* — "plan" collides with the Path/Plan tab. | "Plan this session ›". |
| m9 | Today, day 1 · all | Days before onboarding read "Sat: not studied" (screen reader) and the strip says "0 days studied this week". | Days before `onboardedOn` are "before you started"; first-day copy "Your week starts today." |
| m10 | Onboarding vs Settings · all | Teacher-day picker starts Saturday ("Sa Su…") in onboarding and Sunday ("Sun … Sat") in Settings. | One component, Saturday first (design §9.3), same labels. |
| m11 | Onboarding · dark | Selected option ("Not yet", "4 counts") is only a dark-green border (`#14533f` on `#0c1613`, ~2:1). | Selected = `--soft` fill + 2px `--gold` border + ✓, as in design §5.5. |
| m12 | Onboarding / Learn · all | Short Arabic islands wrap mid-term ("همزة" end of line, "الوصل" next line); "ابن الجزري" splits. | `bdi.a { white-space: nowrap }` for runs ≤ 3 words (or always; long runs are rare in UI copy). |
| m13 | Rules search · all | Placeholder `ابحث · search: إخفاء، مد، ghunnah` renders with the comma stranded (`مد ،ghunnah`) and suggests a transliteration the design forbids. | "Search · ابحث — e.g. إخفاء or مد". |
| m14 | Rules · phone | List/Map toggle 88×40; Teacher All/Open corrections 40px tall. | `min-height:44px`. |
| m15 | Rules map · all | "Read it from right to left, as in a muṣḥaf" but on phone the map is a vertical list. | Show the sentence only when the map is horizontal. |
| m16 | Rule card examples · all | The "open in player" control is a bare chevron that the RTL row mirrors to "‹"; meaning is not discoverable. | Text button "Open in player" or an icon + visible label. |
| m17 | Rule card, in-class sheet, Listen · all | Final ayah-end marker `﴿٧﴾` / closing ﴾ wraps alone onto its own line. | Join the last word and the marker with U+2060 WORD JOINER or wrap both in `<span style="white-space:nowrap">`. |
| m18 | Lesson / rule title · all | Lesson title and top stripe are painted in the lesson's tajweed colour (purple for ibtida). Colour outside verse text reads as a rule signal. | Titles in `--ink`; keep the colour only in the chip/legend. |
| m19 | Plan · all | Locked phases use `opacity:.7` on muted text → about 3:1 for 14px subtitles. | Drop opacity; use `--muted` at full strength plus the lock icon. |
| m20 | Plan · all | Milestone shows `☐ الفاتحة`: looks like a checkbox but isn't one. | Use the star badge or "Not yet" pill instead of ☐. |
| m21 | Progress · laptop | "Corrections per session" rows break: date on one line, chips wrapped below, a stray 8px square as the "bar"; newest first with no label. | CSS grid `grid-template-columns: 7rem 1fr auto`; bar width = count × unit with min 2px; label "newest first". |
| m22 | Progress · all | "16-week goals" is a large empty card with one link. | Make it a row link ("16-week goals ›") or show the goals. |
| m23 | Teacher · all | Empty state "No sessions yet. Plan your first one" shows under a card that already has a planned session; "Plan a session" appears twice. | Empty state only when there are no sessions at all; one CTA. |
| m24 | Teacher plan · all | Passage source label "? You asked" for a passage the learner added. | "Added by you". Surah picker uses Western digits (`الضحى · 93`) — use Arabic-Indic per B4, default to the last practised surah, not الضحى. |
| m25 | In-class sheet · all | Prev/Next passage use LTR chevrons ("‹ Previous", "Next ›"); Listen uses mirrored "‹ Next" / "Prev ›". Same concept, opposite directions. | Decide once: passages are a list (LTR, like the sheet); ayahs inside an RTL island (mirrored). Label Listen buttons "Next ayah" / "Previous ayah" with arrows to match. |
| m26 | In-class sheet · all | "Done" with passage 2 never opened gives no notice; the "Saved · جلي · الفاتحة · ٥" confirmation omits the word and has no Undo. | "1 passage not reached" line on Done; toast "Saved نَسْتَعِينُ · جلي · Undo". |
| m27 | Settings · all | Choosing XL grows the preview and shifts everything below (my next two taps missed). Native unstyled "Choose File" input. "recordings 0 B (0)". | Reserve preview height for XL; style the file input as a secondary button; "No recordings saved". |
| m28 | Settings · laptop | Rail gear has no active state on Settings. | Same active pill as rail items. |
| m29 | Learn (locked) · all | "You'll learn this in phase ٣." — Arabic-Indic digit in an English sentence (B4). | "phase 3". |
| m30 | 404 · all | "Page not found · Not built yet." for a mistyped link; no way back in a focus route. | "This page doesn't exist." + "Go to Today" button. |
| m31 | Resources · all | "61 lines on اللام, النون والميم and المد" — Latin comma between two Arabic islands reads oddly. | Use Arabic list inside one run: "on اللام والنون والميم والمد". |
| m32 | Laptop header strip · all | Date / Hijri at 12px in a 40px strip; Today on laptop loses the band that carries the date on phone. | 14px minimum; Hijri in Amiri at 16px. |
| m33 | Today · all | Teacher's name (collected in onboarding) is never used; the card says "Your session". | "With الشيخ أحمد · Thursday". |

## What I could not verify

- Recording itself (mic permission prompt avoided); the pre-prompt sheet is clear and kind.
- Backup download/restore, offline behaviour, audio-load failure states.
- Screen-reader speech; the DOM has `lang="ar"` on islands, labelled play buttons (`Play البقرة · ٣`), `aria-pressed` on toggles and a skip link, which is a good base.

---

## Five things to keep

1. **The Quran presentation.** Amiri Quran at a generous size with the ornamental ayah-end markers, the gold lamp that follows the reciter word by word, and the neutral wavy underline / ring for marks. Nothing is cropped, faded or coloured without a rule. At XL it is genuinely beautiful on a phone.
2. **The identity.** Green band with the gold lattice, double-ruled cards, star badges with Arabic-Indic numerals, Arabic-first names with small caps English. It feels calm and respectful in both themes; light mode is especially good.
3. **Honest, kind copy.** "It does not grade your recitation. Only a teacher can.", "This shows you can name a rule. Only your teacher can tell you if you recite it.", "This is a milestone check, not an ijazah." Feedback is "Not quite" plus a reason, never red shame.
4. **Feedback mechanics in questions.** ✓/↺ glyph + word + border (not colour alone), number keys 1–4, focus moves to Next, a visible gold focus ring everywhere, "Open card ›" from the feedback.
5. **The teacher loop.** Plan suggests the milestone and open corrections, the in-class sheet lets you tap a word and tag جلي/خفي and a rule in two taps, and re-check closes the correction with a clear summary. The laptop Listen layout (passage left, sticky transport and keyboard shortcuts right) is also excellent.
