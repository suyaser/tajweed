# Review: example proposals, units 2–3

Reviewer: independent. Date: 2026-11-21. Standard: `docs/15-example-strategy.md`.
Lessons: izhar, idgh-g, idgh-n, iqlab, ikhfa, qal-s, qal-k, sakinayn (unit 2: الناس، الفلق، الإخلاص); muttasil, munfasil, mithlayn (unit 3: المسد، النصر، الكافرون).

## How it was checked
- **Text, ayah ends and pause signs.** A script compared every example and contrast (`text`, `word_from`/`word_to`) with `public/data/surah/NNN.json`. It also listed every ayah end and every `marks` entry touching a span.
  - All 110 spans (99 examples, 11 contrasts) match the Tanzil words exactly.
  - No span crosses a pause sign. Four spans touch one: iqlab#5 and mithlayn#4 start after ۖ; iqlab#7 ends at ۚ; iqlab#7's contrast starts after it; izhar#7's contrast starts after ۚ. All of these are correct.
- **Checker.** I ran `EXAMPLES_DIR=docs/examples/proposals LESSONS=… REPORT=1 npx vitest run src/content/examples.check.test.ts`. It gave 0 errors and 3 warnings: izhar#2 m-izhar, mithlayn#6 silent-letters, munfasil#3 silent-letters. I judged all three tolerable:
  - The مْ of أَنْعَمْتَ is a plain م.
  - The silent ا comes after the target, and the note says it is not read.
  - Every و منفصل in جزء عمّ is written with ا۟.
- **"None in the unit's surahs" claims.** I dumped the tajweed spans of 1, 109–114 and scanned 78–114. All the claims hold:
  - idgh-g: there is no case in 112–114 or الفاتحة.
  - idgh-n: the only case is يَكُن لَّهُۥ (112:4).
  - iqlab: there is no joined case in 109–114. تَوَّابًۢا and مَّسَدٍۭ end their ayahs.
  - muttasil: the only case in 109–111 is جَآءَ (110:1). There is no و متصل in 78–114, and the only ي متصل is وَجِا۟ىٓءَ.
  - izhar: in 78–114 the only ن/tanween + غ is أَجْرٌ غَيْرُ (84:25, 95:6).
  - sakinayn: there is no tanween + همزة الوصل inside one ayah in 78–114.
  - qal-k: no ayah of 109–114 ends on ج.
  - mithlayn: there is no مثلين outside ن/م in 109–114 or الفاتحة.
- **Books.** Live Shamela timed out on every request today, as it did on 2026-11-19 (`docs/04-content-review.md` l.185). The rulings below therefore rest on:
  - the locators already verified in `docs/04-content-review.md` and on the rule cards;
  - the standard texts:
    - تحفة vv. 6–16 for the letter groups, the يَنْمُو exceptions and the لام/راء without غنة;
    - الجزرية v. 22 for قطب جد;
    - الجزرية v. 51 for «وبل لا»;
    - الميزان 38104/129 with هداية القاري 1/235–236 for the لين merge;
    - هداية القاري 1/284–286 and غاية المريد 7311/125 for 4/5 counts in both madds;
    - الوافي 38075/136 for ل/ر without غنة.
  - **Before release, reopen the cited pages on live Shamela.**

## Rulings on the points asked
- **Letter groups.** All examples sit in the right group:
  - إظهار: ء هـ ع ح غ خ;
  - يَنْمُو;
  - ل ر;
  - ب;
  - the other 15 letters.
- **Exceptions.** دُنْيَا / بُنْيَانٌ / قِنْوَانٌ / صِنْوَانٌ, مَنْ ۜ رَاقٍ, and يسٓ / نٓ are not used anywhere.
- **Ghunnah of الإخفاء.** Heavy before ص ض ط ظ ق and light otherwise. Every claim follows this: ق ق ق ظ ض are heavy; ش ت ذ ت د are light.
- **القلقلة.**
  - All nine صغرى examples are a ساكن letter mid-word or at a word end mid-ayah.
  - All nine كبرى examples are on the ayah's last letter with `stop: true`.
  - All five letters appear in both lessons.
  - **وَتَبَّ: acceptable as written.**
    - The note ("many teachers…") matches the card's `needs-teacher` wording and الميزان's record of د. أيمن سويد's reservation.
    - The example is in `more`, not in a core role.
    - Check questions also draw on `more`, so no question should ask the learner to *assert* a third level.
- **التقاء الساكنين.**
  - The حرف مد drops in فِى، ذُو، إِذَا.
  - The default كسرة goes to بَلْ and to the tanween: نُوحُنِ ٱبْنَهُ.
  - ميم الجمع takes a ضمة. مِنْ takes a فتحة before ال.
  - All of this is correct. In بَلِ ٱلَّذِينَ, the second ساكن is the لام التعريف inside لّ, so the كسرة is right.
- **المتصل and المنفصل.** Both are 4 or 5 counts for حفص من الشاطبية. Every note says this, and none says 6 or 2. All examples are mid-ayah, so the length is heard while joining.
- **المثلين.**
  - هَل لَّكَ is مثلين صغير.
  - أَو وَّزَنُوهُمْ is a لين و (a ساكن و after a فتحة) before و. It merges and counts as مثلين صغير, like عَصَوا وَّكَانُوا (الميزان 38104/129; هداية القاري 1/235–236, as recorded in 04 #21).
  - The حرف مد exception (فِى يَوْمٍ) is correctly left out.
- **`stop: true` on ayah-final examples.** It is set on izhar#5 #8 #9, idgh-g#6 #7 #8 #9, idgh-n#6 #8 #9, iqlab#3 #6, ikhfa#9 and sakinayn#1. In every one, the joining the rule needs lies *inside* the span, between its words or inside one word. The stop falls only on the last letter, after the target, so nothing the rule needs goes unheard.

---

## izhar: ACCEPT
- All six letters are covered, with ن in one word, ن across words, and tanween.
- The anchor حَاسِدٍ إِذَا (113:5) is from the unit and joined.
- Of the contrast pair, عَنْهُ (111:2) has إظهار and إِنَّهُۥ (110:3) has a held غنة. It is a true minimal pair.
- Small remarks, no fix needed:
  - The contrast إِنَّهُۥ also carries صلة صغرى (a later lesson). It is only a contrast, and the note describes the نّ correctly.
  - #5 وَٱنْحَرْ stops on a ر, which is a later lesson, after the target.

## idgh-g: FIX
1. **MINOR. idgh-g#7 (`note`/`noteAr`).**
   - Current text: "only a two-count غنة on the ي" / «بل غنة حركتين على الياء».
   - **Evidence.**
     - The merge into ي is ناقص (incomplete). The غنة that remains belongs to the ن, not to the ي. The card says: "With ي and و … the غنة of the نون stays".
     - The anchor note (#1) already says it correctly: «تبقى غنتها».
   - **Replacement.**
     - en: "مَن runs into يَخْشَىٰ: no full ن is heard, but its two-count غنة stays."
     - ar: «تتصل مَن بـيَخْشَىٰ فلا تُنطق النون كاملة، وتبقى غنتها حركتين.»

Everything else checks out:
- All four letters, with ن and with tanween.
- The complete merges (ن م) and the incomplete ones (ي و) are labelled correctly.
- None of the exceptions is used.
- The contrast pair مَن يَخْشَىٰ / لِمَنْ خَشِىَ is excellent.

## idgh-n: FIX
1. **MINOR. idgh-n#6 (`why`).**
   - Current text: "the phrase of the استعاذة".
   - **Evidence.** The استعاذة says مِنَ ٱلشَّيْطَٰنِ ٱلرَّجِيمِ: definite, so there is no tanween and no إدغام. شَيْطَٰنٍ رَّجِيمٍ (81:25) is a different phrase.
   - **Replacement.** Change the `why` to "Tanween into ر. Ends the ayah; the target is joined inside it."
   - The `why` is not shown to learners, but the claim is wrong.

Everything else checks out:
- ن/tanween + ل and + ر.
- No غنة, per الشاطبية (الوافي 38075/136).
- مَنْ ۜ رَاقٍ is not used.
- The notice pair مِّن رَّبِّكَ / مِّن مَّسَدٍۭ is a true minimal pair.
- Note: the contrast مَّسَدٍۭ is heard with a stop (قلقلة كبرى, taught later in this unit). This is harmless in a contrast.

## iqlab: FIX
1. **MINOR. iqlab#7 (`note`/`noteAr`).**
   - Current text: "the lips meet lightly" / «فتنطبق الشفتان برفق».
   - **Evidence.**
     - The card marks the lip position `needs-teacher`: إطباق or فرجة, "Follow your teacher".
     - The proposal's own notes promise to say only "hidden م".
     - This note takes the إطباق side.
   - **Replacement.**
     - en: "Before ب the تنوين of يَوْمَئِذٍۭ becomes a hidden م, with a two-count غنة."
     - ar: «قبل الباء ينقلب تنوين يَوْمَئِذٍۭ ميمًا مخفاة بغنة حركتين.»
2. **MINOR. iqlab#6 (`noteAr`).**
   - Current text: «ينقلب التنوين في لَنَسْفَعًۢا».
   - **Evidence.** This is نون التوكيد الخفيفة written as a tanween, not a tanween. The English note ("tanween-written ن") and the coverage line get it right; the Arabic does not.
   - **Replacement.** «تنقلب نون التوكيد (المرسومة تنوينًا) في لَنَسْفَعًۢا ميمًا مخفاة قبل الباء.»

Everything else checks out:
- In one word, across words, and with tanween.
- The notice pair يَوْمَئِذٍۭ بِجَهَنَّمَ / يَوْمَئِذٍ يَتَذَكَّرُ (89:23) sits on either side of the ۚ without crossing it. It is the best pair in the set.

## ikhfa: ACCEPT
- In one word: #2 #5 #7 #8 #10. Across words: #1 #4 #9. Tanween: #3 #6.
- Heavy letters: ق ظ ض. Light letters: ش ت ذ د. Every heavy/light claim is right.
- The anchor مِن شَرِّ (113:2) is the unit's only kind of case.
- Of the contrast pair, فَأَنتَ has a hidden ن and عَنْهُ, the next word in 80:10, has a clear one.

## qal-s: ACCEPT
- All five letters appear, mid-word and at a word end while joining.
- No example sits at an ayah end or before a pause sign.
- The anchor يَلِدْ (112:3) is the book's own «لم يلد ولم».
- The contrast مُنذِرُ (الإخفاء) has a ساكن ن mid-word with no bounce. It is valid.

## qal-k: ACCEPT
- Five of the seven core examples are from the unit's surahs, all on the ayah's last letter with `stop: true`. All five letters appear.
- The notes on #6 and #8 describe العارض correctly; it is taught in unit 1.
- On وَتَبَّ, see the rulings above.

## sakinayn: ACCEPT
- Every case on the card is covered:
  - مد dropped: ي و ا;
  - كسرة;
  - ضمة of ميم الجمع;
  - فتحة of مِنْ;
  - tanween.
- The tanween case (11:42) comes from outside جزء عمّ. I verified that no case exists inside it.
- The anchor فِى ٱلْعُقَدِ (113:4) has the join inside the span. The قلقلة كبرى at the stop is taught one lesson earlier.
- مِنَ ٱلْجِنَّةِ (114:6) is rightly left out: it overlaps ghunnah's anchor ٱلْجِنَّةِ, and the checker counts an overlap as the same words.

## muttasil: ACCEPT
- ا, و and ي are all covered, all joined mid-ayah, at 4/5 counts.
- جَآءَ is the unit's only case.
- The و and ي examples come from outside جزء عمّ. I verified that no clean ones exist inside it.
- The contrast pair شَآءَ / وَشَاهِدٍ is valid.

## munfasil: ACCEPT
- ا, و and ي are covered, including يَٰٓأَيُّهَا as منفصل. Three core examples come from the unit.
- The notice pair وَمَآ أَدْرَىٰكَ / مَآءَهَا differs only in the word boundary. It is a good pair.
- #3's silent ا is unavoidable: every و منفصل in جزء عمّ is written ـُوٓا۟. The note tells the learner the ا is not read.

## mithlayn: FIX
1. **MAJOR. `noticeText` (en and ar).**
   - The Hear prompt names ٱضْرِب بِّعَصَاكَ, which is the *notice* example (#7).
   - **Evidence.**
     - `scripts/merge-examples.mjs` l.25 writes `noticeText` as "the Hear step's 'what to listen for', which names the examples".
     - The Hear step plays the anchor and the two `hear` examples: هَل لَّكَ, ٱذْهَب بِّكِتَٰبِى and رَبِحَت تِّجَٰرَتُهُمْ.
     - The learner is told to listen for a word that is not played. §5 requires the prompt to name the anchor and hear words.
   - **Replacement.**
     - en: "Listen to هَل لَّكَ, ٱذْهَب بِّكِتَٰبِى and رَبِحَت تِّجَٰرَتُهُمْ: the two identical letters become one doubled letter, with no break between them."
     - ar: «استمع إلى هَل لَّكَ وٱذْهَب بِّكِتَٰبِى ورَبِحَت تِّجَٰرَتُهُمْ: يصير الحرفان المتماثلان حرفًا واحدًا مشددًا بلا فصل بينهما.»
2. **MINOR. mithlayn#7: the contrast is not a minimal pair.**
   - The pair is ٱضْرِب بِّعَصَاكَ against مِنْهُ (78:37). The two share nothing but "a ساكن before a letter". §3 asks for a minimal pair, or else two words that differ only in the point being noticed.
   - `contrastWith: izhar` limits the choice to a ن ساكنة before a throat letter, and the ن+ن مثلين is taught as الإدغام بغنة. So no true pair exists inside the allowed lesson.
   - **Two ways to fix it:**
     - Keep the pair and accept it as the best available.
     - Change `contrastWith` in `course.json` to a lesson where a ساكن meets a *different* letter that is not merged. That is a course decision, not something this proposal can fix.
   - The notice word also carries the ض (dad-zha, a later lesson). The proposer acknowledged this.

Everything else checks out:
- ل ب ت ذ د and the لين و.
- The book examples (هَل لَّكَ، ٱذْهَب بِّكِتَٰبِى، رَبِحَت تِّجَٰرَتُهُمْ، وَقَد دَّخَلُوا۟) are used.
- بَل لَّا is the الجزرية's own example, v.51.

---

## Totals
| Severity | Count | Where |
|---|---|---|
| BLOCKER | 0 | — |
| MAJOR | 1 | mithlayn `noticeText` |
| MINOR | 5 | idgh-g#7, idgh-n#6, iqlab#7, iqlab#6, mithlayn#7 |

Verdicts:
- ACCEPT (7): izhar, ikhfa, qal-s, qal-k, sakinayn, muttasil, munfasil.
- FIX (4): idgh-g, idgh-n, iqlab, mithlayn.

## Fixes (round 1)
- **mithlayn `noticeText` (MAJOR):** now names the Hear words هَل لَّكَ، ٱذْهَب بِّكِتَٰبِى، رَبِحَت تِّجَٰرَتُهُمْ (en and ar as given above).
- **idgh-g#7:** note now says the ن's own غنة stays: "no full ن is heard, but its two-count غنة stays" / «فلا تُنطق النون كاملة، وتبقى غنتها حركتين».
- **idgh-n#6:** the wrong استعاذة claim is removed; `why` is "Tanween into ر. Ends the ayah; the target is joined inside it."
- **iqlab#7:** the lip wording is gone; note is "becomes a hidden م, with a two-count غنة" / «ميمًا مخفاة بغنة حركتين». The lesson `notes` now say the notes never describe the lips (teacher matter, as on the card).
- **iqlab#6:** `noteAr` now names نون التوكيد written as a tanween: «تنقلب نون التوكيد (المرسومة تنوينًا) في لَنَسْفَعًۢا ميمًا مخفاة قبل الباء.»
- **mithlayn#7:** the contrast (izhar, مِنْهُ) is kept. The lesson `notes` say that no true minimal pair exists under `contrastWith: izhar`, and that a tighter pair would need a course.json change.
- **qal-k#9 وَتَبَّ (coordinator):** the note no longer calls this the strongest level. It reads "Many teachers, not all, count this as a stronger level" / «ويعدّها كثير من المعلمين، لا جميعهم، مرتبة أقوى».
- **Checker re-run:** 0 errors. The same 3 warnings remain (izhar#2, mithlayn#6, munfasil#3), already judged tolerable above.

## Re-check (round 1)

### Fixes
All six findings are fixed, plus the coordinator's وَتَبَّ change. I checked each one against the current proposal files.

| Finding | What the file says now | Status |
|---|---|---|
| mithlayn `noticeText` (MAJOR) | Names هَل لَّكَ, ٱذْهَب بِّكِتَٰبِى and رَبِحَت تِّجَٰرَتُهُمْ, the anchor and the two hear examples, in en and ar. | Fixed |
| idgh-g#7 | "its two-count غنة stays" / «وتبقى غنتها حركتين». غاية المريد 7311/76 confirms the wording (see the book table). | Fixed |
| idgh-n#6 | The استعاذة claim is gone from the `why`. | Fixed |
| iqlab#7 | No wording about the lips remains in the note. A grep for "lips meet" and «تنطبق» across all 11 files finds nothing. | Fixed |
| iqlab#6 | «نون التوكيد (المرسومة تنوينًا)». هداية القاري 1/158 (OpenITI) confirms it: «نون التوكيد الخفيفة في … {لنسفعا بالناصية} … لأنها ليست تنوينا وإن أشبهته». | Fixed |
| mithlayn#7 | Contrast kept; the reason is now in the lesson's `notes`. I accept it as a course-level limit. | Accepted |
| qal-k#9 وَتَبَّ | "Many teachers, not all, count this as a stronger level". This matches الميزان 38104/75 (see the book table). | Fixed |

### Nothing new broke
- **Text.** All 110 spans still match `public/data` exactly (0 mismatches).
- **Checker.** I re-ran it: 0 errors. The same 3 warnings remain (izhar#2, mithlayn#6, munfasil#3), already judged tolerable.
- **Note lengths.** The new notes are 60–86 characters, within the 120 limit.
- **Commit aa98cb0 (`quizAlso`).** It only *adds* ra-h and ra-l to the excluded wrong answers when the words contain a ر. In units 2–3 that applies to examples such as عَن رَّبِّهِمْ, وَٱنْحَرْ and أَجْرٌ, and it only removes wrong answers that would really be true. No example's own lesson is affected.

### Books, reopened live
Shamela answered this time. I read these pages myself. هداية القاري was read in the OpenITI text (Shamela 22869), cited by printed page.

| Pick | Source and what it says | Result |
|---|---|---|
| izhar anchor حَاسِدٍ إِذَا | غاية المريد 7311/71: إظهار has three degrees, «عليا عند الهمزة والهاء». The تحفة's letter verse is on 9632/2. | ✓ |
| idgh-g anchor فَمَن يَعْمَلْ | غاية المريد 7311/78, exercise 6, lists {فَمَنْ يَعْمَلْ}. 7311/74 gives the four exceptions and يس / ن. | ✓ |
| idgh-g ي/و merge (#7) | غاية المريد 7311/76: «غنة الإدغام في الواو والياء هي غنة المدغم». | ✓ |
| iqlab contrast يَوْمَئِذٍ يَتَذَكَّرُ | The same exercise lists {يَوْمَئِذٍ يَتَذَكَّرُ الْإِنْسَانُ} (and {مِنْ رَبِّهِمْ} for idgh-n). | ✓ |
| iqlab anchor مَنۢ بَخِلَ | غاية المريد 7311/80 cites الليل: 8 and البقرة: 31 (أَنۢبِئْهُم, #9). | ✓ |
| ikhfa heavy/light ghunnah | غاية المريد 7311/90: «تابعة لما بعدها تفخيمًا وترقيقًا»; heavy before حروف الاستعلاء. | ✓ |
| qal-s anchor يَلِدْ | الميزان 38104/74, verbatim: «وتكون وصلا نحو (لم يلد ولم ..)». | ✓ |
| qal-k anchor ٱلْفَلَقِ | الميزان 38104/74: «ووقفا نحو (برب الفلق)». | ✓ |
| qal-s/qal-k levels | الميزان 38104/75: صغرى is «وسط الكلمة … أو وسط الكلام (قد أفلح)»; كبرى is «موقوفا عليه». | ✓ |
| ط as the strongest letter (qal-s#4) | الميزان 38104/75, quoting المرعشي: «أعلى وهو في الطاء». | ✓ |
| وَتَبَّ | الميزان 38104/75 records the three-level view and د. أيمن سويد's reservation: «المدغم لا يقلقل … لا يختلف عن المخفف». So "not all" is correct, and the example stays in `more`. | ✓ |
| sakinayn anchor and cases | الميزان 38104/151–153: the حرف مد is dropped (إِذَا السَّماءُ، ذِي الْمَعارِجِ); the default كسرة (لَمْ يَكُنِ الَّذِينَ); ميم الجمع (هُمُ الْمُفْلِحُونَ); the tanween (أَحَدٌ اللَّهُ). | ✓ |
| muttasil anchor جَآءَ | غاية المريد 7311/125: 4 or 5 counts, with {جَاءَ} (النصر: 1) as the book's own example. | ✓ |
| munfasil lengths | غاية المريد 7311/126: 4 or 5 counts; القصر is not الشاطبية. Its و example is قُوا أَنفُسَكُمْ, also written with the silent ا, which supports #3. | ✓ |
| mithlayn (#2 #3 #5 #6 #7) | الميزان 38104/129 gives رَبِحَت تِّجَٰرَتُهُمْ, ٱضْرِب بِّعَصَاكَ and the حرف مد exception. هداية القاري 1/236–237 lists ربحت تجارتهم، اضرب بعصاك، وقد دخلوا، إذ ذهب. | ✓ |
| mithlayn anchor هَل لَّكَ | هداية القاري 1/212: هل/بل before ل are merged by every reader (هل لكم، بل لا). | ✓ |
| mithlayn#8 أَو وَّزَنُوهُمْ | هداية القاري 1/235–236: «أما إذا سكنت الواو الأولى وانفتح ما قبلها وجب إدغامها … {آووا ونصروا} … لأن حرف اللين بمنزلة الصحيح». The example is correct. | ✓ |

**Not reopened this round.** These rest on the recorded locators and the first review:
- the page in الميزان where مِنْ takes a فتحة (38104/154);
- الجزرية v. 51 («وبل لا»);
- الوافي 38075/136 (ل/ر without غنة);
- the "book's example" remarks in the `why` fields of the `more` examples.

The rules themselves are confirmed above.

### Final verdicts
| Lesson | Verdict |
|---|---|
| izhar | ACCEPT |
| idgh-g | ACCEPT |
| idgh-n | ACCEPT |
| iqlab | ACCEPT |
| ikhfa | ACCEPT |
| qal-s | ACCEPT |
| qal-k | ACCEPT |
| sakinayn | ACCEPT |
| muttasil | ACCEPT |
| munfasil | ACCEPT |
| mithlayn | ACCEPT. The notice contrast is a known course-level limit (`contrastWith: izhar`). |

Open findings: 0 BLOCKER, 0 MAJOR, 0 MINOR.
