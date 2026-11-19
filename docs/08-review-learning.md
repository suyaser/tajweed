# Tajweed Path · learning-effectiveness review (R1)

Reviewer stance: independent and critical. The question is whether this app makes an Arabic-speaking adult beginner (about 40 minutes a day, phone first, one online teacher session a week) recite better, and whether what it shows them is true. Read: `02-product-spec.md`, `03-design.md` §5 and §8, `src/core/{scheduler,questions,store}.ts`, `src/content/index.ts`, `content/*.json` and the study, teacher, plan, progress and onboarding screens. No browser was used.

Evidence comes from code (file:line) and from a simulation that drives the real `buildQueue`, `rebuildItems`, `applyAttempt`, `makeQuestion` and `levelOf` (script kept outside the repo, in the session scratchpad, `sim/sim.ts`, run with `npx vite-node`).

## Verdict in one paragraph

The architecture is right: a test-first سبق, a predictable سبقي/منزل ladder, teacher corrections fed back into review, a soft milestone gate, no streaks, and an honest split between recognition and recitation on Progress. The execution undermines it in two places. First, **during each rule's first 8 days, the quiz can be answered without reading the ayah**, and those answers decide graduation and levels. "Strong" then reaches half the rules even for a learner who gets 30% wrong. Second, **recitation leaves no trace in the data**: recording never completes the recite part, never counts as a study day on Today, and never feeds the schedule. Everything the app counts and celebrates is multiple choice. Intake also runs at one lesson a day, gated only by the quiz backlog, so it gets well ahead of the 16-week plan and then stalls for about 6 weeks on the جزء عمّ milestone.

---

## Findings

### Blocker

**B1. Answers leak during the first week, which inflates graduation.**
- *Learn check is a recall of what you just read, not a discrimination.* Check questions are always about the lesson just studied, and the distractors are drawn only from rules introduced earlier (`questions.ts` `distractors`; `Learn.tsx` `build`). The correct option is the one new name on screen. In the simulation it was the only not-yet-introduced option in **64 of 70** identify checks. The pretest has the same giveaway (the one unfamiliar name), which weakens the pretesting effect the spec cites in F2.
- *The سبقي eyebrow names the answer.* `Review.tsx:140–141` shows `سبقي · day N` above the question. At one lesson a day, "day 3" means the lesson learned three days ago.
- *The order names the answer.* The queue is `[...sabqi, ...manzil]` in insertion order (`Review.tsx:28`, `scheduler.ts:136`). `spread` only moves corrections, so the سبقي block comes in the same order every day.
- *Effect.* `sabqiCorrect ≥ 4` plus a correct last answer sends the item straight to step 2, a 7-day interval and the "known" level (`scheduler.ts:52–53`), on answers that did not need the ayah.

**Fix (small).**
1. Drop "day N" from the eyebrow; show just `سبقي`.
2. Shuffle the review entries (seeded), keep جلي corrections first, then run `spread`.
3. In Learn step 3, make one of the two checks a discrimination question: an example of a confusable or same-topic rule that is already introduced, with the new rule among the options. In the pretest, add one same-topic rule that is not yet introduced, so "the unfamiliar name" stops being the answer.

### Major

**M1. "Strong" and S3 are inflated: a weak learner looks strong.**
Path to "strong": introduced on day 0, سبقي from day 1 to day 7, graduates on day 7 to step 2, one correct answer on day 14 gives step 3, and with no wrong answer in 30 days `levelOf` returns `strong` (`scheduler.ts:190–198`). In the simulation the earliest "strong" came **14 days** after introduction and after **7** scheduled answers (median 35 days and 9 answers). A learner at **70%** accuracy still ended day 120 with **23–27 of 49 rules "strong"**, and **32–39 of 49** at step ≥ 3, which nearly meets S3. At 14- and 30-day intervals, "no lapse in 30 days" checks only one or two answers.
**Fix.** Graduate سبقي to step 1, not 2. Define strong as step ≥ 4 (a 30-day interval) **and** the last 3 manzil answers correct on 3 different examples, with at least one length or discrimination question where one exists. Change S3 to match.

**M2. Recitation is not recorded, so the app rewards only the quiz.**
- The recite part never completes on its own. Spec F1 says it should be marked done once at least one recording is saved, but nothing outside Today's hand tick ever calls `markDayPart('recite')`, and `Listen.tsx` `startRecording` saves the blob without logging anything. As a result, "Your wird is done" needs a hand tick on most days.
- Today's week dots count a day only for سبق or review (`study/helpers.ts:42`). A 40-minute day of listening and reciting with nothing due counts as **not studied** on Today, while Progress counts it (`path/helpers.ts:124`). This is a quiet guilt mechanic, and it falls on exactly the days the learner spent on what matters most. The simulation had up to 5 such days in 104 study days, all during the milestone waits, when nothing is due and there is no new lesson.
- Recite targets are `lesson.examples[0]` of today's lesson only (`Today.tsx`), so a rule's recitation practice disappears the day after it is taught. In the tradition, the سبقي *is* reciting the recent portion. Here it is only a quiz.

**Fix.** Saving a recording marks `recite: 'auto'` and adds a `DayLog.recordings` count. Count listen and recite days as studied, using the same rule as Progress. Build the recite targets as today's rule plus one example ayah for each rule still in سبقي (rotate through examples, at most 3), plus any due corrections. Show "recordings this week" next to the quiz numbers on Progress.

**M3. Phase 2 (مخارج and صفات, 4 planned weeks) is text multiple choice with nothing to say aloud.**
All 11 phase-2 lessons have **0 examples** and 6–7 fact questions each. Learn therefore skips Apply (`Learn.tsx:74–76, 136`), Today has no recite target for the lesson, and the card has nothing to play. The spec's phase-2 milestone includes **the letter drill (أَبْ، أَتْ، …)** (spec F7 table), but `content/index.ts:92` dropped it. Fact options are never shuffled (`questions.ts:99`): **45–66%** of fact questions asked in the simulation were repeats with the same option order, so the learner can memorise the position or the string. This is the phase where the app's تلقي tools could help the most, and it is the phase where they are not used at all.
**Fix.** Shuffle the fact options and remap `answer`. Add the letter drill back to the phase-2 milestone, and add a "letter drill" recite target: each letter's lesson gets 3–5 Quran words with that letter sākin, which are playable with the existing word timings (`playWord`), and the learner does listen, record, then "model, then me". Add 2–3 such example words to each مخرج lesson so Apply is not skipped.

**M4. Pacing ignores the plan, then stalls on the milestone.**
At one new lesson a day, gated only by a backlog of 15 or fewer (`scheduler.ts` `buildQueue`), phases 2–4 (39 lessons) were all introduced by **weeks 6–9**, against the plan's weeks 3–13. Phase 3 began in **weeks 3–5**, against the plan's week 7, so the R2 "needed by week 7" deadline for mutun and the analyser is already late. Then the 6-passage phase-4 milestone (all of جزء عمّ), at one weekly online session, gave **no new lesson for 40 days** (weeks 9–13, which include the 10-day break, so about 30 study days). In that time Today's سبق slot shows only "Phase milestone pending", and the soft gate appears after 14 days. Up to 7 rules of one family sit in سبقي together while recitation of the first one has not been heard by the teacher. The tradition advances the سبق when the previous portion is sound. Here it advances whenever the quiz backlog is short.
**Fix.** Cap introductions per week at about `ceil(phase lessons / phase weeks)` (roughly 3–4 a week). On non-lesson days, give the سبق slot to "repeat the سبق": the newest rule's examples in the player, then record. Let the next phase become `active` once half of a multi-passage milestone has passed. The remaining passages stay on every session plan, which is the same mechanism as `skipped`.

**M5. Feedback is mostly the generic definition, not the deciding reason.**
Only **25 of 269** examples have a `note`, so about 91% of identify feedback is `lesson.summary` (`questions.ts:123`). Design §8.2 asks for "the decisive thing". "Hear it" plays the whole ayah whenever the example spans two words (`verse.tsx:35`), which is most نون and ميم examples.
**Fix.** Generate the reason from the data for the topics where it is mechanical: the letter after نْ, تنوين or مْ, sun or moon letter after ال, a qalqalah letter with sukoon, and the madd cause from `counts`. For example: "نْ then **ق** → الإخفاء (ق is one of the 15)". Author notes only for the rest. Play the word range from the timings instead of the whole ayah.

**M6. Practice is blocked by topic, not interleaved.**
Choosing confusable partners as distractors is good. But a phase introduces one topic at a time and the سبقي block comes in a fixed order, so a review session is mostly one topic. The only contrast work is the distractor list, because contrast drills are R2 (F12), even though the simulation introduced the whole نون and ميم family in 2 weeks. After a confusion, the relearn re-asks the *same* rule (`Review.tsx` relearn) instead of contrasting the two.
**Fix.** Shuffle the queue (B1). When a wrong answer picks a confusable partner, make the relearn a pair: one example of the chosen rule and one of the correct rule, each with the pair's hint. This brings a minimal F12 into R1 at almost no cost.

### Minor

- **m1.** الإمالة and الإشمام have 1 example each, and each occurs only once in Hafs, so the identify question is the same verse every time (7–8 times identical in the simulation). Make them fact and listen lessons.
- **m2.** A correction linked to a lesson still in سبقي does not affect its graduation (`resetLinkedLessons` skips sabqi), so it can still graduate to step 2. Count a correction as a wrong سبقي answer.
- **m3.** Learn introduces the lesson even after 0 of 2 correct checks. That is fine, because سبقي is daily, but on 0/2 show the card's deciding reason again before "in your سبقي".
- **m4.** `suggestPassages` leaves out spec F6 item 3, "the passage worked on since the last session", so session plans are only milestone passages and corrections. Add the recite targets from the last 7 days.
- **m5.** Phase 1 contains one lesson, الابتداء وهمزة الوصل, which does not match its goal (الفاتحة, الحركات, جلي and خفي). Move it to phase 5, and give phase 1 a fact lesson on اللحن الجلي and الخفي, which the correction logging depends on.
- **m6.** The review part is about 3–4 minutes (mean 7.6 items) against 5′. Load is not a problem. The spare minutes are better spent on M2's سبقي recitation than on "10 more".

### What is already right (keep it)

There is no streak, "Not today" carries no penalty, and the welcome-back message is calm: after the 10-day break the simulation showed 18–22 items due and "1–2 days" to catch up, and it was accurate. Correction items require listen → record → compare before the self-rating, and self-ratings are capped. Progress separates the quiz from the teacher and says "only your teacher can tell you if you recite it". The ijazah disclaimer is clear. Teacher logging is fast, and its re-check loop closes.

---

## Simulation summary

Model: 120 days. One learner who studies every day except days 12, 26, 41, 55, 97 and 104, plus a 10-day break (days 70–79). Quiz accuracy 85% (and 70% as a stress case). Self-rating "applied the fix" 70%. One weekly teacher session (none during the break) that re-checks each open correction (60% resolved), logs 1–3 new corrections (30% جلي, 70% tagged to a recent rule) and hears up to 2 pending milestone passages (70% pass each). The learner takes the سبق whenever it is offered and finishes the whole review queue. Seeds 7, 11, 23 and 42.

| Measure | 85% accuracy | 70% accuracy |
|---|---|---|
| Review items per study day (lessons + corrections + relearns) | mean 7.3–7.6, median 7–8, p90 12–14, max 17–24 | mean 10.0–12.0, p90 16–20, max 26–28 |
| Phase-3 lessons start (plan: week 7) | weeks 3–5 | weeks 3–5 |
| Phase-4 lessons introduced (plan: weeks 10–13) | weeks 5–8 | weeks 5–9 |
| Phase-5 lessons introduced (plan: weeks 14–16) | weeks 10–15 | weeks 12–16 |
| Longest stretch with no new lesson | 40 days (waiting for the phase-4 milestone, which spans the break) | similar |
| Learn checks where the answer was the only not-yet-introduced option | 64 / 70 | 64 / 70 |
| Question kinds (identify / fact / length) | about 60% / 27% / 12% | similar |
| Same example as the previous time for that lesson | 1.3–3.5% | 1.9–2.8% |
| Example among the last 3 for that lesson | 23–28% | 24–28% |
| Most repeats of one example (max over lessons) | 8 (الإمالة / الإشمام: 1 example) | — |
| Fact questions that repeat an earlier one with the same option order | 45–56% | 53–66% |
| Days from introduction to first "strong" | min 14, median 34–36 | min 14, median 38–42 |
| Scheduled answers before first "strong" | min 7, median 8–9 | min 7, median 10–13 |
| "Strong" at day 120 (of 49) | 35–40 | 23–27 |
| Step ≥ 3 at day 120 (spec S3) | 41–47 / 49 | 32–39 / 49 |
| Welcome back after the 10-day break | 18–22 due, "1–2 days", accurate | — |

Reading the table: the daily load is light and the backlog handling works. The problems are (1) "strong" separates an 85% learner from a 70% learner only weakly, (2) intake runs far ahead of the plan and then stops for weeks, and (3) the first-week checks measure recency, not recognition.

---

## The 3 highest-leverage changes

1. **Make the quiz honest (B1 + M1), about 30 lines.** Remove "day N", shuffle the session, make one Learn check a discrimination question, graduate سبقي to step 1, and define strong as step ≥ 4 with 3 consecutive correct answers on different examples. Every number the learner sees depends on this.
2. **Make recitation the unit of daily progress (M2 + M3).** A recording completes the recite part and counts the day. The recite list holds today's rule plus one ayah for each سبقي rule, which is the traditional سبقي, recited. Phase 2 gets the letter drill and playable word examples. Fact options get shuffled.
3. **Pace by the plan, not the backlog (M4).** Introduce about 3–4 lessons a week, use the free سبق days to repeat the newest rule aloud, and let the next phase start after half of a long milestone. This keeps reciting in step with knowing, and it removes the 40-day gap with no new lesson.
