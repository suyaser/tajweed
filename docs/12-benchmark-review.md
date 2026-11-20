# Review of 11-benchmark-research.md

Written 2026-11-20 by an independent reviewer. It checks the sources, questions whether each proposal fits a motor and auditory skill, lists what the research missed, and ends with one plan merged with doc 10.

**Verdict.** The research does a good job of describing benchmark apps, and its "patterns to avoid" table is sound. It is weaker on three points:
1. **The evidence for learning is thin.** Almost all of it comes from vendor blogs and app-store pages about vocabulary apps, and the doc offers it as support for design choices.
2. **It misses what the app already does.** S7 is already built, M2 and S3 are half built, and C5 is already specified in doc 10.
3. **It leaves out the learning science that fits tajweed**: perceptual (minimal-pair) training, slow practice in chunks, calibrated self-assessment, and the teacher as the only valid judge of recitation.

Taken as written, the 4 Musts and 7 Shoulds add up to about 3 weeks of work for one maintainer, on top of the doc 10 build (about 1 week). The plan at the end cuts that to about 1.5 weeks of real work.

## 1. Source check (13 sources checked)

| # | Claim in doc 11 | What the source says | Status |
|---|---|---|---|
| [1] | Path became the home screen in Nov 2022, with personalised practice on the path | Blog post dated 6 May 2022, rolled out 1 Nov 2022. It says "Practice is built into your path" but doesn't call it personalised. It also says completed levels can be revisited. | Mostly right. "Personalised" is overstated. |
| [5] | Lessons have 12–15 exercises (3–5 min), plus jump-ahead and checkpoints | Portnoff et al. (EDM 2021) is about *embedded assessment* (Checkpoint Quiz and Review) and how navigation relates to outcomes. I could not find lesson length or test-out in it. | Likely misattributed. Lesson length rests only on [9], a fan site. |
| [6] | Practice Hub is built from your mistakes, with daily targeted practice, and was once paid | The page offers "Review previous mistakes" and says sessions are now "available to all learners, for free". It doesn't describe daily targeted practice. | Partly right. |
| [10] | Babbel lessons take 10–15 min, follow introduce → drill → review → dialogue, and learners complain about thin review | The 10–15 min is confirmed. The four-part pattern and the review complaints are **not in the source**. | Two of three claims are unsupported. |
| [13] | Smart Tips appear after a specific mistake, and fewer errors followed | Confirmed almost word for word. | OK |
| [16] | Busuu shows a fluent-speaker video, side-by-side compare, up to 3 attempts | Confirmed (two more attempts after the first). However, Busuu now adds **opt-in AI pronunciation feedback** (2024), so "speaking without grading" is out of date. | OK, with a caveat |
| [18] | ELSA saves recordings to show change over time (the source for S3) | The post says ELSA tracks *accuracy scores* over time. It doesn't say recordings are kept for comparison. | **Misattributed.** S3 has no benchmark source. |
| [19] | ELSA: "fix one red sound at a time" | The URL now returns 404. A search snippet of the same article confirms "Focus on one 'red' sound at a time". | OK, but the link is dead. |
| [23] | Tarteel's listing says it doesn't correct tajweed | The current US listing doesn't say this; it now advertises flagging "incorrect tashkeel". Tarteel's blog and other listings say letter-level and tajweed checks are "on our roadmap". | Supported, but dating fast. The conclusion "no one grades tajweed reliably" goes further than one vendor's roadmap can show. Treat it as a reason for care now, not a permanent fact. |
| [28] | Quran.com counts one verse a day for a streak | Confirmed: "Reading at least a verse daily will keep the streaks going." | OK |
| [29] | Quranly has hasanat, a streak and a leaderboard, and reviews ask for a menstruation pause | Hasanat, streak and leaderboard are confirmed. A menstruation request turns up only in a search snippet of one regional review. A design showcase says Quranly **already has a "pause streak" feature**. | The rhetoric in §4 needs softening. Quranly has partly fixed this problem. |
| [31] | 2025 study: points and progress bars raise motivation but not learning | *Computers in Human Behavior* vol. 177 (2026), 166 adults learning **vocabulary**. It also found that practising with gamification first *reduced* later practice once it was removed. | Year is wrong. It supports the argument even more strongly, but it is a vocabulary task. |
| [21] | Yousician "Wait to play" | The page returned 403, so I couldn't verify it. | Unverified |

Also out of date: Duolingo has been replacing hearts with **Energy** since 2025, so the "hearts" row in §4 describes an older design. The argument against blocking learners still holds.

## 2. Does each Must and Should fit this product?

Tajweed is closer to learning a musical instrument or second-language pronunciation than to learning vocabulary. Learners gain the most from these, roughly in order:
1. **Perceptual training.** Hearing the contrast reliably comes before producing it. Training learners to identify sounds across many speakers transfers to their own production (Bradlow et al. 1997; Thomson 2018, review of HVPT).
2. **Slow practice in short chunks, fixing errors on the spot.** This is what set the best piano students apart (Duke, Simmons & Cash 2009).
3. **Feedback the learner controls.** Learners who choose when to get feedback retain more (Chiviacowsky & Wulf 2002). Constant feedback creates dependence (Salmoni, Schmidt & Walter 1984, the "guidance hypothesis").
4. **Shadowing.** It improves comprehensibility and fluency more than accent (Foote & McDonough 2017).
5. **Calibrated self-assessment.** Learners judge their own pronunciation poorly unless they are given criteria (Dlaska & Krekeler 2008).

Gamified wayfinding and paths are about keeping learners coming back, not about learning [31].

| Item | Assessment |
|---|---|
| **M1** Listen-for criterion | **Fits.** It is the cheapest fix for poor self-assessment (Dlaska & Krekeler). But doc 10 §4.2 already shows `Listen for:` from `notice` in Hear, and Notice uses it too. Reuse `notice` in Say and Recite. **Don't add a `listenFor` field now**: 58 lessons in two languages through content review is about 116 authored strings for one maintainer. Effort is S, not M. |
| **M2** Separate replays, 0.75×, loop | **Strongest fit** (feedback the learner controls, slow practice). Spec 09 §3 already promises "slowed, looped on tap" in Hear, and the lessons don't do it yet. That is a spec gap, not a new idea. `playMe` already exists (`src/audio/compare.ts`) and so does `player.setRate(0.75)`. **Drop the long-press**: nobody finds it and it is an accessibility problem. Keep one filled button ("Both") to respect doc 10 rule 3. |
| **M3** Hear a sound within 60 s | Sound in principle, but its value is **for new installs**. The current learner has already onboarded, and decision row 43 has just cut onboarding to 5 steps. Moving the منفصل question to just in time is the real win. Move this to Next. |
| **M4** Continue as the "where am I" card | Helps return visits; little to do with learning. "About 15 min" is a guess that clashes with 03 §8.1 ("ordered, not timed"). Use `Resume at Say · step 4 of 7` and the unit dots, with no minutes. Next. |
| **S1** Rule sheet from every step | Fits for Say, Find and Recite (worked example at hand). **Don't offer it during Check**: an open book removes the retrieval effort that makes Check work (Roediger & Karpicke 2006). The header in doc 10 §3 has no room, so put it as a text button under the instruction. |
| **S2** Break point | Cheap copy, keep it. Drop "~2 min per step", which is unmeasured. |
| **S3** First recording vs now | No learning evidence, and its source is misattributed. It does help motivation. Half built already: `recordings.ts` keeps the last 5 per range (`KEEP = 5`), so the first take gets deleted. What's needed is to pin the first take. Later. |
| **S4** Practise what slipped | Check items already come back through review, and "Look again at" exists. This trains recognition, not recitation. Later. |
| **S5** Test out | M–L effort. It runs against strict order (row 28) and the "only rules you've learned" closing passages. Recognition can't show recitation, which is the point of the course. **Drop.** If needed, use a cheap "I know this, start it in review" per lesson. |
| **S6** Path-style map | Cosmetic, and the Duolingo path drew backlash [7]. Keep only "open at the current lesson" and "collapse finished units" (S). |
| **S7** Shadowing mode | **Already built.** The player has Gap `'same'` (segment ÷ rate + 1 s, `src/audio/player.ts`), on by default for non-muʿallim reciters, plus Loop ×1/3/5/10 and 0.75× (03 §5.7). Also, the doc's "not available offline" is wrong: it works wherever the audio is cached. **Drop.** |
| **C1** Haptics | Conflicts with 03 §1 and has no learning value. Drop. |
| **C4** Send a clip to the teacher | **Under-rated.** The teacher is the only valid judge of recitation, and this is the only proposal that brings expert feedback into the loop. Web Share Level 2 with files works on iOS and Android, needs no backend and costs nothing. Row 33 deferred it only for lack of time. Move to Next. |
| **C5** Session summary | Already specified in doc 10 §4.9. Merge in one line (`Recited ‹passage›`). |

## 3. Gaps the research missed

1. **Minimal-pair perceptual drills across many reciters.** This is the best-supported technique for this domain (HVPT). Today there is one Notice pair per lesson and one discrimination question in Check. The Contrast drill (`#/drill/:pairId`, 03 §5.14) is still a placeholder, and `confusableWith` pairs already exist. Use 2–3 bundled reciters for talker variability.
2. **Chunking and backward build-up for long passages.** Closing passages such as المؤمنون ٩٣–٩٧ are long. Recite needs "Practise in parts": loop one ayah or word group, then build up from the end of the ayah. Hifz teachers already do this, and the word timings support it.
3. **Calibrating self-assessment.** Self-ratings are stored (`source: 'selfrate'`) and teacher corrections exist. Two cheap moves:
   - occasionally replay a contrast clip and ask "Same as the reciter?", which tests the learner's ear;
   - later, show "Your teacher agreed with your self-rating on n of m".

   Without this, M1's `Same / Not yet` tracks how confident the learner feels, not whether they are accurate.
4. **Fading feedback.** Auto-playing "Reciter, then me" after every take is constant guidance. Once a lesson is in review, offer the compare on demand only (guidance hypothesis).
5. **Recitation in review.** Review is recognition-only, apart from corrections. The doc's S4 deepens recognition practice when the gap is retrieval *of recitation*: for example, a due item that says "recite this from the text, then compare". Later, since it is a design change.
6. **Arabic-first UI.** The branch is `arabic` and the learner is an Arabic speaker, yet every proposal is in English copy. The doc never mentions:
   - RTL for the dot row, ⟲ and loop icons;
   - the doubled authoring cost of `ar.json`;
   - the scale in 03 §3.3: Amiri at 17–19px for UI body, Latin-first tokens, and the outdated "no language toggle" decision in 03 §2.1.

   Amiri is a book face. Test a Naskh UI face for small Arabic UI text, and keep Amiri Quran for verses.
7. **Older and lapsed learners.** There is no UI text-size setting (S/M/L scales only Quran text), no check of volume or audio route, and 0.75× is buried in the player. Larger UI text and a lesson-level slow toggle help adult learners most.
8. **Scope risk.** Doc 10 is not built yet. Doc 11 changes doc 10's Say rows, header, done line and bottom bar before they exist. Merge them into one spec now (below), or the maintainer builds twice.

## 4. Final recommendation (one plan, merged with doc 10)

### Now (next build, about 1 week; doc 10 is most of it)
1. **Build doc 10 as specified** (shell, step bar, examples, focus highlight, Learn sections, no colours). It is already agreed and answers real learner feedback.
2. **Say/Recite compare row: `[▶ Reciter] [▶ Me]` plus a primary `▶ Both`** (in place of doc 10 §4.5 row 3). This is feedback the learner controls, and `playMe` already exists.
3. **A `Slower` (0.75×) toggle and a `Loop` text button on the example card and in Recite.** This closes the spec 09 §3 promise of slow and loop in Hear using `player.setRate`. No long-press.
4. **The Say rating prompt shows `Listen for: ‹notice›` (no new field), with buttons `Yes, the same` / `Not yet`.** A named criterion for self-rating; the copy reuses what is already there.
5. **The doc 10 done screen adds `Recited ‹passage›`. Close says `Your place is saved`, and the Learn done line mentions pausing.** Cheap copy that shows natural break points.
6. **Arabic strings for all of the above go in `learn.json` and are checked at 375px in RTL.** The branch's main user reads Arabic.

### Next
1. **Contrast drill (03 §5.14) built from `confusableWith`, with examples from 2–3 reciters.** It is the best-evidenced technique, and the route and pairs already exist.
2. **Recite: "Practise in parts" (loop one ayah, build up backwards).** Long closing passages need chunking.
3. **Send a clip to the teacher via the Web Share API, no backend.** It is the only real recitation feedback, and it costs nothing.
4. **A rule sheet from Say, Find and Recite (not Check).** It gives a worked example and keeps retrieval in Check.
5. **Continue card: unit dots plus `Resume at ‹step›`, at most 3 cards.** Wayfinding with no made-up minutes.
6. **Ask the منفصل 4-or-5 question at the start of its own lesson. Onboarding ends on lesson 1's Hear step.** Practical first, for new installs.
7. **UI text-size setting and a Naskh UI face test for Arabic.** For older learners and Arabic-first reading.

### Later
1. **Calibration catch trials and "teacher agreed with your self-rating n of m".** Needs teacher data to build up first.
2. **Pin the first Say take, and play "first vs now" at the finale.** Motivation only, and storage is already in place.
3. **Course map that opens at the current lesson and collapses finished units.** Small comfort.
4. **Recite-from-text items in review.** Retrieval of recitation; it needs a review design.
5. **"Practise what slipped".** Mostly redundant with review.
6. **An optional niyyah line, off by default, after asking the learner.** It suits the Islamic context but risks feeling preachy.
7. **Days-a-week goal and an `.ics` reminder.** "Days studied" already covers most of it.

### Drop
1. **S7 shadowing mode.** Already built (Gap, Loop and 0.75× in the player).
2. **S5 test-out.** Large, breaks the "only rules you've learned" guarantee, and can't test recitation.
3. **A `listenFor` field in the content.** `notice` already does the job, and the field doubles authoring in two languages.
4. **"~2 min per step" and "About 15 min".** Unmeasured; 03 §8.1 says ordered, not timed.
5. **C1 haptics.** Conflicts with 03 §1.
6. **Long-press to loop.** Hard to discover and inaccessible.

**Fix in doc 11 before anyone cites it:**
- the sources for lesson length [5] and [9];
- the Babbel pattern and review complaints [10];
- the source for S3 [18];
- the study year [31];
- Busuu's AI feedback [16];
- the Quranly framing [29];
- S7 "not offline".

## References (learning science)
- Bradlow, Pisoni, Akahane-Yamada & Tohkura (1997). Training Japanese listeners to identify English /r/ and /l/: IV. *JASA* 101(4).
- Thomson (2018). High Variability [Pronunciation] Training (HVPT). *Journal of Second Language Pronunciation* 4(2).
- Duke, Simmons & Cash (2009). It's not how much; it's how. *Journal of Research in Music Education* 56(4).
- Chiviacowsky & Wulf (2002). Self-controlled feedback: does it enhance learning because performers get feedback when they need it? *Research Quarterly for Exercise and Sport* 73(4).
- Salmoni, Schmidt & Walter (1984). Knowledge of results and motor learning. *Psychological Bulletin* 95(3).
- Foote & McDonough (2017). Using shadowing with mobile technology to improve L2 pronunciation. *Journal of Second Language Pronunciation* 3(1).
- Dlaska & Krekeler (2008). Self-assessment of pronunciation. *System* 36(4).
- Roediger & Karpicke (2006). Test-enhanced learning. *Psychological Science* 17(3).
