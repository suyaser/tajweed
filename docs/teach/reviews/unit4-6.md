# Review: teaching texts, units 4–6

Reviewer: independent. Date: 2026-11-21. Standard: `docs/16-teaching-strategy.md`, the cards and review notes in `content/rules.json`, and the books in `docs/04-content-review.md`.

## How I checked
- **Checker.** `LESSONS=m-izhar,…,aqwa-maddayn npx vitest run src/content/teach.check.test.ts` passes. There are 0 errors and 4 warnings, all of them card terms used before their lesson (الاستطالة, صفة, التكرير, إمالة). Learn shows those terms' meanings, so the warnings are acceptable.
- **Quoted words.** I searched for every Quranic word quoted in the 15 files in `public/data/surah/*.json`, the app's Tanzil text, after NFC normalisation. All are present and spelt as quoted.
- **Marks in the app.** I downloaded Amiri Quran (Google Fonts v19, the font in `index.html`) and drew its glyphs with fontTools. The results:
  - **U+0652 sukun** is a **round circle** with a hole. Its bounding box is 166×189 units.
  - **U+06DF ۟ (round zero)** is a round circle with a hole. Its bounding box is 157×178 units. On screen it looks the same as the sukun.
  - **U+06E1 (dotless head of خ)** does not appear anywhere in the app's text. The app always uses U+0652 for the sukun.
  - **U+06E0 ۠** is a tall upright oval. This matches "small upright oval".
  - The teaching text itself is set in Noto Sans Arabic, which also draws the sukun as a circle.
- **Where the marks sit.** I counted what letters carry each mark in the app's text:
  - The sukun never sits on an ا.
  - A sukun on و or ي always comes after a فتحة (2423 and 3067 cases).
  - ۟ sits on an ا in about 3700 cases, and on a و after a ضمة in 255 cases.
  - ۟ sits on a ي after a كسرة 9 times (مَلَإِي۟هِ, أَفَإِي۟ن), and once after another ي in بِأَيْي۟دٍ.
- **Books.** I cross-checked the books where the writer flagged a point. غاية المريد 7311/132 gives the قصر of المد العارض and اللين as «القصر حركتان» and gives no "no stretch" view.

## Verdicts
| Lesson | Verdict |
|---|---|
| m-izhar | ACCEPT |
| m-idgham | ACCEPT |
| m-ikhfa | FIX (1 MAJOR, 1 MINOR) |
| mutajanisayn | FIX (2 MINOR) |
| silent-letters | FIX (1 BLOCKER, 1 MAJOR, 2 MINOR) |
| silah-s | FIX (1 MAJOR, 1 MINOR) |
| silah-k | ACCEPT |
| badal | ACCEPT |
| lin | FIX (1 MAJOR, 1 MINOR) |
| ra-h | FIX (4 MAJOR, 1 MINOR) |
| ra-l | FIX (1 MINOR) |
| dad-zha | FIX (1 MINOR) |
| lazim-k | FIX (2 MINOR) |
| lazim-h | FIX (1 MAJOR) |
| aqwa-maddayn | FIX (2 MINOR) |

---

## m-izhar — ACCEPT
- **Map.** Three rulings, decided by the next letter, with 26 letters for الإظهار. This is correct (تحفة 18–23).
- **Accuracy.** The care before و and ف is correct, with تحفة's line quoted exactly.
- **Spot.** "The م carries a sukun (مْ)" makes no claim about the sukun's shape, so it is safe.
- **Arabic.** Natural, and it means the same as the English.

## m-idgham — ACCEPT
- **Accuracy.** المثلين صغير, the full غنة of a مّ, and the order (the second ruling) are all correct.
- **Spot.** "A bare letter followed by a letter with a شدة means merge" holds in the app's text. The first م is bare in هُم مِّن, as in Tanzil. The rule also holds for اللام الشمسية and إدغام النون.

## m-ikhfa — FIX
1. **MAJOR (spot, both languages): the general rule it gives is false in the app's own text.**
   - Quoted: "In مصحف المدينة a bare letter followed by a letter without a شدة means: hide it." / «وفي مصحف المدينة يدل الحرف الخالي من السكون إذا تلاه حرف غير مشدد على الإخفاء.»
   - The same pattern also marks الإدغام الناقص:
     - مَن يَقُولُ (2:8): the ن is bare and the ي has no شدة. The learner met this in the إدغام بغنة lesson.
     - بَسَطتَ (5:28): the ط is bare and the ت has no شدة. The next lesson calls this "the sign of the incomplete merge".
   - Replace with: "Here a bare م followed by a ب with no شدة means: hide the م." / «فإذا رأيت الميم خالية من السكون وبعدها باء غير مشددة فأخفِ الميم.»
2. **MINOR (plain, how 1): the text sides with one view on the lips before it says that teachers differ.**
   - Quoted: "the lips meet gently" / «تلتقي الشفتان برفق»; "Bring the lips together gently on the م" / «قرّب شفتيك على الميم برفق».
   - The card's review note is `needs-teacher` for exactly this point.
   - Plain: "…it is hidden: the lips come together softly, without pressing, a hum is held for two counts, then the ب comes…" / «…أُخفيت الميم: تقترب الشفتان برفق من غير ضغط، وتُمد الغنة حركتين، ثم تأتي الباء…».
   - How 1: "Bring the lips softly toward each other for the م; never press them (how far they close is in step 4)." / «قرّب شفتيك على الميم برفق، ولا تضغط عليهما (ومقدار انضمامهما في الخطوة الرابعة).»

## mutajanisayn — FIX
The seven pairs are correct for حفص from الشاطبية, and so are their examples:
- ت into ط: وَقَالَت طَّآئِفَةٌ
- ط into ت, incomplete: بَسَطتَ
- د into ت: قَد تَّبَيَّنَ
- ت into د: أَثْقَلَت دَّعَوَا
- ذ into ظ: إِذ ظَّلَمُوٓا۟
- ث into ذ: يَلْهَث ذَّٰلِكَ
- ب into م: ٱرْكَب مَّعَنَا

The marks were checked in the app's text: عَبَدتُّمْ has a bare د, and بَسَطتَ has a bare ط with a ت that has no شدة.

1. **MINOR (fits): an example that no book in the list supports.**
   - Quoted: "Other same-place pairs stay clear, like م before و." / «وما سوى ذلك يُظهر، كالميم قبل الواو.»
   - The books in the list do not class م with و as متجانسين. They treat it under الميم الساكنة. Calling it المتجانسين here invites a dispute and gives the beginner nothing.
   - Replace with: "All other such meetings are said clearly." / «وما سوى هذه الأزواج يُظهر.»
2. **MINOR (term): the definition is the narrow one, without saying so.**
   - Quoted: "Two letters made at the same place (مخرج) but said differently, the first with سكون."
   - The condition "the first with سكون" belongs to المتجانسين الصغير, which is the only kind that merges. As written, the definition reads as if it were the definition of المتجانسين itself.
   - Replace with: "Two letters made at the same place (مخرج) but said differently. When the first has a سكون (المتجانسين الصغير), حفص merges seven such pairs." Arabic to match: «حرفان اتحدا مخرجًا واختلفا صفةً، فإن سكن الأول (المتجانسان الصغير) أدغم حفص منهما سبعة أزواج.»

## silent-letters — FIX
1. **BLOCKER (spot, plain, how 1; both languages): the sukun is described by a shape the app does not draw, and the app draws the sukun and ۟ alike.**
   - Quoted: "The circle is not a sukun: the muṣḥaf's sukun is a small head of خ without its dot (ْ)" / «فالسكون في هذا المصحف رأس خاء صغيرة بلا نقطة (ْ)».
   - In this app the sukun is U+0652. Amiri Quran draws it as a round circle with a hole, almost the same as ۟ (166×189 against 157×178 units). The "(ْ)" in the sentence also renders as a circle in Noto Sans Arabic.
   - The learner is told to look for a خ head that is nowhere on screen. They then cannot tell ۟ from a sukun, which is the whole point of the lesson. Every instruction that starts "۟ on a letter: skip it" depends on telling the two apart.
   - The app's text gives a reliable rule by position:
     - a sukun never sits on an ا;
     - a sukun on و or ي always comes after a فتحة;
     - ۟ sits on an ا, or on a و or ي right after a ضمة or كسرة. The one exception is بِأَيْي۟دٍ (51:47).
   - Replace the spot with: "مصحف المدينة has two marks: a small round zero ۟ (never said) and a small upright oval ۠ (said only at a stop). In the printed muṣḥaf the sukun is a different shape. In this app, though, the sukun and the round zero are both drawn as small circles and look the same. So tell them apart by where they sit. The round zero sits on an ا, or on a و or ي right after a ضمة or كسرة: فَلْيَعْبُدُوا۟, أُو۟لَٰٓئِكَ. A sukun never sits on an ا. On a و or ي it comes after a فتحة: خَوْفٍ. A letter with a sukun is said."
   - Arabic: «في مصحف المدينة علامتان: صفر مستدير صغير ۟ (لا يُنطق الحرف أبدًا)، وصفر مستطيل قائم ۠ (يُنطق عند الوقف فقط). وشكل السكون في المصحف المطبوع مختلف، لكن السكون والصفر المستدير يظهران في هذا التطبيق دائرتين صغيرتين متشابهتين، فميّز بينهما بموضعهما: الصفر المستدير يقع على الألف، أو على واو أو ياء بعد ضمة أو كسرة: فَلْيَعْبُدُوا۟، أُو۟لَٰٓئِكَ. أما السكون فلا يقع على الألف، ويقع على الواو والياء بعد فتحة: خَوْفٍ. والحرف الساكن يُنطق.»
2. **MAJOR (fits): it states something false about the course itself.**
   - Quoted: "Until now every letter you saw was said, and every مد letter was held." / «كل حرف رأيته حتى الآن كان يُنطق، وكل حرف مد كان يُمد.»
   - The learner has already met letters that are written but not said:
     - the ل of اللام الشمسية (lam-s);
     - همزة الوصل when joined (ibtida);
     - a مد letter dropped before two سكون meet (sakinayn: فِى ٱلْعُقَدِ is read فِلْعُقَدِ);
     - ۟ itself, in munfasil's own text: "In قَالُوٓا۟ إِنَّ the ا with the round mark (۟) is not said".
   - Replace with: "You have met letters that are written but dropped: the ل of اللام الشمسية, همزة الوصل when joined, and the ا with ۟ in قَالُوٓا۟. This lesson teaches the two marks that tell you a letter is not said." / «لقيتَ حروفًا تُكتب وتسقط من النطق: لام اللام الشمسية، وهمزة الوصل في الوصل، والألف التي عليها ۟ في قَالُوٓا۟. وهذا الدرس يعلمك العلامتين اللتين تدلانك على الحرف الذي لا يُنطق.» Keep the rest of the fits as it is.
3. **MINOR (Arabic plain): the pronoun's gender is wrong.**
   - Quoted: «فالصفر المستدير الصغير (۟) فوق الحرف معناها … والصفر المستطيل القائم (۠) فوق الألف معناها».
   - صفر is masculine, so both should be «معناه».
4. **MINOR (how 4): the second قَوَارِيرَا is missing.**
   - 76:15 is قَوَارِيرَا۠, the ۠ kind, which is said at a stop. 76:16 is قَوَارِيرَا۟, which is never said. A beginner reading سورة الإنسان meets both, one after the other.
   - Add: "The first قَوَارِيرَا۠ (76:15) has ۠ and follows the rule above." / «أما قَوَارِيرَا۠ الأولى (١٥) فعليها ۠ وحكمها ما سبق.»

## silah-s — FIX
The حفص exceptions are correct (غاية المريد 271–272):
- فِيهِۦ مُهَانًا (25:69) takes a صلة.
- يَرْضَهُ لَكُمْ (39:7) has a short ضمة.
- أَرْجِهْ (7:111, 26:36) and فَأَلْقِهْ (27:28) have a سكون.

Optional, for completeness: add وَيَتَّقْهِ (24:52) from the card. It follows the rule (a ساكن comes before the ه), but a beginner will ask about it.

1. **MAJOR (mistakes 3, term هاء الضمير): هَٰذِهِۦ contradicts it.**
   - Quoted: "Only the pronoun is stretched; this ه is short." / «الصلة لهاء الضمير وحدها، وهذه الهاء قصيرة.»
   - The ه of هَٰذِهِۦ is not a pronoun, yet حفص gives it a صلة, and the app's text marks it with ۦ 22 times (for example 7:73, هَٰذِهِۦ نَاقَةُ). The books put it with هاء الكناية.
   - Replace the "right" with: "This ه belongs to the word: no صلة. The one non-pronoun ه that takes a صلة is the ه of هَٰذِهِۦ, and the muṣḥaf shows its small ي." / «هذه الهاء من أصل الكلمة فلا صلة لها. ولا يوصل من غير هاء الضمير إلا هاء هَٰذِهِۦ، وتجد عليها الياء الصغيرة في المصحف.»
   - Add to the term's en: "(هَٰذِهِۦ is read the same way)". Add to its ar: «(وتلحق بها هاء هَٰذِهِۦ)».
2. **MINOR (how 3): "has a سكون" does not cover the cases it lists.**
   - Quoted: "If either neighbour has a سكون, the ه stays short: مِنْهُ, عَلَيْهِ, لَهُ ٱلدِّينَ." / «إن كان أحد الحرفين ساكنًا».
   - In فِيهِ هُدًى (mistake 2) the ي is a مد letter with no mark. In لَهُ ٱلدِّينَ the ل after ٱ also has no mark. A beginner looking for a sukun finds none and stretches the ه.
   - Replace with: "If either neighbour has no vowel (a مد letter like the ي of فِيهِ, or the silent start of ٱل, counts), the ه stays short." / «إن كان أحد الحرفين بلا حركة، ويدخل فيه حرف المد كياء فِيهِ وأول ٱل، بقيت الهاء قصيرة.»

## silah-k — ACCEPT
- **Lengths.** "4 with 4, or 5 with 5" agrees with the course's rule for المنفصل and المتصل (munfasil and muttasil cards).
- **The stop.** "طَعَامِهِۦٓ becomes طَعَامِهْ" is right: 80:25 starts أَنَّا.
- **Mistake مِنْهُ ءَايَٰتٌ.** Correct (3:7).
- **Spot.** The ٓ on the small letter is shown by the app.

## badal — ACCEPT
- **Accuracy.** Two counts for حفص, the substitution origin (ءَأْمَنُوا), and "the weakest" are all correct (غاية المريد 131).
- **Spot.** "No ٓ" holds in the app's text (ءَامَنُوا۟).

## lin — FIX
1. **MAJOR (how 4, both languages): a disagreement the listed books do not support.**
   - Quoted: "Teachers differ on the shortest way: some hold it two counts, others give it no stretch at all. Ask your teacher." / «اختلف العلماء في أقصر الوجوه: فمنهم من يجعله حركتين، ومنهم من لا يمده أصلًا.»
   - غاية المريد 7311/132 defines the stop over حرف المد **أو حرف اللين** and gives «القصر حركتان، والتوسط أربع حركات والإشباع ست».
   - The card says 2, 4 or 6, with review status `verified` and no note.
   - The text's own mistake 3 ("4 and 2") and plain ("2, 4 or 6") assume two counts.
   - The two languages also disagree: the English says "teachers", the Arabic says «العلماء».
   - Either delete the step, or source the "no stretch" view in the card's review note and then reword: "Most books count the shortest way as two counts; a few teachers read it as a plain glide. Follow your teacher." / «أقصر الوجوه عند أكثر الكتب حركتان، ويقرؤه بعض المعلمين انسيابًا بلا مد، فاتبع شيخك.» Until a source is cited, deleting is the right fix.
2. **MINOR (spot, both languages): a stray mark in the example.**
   - Quoted: "قُرَيْشٍ, خَوْفٍۭ" / «قُرَيْشٍ، خَوْفٍۭ».
   - خَوْفٍۭ carries ۭ, the small low م of الإقلاب. It is there because the surah's end would be joined to the بسملة. A sentence that says "there is no مد sign" then shows an unexplained extra sign.
   - Use "قُرَيْشٍ, ٱلْبَيْتِ" / «قُرَيْشٍ، ٱلْبَيْتِ».

## ra-h — FIX
1. **MAJOR (how 4, both languages): the stopping rule as written makes ٱلْخَيْرْ heavy.**
   - Quoted: "If the letter before it is ساكن, look one more back: a فتحة or ضمة there makes it heavy" / «فإن كان قبلها ساكن فانظر إلى ما قبله: إن كان مفتوحًا أو مضمومًا فُخّمت».
   - In ٱلْخَيْرْ, the letter before the ر is يْ, a ساكن, and before that is خَ with a فتحة. By this step the ر is heavy, yet ra-l teaches it as light. The card has the same gap.
   - Replace with: "If the letter before it is a ساكن other than ي, look one more back: a فتحة or ضمة there makes it heavy, as in وَٱلْفَجْرْ and خُسْرْ. (After يْ it is light: the next lesson.)" / «فإن كان قبلها ساكن غير الياء فانظر إلى ما قبله: إن كان مفتوحًا أو مضمومًا فُخّمت، كما في وَٱلْفَجْرْ وخُسْرْ. أما بعد الياء الساكنة فتُرقق، وذلك في الدرس التالي.»
2. **MAJOR (how 3; the writer flagged فِرْقٍ): a condition from the card is missing.**
   - Quoted: "or a heavy letter follows in the same word (لَبِٱلْمِرْصَادِ, قِرْطَاسٍ)" / «أو أن يليها حرف استعلاء في كلمتها».
   - The card adds: "The heavy letter … must be in the same word and have no كسرة itself. فِرْقَةٍ is heavy; فِرْقٍ has both readings."
   - Without that condition, a learner applies this step to فِرْقٍ (26:63) and reads it only heavy.
   - Replace with: "…or a heavy letter **without a كسرة** follows in the same word (لَبِٱلْمِرْصَادِ, قِرْطَاسٍ). In فِرْقٍ the ق has a كسرة, so it has two readings (next lesson)." / «…أو أن يليها في كلمتها حرف استعلاء غير مكسور: لَبِٱلْمِرْصَادِ، قِرْطَاسٍ. أما فِرْقٍ فالقاف فيها مكسورة، ففيها وجهان (في الدرس التالي).»
3. **MAJOR (fits, both languages): it points back to a lesson that does not teach this.**
   - Quoted: "In the تفخيم lesson you met the basic ر: heavy with فتحة or ضمة, light with كسرة." / «عرفتَ في درس التفخيم أصل الراء…».
   - The tafkhim teaching text says only "the ر has its own rules later", and its card says "ر … change[s] by rule". A beginner will think they missed something.
   - Replace with: "In the تفخيم lesson you learned that the ر changes, heavy or light, by rule. These two lessons give the full map." / «عرفتَ في درس التفخيم أن الراء تتغير بين التفخيم والترقيق بحسب قواعد. وفي هذا الدرس والذي يليه الصورة كاملة.»
4. **MAJOR (fits, both languages; "the three questions in order"): the order leads a learner to the wrong answer at a stop.**
   - Quoted: "Ask in order: what is the ر's own vowel? If it has سكون, what vowel comes before it? If you stop on it, look back past any ساكن letter."
   - Stopping on ٱلْمَقَابِرَ, the learner asks the first question, sees the ر's فتحة, and reads it heavy. It is light. At a stop the ر's vowel is gone, so the stop must be asked first.
   - Replace with: "Ask in order: 1) Are you stopping on it? Then it has lost its vowel; treat it as ساكن. 2) If it has a vowel, that vowel decides. 3) If it is ساكن, look at the vowel before it; at a stop, step back past one ساكن letter." / «اسأل بالترتيب: ١) هل تقف عليها؟ فقد سكنت، فعاملها معاملة الساكنة. ٢) إن كانت متحركة فحركتها تحكم. ٣) إن كانت ساكنة فانظر إلى الحركة قبلها، وعند الوقف تجاوز حرفًا ساكنًا واحدًا.» Make the same change in ra-l's fits (see below).
5. **MINOR (how 3): "original" is a term the beginner has not been given.**
   - Quoted: "the كسرة is not original" / «غير أصلية».
   - Add: "(a كسرة added only to start or to join, not one the word itself has)" / «(أي كسرة عارضة للابتداء أو الوصل، ليست من بنية الكلمة)».

## ra-l — FIX
The how steps and the two-reading words are correct: فِرْقٍ, and at a stop مِصْرَ, ٱلْقِطْرِ, يَسْرِ, وَنُذُرِ, أَسْرِ. "They differ on فِرْقٍ at a stop" matches the card's review note, where هداية القاري and الميزان disagree.

1. **MINOR (fits): the same question order as ra-h finding 4.**
   - Quoted: "Ask the same three questions: its own vowel, then the vowel before a ساكن ر, then, at a stop, the letters before it."
   - Reorder it the same way: the stop first, then its vowel, then the vowel before it.
   - "Whatever is not heavy from the last lesson is light" is true only once ra-h findings 1 and 2 are fixed.

## dad-zha — FIX
The articulation points are correct (الجزرية 13–14 and 17; غاية المريد 200–201):
- ض comes from the side of the tongue with the upper molars. Of the left side, the right side or both, the left is "easier and more common".
- ظ comes from the tip of the tongue with the edges of the upper front teeth.
- الاستطالة belongs to ض alone.

The modern disagreement over the sound of ض is handled as the card's note handles it.

1. **MINOR (mistake 3): the mistake it names is not the real one.**
   - Quoted: "Merging the ض into the ظ in أَنقَضَ ظَهْرَكَ." / «إدغام الضاد في الظاء».
   - The ض here has a فتحة, so a true إدغام is not the risk. The real error is that the ض comes out as a ظ, and the two words run as ظَ ظَ.
   - Replace with: "Letting the ض turn into a ظ next to the ظ: أَنقَظَ ظَهْرَكَ." / «نطق الضاد ظاءً لمجاورتها الظاء: أَنقَظَ ظَهْرَكَ.»

## lazim-k — FIX
These claims are correct:
- مثقل and مخفف, with ءَآلْـَٰٔنَ as the only مخفف كلمي in حفص (10:51, 10:91; both present in the app's text);
- six counts whether joined or stopping;
- "the strongest".

1. **MINOR (term المد اللازم): "always six" is too absolute.**
   - Quoted: "so the مد is always six counts" / «ويُمد ست حركات دائمًا».
   - This term is the general one, and the very next lesson teaches two exceptions: عَيْن is 4 or 6, and الٓمٓ joined to ٱللَّهُ is 6 or 2.
   - Replace with: "so the مد is six counts (the next lesson has two exceptions in the opening letters)" / «ويُمد ست حركات، وفي فواتح السور استثناءان يأتيان في الدرس التالي».
2. **MINOR (how 4): "its first way" is not explained.**
   - Quoted: "in its first way. Its other way comes in a later lesson." / «على وجهها الأول».
   - Replace with: "…when its second همزة is read as a long ا (الإبدال); its other way, a softened همزة (التسهيل), comes later." / «…إذا أُبدلت همزتها الثانية ألفًا ممدودة، ووجهها الآخر (التسهيل) في درس لاحق.»

## lazim-h — FIX
These claims are correct:
- 29 surahs and 14 letters;
- «نَقَصَ عَسَلُكُمْ» with 8 letters, six counts;
- عَيْن is 4 or 6, and 6 is preferred (الشاطبية 177);
- «حَيٌّ طَهُرَ» is two counts;
- ألف has no مد.

The spot also matches the app's text: الٓمٓ has ٓ on the ل and the م only, and كٓهيعٓصٓ has none on the ه or the ي.

1. **MAJOR (how 5, both languages; the الٓمٓ ٱللَّهُ case): the answer "6 or 2" is right, but the learner is not told the م takes a vowel.**
   - Quoted: "In آل عمران, joining الٓمٓ to ٱللَّهُ, the ميم may be 6 or 2: ask your teacher."
   - Both ways are standard: six by the origin, two because the سكون has become a vowel (الوجيز; the Shāṭibiyyah rule for a changed cause).
   - The step leaves out the fact that makes it work. When joined, the م of مِيمْ takes a **فتحة** (مِيمَ ٱللَّهُ) so that two سكون do not meet. A learner following "مِيمْ" says مِيمْ ٱللَّهُ, or drops the ي.
   - The case has no note on the card. Add the source to `rules.json` lazim-h conditions.
   - Replace with: "In آل عمران, when you join الٓمٓ to ٱللَّهُ, the م takes a فتحة so two سكون don't meet: أَلِفْ لَامْ مِّيمَ ٱللَّهُ. Because the سكون is gone, the ي of مِيم may be 6 counts or 2. Both are correct; read as your teacher does." / «وفي أول آل عمران إذا وصلت الٓمٓ بـ ٱللَّهُ فُتحت الميم الأخيرة لئلا يلتقي ساكنان: أَلِفْ لَامْ مِّيمَ ٱللَّهُ. ولزوال السكون جاز في ياء مِيم ست حركات أو حركتان، وكلاهما صحيح، فاقرأ بما يقرأ به شيخك.»

## aqwa-maddayn — FIX
These are correct (غاية المريد 144–145; هداية القاري 310–313):
- the order لازم › متصل › عارض › منفصل › بدل;
- the four examples, all present in the app's text (5:2, 2:264, 2:14, 12:16);
- "look after the مد letter first".

The map in fits is right as far as it goes.

1. **MINOR (fits): "every مد of حفص" overclaims.**
   - Quoted: "You now know every مد of حفص." / «عرفتَ الآن مدود حفص كلها.»
   - The map leaves out مد العوض, taught in iwad (two counts at a stop over a فتحتان), and the course has not taught مد الفرق (ءَآلذَّكَرَيْنِ).
   - Replace with: "You now know the main kinds of مد in حفص." / «عرفتَ الآن أهم أنواع المد عند حفص.» Then add العوض to the "nothing after it, 2" group: «…والمد الطبيعي والعوض والصلة الصغرى ومد البدل، وكلها حركتان».
2. **MINOR (how 5; بدل with عارض): the note is too vague to act on.**
   - Quoted: "With بدل and عارض, some teachers keep the same length they use at their other stops." / «التزم بعض المعلمين المقدار الذي يقفون به في سائر العارض.»
   - It does not say what to do.
   - Replace with: "With بدل and عارض, as when stopping on مُسْتَهْزِءُونَ, all three lengths are correct, but use the same length you use for every other عارض in that recitation." / «إذا اجتمع البدل والعارض، كالوقف على مُسْتَهْزِءُونَ، جازت الأوجه الثلاثة، لكن التزم المقدار الذي تقف به في سائر العارض في التلاوة نفسها.»

## Fixes (round 1)
All findings are applied. `UPDATE_GLOSSARY=1 LESSONS=<15 ids> npx vitest run src/content/teach.check.test.ts` passes with 0 errors and the same 4 card-term warnings. `npx vitest run src/content` passes 7 files and 17 tests.

- **silent-letters**
  - BLOCKER: the خ-head claim is gone. A new how step 1 tells ۟ from the sukun by where it sits, as the reviewer gives it, with the بِأَيْي۟دٍ exception. I re-counted the marks in the app's Tanzil text:
    - ۟ sits on ا about 3720 times, on و after a ضمة 255 times, and on ي after a كسرة 10 times. It sits on a ي after a ساكن ي once (بِأَيْي۟دٍ).
    - There are 0 sukuns on an ا.
  - The spot now says the two marks look alike in the app and points to step 1.
  - MAJOR: fits uses the reviewer's wording (the ل of اللام الشمسية, همزة الوصل, قَالُوٓا۟).
  - MINOR: «معناه» in both places, and قَوَارِيرَا۠ (76:15) is added to the سورة الإنسان step.
- **ra-h**
  - The question order now starts with the stop: are you stopping? then the ر's own vowel, then the vowel before it, stepping back past one ساكن.
  - At a stop, only a ساكن other than ي sends you one letter further back. After يْ the ر is light.
  - "Not original" is explained, and the heavy letter must have no كسرة. فِرْقٍ is sent to ra-l.
  - fits no longer says the tafkhim lesson taught the basic ر.
  - Checked: ٱلْمَقَابِرَ at a stop is ساكن with a كسرة before it, so light. ٱلْخَيْرْ has يْ before it, so light. وَٱلْفَجْرْ and خُسْرْ have جْ or سْ with a فتحة or ضمة before, so heavy.
- **ra-l:** fits uses the same order.
- **silah-s**
  - Mistake 3 now names هَٰذِهِۦ: the app's text has هَٰذِهِۦ 23 times, each with ۦ.
  - The term notes that هَٰذِهِۦ is read the same way.
  - How 3 now says "no vowel", which covers a مد letter and the start of ٱل.
- **m-ikhfa:** the spot rule is narrowed to "a bare م followed by a ب with no شدة". The plain text and how 1 are neutral on the lips and refer to step 4.
- **lin:** the "no stretch" step is deleted, since غاية المريد 7311/132 gives القصر as two counts. The spot examples are now قُرَيْشٍ and ٱلْبَيْتِ.
- **lazim-h**
  - How 5 now says the م takes a فتحة (مِيمَ ٱللَّهُ), so the ي is 6 or 2.
  - Source: غاية المريد 7311/136 (read): «القصر حركتان اعتدادًا بحركة الميم العارضة وهي الفتحة التي أتى بها للتخلص من التقاء الساكنين».
  - Added as a condition to the lazim-h card in `content/rules.json` and `content/ar.json`, with the source.
- **mutajanisayn:** the term notes the narrow kind (المتجانسين الصغير). The م/و example is replaced by "all other such meetings are said clearly".
- **dad-zha:** mistake 3 is now "the ض turns into a ظ: أَنقَظَ ظَهْرَكَ".
- **lazim-k:** the term no longer says "always": it points to the two exceptions in the next lesson. "Its first way" is explained in plain words (the second همزة read as a long ا). I left out the word التسهيل, which belongs to a later lesson.
- **aqwa-maddayn:** fits now says "the main kinds" and adds العوض to the two-count group. The بدل+عارض step says all three lengths are correct, at the same length as your other عارض stops.

## Re-check (round 1)
Re-checked 2026-11-21 against the books and the app's Tanzil text in `public/data/surah`.

**Checks run**
- `LESSONS=<15 ids> npx vitest run src/content/teach.check.test.ts` passes with 0 errors and the same 4 card-term warnings.
- `npx vitest run src/content` passes 17 tests.

### What I verified
- **silent-letters, the position rule.** It holds in the app's text. Every sukun on و, ي or ى follows a فتحة. The only exceptions are 4 words where an ا with ۟ sits in between (تَا۟يْـَٔسُوا۟, يَا۟يْـَٔسِ ×2, لِشَا۟ىْءٍ); the ۟ there is on the ا, so the rule still reads them correctly. ۟ never sits on a و after a فتحة. The spot no longer makes any claim about the sukun's shape.
- **ra-h and ra-l, the five test words.**
  - ٱلْمَقَابِرَ at a stop: ساكن, then a كسرة, so light. Correct.
  - وَٱلْفَجْرْ and خُسْرْ: back past جْ or سْ to a فتحة or ضمة, so heavy. Correct.
  - فِرْقٍ: the heavy letter has a كسرة, so two readings. Correct.
  - ٱلْخَيْرْ: correct in how 4, which says "a ساكن other than ي". The map in fits still gets it wrong; see the open finding below.
  - Also checked ٱلْغَفُورْ and ٱلنَّارْ: back past the مد letter, so heavy. Correct.
- **silah-s, هَٰذِهِۦ.** Correct. The app's text carries ۦ on هَٰذِهِۦ, for example 7:73.
- **m-ikhfa.** The mark rule is now narrowed to "a bare م, then a ب with no شدة". Correct, and it no longer conflicts with مَن يَقُولُ or بَسَطتَ. The lips are described neutrally.
- **lin.** The "no stretch" step is gone, which agrees with غاية المريد 7311/132 («القصر حركتان»). The spot examples have no stray mark.
- **lazim-h.** I read غاية المريد 7311/136 myself. It says: «روي فيه وجهان: الأول: المد ست حركات استصحابًا للأصل. الثاني: القصر حركتان اعتدادًا بحركة الميم العارضة وهي الفتحة…». The فتحة and the 6 or 2 are both correct. The book states no preference, and the text gives none.
- **mutajanisayn, dad-zha, lazim-k, aqwa-maddayn.** Fixed as proposed. No new errors.

### Still open
1. **MAJOR, ra-h fits (en and ar) and ra-l fits (en and ar): the map still sends ٱلْخَيْرْ to heavy.**
   - Quoted: "at a stop, step back past one ساكن letter" / «وعند الوقف تجاوز حرفًا ساكنًا واحدًا»; ra-l: "stepping back past one ساكن at a stop" / «متجاوزًا ساكنًا واحدًا عند الوقف».
   - At ٱلْخَيْرْ the map steps back past يْ to خَ and gives heavy. How 4 correctly gives light, so the map and the steps now contradict each other.
   - Replace in all four places with: "past one ساكن letter other than ي (after يْ it is light)" / «تجاوز حرفًا ساكنًا واحدًا غير الياء (فبعد الياء الساكنة ترقق)».
2. **MINOR, silah-s term (ar): ambiguous wording.**
   - Quoted: «فليست منها (وتلحق بها هاء هَٰذِهِۦ)».
   - «بها» could refer to the word's own ه, which is the opposite of what is meant.
   - Replace with: «فليست منها. أما هاء هَٰذِهِۦ فتُعامل معاملتها في الصلة.»
3. **MINOR, lazim-h card condition (rules.json and ar.json): a raw Shamela id in text the learner reads.**
   - Quoted: "(غاية المريد 7311/136)".
   - The source is already in `sources`. Drop the parenthesis, or write it as the other conditions do, with the book's own words: «(غاية المريد: «روي فيه وجهان»)».

### Final verdicts
| Lesson | Verdict |
|---|---|
| m-izhar | ACCEPT |
| m-idgham | ACCEPT |
| m-ikhfa | ACCEPT |
| mutajanisayn | ACCEPT |
| silent-letters | ACCEPT |
| silah-s | FIX (open finding 2, MINOR) |
| silah-k | ACCEPT |
| badal | ACCEPT |
| lin | ACCEPT |
| ra-h | FIX (open finding 1, MAJOR) |
| ra-l | FIX (open finding 1, MAJOR) |
| dad-zha | ACCEPT |
| lazim-k | ACCEPT |
| lazim-h | ACCEPT for the teaching text; FIX for the card (open finding 3, MINOR) |
| aqwa-maddayn | ACCEPT |

Once open finding 1 is applied to the four fits strings, ra-h and ra-l can be accepted without another round.

- Coordinator: ra-h/ra-l fits now say "unless that ساكن is a ي" (both languages); silah-s term note reworded; the lazim-h card condition no longer shows the bare Shamela id (the source stays in the card sources).

## Re-check (round 2)
I verified only the coordinator's three changes.

**Checks run.** `LESSONS=ra-h,ra-l,silah-s,lazim-h npx vitest run src/content/teach.check.test.ts` passes. `npx vitest run src/content` passes 17 tests.

**Results**
1. **ra-h and ra-l fits, both languages: fixed.** The new wording is "unless that ساكن is a ي (then the ر is light)" / «إلا أن يكون ياءً فترقَّق». I traced the map again:
   - ٱلْخَيْرْ: light.
   - وَٱلْفَجْرْ and خُسْرْ: heavy.
   - ٱلْمَقَابِرَ at a stop: light.
   - The map and how 4 now agree.
2. **silah-s term, Arabic: fixed.** The note now reads «وتُعامَل هاء هَٰذِهِۦ معاملتها فتوصل مثلها». «فتوصل مثلها» makes the meaning clear: هذه takes the صلة, as the pronoun does.
3. **lazim-h card condition, `rules.json` and `ar.json`: fixed.** The bare id is gone, and the source 7311/136 is still in the card's `sources`.

### Final verdicts
All 15 lessons are accepted: m-izhar, m-idgham, m-ikhfa, mutajanisayn, silent-letters, silah-s, silah-k, badal, lin, ra-h, ra-l, dad-zha, lazim-k, lazim-h (text and card), aqwa-maddayn. No findings remain open.
