# Tajweed Path · product spec

Status: draft for review (stage 2). Follows `00-decisions.md`: static Vite + React + TypeScript app, hash routes, `localStorage` store, recordings in IndexedDB, optional Supabase sync later, no automatic grading of recitation.
Source content: `reference/artifact-v3.html` (6 phases, 40 rule cards in 11 topics, mind map, quiz, resources).
Data sources: reconciled with `01-api-research.md` and the updated "Content sources" in `00-decisions.md`. In short, there is no Quran Foundation API in v1. The app bundles the Tanzil Uthmani text, cpfair/quran-tajweed markup and cpfair/quran-align word timings, and streams ayah audio from everyayah.com. The points still unverified are listed in §8.3.

---

## 1. Problem

The learner is an Arabic-speaking adult starting tajweed (رواية حفص عن عاصم، طريق الشاطبية). They have watched a 6-episode intro course (م. علاء حامد), study every day, use a phone and a laptop, and plan to study with a teacher. They prefer Arabic terms (no transliteration) and are happy with English explanations.

The current artifact is a good **reference**: it explains each rule and gives examples. As a **learning tool** it falls short:

| Gap in the artifact | Effect |
|---|---|
| Progress is a self-ticked "أتقنته" checkbox. | Ticks show what the learner *feels*, not what they can do. Rules ticked in week 3 are forgotten by week 10 and nothing notices. |
| The quiz is random, has no memory and ~3 examples per rule. | No spacing. After a few rounds the learner recognises the *verse*, not the *rule*. |
| Examples are hand-typed text that links out to Quran.com. | The learner cannot hear the example on the page, loop it or record themselves. The text is not the canonical Uthmani text of the muṣḥaf. |
| The teacher is mentioned as a principle only. | The most valuable feedback the learner gets (the teacher's corrections) goes into a notebook and never comes back into practice. |
| The plan is a checklist of tasks. | Nothing says what to do *today*, and no phase ends with a check by the teacher. |

### 1.1 Jobs to be done

1. **"Tell me what to do today, in about 40 minutes, so I don't have to plan."** (the daily wird)
2. **"Help me remember every rule I've learned, without reviewing everything every day."** (spaced review)
3. **"Let me hear the correct recitation, copy it, and hear myself next to it."** (التلقي on my own between lessons)
4. **"Make the most of my teacher: know what to recite, keep every correction, and practise it until it's fixed."** (العرض على الشيخ)
5. **"Show me honestly where I stand and what's next."** (phases, milestones, progress)
6. Later: **"Help me memorise the mutun that hold the rules."** (تحفة الأطفال، الجزرية)
7. Later: **"Train my eye to spot rules in any page of the muṣḥaf."** (ayah analyser)

### 1.2 What success looks like after 16 weeks

All numbers are computed **in the app, on the device**, from the learner's own data (Progress screen, §5). There is no analytics backend.

| # | Measure | Target at week 16 | Source in data |
|---|---|---|---|
| S1 | Phase milestones confirmed by the teacher | Phases 1–4 passed; phase 5 passed or scheduled | `PhaseProgress.status = passed` |
| S2 | Clear errors (اللحن الجلي) on the milestone passages | 0 جلي corrections on the last milestone session | `Correction.severity` per session |
| S3 | Rule recognition | Every quizzable rule of phases 1–5 has reached a 14-day interval (step ≥ 3), and accuracy on منزل reviews in weeks 15–16 is ≥ 90% | `ReviewItem.step`, `Attempt.correct` |
| S4 | Corrections that stick | ≥ 80% of خفي corrections logged before week 14 are resolved by the teacher and not logged again on the same rule within 4 weeks | `Correction.status`, `ruleIds` |
| S5 | Consistency | Studied ≥ 5 days a week in at least 12 of the 16 weeks | `DayLog` |
| S6 | Teacher contact | ≥ 12 teacher sessions logged | `Session` count |

S3 measures **recognition** only. Only S1, S2 and S4 measure **recitation**, and they come from the teacher. The app must never present S3 as "you recite correctly".

---

## 2. The core daily loop

The learner opens **Today** at their fixed wird time. Today is the artifact's 40-minute routine made concrete. It starts with **listen and repeat** (10′) on the passage they are working on, in the تلقي player (model reciter, loop, a pause to repeat after each ayah). Then the **سبق** (10′): one new lesson, taught test-first (guess on two examples, read the card, check on two new examples). Then **recite and record** (15′) a short passage that uses today's rule and any open teacher corrections, comparing each recording with the reciter. It ends with **review** (5′): the **سبقي** (every lesson introduced in the last 7 days) and the **منزل** (older lessons and teacher corrections that are due). Every review answer moves that item along the schedule. After each teacher session the learner logs the corrections, tagged جلي or خفي and linked to rules. Each correction becomes a review item, and its rules are sent back to tomorrow's review. The next session's plan lists the open corrections, so the teacher re-checks them. When the teacher confirms a phase's milestone passage, the next phase's lessons start to appear in the سبق slot.

```
 Today ─► listen & repeat ─► سبق (learn) ─► recite & record ─► review (سبقي + منزل)
   ▲                                                              │ answers move the schedule
   │                                                              ▼
   └──── corrections due tomorrow ◄── teacher session log ◄── session plan (open corrections, milestone)
```

---

## 3. Releases at a glance

| Release | Goal | Needed by | Features |
|---|---|---|---|
| **R1 · MVP** | The daily loop works fully offline-first, signed out, on one device. | Before the learner leaves phase 1 (≈ week 2) | F1 Today · F2 Learn (سبق, test-first) · F3 Review and scheduler (سبقي · منزل) · F4 Rule library · F5 Listen · repeat · record · F6 Teacher sessions · F7 Plan and milestones · F8 Progress · F9 Install, offline, backup, reminder |
| **R2** | Apply rules to real pages and memorise the mutun. Needs content work first: our annotations for the rules the markup leaves out (C8) and the matn verification (C7). | Before phase 3 (week 7), which starts تحفة الأطفال and "find 10 examples in جزء عمّ" | F10 Ayah analyser (جزء عمّ) · F11 Mutun and memorise mode · F12 Contrast drills · F13 Offline audio pack |
| **R3** | More than one device, and the teacher in the loop directly. | When the learner needs it (see the note on two devices) | F14 Supabase sync · F15 Teacher page · F16 Push reminder · F17 Khatma tracker (phase 6) |

**The two-device tension.** The learner uses a phone and a laptop, but sync is stage 3 in `00-decisions.md`. In R1 the **phone is the primary device**: all scheduling, recording and the teacher log happen there. The laptop works for reading cards and, in R2, the analyser. Data moves between devices only by export and import (F9). If the split hurts in practice, move F14 up ahead of F12–F13. It is the only R3 item that might be needed earlier.

---

## 4. Features

Each feature lists its purpose, a user story, testable acceptance criteria (AC), and the learning principle behind it. Principles are named honestly: *Islamic method* means established practice in Quran teaching; *research* gives the main source and how far it applies here.

### R1 — MVP

#### F1 · Today (الورد اليومي)

**Purpose.** One screen that says what to do today and in what order, so the learner never has to plan.

**User story.** As a learner opening the app at my wird time, I see today's four parts with the specific passage, lesson and number of reviews, and I can work through them top to bottom.

**AC**
- Shows four parts in this order, with the artifact's default times: **الاستماع والترديد** 10′, **السبق** 10′, **التلاوة والتسجيل** 15′, **المراجعة** 5′.
- *Listen and repeat* opens F5 on the **current passage**: the active milestone passage, or the surah of today's lesson examples if there is none.
- *سبق* shows the name of today's new lesson, or one of these reasons why there is none: "phase milestone pending", "review backlog first", "phase complete, prepare the milestone", "already learned one today". The learner can tap "not today" to skip the lesson without any penalty.
- *Recite and record* lists 1–3 short targets: an example ayah of today's lesson plus the ayat of open corrections that are due. Each one opens F5.
- *Review* shows separate counts for سبقي and منزل, with جلي corrections flagged. One tap starts F3.
- A part is marked done when its action happened: audio played ≥ 3 minutes, lesson finished, ≥ 1 recording saved, review queue empty. The learner can also tick a part by hand (for example after reciting from a paper muṣḥaf). Hand ticks are stored as `manual`.
- Shows **days studied this week (x/7)** and this month. A day counts as studied if the review part or the سبق part is done. There is **no streak counter** (see §9).
- If the teacher session in the plan is today or tomorrow, shows a card that opens the session sheet (F6).
- Works with no network: if audio is not cached, the audio parts say so and still let the learner tick them by hand.
- The day starts at **03:00 local time**, so studying after midnight counts for the evening before.

**Principle.** *Islamic method:* قليل دائم ("أحبّ الأعمال إلى الله أدومها وإن قلّ", Bukhari and Muslim), and a fixed daily wird. *Research:* habit formation through a fixed cue and time (Lally et al., 2010). The same study also found that missing a single day did not significantly set habit formation back, which is why there is no streak.

#### F2 · Learn a new lesson (السبق, test first)

**Purpose.** Introduce one lesson in about 10 minutes and enter it into review.

**User story.** As a learner, when I start today's lesson I first guess on two examples, then read the card and listen, then answer two more. From tomorrow the lesson is part of my سبقي.

**AC**
- **Step 1, pretest.** 2 questions on the new rule: identify-the-rule questions (§6.4) whose options mix the new rule with rules already introduced. The screen says: "You haven't learned this yet — guess. Guessing first helps you remember." Answers are logged with `source=pretest` and do not affect the schedule.
- **Step 2, card.** The F4 card for the rule. Every example has a play button for its ayah, with the highlighted words shown in the canonical Uthmani text.
- **Step 3, check.** 2 questions on examples that were **not** used in steps 1–2, logged with `source=learn`. A wrong answer shows the explanation and the correct highlighted part.
- **Step 4, apply.** Opens F5 on one example ayah. It can be skipped.
- Finishing step 3 **introduces** the lesson: it creates or updates its `ReviewItem` (`state=sabqi`, `introducedOn=today`).
- Lessons are taken in phase order. A phase's lessons appear only when that phase is active (F7).
- Fact lessons (مخارج, صفات, الوقف, الابتداء) use fact questions in steps 1 and 3 instead of identify-the-rule questions.
- The learner can open any lesson in the library (F4) at any time. Reading a card does **not** introduce it; only F2 does. This keeps the review schedule honest.

**Principle.** *Research:* pretesting. Trying to answer before studying improves later recall, even when the guesses are wrong (Richland, Kornell & Kao, 2009; Kornell, Hays & Bjork, 2009). The evidence comes mostly from text and word-pair studies, so expect a modest gain, not a large one. Retrieval right after study (the check) is the testing effect (Roediger & Karpicke, 2006). *Islamic method:* the سبق, a fixed small new portion each day.

#### F3 · Review and the scheduler (سبقي · منزل)

**Purpose.** Bring every learned lesson and every teacher correction back at the right time, decided by answers, not by self-ticks.

**User story.** As a learner I do one short review session a day. Things I got wrong come back tomorrow, and things I know come back less and less often.

**AC**
- The queue follows §6 exactly: what is due, the caps, the order, and what each answer does to the schedule.
- One question per item. The example must differ from the one used the last time this item was reviewed.
- After a wrong answer: show the explanation, play the ayah, and offer "open card". The item is asked **once more** at the end of the session on a different example. That second answer is logged with `source=relearn` and does not change the schedule again.
- Correction items show the ayah with the corrected word highlighted and the teacher's note. They ask the learner to listen (one loop), record, compare, then rate **"applied the fix" / "not yet"**. The screen labels this as a self-rating.
- The session can be stopped at any point. Finished answers are kept, and unanswered items stay due.
- The end screen shows: number reviewed, number correct, which rules to look at again, and the next day each rule is due.
- Every answer is written to `Attempt` before the next question is shown, so a crash cannot lose it.
- A Vitest suite covers every scheduler rule in §6, including missed days and the caps.

**Principle.** *Islamic method:* سبق · سبقي · منزل, the review cycle of the hifz tradition (it is strongest in South Asian madrasas and widely copied). There it is used for memorising Quran text. Using it for *rules* is our adaptation, not a traditional practice. *Research:* the spacing effect (Cepeda et al., 2006, meta-analysis) and retrieval practice (Roediger & Karpicke, 2006). The interval ladder is a simple Leitner-style system (Leitner, 1972). It is not optimised the way FSRS or SM-2 are. We chose it because the learner can predict it, and because at about 50 items an optimiser saves very little.

#### F4 · Rule library (الأحكام), carried over

**Purpose.** The artifact's reference content, improved with real verse text, audio and measured levels.

**User story.** As a learner I can browse every topic and rule, search in Arabic or English, open a card, hear its examples, and see how well I know it.

**AC**
- Carries over the 11 topics, 40 rule cards, the letter tiles, the beat diagrams for counts, the "next letter is…" chooser, the madd lengths table, the colour legend and the mind map (RTL tree; vertical list on phones).
- Phase 2 content is split into teachable lessons (§8.1): about 6 مخارج lessons and 5 صفات lessons replace the two large cards. The library therefore has about **49 lessons**.
- Example text comes from the bundled Uthmani text (§8.2), not hand-typed strings. Highlights are word ranges.
- Every example has an inline play button for the ayah. Tapping the reference opens F5 for that ayah. The only link out is a small "open on Quran.com" link in F5.
- The self-ticked **"أتقنته" checkbox is removed**. Each card and mind-map leaf shows a measured level instead (§6.6): `not started · learning (سبقي) · known · strong`.
- A card shows its content review status (`draft` / `reviewed by <teacher>, <date>`, §8.1). Cards still in `draft` say so plainly.
- Search matches the Arabic name with or without diacritics, the English name and the letters.
- The **Resources** page carries over as is, with the links updated.

**Principle.** Reference and explanation; nothing here claims to teach by itself. The colour scheme matches مصحف التجويد (دار المعرفة), so the eye learns one system.

#### F5 · Listen · repeat · record (التلقي)

**Purpose.** Hear the model reciter, repeat after them, record yourself and compare. It is the closest the learner gets to تلقي between lessons.

**User story.** As a learner I pick an ayah or a short range. I loop it slowly with a pause after each ayah so I can repeat. Then I record myself and play the reciter and my recording one after the other.

**AC**
- Opens on `#/listen/<from>[-<to>]` (for example `#/listen/93:1-93:5`), from cards, Today, review and the teacher log.
- Shows the Uthmani text of the range, with the current ayah highlighted while it plays.
- Controls: play/pause; speed **0.75× / 1×** (pitch kept, through `preservesPitch`); loop the range **1 / 3 / 5 / 10** times; **repeat gap** on or off. With the gap on, playback pauses after each ayah for that ayah's own length plus 1 second, so the learner can repeat (the way المصحف المعلّم works).
- Uses one model reciter, set in Settings, from the three on everyayah.com: **الحصري المعلّم** (default, made for repeating after), الحصري مرتل, المنشاوي مرتل. Audio files follow the pattern `{folder}/SSSAAA.mp3`.
- The repeat gap is off by default for الحصري المعلّم if its files already leave a pause for the listener to repeat (verify, §8.3 U4), and on by default for the murattal reciters.
- **Record:** one button to start and stop. The first time, the app asks for the microphone and explains that recordings stay on this device. If the learner refuses, the player keeps working without recording.
- **Compare:** "model, then me" plays the reciter's ayah and then the latest recording; "me" plays the recording alone. The list shows recordings for this range with date and length.
- Keeps the last 5 recordings per range and deletes older ones automatically. Settings shows the total storage used and has "delete all recordings".
- Recordings never leave the device: they are not uploaded and not included in sync. They are left out of export by default, and the export can include them.
- Audio that has been played once is cached by the service worker (for up to 7 days, §8.2) and plays offline during that time. When audio is not cached and there is no network, the screen shows the text and the message "audio needs a connection".
- Works on iOS Safari 17+ (MediaRecorder with mp4/AAC), Chrome Android and desktop Chrome, Safari and Firefox (verify, §8.3 U5).
- **No** score, waveform comparison or pitch overlay (§9).

**Principle.** *Islamic method:* التلقي والمشافهة. Repeating after a model reciter is how recitation has always been passed on, and المصحف المعلّم is its recorded form. The app supports التلقي; it does not replace the teacher. *Research:* evidence that recording yourself improves pronunciation is modest and mixed (L2 pronunciation studies). The benefit depends on careful listening against a model, which is why compare is "model, then me" and not a meter.

#### F6 · Teacher sessions (العرض على الشيخ)

**Purpose.** Plan each session, log the corrections fast, and feed them back into daily practice until the teacher confirms they're fixed.

**User story.** Before class I see what to recite and which old corrections to ask about. During or after class I log each correction in a few taps. From the next day those corrections and their rules come back in my review.

**AC**
- **Session plan** (`#/teacher/new`): date, teacher name (remembered), and passages to recite. Passages are suggested automatically in this order:
  1. the active milestone passage, if the phase's lessons are finished;
  2. ayat with **open** corrections ("ask the teacher to re-check");
  3. the passage worked on since the last session.
  The learner can add or remove passages. The plan is saved before class.
- **Session sheet:** a read-only view for the phone during class. It shows the passages in large Uthmani text and the open corrections listed under them.
- **Log a correction** (on the session sheet or afterwards): pick the ayah (it defaults to the passage being recited), tap a word in the ayah, choose **جلي / خفي**, choose 1–2 rules (searchable picker; the rules introduced most recently come first), and optionally add a short note. A correction with only an ayah and a severity can be saved in **≤ 4 taps** after the ayah is open.
- "Other / not a rule" is allowed for corrections such as a wrong vowel (لحن جلي that isn't a tajweed rule). These still become review items.
- **Re-check:** each open correction on the sheet has two buttons, "teacher: correct now" and "still wrong". "Correct now" resolves it (`status=resolved`, `resolvedInSessionId`). "Still wrong" counts as a new lapse (§6.5).
- **Milestone result:** when a milestone passage was recited, the session records the result for each passage: **passed / not yet** (F7).
- Saving the session makes the scheduler changes in §6.5 right away. The learner sees what changed: "3 corrections added to review; إخفاء and المد المتصل will come back tomorrow".
- History (`#/teacher`): a list of sessions with the number of جلي and خفي corrections each, a filter for open corrections, and each correction linked to its ayah in F5.
- Works fully offline.

**Principle.** *Islamic method:* العرض على الشيخ, reciting to a qualified teacher, the only reliable judge of recitation. The split into اللحن الجلي and اللحن الخفي is the standard classification in tajweed works and sets the priority: clear errors first. *Research:* deliberate practice, meaning practice aimed at specific weaknesses with expert feedback (Ericsson, Krampe & Tesch-Römer, 1993). The app's part is to make sure feedback is not lost between sessions.

#### F7 · Plan and phase milestones (عرض المرحلة)

**Purpose.** The artifact's six phases, each ending with a set passage recited to the teacher. The next phase's lessons unlock when the teacher confirms.

**User story.** As a learner I see which phase I'm in, what's left, and what passage I must recite to my teacher to finish it.

**AC**
- Shows the six phases from the artifact, with weeks, goal, lessons, "done when" and tasks. Each phase has status `locked · active · milestone · passed · skipped`.
- Each phase has a fixed **milestone**: a list of passages, each tracked separately (passed / not yet). The default list is below. The learner can edit it only to match what the teacher asks for.

  | Phase | Milestone passages |
  |---|---|
  | 1 التأسيس | الفاتحة |
  | 2 المخارج والصفات | The letter drill (each letter with سكون after a همزة: أَبْ، أَتْ، …) · الفاتحة again · الإخلاص to الناس |
  | 3 النون والميم والغنة | الضحى to الناس |
  | 4 المد والقلقلة والتفخيم | جزء عمّ, in parts across several sessions (one passage per group of surahs; about 6 groups) |
  | 5 الوصل والوقف | الملك |
  | 6 الإتقان | none in R1 (khatma tracker in R3, F17) |

- A phase becomes `milestone` when all its lessons are introduced. From then, Today's سبق slot says "prepare the milestone" and points F5 at the milestone passages.
- When **all** passages are marked passed in a session log, the phase becomes `passed` and the next phase becomes `active`.
- **Soft gate.** The learner can "continue without the milestone" and must give a short reason (for example "teacher away"). The phase is then marked `skipped`, the milestone stays in every session plan until it is passed, and Progress shows skipped phases. Once a phase has been `milestone` for 14 days, Today offers this option.
- Phase tasks from the artifact (for example "watch the 6 episodes") stay as checkboxes. They are informational and do not count toward mastery.
- During onboarding the learner says the intro course is done, so phase 1's episode tasks are pre-ticked.
- The wording never says "إجازة". The screen says: "This is a milestone check, not an ijazah. An ijazah is given by a teacher with a sanad after a full khatma."

**Principle.** *Islamic method:* reciting a portion to the teacher before moving on (العرض), in the spirit of how الإجازة is earned, but much smaller and without any claim to it. *Research:* mastery learning (Bloom, 1968): move on when a criterion is met, not when time passes. We made the gate soft because a teacher's schedule should not stop daily practice.

#### F8 · Progress

**Purpose.** Show honestly where the learner stands: recognition from the quiz, recitation from the teacher, consistency from the calendar.

**User story.** As a learner I can see which rules are strong, which keep slipping, what my teacher keeps correcting and how regularly I study.

**AC**
- **Rules:** a table of all lessons with level (§6.6), current interval, lapses, accuracy over the last 5 answers and next due date. Sorted by lapses by default.
- **Recitation (from the teacher):** جلي and خفي counts per session as a simple bar per session, open and resolved corrections, and the rules corrected most often.
- **Consistency:** study days per week for the last 16 weeks.
- **Targets:** the six measures S1–S6 (§1.2), each with its current value.
- Recognition and recitation are on separate panels with separate titles: "What you can recognise (quiz)" and "How you recite (your teacher)".

**Principle.** Honest self-assessment. Self-ratings and recognition scores tend to overstate skill, so the recitation panel uses only the teacher's data.

#### F9 · Install, offline, backup, reminder

**Purpose.** Make R1 dependable on one phone with no account.

**AC**
- **PWA:** manifest, icons, installable on Android and iOS. The service worker caches the app shell, fonts and the bundled content, so after the first visit the app opens with no network.
- **Persistence:** the app calls `navigator.storage.persist()` on first use. When the app is not installed, Today shows a one-time banner: "Install to home screen so your data is kept" (Safari may clear storage for sites that haven't been visited for 7 days, §8.4 R5).
- **Backup:** "Export" downloads one JSON file with all user data and a schema version (recordings optional). "Import" replaces everything after a confirmation, and refuses files with an unknown schema version or a schema newer than the app. If there has been no export for 14 days, Today shows a one-line reminder.
- **Reminder:** "Add my wird to calendar" downloads an `.ics` file with a daily repeating event at the chosen wird time and a link to `#/today`. It works on phone and laptop calendars without a server. Push notifications are R3 (F16).
- **Schema migrations:** the store has a `schemaVersion`. Each migration is a pure function with a Vitest test. If a migration fails, the app keeps the old data untouched and offers an export.
- **Settings** (`#/settings`): wird time, reciter, المد المنفصل length (4 or 5; it is used in explanations and length questions, and the card says to keep one length throughout), Quran text size, theme (light, dark, system), export and import, delete recordings, reset.

**Principle.** Practical, not pedagogical. A learner who loses three months of review history stops trusting the tool.

### R2

#### F10 · Ayah analyser (جزء عمّ)

**Purpose.** Apply the rules to real pages: every rule coloured, tap a word to see why, and a test mode where the learner finds the rules before they are revealed.

**User story.** As a learner I open a surah from جزء عمّ. I tap any word to hear it and see which rules apply and why. In test mode I mark where I think a rule occurs, then reveal and compare.

**AC**
- `#/mushaf/<surah>`, for **الفاتحة and جزء عمّ (78–114) only**. Uthmani text (Tanzil) with tajweed colours from the bundled cpfair markup, mapped to the artifact's palette (§8.3 table).
- Rules the dataset does not mark (الراء، لام الجلالة، الإظهار، البدل، السكت، صغرى/كبرى، and the split of العارض/اللين) come from **our own annotations**. These are hand-made per surah in the same offset format and checked by the teacher (C8). A surah ships in the analyser only when its annotations are `reviewed`. Until then the legend says "not shown on this surah yet: …". The app never guesses a colour.
- Tap a word: play that word as a slice of the chosen reciter's ayah file (quran-align timings; there are no separate word files), and show a sheet listing each rule on that word with its one-line explanation and a link to the card. For the ~1% of words quran-align could not time, the sheet plays the whole ayah.
- Play the surah with the current word highlighted (word timings). Tapping an ayah number starts playback from that ayah.
- **Find-first mode:** choose one rule (only rules that are fully marked on that surah, by the dataset or by reviewed annotations), tap every place it occurs in a passage of up to 10 ayat, then reveal. Shows the places found, missed and wrongly tapped. If every place was found with no wrong taps, one attempt is logged for that rule (`source=analyser`) as correct; otherwise it is logged as wrong. The attempt changes the schedule like any review answer, at most once per rule per day.
- **Generated questions:** for rules that are fully marked, a build step extracts candidate identify-the-rule examples from جزء عمّ. A candidate becomes a quiz example only after it is marked `verified` in the content file (§8.1). This is how the example pool grows past the artifact's ~3 per rule.
- Works offline for text and colours (bundled). Audio is cached after the first play, or via F13.

**Principle.** *Islamic method / artifact principle:* "طبّق فورًا", find every rule in جزء عمّ on the day you learn it. *Research:* retrieval practice in a realistic context, and transfer from examples chosen for the lesson to text that wasn't. The find-first mode is a retrieval task, and revealing the answer gives immediate feedback.

#### F11 · Mutun (تحفة الأطفال، ثم الجزرية)

**Purpose.** Attach the classical lines to each rule card and memorise them with progressive hiding and spaced review.

**User story.** On a rule card I see the lines of the تحفة (or the الجزرية) that state it. In memorise mode, words disappear step by step until I can say the lines from memory, and each line group then comes back in my review.

**AC**
- **Hard rule: no line ships unless it has been checked word by word, with diacritics, against one named published edition by two people** (§8.1). Unverified lines do not exist in the build; a content test fails the build if one slips through.
- Each line records the matn, its line number in that edition, the edition, the page, and the rules it covers. A card shows its lines with the line numbers.
- **Memorise mode** for a group of 1–4 lines. Five stages: full text → every 3rd word hidden → every other word hidden → only the first word of each half-line → nothing. The learner recites aloud, taps to reveal, and self-rates "had it / missed". Two "had it" in a row move to the next stage.
- When stage 5 is reached, the group becomes a `matn` review item in the scheduler (§6). The review shows the first word only, the learner recites, reveals and self-rates. Labelled as a self-rating.
- Order follows the phases: the تحفة lines 6–34 (النون، الميم، اللام، المثلان) in phase 3 and lines 35–57 (المد) in phase 4; the الجزرية from phase 6, or earlier if the learner chooses (its lines 9–26 on مخارج and صفات fit phase 2).
- The editions are fixed by `00-decisions.md`: **تحفة الأطفال** from Shamela book 9632 (with الضباع's notes, 61 lines), and **المقدمة الجزرية** from Shamela book 581 (ed. عبد المحسن القاسم, 2nd ed. 1441/2020, 107 lines). The app shows the edition on every line, and the line numbers are that edition's. Where the editions differ (for example يُصَحِّحِ / يُجَوِّدِ in line 27 of the الجزرية), the chosen edition's wording is used and the variant is shown in a note only if the teacher asks for it.
- An audio recitation of the matn is linked **only** if one with a clear source is found. Otherwise there is none.

**Principle.** *Islamic method:* حفظ المتون. Didactic poems are memorised so the rules are always at hand, the standard path in تجويد study. *Research:* progressive cue removal ("vanishing cues", Glisky, Schacter & Tulving, 1986) has support, but it comes mostly from clinical and word-list studies. For poetry, its main value is that it is a common, easy routine. We don't claim more.

#### F12 · Contrast drills (الفروق)

**Purpose.** Separate rules learners mix up, by putting them side by side.

**User story.** When I keep confusing الإخفاء with الإدغام بغنة, the app gives me a short drill that mixes examples of both and asks me which is which.

**AC**
- Uses the content table of confusable pairs (§8.1). Example pairs: الإخفاء الحقيقي / الإدغام بغنة · الإخفاء الحقيقي / الإقلاب · الإخفاء الشفوي / الإظهار الشفوي · الإدغام الشفوي / الغنة المشددة · الإدغام بغنة / بلا غنة · القمرية / الشمسية · تفخيم / ترقيق لام الجلالة · تفخيم / ترقيق الراء · القلقلة الصغرى / الكبرى · المد المتصل / المنفصل · المد العارض / اللازم الكلمي · مد اللين / المد العارض · الصلة الصغرى / الكبرى · المثلين / المتجانسين / المتقاربين.
- **Trigger:** when an attempt is wrong **and** the chosen answer is the confusable partner, the pair is counted. After 2 such confusions within 14 days, a `contrast` item for that pair becomes due tomorrow.
- **Drill:** 8 examples mixed from both rules. Each answer is one of the two rules, with immediate feedback and the ayah audio. Correct if ≥ 7/8. The item then follows the normal ladder (§6).
- R1 already uses the pair table to choose quiz distractors (§6.4), so the content is ready before this screen exists.

**Principle.** *Research:* interleaving similar categories improves discrimination between them (Kornell & Bjork, 2008; Kang & Pashler, 2012; Rohrer's work on interleaved mathematics). This is one of the better-supported findings for exactly this kind of task: telling similar categories apart.

#### F13 · Offline audio pack

**AC**
- **Gated on licence (§8.3 U1).** everyayah.com publishes no terms, and Quran Foundation counts the same files as its content (no storage beyond 7 days). F13 ships only if the reciter files' terms allow storing them on the device. Otherwise it is cut and audio stays "cached when played" with a 7-day expiry.
- If allowed: Settings gets "Download جزء عمّ audio for offline". It shows the size before downloading, shows progress, and can be resumed or deleted. It covers one reciter's ayah files (words play as slices, so no extra files).
- Settings: an optional second reciter for comparison in F5 (not the default). The model reciter stays one (قارئ قدوة).

### R3

#### F14 · Sync across devices (Supabase, optional)
- Sign in with an email magic link. Syncs the tables in §7 (not recordings). Works signed out exactly as before.
- AC: two devices that make changes offline converge after both sync. Attempts are merged as a union by id; other rows use last-write-wins on `updatedAt`. Scheduler state is rebuilt from the attempts (§7.3), so the two devices end up with the same due dates. Row-level security: a user can read and write only their own rows. Deleting the account deletes all of them.

#### F15 · Teacher page
- The learner shares a link (a revocable token) for one session, or for the open corrections. The teacher can view the session plan and add or resolve corrections without an account. The teacher's changes land in the learner's log tagged `by=teacher`.
- AC: the token expires after 7 days or when revoked. The teacher cannot see recordings, quiz data or other sessions.
- This needs F14's backend. It is the most valuable R3 item, because it moves logging off the learner during class.

#### F16 · Push reminder
- Web Push at the wird time, sent by a Supabase scheduled function. iOS requires the PWA to be installed (16.4+). Only for signed-in users. The `.ics` file stays as the default.

#### F17 · Khatma tracker (phase 6)
- 604 pages, each marked recited to the teacher (date and session) with its corrections. It plugs into F6 and the scheduler unchanged.

---

## 5. Information architecture

Hash routes (decided). On phones there is a bottom tab bar with 4 tabs (**Today · Rules · Teacher · Plan**). Progress, Resources and Settings are under Plan → "More". On desktop the same items are in the top tab bar, as in the artifact.

| Route | Screen | What's on it | Release |
|---|---|---|---|
| `#/today` (default) | Today | The 4 parts with targets (F1); session card if a session is near; days studied this week; backup and install nudges | R1 |
| `#/learn/:lessonId` | Learn | Pretest → card → check → apply (F2) | R1 |
| `#/review` | Review | Queue runner: one question per screen, feedback, end summary (F3) | R1 |
| `#/rules` | Rule library | Topic index, search, mind map toggle, legend, level per lesson (F4) | R1 |
| `#/rules/:lessonId` | Rule card | Card, examples with audio, level and next due date, content status; mutun lines in R2 | R1 |
| `#/listen/:range` | Listen · repeat · record | Text, player, loop, gap, speed, record, compare, recordings list (F5) | R1 |
| `#/teacher` | Sessions | Upcoming session, history, open corrections filter (F6) | R1 |
| `#/teacher/new`, `#/teacher/:id` | Session | Plan → sheet → log corrections → milestone results | R1 |
| `#/plan` | Plan | Six phases, status, milestone passages, tasks, skip with reason (F7) | R1 |
| `#/progress` | Progress | Rules table, recitation panel, consistency, S1–S6 (F8) | R1 |
| `#/resources` | Resources | Carried over from the artifact | R1 |
| `#/settings` | Settings | Wird time and `.ics`, reciter, munfasil length, text size, theme, export and import, storage, reset | R1 |
| `#/onboarding` | First run | 3 screens: what the app is (and that it doesn't grade recitation), intro course done?, wird time and munfasil length | R1 |
| `#/mushaf/:surah` | Analyser | Coloured text, tap-word sheet, follow-along, find-first mode (F10) | R2 |
| `#/mutun/:matnId` | Mutun | Lines by section, verification badge, memorise mode (F11) | R2 |
| `#/drill/:pairId` | Contrast drill | 8 mixed examples (F12) | R2 |
| `#/t/:token` | Teacher page | The teacher's view of one session (F15) | R3 |

Rules shared by every screen:
- Quran text is RTL, in Amiri Quran, and never transliterated. Arabic terms appear in Arabic inside English sentences (bidi isolation carried over from the artifact).
- UI text is English with Arabic terms. A full Arabic UI is not in scope (§9).
- Phone first: one column, at least 44px tap targets, and audio controls within thumb reach.

---

## 6. Scheduling rules (سبق · سبقي · منزل)

> **Changed after the review round (see `07-decision-log.md` #12–13):** at most 4 new lessons per rolling 7 days; a passing سبقي graduates to step 1 (3 days), not step 2; "strong" = step ≥ 4 (30 days) and the last 3 answers correct on 3 different examples; the next phase opens once half its milestone passages are passed. The code (`src/core/scheduler.ts`) is the source of truth.

### 6.1 For the learner, in two sentences

> Each day you learn **one new lesson (سبق)**, check **every lesson from the past week (سبقي)**, and review the **older lessons and teacher corrections that are due (منزل)**. Get one right and it comes back later (in 3, 7, 14, 30, 60, then 120 days); get it wrong, or have your teacher correct it, and it comes back tomorrow.

### 6.2 Definitions

- **Day:** the local date, with the day starting at 03:00. All dates are stored as `YYYY-MM-DD` strings.
- **Item:** one thing that is scheduled. Kinds: `lesson` (R1), `correction` (R1), `matn` (R2), `contrast` (R2).
- **Ladder** (step → interval in days): `0→1, 1→3, 2→7, 3→14, 4→30, 5→60, 6→120`.
- **States:** `sabqi` (introduced in the last 7 days), `manzil` (on the ladder), `closed` (corrections resolved by the teacher), `suspended` (the learner paused it; at most 5 at a time).

### 6.3 What each event does

| Event | Effect |
|---|---|
| Lesson introduced (F2 step 3 done) | `state=sabqi`, `introducedOn=today`, `due=tomorrow` |
| Sabqi answer (any) | Logged. `due=tomorrow`, as long as `today − introducedOn < 7` |
| Sabqi graduation: the first review on or after `introducedOn + 7` | Becomes `manzil`. If **≥ 4 of its sabqi answers were correct and the last one was correct**: `step=2`, `due=today+7`. Otherwise: `step=0`, `due=tomorrow`. The review that triggers graduation counts as the last sabqi answer. |
| Manzil, correct | `step=min(step+1, cap)`, `due=today + ladder[step]` |
| Manzil, wrong | `step=0`, `due=tomorrow`, `lapses+1` |
| Review done before the due date (from the library, analyser or practice) | Correct: no change. Wrong: same as "manzil, wrong" |
| Late review (done after the due date) | Same as on time. The next interval counts from **the day it was answered**. No bonus for remembering after a long gap, no extra penalty. |
| Teacher correction logged | A new `correction` item: `state=manzil`, `step=0`, `due=tomorrow`. Each linked `lesson` item in `manzil` goes to `step=0`, `due=tomorrow`. A lesson in `sabqi` is unchanged (it is already daily). A linked lesson not yet introduced is marked "corrected before taught" and is **offered as the next سبق** if its phase is active. |
| Teacher re-check "still wrong" | The correction item: `step=0`, `due=tomorrow`, `lapses+1`. Linked lessons as above. |
| Teacher re-check "correct now" | The correction becomes `closed`. Linked lessons are not changed. |
| Correction self-rating | "Applied the fix" counts as correct and "not yet" as wrong. **Cap:** a جلي correction cannot go above `step=1` (3 days) and a خفي correction cannot go above `step=3` (14 days) while it is open. Only the teacher closes a correction. |
| Matn / contrast items (R2) | Same ladder. The cap is `step=6`. |
| Lesson cap | `step=6` (120 days) |

### 6.4 Questions

- **identify** (most rules): an ayah with one word range highlighted; "which rule applies to the highlighted part?"; 4 options. The distractors are chosen in this order: (1) the rule's confusable partners (§8.1), (2) other rules in the same topic, (3) any other rule. In review and check questions, only **introduced** lessons appear as options. In the pretest the new rule is included as well. If the example is for stopping, it says "you are stopping here" (carried over).
- **length** (madd rules, derived from data): "how many counts here?" with options from {2, 4 or 5, 2·4·6, 6}. For المنفصل, the learner's chosen length is the expected answer, and the explanation mentions the other.
- **fact** (مخارج, صفات, الوقف, الابتداء): authored multiple-choice questions, ≥ 6 per lesson (§8.1).
- **Item → question:** a `lesson` item alternates between identify and length when both exist. The example is never the same as last time. If the pool has fewer than 3 examples, the item is flagged in a content report (§8.1), not hidden.

### 6.5 Daily queue and caps

Built when Review opens, and again at the start of each day:

1. **سبق:** at most **1 new lesson a day**. It is offered only if all of these hold: a phase is active; that phase has lessons not yet introduced; the backlog of due منزل items is **≤ 15**; no lesson was introduced today. The learner can always skip it.
2. **سبقي:** **all** sabqi items, never capped. In practice this is ≤ 7.
3. **منزل:** items with `due ≤ today`, in this order:
   (a) open جلي corrections; (b) open خفي corrections; (c) lessons whose linked correction was logged in the last 7 days; (d) everything else, most overdue first, and among equals the lowest step first.
4. **Cap:** sabqi plus manzil ≤ **20 items a day**, which is about 8–10 minutes at 20–30 seconds each. Sabqi always fits, so manzil gets `20 − sabqi`. Open جلي corrections are **never** cut, even if they push the total over 20. Items left over stay due and keep their place in the order for tomorrow.
5. **More:** after the queue is done, "10 more" pulls the next due items. If none are due, it does nothing. There is no "review everything" button.

**Expected load.** With about 49 lessons learned over 16 weeks and a 1-to-120-day ladder, steady-state منزل is about **2–4 items a day**. That matches the "2–3 older ones" the learner asked for. Sabqi adds up to 7 and corrections 0–5. A heavy day is about 15 items.

### 6.6 Missed days

- Nothing expires and nothing is reset because a day was missed. Due items wait.
- Sabqi items that pass day 7 while the learner is away graduate at their next review, using the rule in §6.3. Missed sabqi days mean fewer answers, so the item is more likely to start at `step=0`, which is the right outcome.
- After the gap, the 20-a-day cap spreads the backlog over several days. **No new سبق** is offered while the backlog is > 15, so the learner catches up before adding more.
- After a gap of ≥ 7 days, Today opens with a short note: "Welcome back. 34 reviews waiting, so about 2 days to catch up. New lessons resume after that." There is no guilt message and no lost streak.

### 6.7 Levels shown in the UI

| Level | Rule |
|---|---|
| not started | not introduced |
| learning · سبقي | `state=sabqi`, or `manzil` with step 0–1 |
| known | step 2 (7-day interval) |
| strong | step ≥ 3 (14 days and up) **and** no lapse in the last 30 days |

A lesson with an **open** teacher correction shows a "teacher correction open" badge next to its level, whatever the level is.

---

## 7. Data model (local store, sync-ready)

### 7.1 Principles
- **Content is static and bundled**, versioned with the app (`contentVersion`). It is never stored in user data. User data refers to it by stable string ids (`ikhfa`, `tuhfa-24`) that never change once shipped. If an id must change, a migration maps it.
- **User data** lives in one `localStorage` key holding `{ schemaVersion, settings, items, attempts, sessions, corrections, phases, days }`. Recordings live in IndexedDB.
- Every user row has `id` (UUID v4, made on the client), `createdAt`, `updatedAt` (ISO timestamps) and `deletedAt` (ISO or null; soft delete, so a delete can sync). The user id is added only on the server.
- **Attempts are append-only and are the source of truth for scheduling.** `items` is a cache that a pure function can rebuild from attempts, introductions and corrections (§7.3).
- Size: an attempt is about 150 bytes. 25 a day for a year is about 1.4 MB, which fits the ~5 MB `localStorage` limit with room to spare. Attempts older than 12 months are compacted into per-item summaries (R3; noted as a known limit).

### 7.2 Entities

**Content (bundled, read-only)**

| Entity | Fields |
|---|---|
| `Topic` | `id`, `nameAr`, `nameEn`, `intro`, `order` |
| `Lesson` | `id`, `topicId`, `phaseId`, `order`, `nameAr`, `nameEn`, `colour` (palette key), `summary`, `body` (list items, letters, counts `[min,max]`, note, tip), `questionKinds` (`identify`·`length`·`fact`), `confusableWith[]`, `markupRules[]` (cpfair rule names, §8.3), `review` `{status: draft|reviewed, by, on}` |
| `Example` | `id`, `lessonId`, `verseKey` (`2:5`), `wordFrom`, `wordTo` (1-based positions in the Tanzil Uthmani ayah split on spaces, basmala removed; the same indexing quran-align uses), `charSpan?` (only when a rule covers part of a word), `stopping` (bool), `note?`, `origin` (`artifact`·`generated`), `verified` (bool) |
| `FactQuestion` | `id`, `lessonId`, `prompt`, `options[]`, `answer`, `explanation` |
| `Phase` | `id` (1–6), `weeks`, `nameAr`, `nameEn`, `goal`, `doneWhen`, `lessonIds[]`, `tasks[]`, `milestone[]` (`{id, label, from, to}` verse ranges) |
| `ConfusablePair` | `id`, `a`, `b` (lesson ids), `hint` (the one-line difference) |
| `MatnLine` (R2) | `id` (`tuhfa-24`), `matn` (`tuhfa`·`jazariyya`), `n` (line number in the edition), `sadr`, `ajz` (the two half-lines), `edition`, `page`, `lessonIds[]`, `verifiedBy[2]`, `verifiedOn` |
| `Verse` (bundled per surah, §8.2) | `verseKey`, `text` (Tanzil Uthmani, verbatim), `tajweed[]` (`{rule, start, end}` code-point offsets: cpfair plus our reviewed annotations, each tagged `src: cpfair·ours`), `timings` per reciter (`[[wordFrom, wordTo, startMs, endMs], …]` from quran-align) |
| `Reciter` | `id`, `nameAr`, `folder` (everyayah path), `style` (`muallim`·`murattal`), `hasTimings` |

**User data (local, syncs in R3)**

| Entity | Fields | Notes |
|---|---|---|
| `Settings` (1 row) | `id`, `wirdTime` (`HH:MM`), `timezone`, `reciterId`, `munfasilLength` (4·5), `textSize`, `theme`, `onboardedOn`, `introCourseDone`, `lastExportOn` | |
| `ReviewItem` | `id`, `kind` (`lesson`·`correction`·`matn`·`contrast`), `refId` (lesson id, correction id, matn group id, pair id), `state` (`sabqi`·`manzil`·`closed`·`suspended`), `introducedOn`, `step` (0–6), `dueOn`, `lastReviewedOn`, `lastExampleId`, `reps`, `lapses`, timestamps | A cache: rebuilt from attempts |
| `Attempt` | `id`, `itemId`, `on` (day), `at` (timestamp), `source` (`pretest`·`learn`·`review`·`relearn`·`early`·`analyser`·`selfrate`·`teacher`), `questionKind`, `exampleId?`, `chosen?` (lesson id or `applied`/`not_yet`/`passed`/`still_wrong`), `correct` (bool), `countsForSchedule` (bool) | Append-only, never edited |
| `Session` | `id`, `on`, `teacherName`, `plannedPassages[]` (`{from, to, reason: milestone·correction·recent}`), `notes?`, `milestoneResults[]` (`{phaseId, passageId, result: passed·not_yet}`), `status` (`planned`·`done`), timestamps | |
| `Correction` | `id`, `sessionId`, `verseKey`, `wordPosition?`, `severity` (`jali`·`khafi`), `lessonIds[]` (0–2; empty means "other"), `note?`, `status` (`open`·`resolved`), `resolvedInSessionId?`, `by` (`learner`·`teacher`), timestamps | |
| `PhaseProgress` | `id` (= phase id), `status` (`locked`·`active`·`milestone`·`passed`·`skipped`), `activatedOn`, `milestoneOn`, `passedOn`, `skipReason?`, `tasksDone[]` | |
| `DayLog` | `id` (= day), `parts` (`{listen, sabaq, recite, review}`, each `null`·`auto`·`manual`), `listenSeconds` | |
| `Recording` (IndexedDB, never synced) | `id`, `from`, `to`, `createdAt`, `durationMs`, `mime`, `blob` | Last 5 per range |

### 7.3 Rebuilding the schedule

`rebuildItems(attempts, corrections, today) → items` replays every event in time order through the rules in §6.3. It is a pure function, the main target of Vitest tests, and it runs:
- after import,
- after a sync pull (R3), so two devices always agree,
- after a migration that changes the scheduling rules (the history is kept, and only the schedule is recomputed).

Because of this, sync never has to merge two copies of the scheduler state.

### 7.4 Supabase mapping (R3, for reference)
One Postgres table per user entity, with the same column names in snake_case, plus `user_id uuid references auth.users`. RLS: `user_id = auth.uid()` on every table. `attempts` has an insert and select policy only (no update). Pulling uses `updated_at > lastPulledAt`. `Recording` and content tables are never synced.

---

## 8. Content requirements and risks

### 8.1 Rule content

| Requirement | Detail | Blocks |
|---|---|---|
| C1 · Teacher review of every card | Each lesson ships with `review.status`. Before R1 is called *done*, all phase 1–3 cards are `reviewed` by a qualified teacher (ideally the learner's own). The rest must be reviewed before the learner reaches their phase. Cards still in draft carry a visible badge. | R1 done |
| C2 · Split phase 2 | Replace the `makharij` and `sifat` cards with about 11 lessons: الجوف · الحلق · أقصى اللسان (ق ك) · وسط اللسان وحافته (ج ش ي ض ل) · طرف اللسان (ن ر ط د ت ص س ز ظ ذ ث) · الشفتان والخيشوم; and الهمس/الجهر · الشدة/التوسط/الرخاوة · الاستعلاء/الاستفال والإطباق/الانفتاح · الصفير والقلقلة واللين · الانحراف والتكرير والتفشي والاستطالة. Each needs ≥ 6 fact questions. | R1 |
| C3 · Example pool | ≥ **6 verified examples** for every identify-the-rule lesson (the artifact has 2–4). Prefer جزء عمّ and الفاتحة, which the learner recites anyway. Word-specific حفص lessons (السكت، الإمالة، الإشمام، التسهيل، مد العوض) use every occurrence there is. A build report lists lessons below the minimum. | R1 |
| C4 · Fact questions | ≥ 6 per fact lesson (الوقف signs, how to stop, الابتداء, and C2). | R1 |
| C5 · Confusable pairs | The table in F12, each pair with a one-line difference, reviewed with C1. | R1 (used for distractors) |
| C6 · Points to check with the teacher | Places where the artifact simplifies or a route detail matters: the السكت places in حفص (the four listed are the required ones; the optional ones, such as مَالِيَهْ ۜ هَلَكَ and between الأنفال and التوبة, are not mentioned); the ر rules (words with both readings when stopping, such as القطر, مصر, يسر, beyond the two the card names); ع in كهيعص/عسق (4 or 6); the lengths of العارض and اللين and the advice to keep them consistent; المنفصل 4 or 5 *من طريق الشاطبية*; whether الإظهار المطلق (دنيا، صنوان) needs its own lesson. | C1 |
| C7 · Mutun verification (R2) | Use the editions fixed in `00-decisions.md`: تحفة الأطفال = Shamela 9632 (notes of الضباع, 61 lines); المقدمة الجزرية = Shamela 581 (ed. عبد المحسن القاسم, 2nd ed. 1441/2020, 107 lines). Record the Shamela page for every line (the line-to-topic tables are in `01-api-research.md` §6). Wikisource is not a source. Two people check each line word by word with full diacritics: one types it, the other checks it against the printed page. Line numbering follows those editions. The mapping from lines to lessons is reviewed with C1. The classical text is in the public domain, but the vowelling and notes belong to the editor, so the edition is credited on every line and on the Credits screen. **No line is written into the repo from memory or from an unsourced website.** | F11 |

### 8.2 Quran text and audio

The sources are those in `00-decisions.md` → Content sources and `01-api-research.md`.

- **Bundled at build time; no Quran API at runtime.** A build script takes the **Tanzil Uthmani** text (the 2017 copy that cpfair's offsets match), the **cpfair/quran-tajweed** offsets and the **cpfair/quran-align** word timings (for the 3 reciters). It writes one JSON file **per surah** and loads them lazily. R1 needs only the surahs used by examples and milestones; R2 adds all of الفاتحة and جزء عمّ. The text is kept verbatim (a Tanzil condition). The basmala is stripped from ayah 1 of every surah except 1 and 9, and the tajweed offsets are shifted to match. The **Quran Foundation API is not used**: its new API needs a server-side secret, and its terms forbid bundling.
- **Audio** streams at runtime from everyayah.com (`{folder}/SSSAAA.mp3`; CORS `*`, Range supported). A single word plays as a slice of the same ayah file, using the timings. The service worker caches played files for **7 days at most** (LRU, about 100 MB cap) until the licence question (U1) is settled.
- **Build tests (Vitest):** word counts per ayah agree between the text and the timings for all 6236 ayat; every tajweed offset falls inside its ayah; every example's word range is inside its verse and its highlighted text is not empty.
- **Example migration.** The artifact's examples are hand-typed in a near-Uthmani spelling (for example `يَا أَيُّهَا` where the muṣḥaf has `يَٰٓأَيُّهَا`), so its highlights cannot be matched as substrings. Each example is converted once to `{verseKey, wordFrom, wordTo, charSpan?}` against the Tanzil text, by hand where needed, and the build tests above check them.
- **Verse references** in the artifact were spot-checked during this spec (for example 2:5, 13:11, 105:4, 77:20, 5:28) and look right. The build tests check all of them mechanically.
- **Credits screen** (in Settings → About), as the licences require: Tanzil (credit and link), "Collin Fair, quran-tajweed / quran-align" (CC BY 4.0), the reciter names and everyayah.com, and the two mutun editions.

### 8.3 What the tajweed markup can and cannot show

Reconciled with `01-api-research.md` §1. The cpfair dataset (the same data Quran.com shows, except that cpfair keeps متصل and منفصل separate) has 18 rule names. Mapping to lessons:

| Lesson(s) | cpfair rule | Coverage | What we do |
|---|---|---|---|
| الإدغام بغنة / بلا غنة | `idghaam_ghunnah`, `idghaam_no_ghunnah` | marked | dataset |
| الإقلاب | `iqlab` | marked | dataset |
| الإخفاء الحقيقي | `ikhfa` | marked | dataset (heavy vs light ghunnah is not marked; the card explains it) |
| الإخفاء الشفوي / الإدغام الشفوي | `ikhfa_shafawi`, `idghaam_shafawi` | marked | dataset |
| الغنة المشددة | `ghunnah` | marked | dataset |
| اللام الشمسية | `lam_shamsiyyah` | marked | dataset |
| همزة الوصل, silent letters | `hamzat_wasl`, `silent` | marked | dataset (supports الابتداء) |
| المد الطبيعي, الصلة الصغرى | `madd_2` | marked (merged) | dataset colours both as 2 counts; our annotation tags the صلة words |
| المتصل | `madd_muttasil` | marked | dataset |
| المنفصل, الصلة الكبرى | `madd_munfasil` | marked | dataset; الصلة الكبرى tagged by our annotation |
| العارض, اللين | `madd_246` | marked as **one** | split by our annotation (لين = وْ/يْ after فتحة) |
| اللازم الكلمي / الحرفي | `madd_6` | marked | dataset |
| القلقلة | `qalqalah` | marked, **no صغرى/كبرى** | our annotation sets كبرى at ayah ends; elsewhere it is shown as "قلقلة" only |
| المتجانسين / المتقاربين | `idghaam_mutajanisayn`, `idghaam_mutaqaribayn` | marked | dataset (rare in جزء عمّ: 58 and 13 places in the whole Quran) |
| مد البدل, مد العوض | none | **not marked** | our annotation |
| الإظهار الحلقي, الإظهار الشفوي, اللام القمرية | none | **not marked** | our annotation |
| تفخيم/ترقيق الراء, لام لفظ الجلالة, حروف الاستعلاء | none | **not marked** | our annotation (الراء is the largest job: every ر in each surah we ship) |
| إدغام المثلين (other than م) | none | not marked | our annotation |
| السكت, الإمالة, الإشمام, التسهيل, علامات الوقف | none (in the text as marks) | n/a | word-specific, hand-annotated in content |

**C8 · Our annotations (new content requirement, R2).** For each surah shipped in F10, a person adds the missing rules in the cpfair offset format with `src: ours`. A second person, ideally the teacher, checks them. That is 38 surahs (الفاتحة plus 78–114). The work is mostly الراء, لام الجلالة, الإظهار and البدل. Estimate about 15–30 minutes per short surah, so the analyser should ship in batches, shortest surahs first (الناس back to الضحى, which is also the phase 3 milestone).

**Still unverified (from `01-api-research.md`)**

| # | Open point | Affects | Plan |
|---|---|---|---|
| U1 | everyayah.com publishes no terms of use; QF counts the same audio files as its content (no storage over 7 days) | F5 caching, F13 | Short cache only; F13 stays gated. Ask everyayah or the reciters' rights holders. |
| U2 | About 1% of words could not be timed by quran-align (not measured for الحصري المعلّم) | F10 word slices | Fall back to the whole ayah; list the untimed words in a build report |
| U3 | The cpfair markup's accuracy for حفص من طريق الشاطبية | F10 trust | Teacher spot-checks about 50 spans across the classes (with C1) |
| U4 | Whether the الحصري المعلّم ayah files include a pause for repeating | F5 gap default | Listen to 5 files and set the default |
| U5 | MediaRecorder on iOS Safari 17+ (audio/mp4) and in installed PWAs | F5 recording | Test on a device in the first R1 week |

### 8.4 Risks

| # | Risk | Likelihood · impact | Mitigation |
|---|---|---|---|
| **R1** | **Wrong content teaches wrong tajweed.** The rule cards, examples and especially mutun lines are not yet checked by a qualified teacher. Wrong content in a tajweed app is worse than none. | Medium · severe | C1 teacher review with a visible status per card; C6 checklist; C7 two-person matn verification; build tests for example ranges; no unverified matn line in the build. |
| **R2** | **Recognition gets mistaken for recitation.** The quiz measures whether the learner can *name* a rule. With ~3 examples per rule, the learner soon recognises the *verse*, which inflates mastery. | High · high | ≥ 6 examples (C3) and generated examples (F10); never reuse the last example; separate panels in Progress; the teacher's corrections are the only recitation measure; the copy never says "you recite correctly". |
| **R3** | **Gaps and licences in the data sources.** The markup leaves out the rules beginners get wrong most often (الراء، لام الجلالة، الإظهار، البدل), so the analyser depends on our own annotations (C8), which take a lot of work and can be wrong. Audio licensing is unclear (U1). The datasets are no longer maintained (2016 and 2021). | High · medium | Text, markup and timings are bundled under open licences (no runtime API); C8 is reviewed and shipped surah by surah; no colour without a source; audio cache kept short and F13 gated; R1 does not depend on markup at all. |
| R4 | The teacher log is a chore during class, so corrections are not logged and the loop breaks. | Medium · high | ≤ 4 taps per correction; the session sheet is ready before class; logging after class is fine; F15 lets the teacher log directly. |
| R5 | Data loss: Safari clears storage for sites not installed or not visited for 7 days; one device only until R3. | Medium · high | Install nudge, `storage.persist()`, export reminder, import, and the rebuild from attempts. |
| R6 | Too many reviews after a break, so the learner stops. | Medium · medium | 20-a-day cap, no new lessons while the backlog is > 15, no streak. |
| R7 | A hard milestone gate blocks progress when the teacher is unavailable. | Medium · medium | Soft gate with a reason; the milestone stays on every session plan. |
| R8 | Recording on iOS is fragile (permissions, formats, the PWA standalone mode). | Medium · low | Verify U5 early; the player works without recording. |

The three biggest are **R1, R2, R3**.

---

## 9. What we deliberately cut

| Cut | Why |
|---|---|
| Automatic AI grading of recitation | Out of scope by decision: it cannot judge tajweed reliably. It would also compete with the teacher, who is the core of the method. |
| Waveform or pitch comparison of the learner's recording with the reciter | A visual "match" is grading by another name and is misleading for tajweed (ghunnah, tafkhim and makharij don't show reliably in a waveform). Listening is the skill being trained. |
| Self-ticked "أتقنته" | Replaced by measured levels (§6.7). A tick measures confidence, not skill. |
| Streak counter | Punishes one missed day, and habit research does not support it (Lally et al., 2010). Replaced by days per week. |
| Separate wird timer with 4 countdowns | Today already orders the four parts. A timer adds screens and little value. The minutes stay as guidance. |
| Points, badges, leaderboards | Extrinsic rewards that don't fit the subject; a single user has no one to compete with. |
| Transliteration; full Arabic UI | The learner reads Arabic and prefers Arabic terms in English text. A full Arabic UI doubles the copy and testing for no gain to this learner. Revisit if others use it. |
| Many reciters as a feature | قارئ قدوة: one model reciter. A second reciter for comparison only in R2. |
| Three-speed (تحقيق / تدوير / حدر) mode | Phase 6 skill; 0.75×/1× covers the beginner need. Revisit with F17. |
| Uploading or sharing recordings with the teacher | Privacy and server cost in v1. The teacher hears the learner live. Reconsider after F15. |
| Quran Foundation API (and live Quran.com calls) | Its new API needs a server-side secret, and its terms forbid bundling and storing content beyond 7 days. Open datasets cover what we need (§8.2). Revisit only if a backend arrives. |
| AI explanations / chat about rules | Unreviewed generated tajweed content is exactly risk R1. |
| Contrast drills in R1 (as a screen) | Kept as R2. R1 already gets most of the benefit through confusable distractors (§6.4). |
| An optimised scheduler (FSRS or SM-2) | At about 50 items, a fixed ladder the learner can predict is better than a slightly better optimiser no one can explain. Revisit if the item count grows (mutun, khatma). |
| Free-text notes or journal | The correction note field covers the real need. |
| Ayah analyser for the whole Quran | جزء عمّ is what the plan uses up to week 16. Extend only if it proves useful and the markup proves reliable. |

---

## 10. Open questions for the learner

1. Teacher sessions: in person or online, and weekly? This sets the default session day for the Today card and how much time F15 can save.
2. Is the phone acceptable as the only device for the review schedule until sync? If not, F14 moves up.
3. The editions are fixed (Shamela 9632 and 581). If the teacher teaches from a different printed edition of the الجزرية, should the app show that edition's wording instead (C7)?
4. Will the teacher review the cards (C1)? If not, who will?

### 10.1 Answers from the learner (2026-11-19)
1. Teacher: **weekly, online**. Default one teacher day a week (chosen in onboarding).
2. Phone as the only device until sync: **fine**. Sync stays in R3.
3. Content review: **an agent reviews all rule content, examples and mutun against top credible sources** (classical texts and established tajweed references), recording the source for every item. Cards carry their review status; anything unverified is flagged, not shipped silently.
4. الجزرية edition: **Shamela 581** (ed. عبد المحسن القاسم).
