# Review: units 5–6 example proposals

Reviewer: independent agent, 2026-11-21. Scope: `docs/examples/proposals/{silah-s,silah-k,badal,lin,ra-h,ra-l,dad-zha,lazim-k,lazim-h,aqwa-maddayn}.json` against `docs/15-example-strategy.md`, the cards in `content/rules.json`, `content/course.json`, and the books.

## How it was checked

- **Checker.** `EXAMPLES_DIR=docs/examples/proposals LESSONS=… REPORT=1 npx vitest run src/content/examples.check.test.ts` gives 0 errors and 2 warnings (silah-s#8 and silah-k#8: the data can't see a صلة at a stop, which is expected). The full run over all lessons has no duplicate-word errors touching these ten lessons.
- **Text.** Every `text` matches `public/data/surah/NNN.json`. For each example I printed the word before, the word after, and the next ayah. Note: the data has **no pause marks** (no ۚ ۖ ۗ), so the checker can't see a span that crosses a pause sign. I checked those by hand from the Madinah muṣḥaf.
- **Audio.** I read the `timings` of all three reciters (husary-muallim, which is the default; husary; minshawy) to see whether they join or stop between words. A gap of about 10 ms means the words are joined. A gap over 300 ms means a pause.
- **Books.** Shamela (shamela.ws) timed out (curl returned 000 after 25 s), as it did in doc 04. I read the OpenITI copies of the same Shamela texts instead:
  - هداية القاري (Shamela 22869), cited below as **HQ**, with volume/page from the `PageV` markers
  - النشر (22642)
  - الشاطبية (7754)

  I could not open غاية المريد, الميزان, تحفة or الجزرية directly, so every claim below is checked against HQ or النشر.

Key passages read:
- هاء الكناية: HQ 1/355–360
- البدل: HQ 1/332–334
- أقوى المدين (the order, and its examples آمين، برءآؤا، المآب، رأى أيديهم): HQ 1/349–352
- اللين: HQ 1/352–354
- the ر, including stopping, مصر/القطر and يسر/ونذر: HQ 1/121–134
- اللازم الكلمي والحرفي (each letter, ع 4 or 6 with 6 preferred, طسم merged, ن and يس with إظهار from الشاطبية): HQ 1/340–345
- آلآن with الإبدال first or التسهيل: HQ 2/500–501
- the ض mistakes, and أنقض ظهرك، يعض الظالم، فمن اضطر، في تضليل: النشر 1/218–219
- الشاطبية v.177 «وفي عين الوجهان والطول فضلا»

The rule claims in the proposals hold up well. I found **no wrong rule** in any learner-facing `note`, `noteAr` or `noticeText`. The findings are about the anchor choice, coverage, focus, stop/audio details, and one wrong `why`.

---

## silah-s · FIX

Every example is right for Hafs (HQ 1/356–360):
- the صلة between two voweled letters
- فِيهِۦ مُهَانًا as the one place where Hafs agrees with Ibn Kathir
- أَرْجِهْ and فَأَلْقِهْ ساكنة, وَيَتَّقْهِ with قصر, يَرْضَهُ with قصر
- وَعَدَّدَهُۥ: no صلة at a stop

Every two-word span is joined by all three reciters (10 ms gaps), and no span crosses a pause sign. The contrast فِيهِ (78:3) has no صلة, because a ساكن comes before the هاء: HQ's "الحالة الرابعة".

1. **MINOR · coverage (no example).** The card's first condition is "No صلة if the letter before **or after** the هاء is ساكن: …لَهُ ٱلْمُلْكُ". The case of a ساكن *before* the هاء is shown, by the contrast فِيهِ. The case of a ساكن *after* it (HQ's "الحالة الثانية", {له الملك}) is not shown anywhere, which breaks strategy §2.6.
   - **Replacement:** add a `more` example: 98:5, words 7–8, `لَهُ ٱلدِّينَ`, focus `هُ`, stop false.
     - It is in the unit (البينة), and all three reciters join it (10/10/10 ms).
     - Only `muttasil` uses 98:5, and on word 9 (حُنَفَآءَ), so there is no overlap.
     - Note: "لَهُ ٱلدِّينَ: a ساكن follows the هـ, so no صلة." / noteAr «لَهُ ٱلدِّينَ: بعد الهاء ساكن فلا صلة.»
2. **MINOR · `noticeText.en`.** "stretched into a two-count و **between two vowels**". The rule is between two *voweled letters* (بين متحركين; the card says "between two voweled letters"). The Arabic text is already right.
   - **Fix:** "…stretched two counts, like a small و, because the letters on both sides of it have vowels."

## silah-k · ACCEPT

All eight examples are هاء الكناية between two voweled letters, before a همزة in the next word. The card's 4 or 5 counts (the same as المنفصل) matches HQ 1/360 (التنبيه الأول: «فالصلة من قبيل المد المنفصل»).
- يَرَهُۥٓ أَحَدٌ (90:7) is HQ's own example.
- طَعَامِهِۦٓ at the end of the ayah, with no صلة at the stop, is right. The next ayah begins أَنَّا, as the `why` says.
- All spans are joined by all three reciters.
- The notice pair مَالُهُۥٓ إِذَا / مَالُهُۥ وَمَا is a true minimal pair.
- Only #1 is from the unit. 104:3 is the only كبرى in the unit's surahs (99:7–8 يَرَهُۥ end their ayahs), so that is justified.

## badal · FIX

Two counts for Hafs is confirmed: HQ 1/333 says «فالقصر لجميع القراء والتوسط والمد زائدان لورش من طريق الأزرق». The و, ا and ي forms are all covered, and every example is joined. The notice pair رَّءَاهُ / جَآءَ is good: جَآءَ has no همزة before its مد.

1. **MINOR · badal#6 `why` is wrong.** It says "The ر … is light here". In وَلَلْءَاخِرَةُ the ر has a **فتحة** (خِرَةُ), so it is heavy (HQ 1/121, and the ra-h card: "It has فتحة or ضمة"). The learner can't see this field, but it is a false tajweed claim.
   - **Fix:** "The ر is heavy (فتحة), already met in tafkhim; the target is the ءَا."
2. **MINOR · badal#4 repeats the anchor.** The Say slot asks for "New words … covering further cases" (§3). #4 is ءَامَنُوا۟ again (95:6), in the same phrase as the anchor (ٱلَّذِينَ ءَامَنُوا۟ وَعَمِلُوا۟).
   - **Replacement:** 79:38, word 1, `وَءَاثَرَ`, focus `ءَا`, stop false.
     - It is a new word with the ا form, and it is unused in every proposal.
     - All three reciters join it to ٱلْحَيَوٰةَ (10 ms).
   - Alternative: 88:25, word 3, `إِيَابَهُمْ` (a second ي form; it ends the ayah, but the focus `إِي` is inside the word).

## lin · FIX

اللين is lengthened only at a stop, with 2, 4 or 6 counts (HQ 1/353–354: «وأما في حالة الوقف ففيه المدود الثلاثة … لجميع القراء»). Joined, it has القصر. The notes are right, and so is the point that only the last يْ of عَيْنَيْنِ is stretched. The claim that the unit's surahs have no لين at a stop is true: I checked every ayah-final word of 98–104. The pair وَٱلصَّيْفِ / ٱلْفِيلِ is good.

1. **MINOR · lin#6 `نَوْمٌ` (2:255) is a stop rule at a pause sign, not at an ayah end.** Strategy §2.2 says "A rule about stopping … uses the ayah's end".
   - I searched the whole Quran: خَوْفٍۭ (106:4) is the **only** ayah-final word with وْ followed by a single letter. So no ayah-end replacement exists for a second وْ.
   - The timings show all three reciters pause after نَوْمٌ (5750 / 400 / 300 ms), so the stop is heard.
   - **Fix:** keep it, and put this evidence in `why` ("the only second وْ; all three reciters pause at the ۚ, 5.7 s / 0.4 s / 0.3 s"). The و form is already covered by #2, so dropping #6 would also be acceptable.

## ra-h · ACCEPT

Every claim matches HQ 1/121–132 and الجزرية vv.41–43 (quoted in HQ 1/129):
- رَبَّكَ, شَرُّ: the ر has a فتحة or ضمة
- زُرْتُمُ, فَأَثَرْنَ: رْ after a ضمة or فتحة
- ٱلْمِرْصَادِ: HQ lists it by name among the three heavy letters that make the ر heavy: «الصاد في … لبالمرصاد»
- ٱرْجِعِىٓ at the start of its ayah: the كسرة of the همزة الوصل is not original, HQ 1/122
- خُسْرْ and ٱلْفَجْرْ at a stop: a ساكن with a ضمة or فتحة before it, HQ 1/128 and 1/132 (التنبيه الخامس, the majority view, «وبه أقرىء»)

6 of 7 core examples are from the unit. The noticeText names the anchor and hear #2. The contrast لَكَ has no ر.

Not a defect: خُسْرٍ and ٱلْفَجْرِ are heavy only with a plain سكون; stopped with الروم they are light (HQ 1/129, 1/132). That is right for these reciters, who stop with a plain سكون. Adding "(with سكون)" to the two notes would future-proof them for the rawm-ishmam lesson.

## ra-l · FIX

All the light cases are confirmed by HQ 1/121–132:
- رِ (ٱلْخَيْرِ, ٱلْبَرِيَّةِ)
- رْ after an original كسرة with no heavy letter after it (وَٱسْتَغْفِرْهُ, فِرْعَوْنَ)
- a stop after يْ: «خبير» is HQ's own example
- **ٱلْمَقَابِرَ at the stop is light**: «الأول: أن تسبق الراء كسرة نحو قدر …». Here the كسرة of بِ comes directly before the ر, with no ساكن between them, and الروم is not used on a فتحة, so the plain stop is light. The note is right.
- حِجْرٍ is HQ's own example for a ساكن that is not حرف استعلاء, after a كسرة
- يَسْرِ (HQ 1/131: «الوجهان … والأول هو الأرجح») and ٱلْقِطْرِ (HQ 1/130–131: «واختار … الترقيق في القطر … وهذا هو المعمول عليه») both have two readings, light preferred

The notice pair فِرْعَوْنَ / مِرْصَادِ is an excellent near-minimal pair. Leaving فِرْقٍ out is justified.

1. **MINOR · ra-l#8 `ٱلْقِطْرِ` (34:12) has stop: true at a pause sign (ۖ), not an ayah end.**
   - husary-muallim stops there (4700 ms), but **husary joins** (10 ms) and minshawy pauses only 400 ms.
   - With husary the learner hears ٱلْقِطْرِ with its كسرة, which is light anyway, while the note says "Stopping: ٱلْقِطْرْ. Both readings". The two-reading point is not audible.
   - ٱلْقِطْرِ occurs only here, so no ayah-end replacement exists.
   - **Fix:** keep it as `more`. Add to `why`: "only the default reciter stops here; with Husary it is heard joined (light by its كسرة)".

## dad-zha · FIX

The pair and the places of articulation are right. Four examples are النشر's own words for the ض cases that need care (1/218–219):
- أَنقَضَ ظَهْرَكَ, يَعَضُّ ٱلظَّالِمُ: a ض next to a ظ
- ٱضْطُرَّ: a ض before a heavy letter that is مطبق
- تَضْلِيلٍ: a ساكن ض

The `source` fields can cite النشر for these. بِضَنِينٍ with ض is right for Hafs. The notice contrast نَصْرُ has no ض or ظ and has a heavy letter (tafkhim).

1. **MINOR · dad-zha#4 note makes a claim about the sound of ض.** noteAr «بلا شائبة ظاء ولا زاي» ("without a trace of ظ"). النشر lists the mistakes as «يخرجه ظاء … يشمه الزاي»: saying ض *as* ظ, and giving it a hint of ز. "No trace of ظ" goes further, and takes a side in the modern disagreement the card itself leaves to the teacher (review note: "a sound close to ظ argued from old descriptions").
   - **Fix:** note "ٱلْأَرْضُ: ض with ضمة from the side of the tongue; don't turn it into ظ or give it a ز sound." / noteAr «ضاد مضمومة من حافة اللسان، لا تقلبها ظاءً ولا تُشمّها زايًا.»
2. **MINOR · dad-zha: unit surahs not first.** 1 of 7 core examples is from unit 6. The Say slots #4 (ٱلْأَرْضُ, 99:1) and #5 (تَضْلِيلٍ, 105:2) come from earlier units, while the unit has clear, unused ض words:
   - **Replacement for #4:** 94:2, word 1, `وَوَضَعْنَا`, focus `ضَ`, stop false.
     - It is a ض with فتحة, joined to عَنكَ by all reciters (10 ms), and unused in every proposal.
   - Or 93:5, word 4, `فَتَرْضَىٰٓ`, focus `ضَ`, stop true (it ends the ayah on ىٰ; unused).
   - Keep تَضْلِيلٍ, the ساكن case from النشر. 93:1 وَٱلضُّحَىٰ is taken by lam-s.

## lazim-k · FIX

The مثقل examples are right, and the مخفف is right for Hafs:
- HQ 1/340: «آلآن … على وجه الإبدال … وليس في التنزيل غير هذين الموضعين بالنسبة لرواية حفص»
- HQ 2/501: الإبدال with a long مد, read first, or التسهيل with no مد

Other checks:
- أَتُحَٰٓجُّوٓنِّى has two لازم مثقل for Hafs (a doubled نّ).
- ٱلطَّآمَّةُ ٱلْكُبْرَىٰ is joined by all three reciters, so the six is heard without a stop. The notice pair against ٱلْمَاعُونَ (arid) is good.
- ءَآلْـَٰٔنَ (10:51) doesn't clash with tashil, which uses 10:91.

1. **MINOR · lazim-k#6 focus doesn't match the note.**
   - Note: "six on the ا before جّ, six on the و before نّ".
   - Focus: `جُّوٓنِّ` covers only the و. The highlighted stretch should hold both مدّات the note names.
   - **Fix:** focus `حَٰٓجُّوٓنِّ`. Or keep the focus and cut the note to the و: "Six on the و before the doubled نّ (the ا before جّ is six too)".

## lazim-h · FIX

Every letter-name claim checks against HQ 1/340–345 and الشاطبية v.177:
- الٓمٓ: the لام is مثقل and the ميم مخفف at the stop. The ألف has no مد.
- نٓ and صٓ are 6.
- يسٓ: يا is 2, سين is 6, مخفف from الشاطبية «وطريقها الإظهار».
- طسٓمٓ: Hafs merges the ن of سين into the ميم, so سين is مثقل. HQ 1/343 says «فمن المثقل في الشعراء والقصص لأنه ضمن المدغمين».
- كٓهيعٓصٓ: 6 / 2 / 2 / 4 or 6 / 6.
- عٓسٓقٓ: ع is 4 or 6, 6 preferred (HQ 1/342: «غير أن الإشباع هو الأفضل»; الشاطبية «والطول فضلا»).
- حمٓ: حا is 2, ميم is 6.

All eight letters of نقص عسلكم appear. The pair قٓ / ٱلْحَآقَّةُ is good.

1. **MINOR · lazim-h#6 focus vs coverage.**
   - `coverage` counts #6 as an ع case ("ع 4 or 6: #6 #8"), and the note gives counts for all five letters, but the focus is only `كٓ`.
   - **Fix:** focus `كٓهيعٓصٓ` (the whole opening, which is the point of this example). Or keep `كٓ` and drop #6 from the ع coverage.
2. **MINOR · lazim-h#3 `صٓ` (38:1) and #7 `قٓ` (50:1) are stop: true, but husary and minshawy join them** (10 ms; only the default reciter pauses, about 5 s). The 6 counts are the same either way (HQ 1/345: «مشروط بوصل … أما إذا وقف … فالمخفف بالإجماع»), so nothing wrong is taught. But the `stopping` flag feeds `rulemap.ts` detection and the stop label.
   - **Fix:** set `stop: false` on 38:1 and 50:1. The rule doesn't depend on the stop, and نٓ ۚ (68:1), whose note says "Stop at the ۚ", is the one to keep as stop: true.

## aqwa-maddayn · FIX

The order لازم › متصل › عارض › منفصل › بدل is exactly HQ 1/349 («المد اللازم فالمتصل فالعارض للسكون فالمنفصل فالبدل. ولا يجوز بحال تقديم مرتبة منها على الأخرى»), with the verse «أقوى المدود لازم فما اتصل…».

Four examples are HQ's own examples (1/351–352):
- ءَآمِّينَ: بدل + لازم, «يجب الإشباع وصلا ووقفا»
- بُرَءَٰٓؤُا۟: بدل + متصل
- ٱلْمَـَٔابِ: بدل + عارض
- رَءَآ أَيْدِيَهُمْ: بدل + منفصل joined, «وأما عند الوقف على رأى فيتعين … البدل»

رِئَآءَ, وَجَآءُوٓ أَبَاهُمْ and مُسْتَهْزِءُونَ are right too. Leaving out the مد الفرق words is right. The notice pair ءَآمِّينَ / ءَامِنِينَ is a real minimal pair, and the contrast has only a بدل.

1. **MAJOR · aqwa#1 anchor is not the clearest case.** يُرَآءُونَ (107:6) at a stop is بدل + عارض. The strategy says the anchor is "the single clearest, most typical case", and this one is the least audible of the four combinations, for two reasons:
   - The winner (العارض) may be read with **2** counts, which sounds the same as a plain بدل. The noticeText's "not two only" then contradicts what the learner may hear.
   - The same word has a متصل just before it (رَآءُ, 4–5). The long sound the learner hears is from that متصل, not from the focus ءُو.

   The course itself moved this lesson after the لازم lessons because "its strongest case is بدل + لازم" (doc 04, course order #4). The card's first example and the old notice are وَلَآ ءَآمِّينَ.
   - **Fix:** make 4:38 `رِئَآءَ` (already #2, the card's بدل + متصل example) the anchor. It has a single حرف مد held 4–5 instead of 2, and it is joined to ٱلنَّاسِ by all reciters.
   - Move يُرَآءُونَ to `hear`, which keeps the unit-4 surah.
   - Rewrite `noticeText` around رِئَآءَ:
     - en: "Listen to رِئَآءَ: the ا has a همزة before it (بدل) and after it (متصل); the stronger متصل wins, four or five counts."
     - ar: «استمع إلى «رِئَآءَ»: الألف بين همزتين، بدل ومتصل، فيُعمل بالمتصل الأقوى أربعًا أو خمسًا.»
2. **MINOR · `coverage` names an example that doesn't exist.** "بدل+عارض: #1 #4 **#9**", but there are 8 examples. The stop case is #8 (مُسْتَهْزِءُونَ).
   - **Fix:** "#1 #4 #8".

---

## Totals

| Lesson | Verdict | BLOCKER | MAJOR | MINOR |
|---|---|---|---|---|
| silah-s | FIX | 0 | 0 | 2 |
| silah-k | ACCEPT | 0 | 0 | 0 |
| badal | FIX | 0 | 0 | 2 |
| lin | FIX | 0 | 0 | 1 |
| ra-h | ACCEPT | 0 | 0 | 0 |
| ra-l | FIX | 0 | 0 | 1 |
| dad-zha | FIX | 0 | 0 | 2 |
| lazim-k | FIX | 0 | 0 | 1 |
| lazim-h | FIX | 0 | 0 | 2 |
| aqwa-maddayn | FIX | 0 | 1 | 1 |
| **Total** | 2 ACCEPT · 8 FIX | **0** | **1** | **12** |

No BLOCKERs. Every rule claim made to the learner (notes, noteAr, noticeText) is right for حفص من طريق الشاطبية, as far as HQ, النشر and الشاطبية cover it. غاية المريد, الميزان, تحفة and الجزرية could not be reopened, because Shamela was unreachable.

## Fixes (round 1)

Proposer, 2026-11-21. Every replacement was checked in `public/data` (text, neighbours, reciter timings). Checker: 0 errors.

- **aqwa-maddayn (MAJOR):** the anchor is now رِئَآءَ (4:38). يُرَآءُونَ (107:6) moves to `hear`, with وَجَآءُوٓ أَبَاهُمْ as the second hear. `noticeText` uses the review's wording. Coverage is now "بدل+متصل #1 #6; عارض #2 #4 #8; منفصل #3 #5; لازم #7".
- **silah-s:** added `more` لَهُ ٱلدِّينَ (98:5 w7–8, focus هُ). The checker warning "data does not see silah-s" on it is the point of the example, and its `why` says so. `noticeText.en` now says "because the letters on both sides of it have vowels".
- **badal:**
  - #4 is now وَءَاثَرَ (79:38 w1). All three reciters join it (10 ms).
  - #6 `why` corrected: the ر of وَلَلْءَاخِرَةُ has a فتحة and is heavy.
- **lin#6 نَوْمٌ:** `why` now gives the evidence. It is the only second وْ, and all three reciters pause at the ۚ (5.75 s / 0.4 s / 0.3 s).
- **ra-l#8 ٱلْقِطْرِ:** `why` now gives the evidence. This is its only place. husary-muallim stops (4.7 s) and husary joins (10 ms), where the كسرة makes it light anyway.
- **ra-h:** خُسْرْ and ٱلْفَجْرْ now say "Stopping with سكون", to keep them consistent with الروم.
- **dad-zha:**
  - #4 is now وَوَضَعْنَا (94:2 w1, unit 6, joined 10 ms). Its note uses النشر's wording: «لا تقلبها ظاءً».
  - The anchor, #5, #8 and #10 now also cite النشر 1/218–219.
- **lazim-k#6:** the focus is now حَٰٓجُّوٓنِّ, covering both مدّات the note names.
- **lazim-h#6:** the focus is the whole كٓهيعٓصٓ.
- **lazim-h صٓ (38:1) and قٓ (50:1):** kept `stop: true`. The default reciter, husary-muallim, pauses there (5.2 s and 5.0 s); husary and minshawy join. Following the coordinator's rule that the flag matches the default reciter, the `why` now records the timings. The 6 counts are the same either way (HQ 1/345).

## Re-check (round 1)

Reviewer, 2026-11-21.

**Checker.** I re-ran it on these ten lessons: 0 errors and 3 warnings. The warnings are silah-k#8 and silah-s#8 (no صلة at a stop) and the new silah-s#10. The full run over all lessons also has 0 errors.

**My correction is accepted.** The data does carry `marks`, and the checker found no span crossing a pause mark in any of these lessons.

How I checked each fix:
- **The data.** Text, the words on either side, the next ayah, and the timings of all three reciters.
- **Duplicates.** None of the new words (98:5 w7–8, 79:38 w1, 94:2 w1) is used in any other proposal.
- **The books.** The citations are the same as in round 0.

| Finding | Fix | Verdict |
|---|---|---|
| aqwa#1 (MAJOR) | The anchor is رِئَآءَ (4:38). It is joined to ٱلنَّاسِ and is بدل + متصل, which wins, at 4 or 5 counts (HQ 1/351, the برءآؤا reasoning). يُرَآءُونَ moves to hear. `noticeText` names only رِئَآءَ, the anchor. | Resolved |
| aqwa coverage | "#1 #6 / #2 #4 #8 / #3 #5 / #7" matches the eight examples. | Resolved |
| silah-s, the "ساكن after" case | لَهُ ٱلدِّينَ (98:5 w7–8, in the unit) is joined by all three reciters. Its note is right (HQ 1/356, الحالة الثانية). The warning on it is expected and explained in `why`. The coverage line maps both ساكن cases correctly. | Resolved |
| silah-s noticeText.en | "because the letters on both sides of it have vowels" now means the same as «بين متحركين». | Resolved |
| badal#4 | وَءَاثَرَ (79:38) is a new word with an ا-form بدل, joined, so two counts. | Resolved |
| badal#6 `why` | The ر is now described as heavy (it has a فتحة). | Resolved |
| lin#6, ra-l#8 | The timing evidence is in `why` and matches my measurements. | Resolved |
| dad-zha#4 | وَوَضَعْنَا (94:2) is in the unit and joined. The new note uses النشر's wording («لا تقلبها ظاءً»). «شائبة» no longer appears in any proposal. 2 of 7 core examples are now from the unit, and the coverage line says "ض with فتحة: #4". | Resolved |
| lazim-k#6 | The focus حَٰٓجُّوٓنِّ covers both مدّات the note names. | Resolved |
| lazim-h#6 | The focus is the whole كٓهيعٓصٓ, so the ع coverage claim now holds. | Resolved |
| lazim-h صٓ / قٓ `stop` | Kept as `stop: true`. I withdraw this finding. Under the coordinator's rule, the flag follows the default reciter, and husary-muallim pauses there (5.2 s and 5.0 s). The 6 counts are the same either way (HQ 1/345), and `why` records the timings. | Withdrawn |
| ra-h (optional) | خُسْرْ and ٱلْفَجْرْ now say "with سكون", in English and Arabic. Right per HQ 1/132. | Done |

**Code change.** `quizAlso` no longer offers ra-h or ra-l as a wrong answer when the words contain a ر. None of these examples relied on ra-h or ra-l showing up as a wrong option, so nothing needs to change.

**Nothing new broke.**
- Role counts and order are valid.
- Every changed `note` has a `noteAr`.
- No new later-lesson rule appears in a core example. وَءَاثَرَ only has tabii; وَوَضَعْنَا only has tafkhim.

### Final verdict

| Lesson | Verdict |
|---|---|
| silah-s | ACCEPT |
| silah-k | ACCEPT |
| badal | ACCEPT |
| lin | ACCEPT |
| ra-h | ACCEPT |
| ra-l | ACCEPT |
| dad-zha | ACCEPT |
| lazim-k | ACCEPT |
| lazim-h | ACCEPT |
| aqwa-maddayn | ACCEPT |

Open: 0 BLOCKER, 0 MAJOR, 0 MINOR. One finding was withdrawn (lazim-h `stop`).
