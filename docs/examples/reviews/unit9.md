# Review: unit 9 examples (المخارج والصفات)

Reviewer: independent. Date: 2026-11-21. Standard: `docs/15-example-strategy.md`, the rule cards in `content/rules.json`, the sources in `docs/04-content-review.md`.

Proposals reviewed: `docs/examples/proposals/{makharij-jawf,makharij-halq,makharij-aqsa,makharij-wasat,makharij-taraf,makharij-shafatan,sifat-hams,sifat-shidda,sifat-istila,sifat-safir,sifat-inhiraf}.json`.

## How it was checked
- **Text and word numbers:** every `verse`/`word_from`/`text` was checked against `public/data/surah/NNN.json`. All 78 match, and the checker's text test passes.
- **Claims about الملك:** I scanned 067.json for every letter with a sukun or shadda. Some claims hold: «the only قْ» (only وَيَقْبِضْنَ 67:19:7), «no كْ», «no ضّ», «no فْ but وَٱلْأَفْـِٔدَةَ». One claim is false (sifat-hams#5, below).
- **الجزرية:** I read ed. القاسم on Shamela 581: pp. 54–56 (vv. 9–19), 57–58 (vv. 20–25) and 66 (v. 43). Every verse quoted matches the edition except the الجوف line (jawf, finding 2).
- **هداية القاري:** for 1/61–68 and 1/79–86 I relied on the locators already verified for these cards (`docs/04-content-review.md`). Every letter-level claim in the notes agrees with the card, and the card agrees with the الجزرية text I read.
- **Checker:**
  - Run: `EXAMPLES_DIR=docs/examples/proposals LESSONS=<the 11 ids> REPORT=1 npx vitest run src/content/examples.check.test.ts`.
  - First run (11:34): 1 error, `sifat-inhiraf#4 يَحُضُّ` = `dad-zha#4`. That came from rules.json, because the dad-zha proposal didn't exist yet.
  - Re-run after `dad-zha.json` was written (11:35): passes, 0 warnings. The full-directory run shows no unit-9 errors.
  - The checker's line «ends the ayah (focus inside the word; stopping doesn't change it)» is wrong for one example (jawf, finding 1).
- **Unicode:** the noticeTexts name the Hear words with the vowel typed before the shadda. Tanzil puts the shadda first. They render the same, so this is not a defect.

---

## Cross-cutting

**X1. BLOCKER: the examples turn on "identify" questions that have more than one right answer (all 11 lessons).**
- **Evidence:**
  - `src/content/index.ts:88`: `if (examples.length) questionKinds.push('identify')`.
  - `src/core/questions.ts:102–108`: distractors are drawn first from lessons with the same `topicId`, and these 11 lessons are all `cat: "found"`, like `tafkhim`, `dad-zha` and `basics`.
  - The only exclusion is `example.also`, and `also.json` comes from `rulemap.ts`, which does not detect مخارج or صفات (`docs/04-content-review.md`, "Not detected: … مخارج and صفات").
- **What goes wrong:**
  1. **These lessons' own questions.** `makharij-aqsa#1` (قْ in وَيَقْبِضْنَ) asks "Which rule is the highlighted part?". Its distractors can be الاستعلاء (ق is مستعلٍ), الصفير والقلقلة (ق is a قلقلة letter) or الشدة (ق is شديد). Each of these is also true.
  2. **Every older lesson's questions.** These 11 lessons now enter the distractor pool. A `tafkhim` question on ص can offer «الاستعلاء والإطباق» as a *wrong* option, and a `qal-s` or `qal-k` question can offer «الصفير والقلقلة واللين».
- **What it reverses:** `docs/04-content-review.md` (v2 review) decided: «مخارج and صفات lessons get no examples: an example adds "identify" questions, which have no single answer for a letter's place.» Nothing in the proposals or the code answers that.
- **Fix:** before merging, keep these 11 lessons out of `identify`, both as the asked lesson and as distractors. For example, skip `identify` when `id` starts with `makharij-` or `sifat-`. Their examples then feed Hear, Learn and Say only, and Check stays on facts.
- **Scope:** this is code, not word choice. The word picks below can be accepted on their own once X1 is fixed.

**X2. MINOR: the shared `notes` line is inaccurate.**
- Every proposal says «The Say step stays the letter drill». It doesn't. `src/screens/Learn.tsx` `Say()` shows the three `say` words for self-rating, and the drill appears only as a warm-up beside the first word.
- **Fix:** reword it to «Say shows these words; the letter drill is its warm-up».

---

## makharij-jawf: FIX

1. **MAJOR. `makharij-jawf#5` ٱلْغَفُورُ (67:2:11), focus فُو.**
   - The word ends the ayah. When the reciter stops on it, the وْ is before the stopped last letter, so it becomes المد العارض للسكون (2/4/6). `docs/04-content-review.md` (Find) says the same: «the مد before the last letter is `arid`, not `tabii` (ٱلدِّينِ in 1:4)». The checker also lists `also arid`.
   - So the why («the stop at the ayah end does not touch it») is false, and the note's «like the و of دُونِ» suggests the same 2-count length the learner just heard.
   - **Replace with 67:25:1 وَيَقُولُونَ, focus `قُو`.** It is mid-ayah, starts the ayah, and has two clean 2-count وْ before ل and ن. Its words are unused by any proposal. (67:15:6 ذَلُولًا, focus `لُو`, also works.)
2. **MINOR. All six `source` lines, the الجزرية quote.**
   - The proposals quote «للجوف ألفٌ وأختاها». Ed. القاسم (581/54, v. 10) prints «فَأَلِفُ الجَوْفِ وَأُخْتَاهَا وَهِي … حُرُوفُ مَدٍّ لِلْهَوَاءِ تَنْتَهِي». Its footnote 2 records «للجوف ألف» as a variant of manuscript أ «وبه ينكسر الوزن».
   - **Fix:** quote the edition's text.

The other examples are correct:
- قَالُوا۟ (67:9:1), دُونِ (67:20:9), نَذِيرٌ (67:9:5, mid-ayah), تَكَادُ (67:8:1) and فِيهَا (67:7:3) each show a حرف مد before a non-همزة, non-سكون letter, so 2 counts while joining.
- noticeText EN/AR: correct and equivalent.

## makharij-halq: ACCEPT

Checked:
- أَحْسَنُ (67:2:7): ء أقصى + حْ وسط.
- يَخْشَوْنَ (67:12:3): خْ أدنى.
- أَهْدَىٰٓ (67:22:6): ء + هْ أقصى. The منفصل after it is outside the focus.
- نَعْقِلُ (67:10:6): عْ.
- مَّغْفِرَةٌ (67:12:7): غْ. The why's note on the merged م is right.
- يَأْتِكُمْ (67:8:12): أْ.

All six letters are covered, and each one with a sukun. The notes match v. 11–12 («ثُمَّ لِأَقْصَى الحَلْقِ: هَمْزٌ هَاءُ … ثُمَّ لِوَسْطِهِ: فَعَيْنٌ حَاءُ، أَدْنَاهُ: غَيْنٌ خَاؤُهَا»). See sifat-shidda 1 for the near-duplicate يَأْتِيكُم.

## makharij-aqsa: ACCEPT

Checked:
- The الملك claims hold: «only قْ» = وَيَقْبِضْنَ, and «no كْ» is true. That justifies ٱلْأَكْبَرَ (88:24:4); its focus is mid-word, so the stop doesn't reach it.
- The notes agree with v. 12–13 («وَالقَافُ أَقْصَى اللِّسَانِ فَوْقُ، ثُمَّ الكَافُ أَسْفَلُ»).
- يَرْزُقُكُمْ `قُكُ` is a good adjacent pair.
- The «learned in unit 2» claim (qal-s) matches `course.json`.

## makharij-wasat: FIX

1. **MINOR. `makharij-wasat#6` قُلْ (67:23:1).**
   - It is the same word as `basics#2` قُلْ (114:1), a core `hear` example of lesson 1, and the learner complaint in §1 is exactly this kind of repeat.
   - **Replace with 67:27:3 زُلْفَةً, focus `لْ`** (لْ before ف, mid-ayah, unused). 67:9:7 وَقُلْنَا also works.
2. **MINOR. `makharij-wasat#2` ٱجْهَرُوا۟ (67:13:4).**
   - It is read joined after أَوِ, so the word's clip starts on a bare جْ («-jharū»). That is a needless difficulty for a Hear word.
   - **Replace with 67:22:5 وَجْهِهِۦٓ, focus `جْ`** (جْ after a فتحة inside the word; the صلة at its end is outside the focus). Update noticeText EN/AR to match.
3. **MINOR. noticeText AR «وسط اللسان وحافته في العمل».**
   - This is a calque of "at work".
   - **Fix:** «…: يعمل فيها وسط اللسان وحافته».

The other examples are correct:
- تَمَيَّزُ يّ: consonant ي, وسط.
- تَشْكُرُونَ شْ: focus mid-word.
- بِيَدِهِ يَ.
- ٱلْأَرْضَ ضَ: «the left side is easier and more common» = card, and v. 13–14 «مِنْ أَيْسَرَ أَوْ يُمْنَاهَا».
- ضَلَٰلٍ (67:29:12).

## makharij-taraf: FIX

1. **MINOR. Coverage.**
   - ط, ت and ظ have no example. The «ط د ت» group is covered only by دّ (#1, #6), and «ظ ذ ث» by ذ and ث. The card's own tip drills «ط ت».
   - **Add as `more`: 67:3:5 طِبَاقًا, focus `طِ`** (unused). ظ appears in الملك only in ٱلْغَيْظِ, which sifat-istila uses, so leave it.
2. **MINOR. `makharij-taraf#4` ٱرْجِعِ (67:4:2).**
   - It is joined after ثُمَّ, so the clip starts on a bare رْ. That is the same issue as wasat 2.
   - **Replace with 67:17:7 يُرْسِلَ, focus `رْ`** (unused).
3. **MINOR. noticeText.**
   - It says «Listen to the tip of the tongue … in أَلْ، أَنْ، أَرْ». ل is not on this card: the card's letters are ن · ر · ط د ت · ص س ز · ظ ذ ث, and ل is taught in makharij-wasat. `drillFor()` also builds this lesson's syllables from those letters, so no أَلْ appears in its drill.
   - This was inherited from the old notice.
   - **Fix:** drop أَلْ from EN and AR.

The other examples are correct:
- ٱلدُّنْيَا: دّ roots of the upper incisors, نْ their gum, إظهار مطلق.
- نَسْمَعُ سْ.
- فَكَذَّبْنَا ذّ: «لِلْعُلْيَا مِنْ طَرَفَيْهِمَا», v. 17–18.
- أَصْحَٰبِ صْ.
- تَدَّعُونَ دّ.
- ثُمَّ ثُ.
- زَيَّنَّا زَ.

## makharij-shafatan: FIX

1. **MINOR. Coverage of الخيشوم.**
   - The card says «الخيشوم … is the مخرج of the غنة of ن and م», and the noticeText says «the hum from the nose in م and ن». Yet both غنة examples (#1, #5) are م.
   - **Add as `more`: 67:6:5 جَهَنَّمَ, focus `نَّ`** (unused).

The other examples are correct:
- أَمْسَكَ مْ, إظهار شفوي before س.
- صَٰٓفَّٰتٍ فّ: «مِنْ بَطْنِ الشَّفَهْ فَالْفَا مَعَ اطْرَافِ الثَّنَايَا المُشْرِفَهْ», v. 18. Its why's claim about فْ is true.
- وُجُوهُ: lip و and madd و side by side, an excellent pick.
- لِيَبْلُوَكُمْ بْ.
- أَمَّنْ مّ.
- ٱلسَّمْعَ مْ.
- ٱلنَّفْسُ فْ (89:27).

## sifat-hams: FIX

1. **MAJOR. The الجهر case is missing.**
   - The card teaches الهمس *and* its opposite: «الجهر, its opposite: the breath is held back. Every other letter is مجهور». Its facts ask «Which of these letters is مجهور?» and «س and ز … what separates them?».
   - Every one of the 9 examples is a مهموس letter, so §2.6 (cover the rule's cases) fails. The only مجهور sound in the lesson is the syllable أَبْ in the noticeText.
   - **Add, preferably as `more`: 67:21:7 رِزْقَهُۥ, focus `زْ`** (unused; sifat-safir uses the other one, 67:15 رِّزْقِهِۦ).
   - Suggested note: «زْ: the place of س, but the breath is held back: مجهور.» / «الزاي الساكنة: من مخرج السين، لكن النفس ينحبس معها، فهي مجهورة.»
2. **MINOR. `sifat-hams#5` كَٱلْعِهْنِ (101:5:3).**
   - The why says «none in الملك outside lessons already used». That is false: 67:28:4 أَهْلَكَنِىَ has هْ and is unused.
   - كَٱلْعِهْنِ is also `waqf-how#4`'s word (70:9).
   - **Replace with 67:28:4 أَهْلَكَنِىَ, focus `هْ`.** This raises the lesson from 3 of 6 to 4 of 6 core examples from the unit surah.

The other examples are correct:
- يَخْسِفَ: خ س ف, all in «فَحَثَّهُ شَخْصٌ سَكَتْ», v. 21.
- فَسُحْقًا حْ.
- مُّسْتَقِيمٍ سْتَ, mid-word.
- كُوِّرَتْ stop: the تْ is heard sākin at the stop, and the note describes the stop.
- ٱلذِّكْرَىٰ كْ.
- أَثْقَالَهَا ثْ.
- بِأَصْحَٰبِ صْ.
- وَٱلْمُشْرِكِينَ شْ.

## sifat-shidda: FIX

1. **MINOR. `sifat-shidda#2` يَأْتِيكُم (67:30:8), focus أْ.**
   - It is the same verb, with the same focus أْ, as `makharij-halq#6` يَأْتِكُمْ (67:8:12), one lesson earlier in the same unit.
   - **Replace with 67:6:6 وَبِئْسَ, focus `ئْ`** (unused; حفص pronounces the همزة fully). Its سَ right after the ئْ also contrasts الشدة with الرخاوة in one word.
2. **MINOR. The Hear set (anchor + 2 hear: قَدْ، يَأْتِيكُم، وَأَعْتَدْنَا) has no رخو letter.**
   - The noticeText still promises «the sound stops, half-flows, or runs freely», and الرخاوة appears only in `say` #6.
   - **Fix:** swap roles, making تُحْشَرُونَ (حْ) a `hear` and moving the second شدة word to `say`. Update noticeText EN/AR.

The other examples are correct:
- قَدْ دْ: د before ج is إظهار for حفص.
- وَأَعْتَدْنَا: عْ توسط, then دْ شدة.
- خَلْقِ لْ.
- مَنْ نْ before خ.
- سَبْعَ بْ.

They match v. 21–22 («شَدِيدُهَا: لَفْظُ أَجِدْ قَطٍ بَكَتْ، وَبَيْنَ رِخْوٍ وَالشَّدِيدِ: لِنْ عُمَرْ»).

## sifat-istila: ACCEPT

Checked:
- All seven مستعلية letters are covered, and the four مطبقة are each shown: صّ، ظ، طّ، ض.
- The contrast between مستعلٍ منفتح and مطبق works well: غ with ظ in one word, then خَلَقَ.
- The light ل (الاستفال) is pointed out in #3 and #5.
- ٱلصُّدُورِ and قَدِيرٌ end their ayahs, but each focus is the first letter, so the stop doesn't change it.
- ضَلَٰلٍ is shared in text with makharij-wasat#7, but from another ayah and in a `more` slot there. ض in الملك occurs only in ٱلْأَرْض, ضَلَٰلٍ and وَيَقْبِضْنَ, so this is acceptable.

## sifat-safir: ACCEPT

Checked:
- صفير: أَصْبَحَ صْ، رِّزْقِهِۦ زْ، ٱلسَّمَآءَ سّ.
- قلقلة while joined: يَنقَلِبْ بْ before إِلَيْكَ، وَلَقَدْ دْ (د before ز is إظهار for حفص), وَأَجْرٌ جْ.
- لين, mid-ayah with no مد: ٱلْمَوْتَ وْ، كَيْفَ يْ.
- The notes match v. 24–25.

## sifat-inhiraf: ACCEPT

Checked:
- كَرَّتَيْنِ and ٱلرَّحْمَٰنُ: رّ, with «وَأَخْفِ تَكْرِيراً إِذَا تُشَدَّدُ» (v. 43, 581/66, verified).
- كُلِّ لّ and هَلْ لْ: لْ before ت is إظهار for حفص.
- لِّلشَّيَٰطِينِ شّ and ٱلنُّشُورُ شُ: التفشي.
- يَحُضُّ ضّ (107:3) and ٱلْأَرْضِ ضِ: الاستطالة.
- Merge-order note (not a defect): `يَحُضُّ` 107:3 is still `dad-zha#4` in `content/rules.json`. The checker passes only because the new `dad-zha.json` proposal drops it. Merge the two together. If dad-zha's old list is kept, this word must change, because الملك has no ضّ.

## maratib (no examples): ACCEPT the decision

مراتب القراءة is about the pace of a whole recitation (النشر 22642/213–217; الميزان 38104/30–31). A single word cut from one reciter at one speed cannot show التحقيق, التدوير or الحدر. Any word would also "be" maratib, so it would raise the same no-single-answer problem as X1. Its facts and closing do the work.

---

## Totals

| Severity | Count | Where |
|---|---|---|
| BLOCKER | 1 | X1 (identify questions for theory lessons: code, all 11 lessons) |
| MAJOR | 2 | jawf#5 (ayah-final ٱلْغَفُورُ: the stop makes the focused و an عارض); sifat-hams (no الجهر case) |
| MINOR | 13 | X2; jawf source quote; wasat ×3; taraf ×3; shafatan ×1; hams ×2; shidda ×2 |

Verdicts:
- ACCEPT (5): makharij-halq, makharij-aqsa, sifat-istila, sifat-safir, sifat-inhiraf (with its merge-order note).
- FIX (6): makharij-jawf, makharij-wasat, makharij-taraf, makharij-shafatan, sifat-hams, sifat-shidda.
- maratib: no examples, decision accepted.

No example has wrong text, a wrong مخرج or a wrong صفة for its highlighted letters.

## Fixes (round 1)

Every replacement word was checked in `public/data/surah/NNN.json` (text, word number, mid-ayah where it matters).

| Finding | Change |
|---|---|
| X1 BLOCKER | Fixed in code by the coordinator; no proposal change. |
| X2 MINOR (notes) | Every proposal's `notes` now says «Say shows the say words; the letter drill is its warm-up». |
| jawf 1 MAJOR | #5 ٱلْغَفُورُ (67:2:11) → وَيَقُولُونَ (67:25:1), focus `قُو`: ayah-initial and mid-recitation, so the وْ is two counts. |
| jawf 2 MINOR | All six `source` lines now quote the edition's text: «فألفُ الجوفِ وأختاها وهي، حروفُ مدٍّ للهواءِ تنتهي». |
| wasat 1 MINOR | #6 قُلْ (67:23:1) → زُلْفَةً (67:27:3), focus `لْ`. |
| wasat 2 MINOR | #2 ٱجْهَرُوا۟ (67:13:4) → وَجْهِهِۦٓ (67:22:5), focus `جْ`. noticeText EN/AR updated. |
| wasat 3 MINOR | noticeText AR now ends «يعمل فيها وسط اللسان وحافته». |
| taraf 1 MINOR | Added `more` طِبَاقًا (67:3:5, `طِ`) and تَفَٰوُتٍ (67:3:12, `تَ`), so ط and ت are both shown. ظ is left out: in الملك it occurs only in ٱلْغَيْظِ (sifat-istila). |
| taraf 2 MINOR | #4 ٱرْجِعِ (67:4:2) → يُرْسِلَ (67:17:7), focus `رْ`. |
| taraf 3 MINOR | أَلْ dropped from noticeText EN and AR. |
| shafatan 1 MINOR | Added `more` جَهَنَّمَ (67:6:5), focus `نَّ`: the غنة of ن from الخيشوم. |
| hams 1 MAJOR | Added the الجهر case رِزْقَهُۥ (67:21:7), focus `زْ`, with the suggested note. It is a `say` (#6), not a `more`, because `more` was already at its limit of 4. ٱلذِّكْرَىٰ was dropped to make room; ك is now covered by #5. |
| hams 2 MINOR | #5 كَٱلْعِهْنِ (101:5:3) → أَهْلَكَنِىَ (67:28:4), focus `هْلَكَ` (هْ and ك, both مهموسة). Core examples from the unit surah go from 3 of 6 to 5 of 6. |
| shidda 1 MINOR | يَأْتِيكُم (67:30:8) → وَبِئْسَ (67:6:6), focus `ئْ` (now `say`). The note covers ئْ (شدة) followed by سَ (رخاوة). |
| shidda 2 MINOR | تُحْشَرُونَ (حْ, رخاوة) moved to `hear`, so Hear is قَدْ / وَأَعْتَدْنَا / تُحْشَرُونَ: full stop, part flow, free flow. noticeText EN/AR updated. |

Checker after the fixes (`EXAMPLES_DIR=docs/examples/proposals LESSONS=<the 11 ids> REPORT=1`): passes, 0 errors, 0 warnings.

## Re-check (round 1)

How I checked:
- Every new or changed example was checked against `public/data/surah/NNN.json` by script. All texts and word numbers match.
- Checker (`EXAMPLES_DIR=docs/examples/proposals LESSONS=<the 11 ids>`): passes, with 0 errors and 0 warnings.
- `npx vitest run src/core src/content`: 78 of 78 pass.

**X1: fixed.**
- `src/content/index.ts:70,92`: `NO_IDENTIFY` keeps the `makharij-*` and `sifat-*` lessons (and maratib, ibtida, waqf-*, rawm-ishmam) out of `questionKinds: identify`.
- The distractor pool in `questions.ts:102` only takes lessons that have `identify`. So these lessons also never appear as wrong options in other lessons' questions.

**X2: fixed.** Every proposal's `notes` line now says what the Say step does.

Fix by fix:
- **jawf.**
  - #5 is now وَيَقُولُونَ (67:25:1), focus `قُو`. It is mid-ayah and followed by مَتَىٰ, so this is a 2-count حرف مد and the stop doesn't reach it. The note is correct in both languages.
  - The source now quotes the edition's text, which matches 581/54 v. 10.
- **wasat.**
  - #2 is now وَجْهِهِۦٓ (67:22:5), focus جْ after a فتحة. The صلة at the end of the word is outside the focus.
  - #6 is now زُلْفَةً (67:27:3), focus لْ before ف.
  - The noticeText names the new Hear words, and the Arabic now reads naturally.
- **taraf.**
  - #4 is now يُرْسِلَ (67:17:7), focus رْ.
  - New `more`: طِبَاقًا (67:3:5) and تَفَٰوُتٍ (67:3:12). Each focus is the word's first letter, so a pause after the word can't change it. The notes match «والطاءُ والدالُ وتا منه ومن عُليا الثنايا» (v. 16).
  - أَلْ is gone from the noticeText.
  - `more` now has 4 entries, the limit.
- **ظ in taraf:** not needed.
  - The card teaches ظ ذ ث as one مخرج, «للعليا من طرفيهما» (v. 17–18). ذّ (#3) and ث (#7) already show that place.
  - ظ's own sound is taught with dad-zha (unit 6) and sifat-istila (ٱلْغَيْظِ).
  - A word from outside الملك would only add a letter whose مخرج is already shown.
- **shafatan.** New جَهَنَّمَ (67:6:5), focus نّ. The غنة of ن comes from الخيشوم and the note is correct.
- **hams.**
  - #5 is now أَهْلَكَنِىَ (67:28:4), focus `هْلَكَ`. The ل in the focus is مجهور. The note names only هْ and كَ, so it is not wrong, but focus `هْ` alone would be tighter. This is optional and not counted.
  - #6 is the new الجهر case, رِزْقَهُۥ (67:21:7), focus زْ. The note is correct: جهر is the breath held back.
  - Dropping ٱلذِّكْرَىٰ is fine, because ك is still covered by #5.
- **shidda.**
  - #4 is now وَبِئْسَ (67:6:6), focus ئْ. حفص pronounces the همزة fully. The note is correct: ئْ is شدة, then سَ is رخاوة.
  - تُحْشَرُونَ is now a `hear`, and its focus sits inside the word.
  - The Hear set now goes full stop, part flow, free flow, as the noticeText promises.

No new problems were found.

### Final verdicts
| Lesson | Verdict |
|---|---|
| makharij-jawf | ACCEPT |
| makharij-halq | ACCEPT |
| makharij-aqsa | ACCEPT |
| makharij-wasat | ACCEPT |
| makharij-taraf | ACCEPT (no ظ needed) |
| makharij-shafatan | ACCEPT |
| sifat-hams | ACCEPT |
| sifat-shidda | ACCEPT |
| sifat-istila | ACCEPT |
| sifat-safir | ACCEPT |
| sifat-inhiraf | ACCEPT. Merge it together with the dad-zha proposal, because `يَحُضُّ` 107:3 is still dad-zha#4 in rules.json. |
| maratib | No examples: ACCEPT |

Findings left: 0 BLOCKER, 0 MAJOR, 0 MINOR.
