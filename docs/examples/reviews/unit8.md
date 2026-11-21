# Review · Unit 8 example proposals

Reviewer: independent agent, 2026-11-21. Scope: `docs/examples/proposals/{mutaqaribayn,waqf-signs,waqf-how,rawm-ishmam,sakt,imalah,ishmam,tashil}.json` against `docs/15-example-strategy.md`, the lesson cards in `content/rules.json`, `content/course.json`, `public/data/surah/*.json` and the books.

## How it was checked
- **Books read on Shamela for this review:**
  - الميزان 38104: pages 135, 189–196, 200, 204, 207–210
  - الشاطبية 7754: pages 21, 22, 31, 67, 72, i.e. vv. 183–185, 192–194, 311, 773–774, 830–831
  - الجزرية 581: pages 68–69, vv. 46 and 50
- **The text:** every `text` (and every contrast) was compared with `words[word_from-1..word_to]`. All 47 spans match exactly.
- **Pause marks:** every sign was compared with `marks` (from Tanzil, Madinah marks). All signs are where the notes say.
- **Data counts:**
  - ل ساكنة before ر: 13 places. These are the 12 merges plus بَلْ ۜ رَانَ, which agrees with the proposal's "12 places".
  - ق before ك: only 77:20.
  - ۜ appears only at 18:1, 36:52, 69:28, 75:27 and 83:14.
- **Audio:** default audio is husary-muallim. Each gap was measured from `timings` (end of word n to start of word n+1). For scale, a joined pair has a gap of about 10 ms, the sakt at 83:14 has 850 ms, and a stop at a sign has 3–6 s.
- **App behaviour:** read in `src/screens/Learn.tsx` (`exampleSets`) and `src/core/questions.ts`. Examples feed `identify` questions ("Which rule is the highlighted part?"), with the example's note as the explanation. Lessons in the same `cat` are first-tier distractors. When a lesson has no `say` examples, Say falls back to `xs.slice(0, 3)`.
- **Checker:** I ran `EXAMPLES_DIR=docs/examples/proposals LESSONS=… REPORT=1 npx vitest run src/content/examples.check.test.ts` and got 0 errors and 13 warnings. Every warning is answered in `notes`, except the role shortfalls discussed below.

---

## mutaqaribayn: ACCEPT
Each claim was checked against the books:
- ل ← ر is a full merge with no غنة, for both a particle and a verb. Source: الميزان 38104/135: «سواء كانت من حرف أو فعل … (بل رّبكم)، (وقل ربّ أنزلني)، (بل رّفعه الله)».
- نَخْلُقكُّم can be read كامل or ناقص, and «والإدغام الكامل هو الأولى» (same page). The Madinah ضبط also prints the ق with no sukun.
- الجزرية v.50 «كَـقُلْ رَبِّ» and v.46 «وَالخُلْفُ بِـنَخْلُقْكُمْ وَقَعْ» are verified.

The rest also checks out:
- All 10 spans are joined and none crosses a sign.
- The anchor (23:29) is the book's own example and comes from the unit's surah.
- The contrast قَد تَّبَيَّنَ is a true المتجانسين case with no متقاربين. It is mutajanisayn's own first example, which is the right word to stand for that lesson.

The near-identical وَقُل رَّبِّ in `more` (×3) is harmless.

## waqf-signs: FIX
1. **MAJOR · waqf-signs#6 (7:172 بَلَىٰ ۛ شَهِدْنَآ ۛ).**
   - **The problem:** the default audio appears to pause at both ۛ signs, which is exactly what the note forbids («not on both»). husary-muallim timings show:
     - word 16 (بَلَىٰ) ends at 39100 and word 17 starts at 41500, a 2.4 s gap;
     - word 17 ends at 43150 and word 18 starts at 45450, a 2.3 s gap.
   - **Better audio exists:** 2:2 is clean. Word 4 → 5 (رَيْبَ فِيهِ) is joined (a 10 ms gap), and there is a single stop after فِيهِ (4700 → 8400).
   - **Replacement:** give the say slot to `2:2`, `word_from 3`, `word_to 5`, `text "لَا رَيْبَ فِيهِ"`, `focus "رَيْبَ فِيهِ"`. This was checked in the data: the words match, ۛ is after words 4 and 5, and there is no overlap with idgh-n's 2:2 w6–7, so the checker warning on #10 also goes. It is الميزان's own example (38104/204). Move 7:172 to `more`, or drop it after an ear check.
2. **MINOR · waqf-signs#3 (32:18), `why`.**
   - **The problem:** the `why` calls this place "a book example of … الكافي". But الميزان 38104/193 lists كَمَن كَانَ فَاسِقًا under «ما يلحق بالوقف التام», the places where the Prophet ﷺ stopped. Its own الكافي examples are on 194.
   - **Fix:** reword the `why`. The sign and the note are correct.
3. **MINOR · `noticeText`.**
   - **The problem:** "joining would change the meaning" / «والوصل يغيّر المعنى» is stronger than the source and the example's own note. الميزان 38104/189 says «لأوهم معنى غير المعنى المراد».
   - **Fix:** use "joining could suggest a wrong meaning" / «والوصل يوهم معنى غير مراد».

Also checked, all correct:
- Every sign is at the stated word.
- The meanings of م، لا، ج، صلى، قلى and ∴ ∴ match الميزان 189–204.
- The 36:76 (ۘ) and 25:29 (ۗ) books' examples are verified on 193 and 190.
- 16:5 is marked قلى and 27:34 is الكافي/صلى, as on 193 and 194.
- The audio is right at 16:32 ۙ (joined, 10 ms) and at 36:76 ۘ (a stop, 5.9 s).
- See also waqf-how#1, which applies to this lesson too.

## waqf-how: FIX
1. **MAJOR · all examples (cross-lesson with rawm-ishmam and waqf-signs).**
   - **The cause:** waqf-how and waqf-signs had 0 examples before, so they asked fact questions only. With examples, they now get `identify` questions, and the three `waqf` lessons are each other's first-tier distractors (`distractors()` in questions.ts).
   - **The effect:** on ٱلْمُزَّمِّلُ (focus لُ, a stop), "الوقف بالروم والإشمام" is also a correct answer, because a ضمة takes الروم and الإشمام. The same holds for كَٱلْعِهْنِ (الروم), and the other way round for أَحَدٌ or وَٱلْفَتْحُ in rawm-ishmam. In each case, a right answer would be marked wrong.
   - **Fix:** limit these three lessons to fact questions (they have 8, 7 and 7 facts), or never offer another `waqf`-topic lesson as a distractor for a `waqf` lesson. Without one of these, the examples should not go in.

Every ending was checked and is right:
- ٱلْمُزَّمِّلْ, كَٱلْعِهْنْ and أُفِكْ: the last vowel becomes a سكون.
- أَبَدَا: تنوين الفتح becomes an ا.
- لَوَٰقِعْ and دَافِعْ: the tanween is dropped.
- ٱلْقِيَٰمَهْ and ٱلْمُوقَدَهْ: the ة becomes a هاء ساكنة.
- وَٰحِدَهْ: a ة with تنوين الفتح becomes a هاء, not an ا. Source: الميزان 38104/210 «فيوقف عليها بالهاء».

The data also bears out the rest:
- All nine examples are ayah-final, with `stop: true`.
- There is no مد before the last letter.
- The missing open-ت case is justified. A data scan for رحمت، نعمت، لعنت، امرأت، سنت، شجرت، قرت، جنت، فطرت، بقيت، ابنت، معصيت، كلمت، غيابت، هيهات، أبت found none at an ayah end or before a sign.

## rawm-ishmam: FIX
1. **BLOCKER · rawm-ishmam#7 فَعَدَلَكَ, #8 ٱلْحُطَمَةُ, #9 حِسَابَهُم.**
   - **The problem:** these are negative examples, where the rule is not allowed. But every example feeds `identify` (`makeQuestion` → `answerId: lesson.id`). The app will highlight كَ of فَعَدَلَكَ, ask "Which rule is the highlighted part?", and mark "الوقف بالروم والإشمام" correct. It then shows the explanation "Not allowed: a فتحة takes neither الروم nor الإشمام". The question says the opposite of its own answer. Meanwhile "كيفية الوقف", the truly correct answer for #7 and #8, is a likely distractor (same `cat`) and would be marked wrong.
   - **Fix:** remove #7–#9. The "never" cases are already on the card (`list` → "Never") and in the facts:
     - «Can الروم or الإشمام be used on a فتحة?»
     - «Stopping on ٱلْحُطَمَةُ, can you use الروم?»

     فَعَدَلَكَ could instead go to waqf-how `more` as a second فتحة case.
2. **MINOR · rawm-ishmam#5 ٱلرَّحِيمِ.** The note is about the مد before the last letter, but the focus is `مِ` only. Use `focus "يمِ"`, which includes the ي of the مد.
3. **MINOR · rawm-ishmam#9.** If it is kept, the smallest focus is `م`, not `هُم`.

Each claim was checked against the books:
- الروم and الإشمام are allowed on ضمة or تنوين ضم, and الروم alone on كسرة or تنوين كسر (الميزان 38104/208–209 الخلاصة).
- With الروم, the عارض is 2 counts («الروم كالوصل», 208).
- With الروم there is no قلقلة: الروم is not a سكون, so this is correct.
- The 73:2 drop and the هاء الضمير exclusion are justified. الميزان 208 even gives the سكون المحض only for هاء مضمومة/مكسورة.

## sakt: FIX
1. **BLOCKER · sakt#2 36:52 مَرْقَدِنَا ۜ هَٰذَا: not safe.**
   - **What the data shows:** it prints ۜ **and** ۗ after word 6, as the Madinah muṣḥaf does. ۗ means a stop is preferred.
   - **What the reciter does:** the default reciter stops there. In husary-muallim, word 6 ends at 7600 and word 7 starts at 12850, a 5.25 s gap. Against that, the sakt at 83:14 (بَلْ ۜ رَانَ) is 850 ms, and stops at signs elsewhere run 3–6 s.
   - **Why it fails:** the Hear step would play a full stop as the example of "a pause with no breath", so the learner hears a stop taught as a sakt. The note («stopping … is also allowed») also understates the ۗ: stopping is the preferred choice here.
   - **Book:** الميزان 38104/210 allows either («يختار بين السكت إن أراد الوصل وبين الوقف»), so the place is right but the audio is not a sakt.
   - **Fix:**
     - Move 36:52 to `more`. Rewrite its note: "ۜ and ۗ: joining, سكت on the ا; stopping (preferred here) is also correct."
     - Make 75:27 `مَنْ رَاقٍ` (w2–3) the `hear`.
     - Let the notice entry take the wider span 75:27 w1–3 `"وَقِيلَ مَنْ رَاقٍ"` (focus `نْ`), with the same contrast مَن رَّبُّ.
     - Update `noticeText` so it no longer names مَرْقَدِنَا.
   - **Verify first:** listen to 75:27 before relying on it. Its muallim gap is 1.95 s (murattal: 0.66 s), so confirm it is a sakt and not a breath.
2. **MAJOR · sakt#3 عِوَجَا, sakt#4 مَالِيَهْ (`say`).**
   - **The problem:** both are the last word of their ayah. The sakt exists only when joining to the next ayah, and the Say step has the learner record that one word alone. Nothing of the rule can be said or heard (strategy §2: "a rule that needs joining never sits on the last word of an ayah"). The checker exempts `sakt` (STOP_LESSONS), so it did not flag this. Also, `stop: false` contradicts the audio, which is a stop.
   - **Fix:** move both to `more` and leave `say` empty. The shortfall is justified, since no other joined place exists. The Say step then falls back to the first three examples (`exampleSets`), which are the joined places بَلْ رَانَ and مَنْ رَاقٍ.
3. **MAJOR · sakt#6 8:75 عَلِيمٌۢ.**
   - **The problem:** the highlight is a word whose printed ۢ is an إقلاب mark, and السكت is only one of three equal ways there. In an `identify` question, a learner who answers الإقلاب, which the muṣḥaf literally shows, is marked wrong.
   - **Fix:** drop the example. The place stays on the card (`list` → Optional).
4. **MINOR · sakt#6, note.** «Joining الأنفال to التوبة: stop, سكت or join» contradicts itself. If it is kept, use "Between الأنفال and التوبة: …" / «بين آخر الأنفال وأول التوبة: …».

Also checked, all correct:
- The four required places and the two optional ones are complete (الشاطبية vv. 830–831; الميزان 210).
- سكت on the ا of عِوَجَا («على ألف التنوين»), on the ا of مرقدنا, on the ن and on the ل.
- مَالِيَهْ: سكت first, or إدغام.
- The contrast مَن رَّبُّ is إدغام without غنة and has no sakt.
- The anchor بَلْ ۜ رَانَ is the clearest case, and its audio has an 850 ms sakt.

## imalah: FIX (minor only)
1. **MINOR · lesson `notice` (kept because `noticeText` is null).**
   - **The problem:** "the ا leans toward an e sound" is imprecise. Both the فتحة of the ر and the ا lean, as the anchor note says.
   - **Fix:** set `noticeText`: "Listen to مَجْر۪ىٰهَا: the رَا is tilted toward رِي (إمالة كبرى), the only such word in حفص." / «استمع إلى مَجْر۪ىٰهَا: تُمال الراء والألف نحو الكسرة والياء، وهي الإمالة الوحيدة عند حفص.»

**The notice that repeats the anchor:** it teaches, and it is the best that the "no repeated span" rule allows. بِسْمِ ٱللَّهِ مَجْر۪ىٰهَا is the phrase the learner knows. Its contrast, وَمُرْسَىٰهَآ, is the very next word, with the same pattern and no إمالة: a true minimal pair. Without the entry, Notice would pair the word with a random tabii word (`Learn.tsx:346`). The added words carry no competing rule, since the ل of the name after a كسرة is light.

Checked against the books:
- الشاطبية v.311 «وَحَفْصُهُمْ يُوَالِي بِمَجْرَاهَا وَفي هُودَ أُنْزِلَا».
- The ر is light under إمالة.
- The contrast has the tabii rule and no إمالة.

## ishmam: FIX (minor only)
1. **MINOR · ishmam#1, note and noteAr.**
   - **The problem:** the note lists الإشمام first and calls the other way just "الروم". The card says «الروم or الاختلاس … المرصفي reads الاختلاس first». الشاطبية v.773 gives الإخفاء «للكل» first and the merge «مع إشمامه» to «البعض» (v.774).
   - **Fix:** name it «الروم (الاختلاس)» and add "follow your teacher for which to read first", in line with the card's needs-teacher status.

Also checked:
- The text and the ۫ mark match the data.
- Both ways are from الشاطبية (7754/67).
- الميزان 208 says الإشمام and الروم fall inside a word only in تأمنا.

## tashil: FIX
1. **MAJOR · Say step (no `say` examples).**
   - **The problem:** `exampleSets` falls back to `xs.slice(0, 3)`, which here is #1, #2 and #3. So the learner is asked to repeat ءَآلذَّكَرَيْنِ, whose audio is الإبدال with a 6-count مد. The proposal itself says this audio "does not carry التسهيل", yet the learner copies it in the التسهيل lesson.
   - **Fix:** either give the lesson one `say` example so the fallback isn't used (41:44 w8–9 is not possible, because it contains the contrast), or change the fallback so it never takes `more`, only anchor, hear and notice. The second fix is preferred, and it also helps imalah and ishmam.
2. **MINOR · tashil#2 (notice), and its contrast.**
   - **The notice span:** the wider span (adding وَعَرَبِىٌّ) is harmless but adds nothing for التسهيل. It also brings in a tanween-into-و merge, which is an extra sound.
   - **The contrast:** ءَايَٰتُهُۥٓ is followed by ۖ, and the reciter stops there (muallim 13250 → 16450). The printed صلة mark ۥٓ is therefore not heard. Add «(stopped here, so no صلة)» to the contrast note.

   Both spans are correct as they stand.

Checked against the books:
- The anchor and التسهيل as required: الشاطبية v.185 «وَحَقَّقَهَا فِي فُصِّلَتْ صُحْبَةٌ», and حفص is not in صحبة.
- The ءَآلْ words: v.192–193 «فَامْدُدْهُ مُبْدِلَا … فَلِلْكُلِّ ذَا أَوْلى وَيَقْصُرُهُ الَّذِي يُسَهِّلُ». So الإبدال with 6 counts comes first and التسهيل is without مد, as the notes say.
- The four `more` spans match the data, and their data warnings are answered.
- The contrast (مد البدل, a full همزة) truly lacks التسهيل.

---

## Totals
| Severity | Count | Where |
|---|---|---|
| BLOCKER | 2 | sakt#2 (36:52: the audio is a stop, ۜ+ۗ); rawm-ishmam#7–9 (negative examples become identify questions with a false answer) |
| MAJOR | 5 | waqf-signs#6 (7:172 audio pauses at both ۛ); waqf-how, cross-lesson (identify ambiguity between the waqf lessons); sakt#3–4 (say words cannot carry the sakt); sakt#6 (عَلِيمٌۢ shows an iqlab mark); tashil Say fallback (plays الإبدال) |
| MINOR | 8 | waqf-signs#3 why; waqf-signs noticeText; rawm-ishmam#5 focus; rawm-ishmam#9 focus; sakt#6 note; imalah notice; ishmam#1 note; tashil#2 span and contrast note |

Verdicts:
- **ACCEPT:** mutaqaribayn.
- **FIX:** waqf-signs, waqf-how, rawm-ishmam, sakt, imalah (minor), ishmam (minor), tashil.

No wrong text was found: all 47 spans match the data. No wrong pause-sign placement was found.

## Fixes (round 1)
Proposer, 2026-11-21. The checker (`LESSONS=` the eight unit-8 ids, `REPORT=1`) gives 0 errors and 12 warnings. All 12 are answered in `notes`:
- 8 are role shortfalls in imalah, ishmam, tashil and sakt, where the Quran has no more cases.
- 4 are tashil's ءَآلْ words, which the data does not mark.

| Finding | Severity | Change |
|---|---|---|
| sakt#2 36:52 (the audio is a stop) | BLOCKER | Moved to `more` with the suggested note («ۜ and ۗ: joining, سكت on the ا; stopping (preferred here) is also correct»). `hear` is now 75:27 مَنْ رَاقٍ (w2–3). The notice is widened to 75:27 w1–3 وَقِيلَ مَنْ رَاقٍ, with the same contrast مَن رَّبُّ. The `noticeText` now names بَلْ ۜ رَانَ and مَنْ ۜ رَاقٍ. The 1.95 s muallim gap at 75:27 is noted in `notes`. |
| rawm-ishmam#7–9 (negative examples) | BLOCKER | Removed. فَعَدَلَكَ moved to waqf-how `more`, as a second فتحة case. The "never" cases stay on the card and in the facts. |
| waqf-signs#6 7:172 (pauses at both ۛ) | MAJOR | Replaced by 2:2 w3–5 «لَا رَيْبَ فِيهِ» (focus رَيْبَ فِيهِ) in `say`. Dropped 7:172 and the old 2:2 w4–6 `more`. No other proposal or rules.json lesson uses 2:2 w3–5 (idgh-n has w6–7), so the shared-word warning is gone. |
| waqf-how, identify ambiguity across the waqf lessons | MAJOR | Fixed in code by the coordinator: the waqf lessons no longer get identify questions. |
| sakt#3 عِوَجَا, sakt#4 مَالِيَهْ (say) | MAJOR | `say` is now empty. On the coordinator's rule (drop an example when another rule would be equally right), both were dropped rather than moved to `more`. مَالِيَهْ: the merge (إدغام المثلين) is an equally valid way, so المثلين would also be a right answer. عِوَجَا: it ends its ayah, so the clip is a stop on the ألف التنوين, where مد العوض would be equally right, and the data's also-list doesn't catch it. Both stay on the card's list. |
| sakt#6 عَلِيمٌۢ (shows an iqlab mark) | MAJOR | Dropped. It stays on the card as Optional. |
| tashil Say fallback | MAJOR | Fixed in code: with no `say` words, Say repeats the core words. `notes` say so. |
| waqf-signs#3 `why` | MINOR | Reworded: the place is in الميزان's «ما يلحق بالوقف التام» list (38104/193), and the مصحف marks it ج. |
| waqf-signs `noticeText` | MINOR | "joining could suggest a wrong meaning" / «والوصل يوهم معنى غير مراد». |
| rawm-ishmam#5 focus | MINOR | The focus is now `يمِ`. The word also changed to ٱلنَّعِيمِ (102:8), because the checker now warns that ٱلرَّحِيمِ is an arid core word. |
| rawm-ishmam#9 focus | MINOR | Moot: the example was removed. |
| sakt#6 note | MINOR | Moot: the example was dropped. |
| imalah notice | MINOR | `noticeText` set to the suggested text, in both English and Arabic. |
| ishmam#1 note | MINOR | Now «الروم (الاختلاس)» first, then الإدغام مع الإشمام, with "your teacher picks the first" / «وخذ بما يقدّمه شيخك». |
| tashil#2 span and contrast note | MINOR | Added «Stopped here, so no صلة» / «ويقف القارئ هنا، فلا صلة» to the contrast. The span is kept: w9 alone repeats the anchor, and w8–9 contains the contrast. The reason is in `notes`. |

**Units 0–1 follow-up:** rawm-ishmam#2 وَٱلْفَتْحُ (110:1), which lam-jh uses as its notice contrast, is replaced by ٱلْأَكْرَمُ (96:3 w3). It is a plain ضمة at an ayah end with no مد before it (الميزان 38104/208, المضموم), and no other lesson uses it as a core or contrast word. The `noticeText` is updated to name it.

**Other change:** waqf-how#8 104:6 ٱلْمُوقَدَةُ was dropped, because ibtida, an earlier lesson, now has it as a core word.

**Open identify ambiguities** that I can't fix by dropping, because each is the lesson's only word. They need code (an also-list entry or a distractor exclusion):
- imalah: مَجْر۪ىٰهَا also has a light ر, so ra-l (ترقيق الراء) would be a right answer.
- ishmam: in the إشمام way, تَأْمَ۫نَّا is a merge of two نون, so mithlayn would be a right answer.

The same holds systemically for mutaqaribayn's «ل رَّ»: the ر is heavy, and ra-h is not in the also-list. The reviewer accepted that lesson, so I left it.

## Re-check (round 1)
Reviewer, 2026-11-21.

**How I checked**
- **Text and marks:** every changed or new span was compared with `words` and `marks` again. All match.
- **Checker:** run with `LESSONS=` the eight ids and `REPORT=1`. It gives **0 errors and 12 warnings**:
  - 8 are role shortfalls (imalah, ishmam, tashil, sakt), justified.
  - 4 are the ءَآلْ words, which the data does not mark. The rule is from الشاطبية vv.192–193.
- **Code read:** `src/content/index.ts` (`NO_IDENTIFY`, `quizAlso`) and `src/screens/Learn.tsx` (`exampleSets`).
  - A lesson without identify is also never offered as a wrong answer, because the distractor pool requires `identify`. So the ۗ on 36:52 can no longer make waqf-signs a trap.
  - With no `say` words, Say now plays the anchor and hear words only.

**Each fix**
- **sakt#2 → `more` 36:52 (BLOCKER 1): fixed.**
  - The note now says stopping is preferred here (ۗ), matching الميزان 38104/210.
  - The new hear is 75:27 w2–3 مَنْ رَاقٍ (ۜ after word 2) and the notice is w1–3. Both match the data.
  - The new `noticeText` names the anchor and the hear word, and its Arabic is correct («تُدغمان»).
  - One check is still open: listen to the 75:27 clip (a 1.95 s gap in muallim) before release. It is not a blocker, because the murattal gap is 0.66 s.
- **Dropping عِوَجَا and مَالِيَهْ, instead of moving them to `more`: agreed.**
  - `more` still feeds the "which rule" questions.
  - On مَالِيَهْ, the merge (إدغام المثلين) is an equally valid way (الميزان 210), so المثلين would be a right answer.
  - On عِوَجَا, the clip is a stop on the ألف التنوين, so العوض would be a right answer.
  - Neither ambiguity is caught by the data's also-list. The places stay on the card's list, which is marked complete, so nothing is lost.
  - With Say now repeating بَلْ رَانَ and مَنْ رَاقٍ, the learner practises the sakt where it is actually heard.
- **rawm-ishmam#7–9 removed (BLOCKER 2): fixed.**
  - rawm-ishmam also no longer gets "which rule" questions, which closes the cross-lesson issue as well.
  - فَعَدَلَكَ is now waqf-how#9: an ayah end with a فتحة, read with a سكون (فَعَدَلَكْ). It is correct.
- **rawm-ishmam#5 ٱلنَّعِيمِ (102:8), focus `يمِ`: correct.**
  - It is the last word of the ayah, with a كسرة after a ي مد.
  - With الروم the عارض is 2 counts («الروم كالوصل», 38104/208).
  - It is used by no other lesson.
  - It comes from التكاثر, a unit 5 surah, which is a better fit than 27:30.
  - The focus now covers the مد and the vowelled م.
- **waqf-signs#6 → 2:2 w3–5 «لَا رَيْبَ فِيهِ»: fixed.** The ۛ signs are after words 4 and 5. The muallim audio joins رَيْبَ فِيهِ (a 10 ms gap) and stops once. There is no overlap with idgh-n.
- **waqf-signs#3 `why` and the `noticeText` («يوهم معنى غير مراد»): fixed.**
- **sakt#6 dropped: fixed.**
- **tashil Say: fixed in code.**
- **imalah `noticeText`, ishmam note (الروم (الاختلاس) first, the teacher decides) and the tashil contrast note: fixed.** The wording is correct and the English and Arabic agree.
- **waqf-how#8 ٱلْمُوقَدَةُ dropped:** fine. The ة → هـ case is still covered by #3 and the ةً case by #6.
- **The imalah, ishmam and mutaqaribayn ambiguities the proposer raised:** covered by `quizAlso` (no ra-h or ra-l when the words contain ر, no mithlayn for ۫).

**New problems:** none found.

**Final verdicts:** ACCEPT for all eight lessons: mutaqaribayn, waqf-signs, waqf-how, rawm-ishmam, sakt, imalah, ishmam and tashil. The one remaining item is the ear check of the 75:27 clip noted above.
