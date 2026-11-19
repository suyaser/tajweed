# Tajweed and Quran-fidelity review

Scope: faithfulness to the Quran text and to tajweed in رواية حفص عن عاصم من طريق الشاطبية. Read-only review, no browser.

What was checked:
- `content/rules.json`: all 49 lessons. Every definition, condition, list and tip was read. All 269 examples were checked against the verse text in `public/data/surah/NNN.json`, including the word before and after each one, whether it sits at an ayah end, and the stop flag. All 94 fact questions were checked, with every option.
- `content/pairs.json`, and samples of `content/mutun.json` (all 61 lines of the Tuḥfa, and al-Jazariyya lines 9–19 and 36–59).
- Code: `src/quran/index.ts`, `src/quran/data.ts`, `scripts/build-quran-data.mjs`, `src/components/Verse.tsx`, `src/components/Marks.tsx`, `src/screens/study/*`, `src/core/questions.ts`, `src/content/index.ts`, `src/screens/Rule.tsx`, `src/screens/Listen.tsx`.
- The cpfair spans that fall on each example's words, and on the special places of حفص (75:27, 83:14, 36:1–2, 68:1, 26:1, 12:11, 11:41–42, 7:176, 77:20, 69:28, 3:1–2, 19:1, 42:1–2, 10:51, 41:44, 18:1, 36:52, 8:75–9:1, 95:1, 97:1).

Overall, the rule content is careful and correct for حفص من الشاطبية. All 269 examples match the Tanzil text word for word, and every one does show its rule. In the details checked, the route-specific points are right: إظهار in يسٓ وَٱلْقُرْءَانِ and نٓ وَٱلْقَلَمِ; no غنة with ل ر; المنفصل and المتصل at 4 or 5, read equal; ع at 4 or 6; the four places of سكت plus the two optional ones; the six words of إبدال or تسهيل; مَجْر۪ىٰهَا; تَأْمَ۫نَّا. Every fact question has exactly one correct option, and its explanation is right. No Quran word is transliterated. Ayah numbers come from Tanzil's Kufan count. The ﴿ ﴾ brackets are U+FD3F then U+FD3E, the right order for RTL.

The problems are mostly in how the app **uses** correct content: how it asks questions, how it shows passages, and what the Quran text it displays leaves out.

---

## Blocker

### B1. "Which rule is the underlined part?" can mark a correct answer wrong
**Where:** `src/core/questions.ts` `makeQuestion` and `distractors`; `src/screens/study/verse.tsx` `ExampleVerse` (it underlines whole words, `focus={[ex.wordFrom, ex.wordTo]}`); the content's `focus` field, which nothing in `src/` reads.

**Problem:** The question underlines whole words, but a whole word often carries more than one rule. Wrong options are picked in this order: the confusable partners, then lessons of the same topic, then **any** lesson already introduced. Some topics have only 1 or 2 lessons with examples: ghunnah (1), ra (2), qal (2), meem (3), merge (3). For those, wrong options are drawn at random from other topics. Wrong options also come from other topics whenever the same-topic lessons are not introduced yet. The result: one of the "wrong" options can also be a correct answer.

**Evidence. The same words are the example of two different lessons** (same verse and same word range):
- `113:1` w4 ٱلْفَلَقِ is both `lam-q#3` and `qal-k#0`
- `97:1` w5 ٱلْقَدْرِ is both `lam-q#4` and `qal-s#4`
- `105:1` w7 ٱلْفِيلِ is both `lam-q#5` and `arid#7`
- `114:1` w4 ٱلنَّاسِ is both `lam-s#2` and `arid#5`
- `10:51` w7 ءَآلْـَٰٔنَ is both `lazim-k#2` and `tashil#3`

**Evidence. The underlined word also clearly shows a rule taught in another topic** (from the cpfair spans on the word):
- `ra-l#2` قَدِيرٌ (2:20) and `ra-l#7` لَّخَبِيرٌۢ (100:11), both stopped: a يْ before a stopped letter, so مد عارض is just as correct.
- `ra-h#6` تَرْمِيهِم (105:4): the final مْ before بِحِجَارَةٍ is الإخفاء الشفوي. It is the same word as `m-ikhfa#0`.
- `ra-h#2` ٱرْجِعِىٓ (89:28): ىٓ before إِلَىٰ is منفصل.
- `ra-h#4` ٱلْكَوْثَرَ, `ra-h#7` وَٱلْفَجْرِ, `ra-h#9` لَبِٱلْمِرْصَادِ, `ra-l#4` ٱلْبَرِيَّةِ: each has an اللام القمرية.
- `ra-l#0` رِجَالٌ لَّا (24:37): the تنوين is إدغام بلا غنة.
- `qal-k#5` ٱلْبُرُوجِ (اللام القمرية); `qal-k#6` ٱلصَّمَدُ and `qal-k#7` بِٱلشَّفَقِ (اللام الشمسية); `qal-k#2` مُّحِيطٌۢ (its مُّ is the merge from وَرَآئِهِم).
- `ghunnah#2` ٱلْجِنَّةِ and `ghunnah#5` ٱلْخَنَّاسِ (اللام القمرية); `ghunnah#4` ٱلنَّبَإِ (اللام الشمسية).

In all, 139 of the 269 examples underline at least one other marked rule. Most of these are harmless today only because of the order in which wrong options are picked.

**Fix:**
1. Underline the `focus` substring, not the whole word. Every example already has one, and it is always a substring of `text`. Map it onto the code-point range of the words, the same way the build maps typed highlights.
2. When picking wrong options, drop any lesson that also shows up in the underlined words. Derive this per example in the build: lessons mapped from cpfair rules on those words, any other lesson that uses the same verse and words, plus a check for ٱلْ followed by a sun or moon letter. Store it as `example.also: string[]` and exclude those ids in `distractors`.
3. Until this is done, replace the five duplicated examples in one lesson of each pair.

---

## Major

### M1. Passages drop the basmala and the surah boundaries
**Where:** `scripts/build-quran-data.mjs` / `src/quran/data.ts` `stripBasmala`; `src/components/Verse.tsx` `Passage`; `src/screens/Listen.tsx`; milestone ranges in `src/content/index.ts` (`p3-duha-adiyat` 93:1–100:11, `p4-naba-abasa` 78:1–80:42, …, `p5-mulk` 67:1–67:30).

**Problem:** The basmala is removed from ayah 1 of surahs 2–114. That is right for word indexing, but the Passage never adds it back, and it shows no surah title between surahs. A milestone such as الضحى – العاديات runs ﴿١١﴾ straight into the next surah's ﴿١﴾, eight times over, with no name and no basmala. The audio uses the everyayah per-ayah files. Their ayah-1 files for surahs 2–114 normally do not contain the basmala; confirm this for the three folders. If so, the model recitation has no basmala either. In حفص, the basmala is required between two surahs (except الأنفال → التوبة) and when you start at the beginning of a surah. A learner who practises these milestones from the app and then recites them to the teacher will leave it out.

**Fix:** In `Passage`, when an ayah has `n === 1` and the surah is not 1 or 9, render a surah heading and a basmala line. The basmala is not a numbered ayah, so give it no ﴿n﴾ marker. In the player, queue `001001.mp3` from the same reciter folder before ayah 1 of every surah except 1 and 9. Do this also when a range starts at ayah 1.

### M2. The displayed text has no stop or sakt marks
**Where:** the text source (Tanzil Uthmani copy pinned by cpfair; `docs/04-content-review.md` says it has "no waqf marks (no ۛ ۜ ۖ)"); everything that renders `verse.text`.

**Problem:** The app teaches the stop marks (`waqf-signs`) and the four obligatory سكتات (`sakt`), but the Quran it displays never shows ۘ ۗ ۚ ۖ ۙ ۛ or ۜ. In the Listen and milestone passages, 75:27 reads مَنْ رَاقٍ and 83:14 reads بَلْ رَانَ with nothing to mark the pause. Without the mark, a learner is likely to merge them into مَن رَّاقٍ and بَل رَّانَ, which is a لحن in this route. The `sakt` examples (18:1, 36:52, 75:27, 83:14) underline words whose defining mark is missing. The `waqf-signs` facts (for example لَا رَيْبَ ۛ فِيهِ ۛ) refer to marks the learner will never see in the app's own text.

**Fix:** Build from a Uthmani text that carries the waqf marks, and recompute the cpfair offsets against it, or insert the marks at known positions with an offset shift. At a minimum, hard-code ۜ in the four سكت places and show a "سكت" badge on those words in `Passage` and `ExampleVerse`. Until then, add a visible note in Listen: "Stop and سكت marks are not shown; use your printed muṣḥaf."

### M3. "How many counts here?" has no single answer for multi-letter opening letters
**Where:** `src/core/questions.ts` (length kind, `lengthId(lesson.counts)`), with `lazim-h` counts `{min:6,max:6}`. Examples `lazim-h#3` كٓهيعٓصٓ (19:1), `lazim-h#4` عٓسٓقٓ (42:2), `lazim-h#5` طسٓمٓ (26:1), `lazim-h#7` الٓمٓصٓ (7:1).

**Problem:** The whole word is underlined (see B1), so the learner is asked one length for a group of letters with different lengths. كٓهيعٓصٓ has كاف 6, ها and يا 2, عين 4 or 6, صاد 6. In عٓسٓقٓ the عين is 4 or 6. In طسٓمٓ the طا is 2. The answer key says "6" for all of them. The example's note appears only after the learner answers. The same issue, in a milder form, affects `arid#0` ٱلْعَٰلَمِينَ and `arid#6` ٱلْكَٰفِرُونَ: each word also has a 2-count مد طبيعي (the dagger alif).

**Fix:** For length questions, underline only `focus`, and make sure each `focus` holds exactly one مد: change `lazim-h#4` to عٓ, or to سٓ alone; change `lazim-h#5` to سٓ, or to مٓ alone. Or leave multi-letter openings out of the length kind (a per-example `noLength: true`).

---

## Minor

1. **The length options treat المتصل and المنفصل differently.** `src/core/questions.ts`: `MUNFASIL_LIKE = ['munfasil','silah-k']`, so a `muttasil` question shows "٤ أو ٥", while `munfasil` shows the learner's own length. The cards say the two are read equal in this route. Fix: add `muttasil` to `MUNFASIL_LIKE`, with the explanation "same length as your منفصل; 6 is also allowed when you stop on a final همزة".
2. **The opening-letter card leaves out two things.** `lazim-h` conditions should add: الٓمٓ ٱللَّهُ (3:1–2), when joined, gives the ميم 6 or 2 (حركة عارضة); and in طسٓمٓ (26:1, 28:1) the نون of سِينْ merges into the ميم with a غنة. In the data, 3:1 and 26:1 get only `madd_6`.
3. **Colour for الإدغام المتجانس والمتقارب.** In `RULE_COLOUR`, `idghaam_mutajanisayn` and `idghaam_mutaqaribayn` get the app's own `merge` (magenta). In the Dār al-Maʿrifa legend, merging and unpronounced letters share the grey "إدغام، وما لا يلفظ", which this app already uses for `idghaam_no_ghunnah`. Check this against the printed legend. If it matches, map them to `silent`, or keep `merge` and stop presenting the palette as that muṣḥaf's scheme (comment in `src/quran/index.ts` and design §3.2).
4. **Colour on تَأْمَ۫نَّا (12:11).** cpfair colours the نَّ green, which fits the إشمام way only. The `ishmam` card says المرصفي reads الاختلاس (no merge, so no doubled-نون غنة) first. Add a note on the card, or drop that span in the build.
5. **ع coloured `madd6`** in 19:1 and 42:2, although the card says 4 or 6. This is acceptable, since 6 is preferred, but the legend label "مد ٦" is exact there. Optional: a footnote in the legend.
6. **Feedback crop shows colours whose cause is cut off.** `ExampleVerse spanOnly` shows only the example's words. Spans whose cause is in the next, hidden word stay coloured. For example `ra-h#6` تَرْمِيهِم shows a green م with no بِ after it, and `ra-h#2` ٱرْجِعِىٓ shows a red ىٓ with no hamza after it. Fix: in `spanOnly` mode, drop spans that run past `wordTo`, or include the next word in grey.
7. **`sifat-safir` fact F2**, "When does القلقلة sound?". The answer reads "in the middle of a word or at a stop". That leaves out a word-final ساكن while you keep reading (يَلِدْ وَلَمْ), which `qal-s` teaches as صغرى. Fix: "When the letter has a سكون, whether original or from stopping."
8. **`tashil` tip** carries ضَعْف (30:54, فتح or ضم). That is not تسهيل. Move it to its own "two readings in حفص" list. The open points in `docs/04` already suggest this; add يَبْصُۜطُ / بَصْۜطَةً, ٱلْمُصَۣيْطِرُونَ, نُۨجِى to it.
9. **Arrows in lists** ("ت ← ط", "ل ← ر", "ٱلْحَمْدُ ← اَلْحَمْدُ"). They read correctly only inside an RTL run. Inside an LTR line, the arrow points the wrong way and the merge reads backwards. Check the rendering in `Rule.tsx` and `RuleBody`, or write it out as "ت into ط".
10. **Single-word audio is cut from continuous recitation** (`useStudyAudio.example` → `playWord`). Word boundaries from quran-align can clip a word-final قلقلة, or the غنة that runs into the next word. For examples whose rule crosses a word boundary or needs a stop, play the whole ayah.
11. **Surah names from Tanzil metadata** shown in references: ابراهيم (should be إبراهيم), الانسان (should be الإنسان), الإنفطار and الإنشقاق (should be الانفطار and الانشقاق). Override these four in the build.
12. **The checked mutun are not used.** `src/content/index.ts` imports `fallback/mutun.json`, which is `[]`, so the reviewed `content/mutun.json` never reaches the app. Nothing wrong is shown, but nothing is shown at all. Wire it in when the spec C7 check is done.
13. **ٱلْكَوْثَرَ / ٱلْقَدْرِ / مِرْصَادًا (`ra-h#4`, `qal-s#4`, `ra-h#3`)** sit at an ayah end with `stop: false`. Their rule does not change on a stop, so they are fine. But a learner sees the ayah end with no stop badge. Consider `stop: true`, or a note "same when you stop".

## Checked and found correct (selection)
- نون rules: 10 + 9 + 9 + 9 + 10 examples. The iqlab marks (ۢ / ۭ) are present. ikhfa#5 مَن طَغَىٰ is noted as a heavy غنة.
- ميم rules, الغنة المشددة, اللام القمرية والشمسية (both 14-letter sets are complete), لام الجلالة (قُلِ ٱللَّهُمَّ light, start from ٱللَّهُ heavy).
- ر: ٱرْجِعِىٓ is heavy both at a start and when joined to 89:27; مِرْصَادًا is heavy; وَٱلْفَجْرْ and خُسْرْ are heavy on a stop; حِجْرْ and قَدِيرْ are light on a stop; the مِصْرَ / ٱلْقِطْرِ preferences are right.
- Madd: every example's type is clear-cut; يَٰٓأَيُّهَا is correctly called منفصل; صلة exceptions (يَرْضَهُ، فِيهِۦ مُهَانًا، أَرْجِهْ، فَأَلْقِهْ، وَيَتَّقْهِ); اللين ≤ العارض.
- Merging: ٱرْكَب مَّعَنَا and يَلْهَث ذَّٰلِكَ (إدغام من الشاطبية); نَخْلُقكُّم (كامل first, ناقص also correct); the exceptions فِى يَوْمٍ and قَالُوا۟ وَهُمْ; أَو وَّزَنُوهُمْ.
- Basmala: no example falls inside a removed basmala. `lam-jl#0` uses 1:1, which is an ayah in the Kufan count. 95:1 and 97:1 (بِّسْمِ) are handled.
- Facts: every option was checked; each question has one correct answer and the explanations are right.
- Reciter labels: الحصري (murattal, and the Muʿallim recording) and المنشاوي (murattal), all حفص. The everyayah folders match their names.

## Verdict
**Safe for a learner who also has a teacher, once B1 is fixed. Fix M1–M3 before the milestone passages are used for recitation practice.** The tajweed content is accurate for this route and sources its disputed points openly; the `needs-teacher` items are sensibly chosen. The risks lie in the app around that content. Its questions can grade a correct identification as wrong (B1). Its passages leave out the basmala and surah breaks (M1), and show no stop or سكت marks (M2). One kind of length question has no single right answer (M3). The teacher should still review every card before its phase, as `docs/04` asks.
