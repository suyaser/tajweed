# Benchmark research: course UX in learning apps (v2.2 input)

Written 2026-11-20. This doc compares Tajweed Path (spec 09, lesson UX 10, design 03, style B tokens) with language, pronunciation, music and Quran apps, and proposes changes. Sources are listed at the end with numbers [n]. Most evidence comes from company blogs, help centres, store listings and reviews, not from controlled studies. Where a claim rests on one review or on vendor marketing, it says so.

## 1. What the benchmarks do, and whether it fits us

### 1.1 Course map and home
- **Duolingo's path is the home screen** (Nov 2022) [1]. Duolingo's stated reason: learners "weren't sure whether they were using Duolingo the correct way" [2]. Each unit has a sticky banner with the unit goal and a **Guidebook** (key phrases and grammar notes) [3][4], ends in a checkpoint [5], and **mixes personalised practice nodes into the path** so review is part of moving forward [1][6]. Backlash came from learners who lost the freedom to choose and to fully level up a skill [1][7].
  *Fit:* high. We already have one linear order and unit finales. Two gaps: Today and the course map are separate screens, so "where am I" lives on another tab, and our review sits beside the path, not on it.
- **Checkpoints and test-outs:** Duolingo lets learners jump ahead by passing a unit test, and its placement test cannot be undone [5][8]. *Fit:* medium. Many learners already know نون ساكنة rules from a qaida class. Our strict unlock order has no way to skip ahead.

### 1.2 Lesson structure
- **Length:** Duolingo lessons have about 12–15 exercises, roughly 3–5 minutes [5][9]. Babbel lessons run 10–15 minutes and follow a fixed pattern: introduce, drill, review, then a short dialogue in context [10]. Drops markets 5 minutes a day [11]. Our lesson has 7 steps, about 15 minutes, which is long but resumable.
- **One task per screen, one bottom CTA, a thin progress bar and an ✕ to exit** are the norm everywhere. Doc 10 already does this. Duolingo shows a single progress bar with no step names. Our labelled 7-step bar is richer and suits a fixed lesson anatomy.
- **Theory placement:** Babbel gives "tips when they're most helpful" inside exercises rather than up front [12]. Duolingo moved from front-loaded Tips to unit Guidebooks plus **Smart Tips that appear after a specific mistake**, and reports that learners who saw them made fewer later errors [13]. *Fit:* our Hear → Notice → Learn order already matches "example before rule". Our confusable-pair hint in feedback is in effect a Smart Tip. The gap is that the rule card isn't reachable during Say, Find and Check without leaving the step.

### 1.3 Feedback
- Duolingo uses a green or red bottom sheet, a sound, and a "Continue" in the same place as "Check" [14]. Haptics and motion are part of the design [15]. Drops uses haptics and micro-interactions heavily [11].
- *Fit:* the anatomy in 03 §5.5 (verdict word → rule → deciding letter → pair hint → ▶ hear it) is already better than Duolingo's free text and needs no change. The one transferable idea is a **fixed answer position**: Check and Next stay in the same thumb spot.

### 1.4 Speaking without automatic grading
- **Busuu:** a video of a fluent speaker, record, then **play theirs and yours side by side** before trying again. Up to 3 attempts. Recordings can also be sent to the community for human feedback [16][17].
- **ELSA:** colour-codes each phoneme (green, amber, red), lets you hear the correct sound alone and then your own, and advises "fix one red sound at a time" [18][19]. It grades automatically, which we can't and shouldn't copy. What transfers is focusing on **one sound per retry**.
- **Shadowing apps** (Shadowfy, Speak Pro): auto-pause after each sentence, record, then **A/B compare** [20].
- **Yousician "Wait to play":** the song stops until the learner plays the note [21]. In recitation terms, the reciter waits for you.
- **Learn Quran Tajwid:** record, compare with the voice-over, or **send to a teacher** [22]. **Tarteel** detects word-level memorisation mistakes with AI, but its listing says it does not correct tajweed or pronunciation [23]. This confirms that no one grades tajweed reliably.
- *Fit:* high for compare and shadowing. Our "Reciter, then me" is Busuu's compare in one button. What's missing: replaying each side separately, a slower or looped focus word, a stated thing to listen for when self-rating, and seeing your own recordings improve over time.

### 1.5 Review, habits, motivation
- **Duolingo Practice Hub:** built from learners' own recent mistakes, a daily refreshing "targeted practice" at the top, and on-demand "mistakes review" [6]. Duolingo found that learners "want to know what mistakes they made and practise their weak areas" [24]. Babbel's Review is scheduled automatically, and learners complain when it serves only a few items a day [10][12].
- **Streaks:** Duolingo's streak and streak freeze are its main retention tool [25]. Critiques say it punishes breaks and that freezes only patch the problem [26][27]. **Quran.com** has reading goals and a streak that one verse a day keeps alive [28]. **Quranly** shows a hasanat counter and a streak. Its reviewers ask for a way to keep the streak during illness and **to pause it during menstruation**, and its changelog adds a leaderboard [29].
- **Session summaries:** Elevate's "Session Highlights" show what you did and progress toward unlocking more [30].
- **Evidence:** a 2025 controlled study found that points and progress bars raise motivation but **not learning or delayed recall** [31].
- *Fit:* our سبق/سبقي/منزل review, "days studied this week" with no streak, and the "Welcome back" copy already avoid the trap the Quranly reviews describe. The gaps are a "practise what slipped" entry point and a lesson-end summary that shows what was done.

### 1.6 Onboarding
- Duolingo puts a real exercise **before** sign-up, offers "start from scratch" or "find my level" (about 5 minutes, adaptive), and asks for a daily goal [8][32][33].
- *Fit:* our onboarding asks five settings questions (welcome, starting point, reciter, منفصل 4 or 5, rhythm) and then says "Start lesson 1". The learner hears no recitation until about 2 minutes in, and the منفصل question comes 40 lessons before it matters.

### 1.7 Visual design and accessibility
- Duolingo's visual system: bold flat colour, a mascot, heavy motion. Drops and Elevate use flat illustration and colour per category [11][30]. Bayyinah TV's reviews centre on content quality and playback reliability (background audio, resume), not on visuals [34].
- *Fit:* style B (sand and ink, Amiri Quran, one green, gold for "playing") already suits a muṣḥaf and needs no change. Lessons from reviews: **audio reliability beats decoration**, and a long Arabic course needs per-unit wayfinding without a mascot.
- Accessibility: NN/g treats progress indicators as status micro-interactions that tell users their action registered [35]. Doc 10 already covers status lines, 48px targets, reduced motion and forced colours. Busuu-style video has no equivalent for us. Our risk is audio-only content without a text fallback (the offline copy covers part of this).

## 2. Our screens against the benchmarks

| Screen | Matches the best practice | Gap |
|---|---|---|
| **Today / Continue** | One primary card that names the lesson, "Lesson n of 58", resume, honest pace and backlog copy | Up to 6 cards plus nudges compete with it. Unit progress sits in a side card, not in Continue. No time estimate. No picture of where this lesson sits in the unit. |
| **Course map** | Vertical units, star badges, finale per unit, locked state | Accordions of text lists, not a path. Doesn't scroll to the current lesson. No "test out". Review isn't on it. |
| **Unit page** | Intro, lessons, finale, optional mutun | No "rules in this unit" guidebook. The finale gives no sense of before and after (your first recording against now). |
| **Lesson steps** | Example-first order, one instruction, a named next CTA, a clickable step bar, the done line, resumable | About 15 minutes with no visible estimate or natural break point. The rule card isn't reachable from later steps. |
| **Say / Recite** | Record → compare → self-rate, honest copy | One combined compare button. Nothing stated to listen for when rating. No slow or loop on the focus word. Recordings aren't kept for comparison. |
| **Review** | One question per screen, wrong items return once, summary with "Look again at" | No on-demand "practise what slipped" outside the due queue. |
| **Rule card** (doc 10 §4.4) | Numbered sections, "Remember", details behind "More" | Can only be opened in Learn or the library, not as a guidebook sheet. |

## 3. Proposed improvements

Effort: S = under half a day, M = 1–2 days, L = 3 days or more.

### Must

**M1. Say a specific thing to listen for before self-rating.**
- *Source:* ELSA's "fix one sound at a time" [19]; criterion-based self-assessment in Busuu's side-by-side compare [16].
- *Why it fits:* "Did it sound the same?" is too vague for a beginner to judge. One named criterion makes self-rating honest without AI.
- *Change:* Say row 4 and Recite row 3 show `Listen for: the غنة on نْ lasts 2 counts`. The text comes from the lesson's `notice`, with a new optional `listenFor` field in rules.json and ar.json. The rating buttons become `Yes, the same` / `Not yet`.
- *Effort:* M (content for 58 lessons, which can fall back to `notice`).
- *Risk:* an authoring burden. Wrong criteria mislead, so they go through the same review status as the rest of the content.

**M2. Hear the reciter, then me, as separate replays, with a slower and looped focus word.**
- *Source:* Busuu's side by side and the A/B compare in shadowing apps [16][20].
- *Why it fits:* with "Reciter, then me" as one button, the learner can't replay the part they missed.
- *Change:* Compare row: `[▶ Reciter] [▶ Me] [⟲ Both]`, plus a `0.75×` toggle on Reciter. A long-press, or a "Loop" text button, loops the focus word. Uses the existing word timings.
- *Effort:* M.
- *Risk:* clutter on 375px. Keep `Both` as the primary of the three.

**M3. Reach the first sound within 60 seconds of opening the app.**
- *Source:* Duolingo's exercise before sign-up [32][33].
- *Why it fits:* the course says it is "practical first", but onboarding is settings first.
- *Change:* onboarding becomes Welcome (with the honest note) → `Start lesson 1` (the `basics` Hear step, default reciter الحصري المعلّم). Reciter, wird time and teacher day move to a dismissible card after lesson 1: `Set up your study rhythm (1 min)`. The منفصل 4-or-5 question moves to just in time, at the start of the `munfasil` lesson.
- *Effort:* M.
- *Risk:* learners who have a teacher may want to choose the reciter first. Keep a `Choose reciter` link on Welcome.

**M4. Make Continue the single "where am I" card.**
- *Source:* Duolingo's path as home, which answers "am I doing this right?" [2].
- *Change:* inside the Continue card, show a mini path of the current unit: `✓ ✓ ● ○ ○ · finale`, with the current lesson's star filled. Add `About 15 min · 7 steps` (or `Resume at Say · step 4 of 7`). Move the side unit card's content into this card. Show at most 3 cards above the fold: Continue, Review, and one contextual card (teacher, welcome back or catch-up). Practice moves below.
- *Effort:* S–M.
- *Risk:* the dot row must stay readable in RTL and with 11 lessons. Wrap it and number it.

### Should

**S1. A rules sheet available from every lesson step.**
- *Source:* Duolingo's Guidebook and Smart Tips [3][13].
- *Change:* add `Rule ▾` in the lesson header that opens the Learn card as a bottom `Sheet` without leaving the step. The unit page gets a `Rules in this unit` section of compact chips that open the same sheet.
- *Effort:* S.
- *Risk:* learners may skip Learn. Learn stays required (doc 10 §3.1).

**S2. A natural break point and an honest time cue.**
- *Source:* Duolingo's 3–5 minute lessons and Babbel's 10–15 [5][10].
- *Change:* after Learn, the done line reads `✓ You read the rule. Good place to pause; your place is saved.` Close says `Your place is saved` and never "are you sure?". The step bar's tooltip and aria give `~2 min` per step.
- *Effort:* S.
- *Risk:* none worth noting.

**S3. Keep recordings over time and compare at the finale.**
- *Source:* ELSA saves recordings to show change over time [18]; Elevate's Session Highlights [30].
- *Change:* keep the first Say recording per lesson in IndexedDB (local only, as now). On the unit finale's done screen, show `Your first ‹word› (day 1) · now` with two ▶ buttons and no score. Add a Settings toggle `Keep my recordings` that is on by default and can be cleared.
- *Effort:* M.
- *Risk:* device storage, so cap one clip per lesson. Hearing old mistakes can feel bad, so the copy says `Listen to how far you've come`.

**S4. "Practise what slipped" outside the due queue.**
- *Source:* Duolingo's mistakes review [6][24].
- *Change:* the Review card on Today gets a secondary `Practise what slipped (4)`. It builds a session from items with lapses in the last 14 days. It doesn't change the schedule (`countsForSchedule: false`), and its copy says so. The review summary's `Look again at` chips start the same session.
- *Effort:* S–M.
- *Risk:* it could be used to avoid due reviews. Show it only when nothing is due, or below the Review button.

**S5. Test out of a unit (placement).**
- *Source:* Duolingo's jump-ahead and placement [5][8].
- *Change:* on the course map, a locked unit has `Already know this? Test out`. It runs 8 Check questions across the unit's lessons plus the finale recite. If 7 of 8 are right and the finale is marked recited, the lessons are marked `introduced` (and start in review), with the note `Tested out on ‹date›`. Onboarding's "Where you're starting" links here.
- *Effort:* M–L.
- *Risk:* recognition can't show recitation, so the copy says `This checks naming the rules. Recite the finale to your teacher if you can.` Undo is available from the unit page.

**S6. A course map that looks like a path and opens at the current lesson.**
- *Source:* Duolingo's path [1].
- *Change:* render every unit's lessons as a vertical column of star nodes (done / current / locked) with the finale as a larger ۞ node. Auto-scroll to the current one and keep a sticky unit header (`Unit 2 · الناس · الفلق · الإخلاص · Rules ›`). No zig-zag and no mascot. Keep the `<ol>` semantics.
- *Effort:* M.
- *Risk:* long scroll for 58 lessons. Collapse units that are done.

**S7. A shadowing mode in the player.**
- *Source:* Yousician's Wait to play and Shadowfy's auto-pause [20][21].
- *Change:* add `Repeat after each ayah` to Listen. It pauses after each ayah, or word group, for that segment's length × 1.2, then continues. It complements the Husary Mu'allim reciter for every other reciter.
- *Effort:* S–M.
- *Risk:* needs the timings we already have. Not available offline.

### Could

- **C1. A gentle haptic on a correct answer and on finishing a lesson** (`navigator.vibrate(10)`, Android only), off by default. *Source:* Drops and Duolingo [11][15]. *Effort:* S. *Risk:* conflicts with "no sound effects" in 03 §1. Keep it opt-in and silent.
- **C2. An optional intention line at the start of a lesson.** For example `Intention: to recite as it was revealed. ﴿ وَرَتِّلِ ٱلْقُرْءَانَ تَرْتِيلًا ﴾`, shown once a day and dismissible. *Source:* the Quran.com and Quranly framing [28][29], reversed: a niyyah, not a counter. *Effort:* S. *Risk:* can feel preachy, so offer a Settings toggle.
- **C3. Days-studied goal ("4 days a week") instead of a streak,** where one review or one recited passage counts as a day (as Quran.com counts one verse [28]). Add an `.ics` reminder and, later, iOS PWA web push for installed apps. *Effort:* S (goal), L (push, which the spec defers). *Risk:* a goal can become a streak by another name. Never show a "lost" state.
- **C4. Send a recording to the teacher,** as in Learn Quran Tajwid [22]: share a Say or Recite clip via the Web Share API to WhatsApp. No backend. *Effort:* S. *Risk:* privacy, so the copy says where it goes.
- **C5. A lesson done screen like a session summary:** `You heard 3 words · said 3 · found 2 of 2 · recited الناس ١–٣`, then `Comes back tomorrow`. *Source:* Elevate [30]. *Effort:* S.

## 4. Patterns to avoid

| Pattern | Seen in | Why not for us |
|---|---|---|
| XP, leagues, public leaderboards | Duolingo; Quranly's changelog [29] | Invites showing off (riyāʾ) and turns worship into competition. The spec already rules this out. Circles show only days studied. |
| Hasanat counters | Quranly [29] | Claims to know how much reward a deed earns, which is presumptuous before Allah, and it rewards speed over tartīl. |
| Streaks that reset, and streak freezes | Duolingo [25]; Quranly [29] | Punishes illness and travel. Quranly users ask for a freeze during menstruation, a time of rukhṣa, not failure. Guilt goes against قليل دائم. |
| Hearts or energy that block learning after mistakes | Duolingo | Penalises the beginner who needs the most practice. Mistakes in Check already feed review. |
| Automatic pronunciation scores and red/green phonemes | ELSA [18]; Tarteel's AI framing [23] | No reliable tajweed grading exists (Tarteel says it doesn't correct tajweed). A wrong verdict on Quran recitation is worse than none. Verse text is never coloured red or green (03 §1). |
| Timed challenges and speed rounds | Elevate, Drops [11][30] | Rushing goes against tartīl. Calm audio-first steps are the point. |
| Mascots, confetti, celebratory sounds | Duolingo [14][15] | Clashes with the muṣḥaf register. The quiet ۞ line is the reward. |
| Guilt notifications ("Duo is sad") and "are you sure you want to quit?" | Duolingo (widely critiqued [26][27]) | Manipulative. Exit saves silently. |
| Paywalled mistakes review or premium features | Duolingo's Practice Hub was once paid [6]; Tarteel [23]; Quranly [29] | No paid services, and teaching the Quran shouldn't sit behind a paywall. |
| Freedom-removing paths with no way out | Duolingo backlash [7] | Use test-outs (S5) and keep replay and jump-ahead in lessons, so experienced learners aren't trapped. |

## 5. Suggested order

M3 and M4 together (first-run and Continue: the first 60 seconds and every return), then M1 and M2 (the core self-check loop), then S1 and S2 (cheap), then S4, S6, S3, S5 and S7.

## Sources
1. Duolingo, "New Duolingo home screen design" — https://blog.duolingo.com/new-duolingo-home-screen-design
2. NBC News, Duolingo redesign interview — https://www.nbcnews.com/tech/tech-news/duolingos-update-redesign-luis-von-ahn-interview-rcna44655
3. Duolingo, "Duolingo 101" — https://blog.duolingo.com/duolingo-101-how-to-learn-a-language-on-duolingo
4. Online Course Report on Duolingo guidebooks — https://onlinecoursereport.com/?p=4182
5. Portnoff et al., Duolingo research, EDM 2021 — https://research.duolingo.com/papers/portnoff.edm21.pdf
6. Duolingo, "Guide to the Practice Hub" — https://blog.duolingo.com/guide-to-duolingo-practice-hub/
7. PiunikaWeb, path UI backlash — https://piunikaweb.com/2022/10/17/duolingo-app-update-with-path-ui-faces-backlash-from-users/
8. Duolingo, placement test partial credit — https://blog.duolingo.com/partial-credit-improvements-to-duolingos-placement-test/
9. Duolingo Data (fan site) — https://duolingodata.com/dat/itfen66.html
10. LingQ, Babbel review — https://www.lingq.com/blog/babbel-review/
11. DesignRush, Drops app design — https://www.designrush.com/best-designs/apps/drops
12. Babbel, "How Babbel works" and spaced repetition — https://www.babbel.com/how-babbel-works · https://www.babbel.com/spaced-repetition-language-learning
13. Duolingo, "Grammar skills improvements 2021" — https://blog.duolingo.com/duolingo-grammar-skills-improvements-2021
14. UX Planet, Duolingo after 400 days — https://uxplanet.org/analyzing-duolingo-from-product-design-perspective-after-400-days-of-non-stop-practice-c4d4809bdb37
15. 60fps.design, "Fun in every frame" — https://60fpsdesign.substack.com/p/fun-in-every-frame
16. Busuu Help, speaking practice — https://help.busuu.com/hc/en-us/articles/19367617005970-Mastering-language-skills-through-speaking-practice
17. Busuu, Community Corrections — https://blog.busuu.com/community-corrections/
18. ELSA blog, feedback — https://blog.elsaspeak.com/en/advantage-of-elsa-feedback
19. ELSA Help, Advanced feedback — https://elsanow.freshdesk.com/en/support/solutions/articles/31000177968-advanced-feedback
20. Shadowfy (App Store) — https://apps.apple.com/app/id6786404437 · Speak Pro — https://apps.apple.com/us/app/id6746413897
21. Yousician Help, Practice vs Play — https://support.yousician.com/hc/en-us/articles/201558362-Practice-vs-Play-mode-Guitar-
22. Learn Quran Tajwid (App Store) — https://apps.apple.com/us/app/learn-quran-tajwid/id960134803
23. Tarteel (App Store) — https://apps.apple.com/us/app/tarteel-%D8%AA%D8%B1%D8%AA%D9%8A%D9%84-ai-quran/id1391009396
24. Duolingo, "How Duolingo works with learners" — https://blog.duolingo.com/how-duolingo-works-with-learners/
25. Duolingo, "How the streak builds habit" — https://blog.duolingo.com/how-duolingo-streak-builds-habit
26. UX Collective, "Reframing streaks" — https://uxdesign.cc/3-reframing-streaks-on-duolingo-5-ideas-for-a-more-healthy-and-flexible-approach-to-language-8fd89545771e
27. Mobbin, "Streaks are about losing" — https://mobbin.com/blog/streaks-are-about-losing-a-study-of-859-streak-designs
28. Quran.com, reading streaks and goals — https://quran.com/product-updates/quran-reading-streaks · https://quran.com/beyond-ramadan
29. Quranly (App Store, reviews and changelog) — https://apps.apple.com/gb/app/quranly/id1559233786
30. DesignRush, Elevate — https://www.designrush.com/best-designs/apps/elevate
31. Gamified feedback in adaptive retrieval practice, Computers in Human Behavior 2025 — https://research-portal.uu.nl/en/publications/gamified-feedback-in-adaptive-retrieval-practice-points-and-progr/
32. Appcues GoodUX, Duolingo onboarding — https://goodux.appcues.com/blog/duolingo-user-onboarding
33. UX Collective, "Duolingo diaries: onboarding" — https://uxdesign.cc/the-duolingo-diaries-an-honest-ux-review-part-1-onboarding-ed0165d44c58
34. Bayyinah TV (App Store reviews) — https://apps.apple.com/gb/app/bayyinah-btv/id1530635769
35. NN/g, "What are microinteractions?" — https://www.nngroup.com/articles/microinteractions/
