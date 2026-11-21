# Review: unit 8 teaching texts (rules particular to حفص, and the stop)

Reviewer: independent. Date: 2026-11-21. Standard: `docs/16-teaching-strategy.md`; the cards in `content/rules.json` and `content/ar.json`; the agreed rulings in `docs/examples/reviews/unit8.md`.

Files: `content/teach/{mutaqaribayn,waqf-signs,waqf-how,rawm-ishmam,sakt,imalah,ishmam,tashil}.json`.

## How it was checked
- **Checker:** `LESSONS=<the 8 ids> npx vitest run src/content/teach.check.test.ts` gives 0 errors. It gives 3 card warnings (mutaqaribayn's card uses سكت; waqf-how's card uses روم and إشمام). Learn shows their meaning, so they are acceptable. The other output is glossary staleness from units still being written, which I ignored.
- **Term order (§4):** I matched each Arabic text against `content/glossary.json` with the app's own `termsIn` rule. Every term used is either defined in the lesson or comes from an earlier lesson: basics, mutajanisayn, mutaqaribayn or rawm-ishmam. No lesson defines a term that another lesson owns. One false match is coming (tashil «بلين», see tashil #1).
- **The muṣḥaf data:** `public/data/surah/*.json` was scanned for every word that carries ۜ ۣ ۪ ۫ ۬ ۠, and the `marks` were read at 18:1 and 36:52.
- **Books read for this review:**
  - **الميزان 38104/208–210:**
    - الروم «بقدر الثلث»; الاختلاس «الإتيان بثلثي الحركة».
    - الإشمام «بغير انطباق … يرى ولا يسمع».
    - «إن كان القارئ منفردا فليس عليه روم ولا إشمام».
    - الروم كالوصل.
    - The exclusions (هاء التأنيث, the كسرة added for two سكون, the ضمة of ميم الجمع).
    - The four سكتات «حكمها الوجوب»; at the first two «يختار بين السكت … وبين الوقف»; the two optional places.
  - **الوافي 38075/292** (vv. 773–774): تأمنا «بإظهارها واختلاس حركتها … وأدغم بعض أهل الأداء … إدغاما محضا مع الإشمام … ضم الشفتين عقب إدغام الحرف الأول … وإن كان وجه الإشمام أكثر شهرة وعليه جمهور أهل الأداء».
  - **الوافي 38075/308** (vv. 830–831): the سكت is on the ألف that replaces the تنوين, «سكتة لطيفة من دون قطع نفس».
  - **هداية القاري** (the OpenITI copy of 22869):
    - 1/259–261: تأمنا has two ways, «ووجه الاختلاس هو المقدم في الأداء», and both «لا يحكمان إلا بالمشافهة».
    - 1/407–408: the سكت is «بقدر حركتين»; stopping on مرقدنا «تام».
    - 2/501 (Shamela 454): ءآلذكرين and the rest: «لا يجوز حذفها … لئلا يلتبس الاستفهام بالخبر … ووجه الإبدال هو المقدم».
    - 2/577–578: يبصط and بصطة are read with س; مجريها is إمالة كبرى, the only one; ءاعجمي is marked «نقطة كبيرة في الهمزة الثانية».
    - 1/282–289 (Shamela pages): the three views on هاء الضمير; why a vowel added for two سكون takes no روم.
  - **النشر 1/425** (Shamela 22642/434): the reasons for the four سكتات.
  - **غاية المريد 7311/291–292:** the سكت «مقداره حركتان», four required places and two optional.

### The writer's four doubts
1. **The meaning reasons for the sakt places:** supported by النشر 1/425, «ووجه السكت في عوجا قصد بيان أن قيما … ليس متصلا بما قبله في الإعراب … وفي مرقدنا بيان أن كلام الكفار قد انقضى … وفي من راق وبل ران قصد بيان اللفظ ليظهر أنهما كلمتان مع صحة الرواية». The texts' framing ("حفص received these places …; the books explain it by meaning") is right. Two wordings need fixing (sakt #3).
2. **The mark shapes (۪ ۫ ۬):** the texts name no shape, only "a small mark", so nothing in them is wrong. The data confirms that each mark is in that one word only, below the ر, above the م, and above the ا. هداية القاري 2/578 calls the تسهيل mark «نقطة كبيرة», so for tashil "a round dot" is better than "a small mark" (tashil #4). I could not read the مصحف المدينة end notes, so I would not add the shapes of ۪ and ۫.
3. **The amounts for الروم and الاختلاس:** الروم is about a third (الميزان 208), as rawm-ishmam says. But الميزان 208 gives الاختلاس as **two thirds**, and الوافي and هداية القاري both call the تأمنا way الاختلاس. ishmam labels it «الروم (الاختلاس)», so a learner applies the "third" from the previous lesson (ishmam #1, MAJOR).
4. **Which way is read first:**
   - **تأمنا:** هداية القاري 1/261 «ووجه الاختلاس هو المقدم» supports "المرصفي reads the first way first". الوافي 38075/292 says الإشمام is «أكثر شهرة وعليه جمهور أهل الأداء», which supports "many teachers start with the second". The text is right, but it should cite الوافي and say who المرصفي is (ishmam #2).
   - **The ءَآلْ words:** هداية القاري 2/501 «ووجه الإبدال هو المقدم» and الشاطبية v.193 «فللكل ذا أولى». The text is right.

---

## mutaqaribayn: FIX (minor)
Verified: ل and ر come from the tip of the tongue, ق and ك from its back (ق deeper). The complete merge comes first and the incomplete one keeps the استعلاء (الميزان 135). The ضبط is right: a bare ل or ق before a شدة. No غنة. بَلْ ۜ رَانَ is the exception.

1. **MINOR: the Arabic exception is doubled, and «منهما» is the wrong number.**
   - **Text:** term `ar` «ولا يُدغم حفص منهما، سوى ما عرفتَه من أحكام النون وال، إلا اللام في الراء، والقاف في الكاف.» and `ar.fits` «ولا يُدغم منهما، سوى أحكام النون وال، إلا اللام في الراء والقاف في الكاف.»
   - **The problem:** «منهما» points to one pair, not to the class. «سوى … إلا» stacks two exceptions in one clause. A bare «وال» reads badly in prose.
   - **Replacement (term):** «ولا يُدغم حفص من هذا النوع إلا اللام في الراء والقاف في الكاف، زيادةً على ما عرفتَه في النون الساكنة ولام التعريف.»
   - **Replacement (fits):** «والأصل عند حفص إظهار المتقاربين، ولا يُدغم منها، زيادةً على ما عرفتَه في النون الساكنة ولام التعريف، إلا اللام في الراء والقاف في الكاف.»
2. **MINOR: the English and Arabic `plain` differ.**
   - **Text:** EN "The same happens **once** with ق before ك". AR «ومثلها القاف قبل الكاف **في كلمة واحدة**».
   - **The problem:** "once in the Quran" and "within one word" are different claims.
   - **Replacement (AR):** «ومثلها مرةً واحدة في القرآن: القاف قبل الكاف في نَخْلُقكُّم.»
3. **MINOR: there is no self-check (§3).**
   - **Replacement:** append to `how[1]`:
     - EN: "Check: if the tip of your tongue stops on the gum for an ل before the ر starts, you said the ل."
     - AR: «وللتحقق: إن توقف طرف لسانك على اللثة للام قبل أن تبدأ الراء فقد نطقت اللام.»

## waqf-signs: FIX (minor)
Verified:
- Every sign and its meaning: الميزان 189–204 and غاية المريد 294.
- The examples 36:76, 16:32 and 2:2.
- The رأس الآية note.
- The Arabic is natural.

1. **MINOR: `why` says the signs only mark where the meaning is complete.**
   - **Text:** "the signs record where scholars found the meaning complete" / «تحفظ المواضع التي رأى العلماء أن المعنى يتم عندها».
   - **The problem:** ۙ marks where it is **not** complete.
   - **Replacement (EN):** "the signs record where scholars judged the meaning complete, and where it is not."
   - **Replacement (AR):** «وهذه العلامات تبيّن ما رآه العلماء من تمام المعنى أو عدم تمامه.»

## waqf-how: FIX
Verified:
- The سكون, the dropped tanween, العوض, ة → هـ (also with ةً), and the open ت stopped as ت for حفص (هداية القاري 2/462).
- The صلة is dropped at a stop.
- The `why` («العرب لا تقف على متحرك …»).

1. **BLOCKER: `spot` is false, and `fits` overclaims.**
   - **Text:** `spot` "The muṣḥaf prints each word as it sounds when joined; nothing marks the change at a stop." / «ولا علامة فيه لتغيّرها عند الوقف». `fits` "This lesson gathers every kind of ending" / «تجتمع لك أنواع الأواخر كلها».
   - **Evidence:** the muṣḥaf has 66 words with ۠, such as أَنَا۠, لَّٰكِنَّا۠ and ٱلظُّنُونَا۠ (data scan). ۠ marks exactly a stop change: the ا is said only when you stop. The learner met it in silent-letters (unit 4, card: "A small upright oval (۠) on an alif means it is said only when you stop on that word"). So the text contradicts an earlier lesson, and "every kind" leaves this kind out.
   - **Replacement (spot, EN):** "Most changes have no sign: look at the last letter (a vowel, a tanween, a ة or an open ت). One sign does mark a stop change: the small upright oval ۠ on an ا, as in أَنَا۠, which you met earlier: that ا is said only when you stop."
   - **Replacement (spot, AR):** «أكثر هذه التغيّرات لا علامة لها، فانظر إلى آخر حرف: الحركة أو التنوين أو التاء المربوطة أو التاء المفتوحة. وعلامة واحدة تدل على تغيّر عند الوقف: الصفر المستطيل ۠ فوق الألف، كما في أَنَا۠، وقد عرفتَه من قبل: تُنطق هذه الألف عند الوقف فقط.»
   - **Replacement (fits):** "This lesson gathers the kinds of ending" / «وفي هذا الدرس تجتمع لك أنواع الأواخر».
2. **MINOR: a doubled final letter is missing, and beginners often lose its doubling at a stop** (ٱلْحَقُّ, مُسْتَقَرٌّ).
   - **Replacement:** add a mistake pair:
     - EN: "Stopping on ٱلْحَقُّ as a single ق: ٱلْحَقْ." / "Keep the doubling: press on the ق, then still it."
     - AR: «الوقف على ٱلْحَقُّ بقاف واحدة خفيفة.» / «أبقِ التشديد: اضغط على القاف ثم سكّنها.»

## rawm-ishmam: FIX (minor)
Verified against الميزان 208–209:
- الروم is about a third, heard by someone close. الإشمام is silent and on a ضمة only.
- الروم is like joining, so العارض has 2 counts and there is no قلقلة. With الإشمام the مد is read as at any stop.
- The exclusions are right.
- The `why` is supported: «إن كان القارئ منفردا فليس عليه روم ولا إشمام».
- هاء الضمير has three views (هداية القاري), so "ask your teacher" is right.

1. **MINOR: the example for the ميم الجمع case shows nothing.**
   - **Text:** `how[4]` "…on the م of عَلَيْهِمْ…" / «ولا ميم عَلَيْهِمْ».
   - **The problem:** printed عَلَيْهِمْ already has a سكون, so a beginner sees no vowel to hint at. الميزان 209 excludes «ضمة ميم الجمع التي جاء بعدها ساكن».
   - **Replacement:** "…on the ضمة a ميم الجمع takes before a سكون (عَلَيْهِمُ ٱلْقِتَالُ → عَلَيْهِمْ)…" / «ولا ضمة ميم الجمع قبل الساكن (عَلَيْهِمُ ٱلْقِتَالُ ← عَلَيْهِمْ)». Or drop it, since the التقاء الساكنين clause already covers it.
2. **MINOR: an unverified claim about the audio.**
   - **Text:** `fits` "it is what the reciters did in أَحَدٌ and ٱلْأَكْرَمُ" / «وبه وقف القرّاء على …».
   - **The problem:** nobody has checked by ear that both clips end in a plain سكون.
   - **Fix:** confirm by ear, or write "That is the normal way" / «وهو الأصل» alone.
3. **MINOR: no self-check for الإشمام (§3).**
   - **Replacement:** append to `how[2]`:
     - EN: "Check in a mirror: the lips round after the د of أَحَدْ, and no sound comes."
     - AR: «وتحقّق بالمرآة: تنضم الشفتان بعد دال أَحَدْ، ولا يخرج صوت.»
4. **MINOR: the Arabic refers to the wrong word.**
   - **Text:** `ar.how[1]` «ولا يُمد المد العارض قبله إلا حركتين» («قبله» points to الروم). `ar.how[3]` «فيُمد ما قبله».
   - **Replacement:** «ولا يُمد المد العارض قبل الحرف الموقوف عليه إلا حركتين» and «فيُمد حرف المد قبله كما في أي وقف».

## sakt: FIX
Verified:
- Four required places when joining, and two optional (الميزان 210, غاية المريد 292).
- At عِوَجَا and مَرْقَدِنَا stopping is also allowed, and ۗ is printed at 36:52 (data).
- At مَالِيَهْ the سكت comes first (هداية القاري 1/237, غاية المريد 292).
- Between الأنفال and التوبة there are three ways, all without the بسملة.
- The other سكتات belong to الطيبة.

1. **BLOCKER: `spot` is false.**
   - **Text:** "In مصحف المدينة it appears only at the four required places and at مَالِيَهْ." / «ولا تأتي في مصحف المدينة إلا في المواضع الأربعة الواجبة وفي مَالِيَهْ.»
   - **Evidence:** the same small س (ۜ) is printed on a ص inside a word in وَيَبْصُۜطُ (2:245) and بَصْۜطَةً (7:69) (data scan). There it means "read this ص as س" (هداية القاري 2/577). A learner told "only here" who meets وَيَبْصُۜطُ will try a سكت inside a word.
   - **Replacement (EN):** "A small س (ۜ) after the last letter of a word: بَلْ ۜ رَانَ. As a pause sign it is printed only at the four required places and at مَالِيَهْ. The same small س on a ص inside a word (وَيَبْصُۜطُ) is a different sign: read that ص as س."
   - **Replacement (AR):** «سين صغيرة (ۜ) بعد آخر الكلمة: بَلْ ۜ رَانَ. ولا تأتي علامةً للسكت إلا في المواضع الأربعة الواجبة وفي مَالِيَهْ. أما السين الصغيرة فوق الصاد داخل الكلمة (وَيَبْصُۜطُ) فعلامة أخرى، معناها: اقرأ الصاد سينًا.»
2. **MINOR: "route" is used without being explained.**
   - **Text:** `mistakes[3].right` "Those belong to another route of حفص." / «هذه من طريق آخر لحفص».
   - **The problem:** basics names the الشاطبية but never says what a route (طريق) is.
   - **Replacement:** "Those come to حفص through another line of teachers (طريق الطيبة), not the الشاطبية line this course follows." / «هذه وردت لحفص من طريق آخر، هو طريق الطيبة، لا من طريق الشاطبية الذي يتبعه هذا المقرر.»
3. **MINOR: the `why` softens one reason and adds an example the books don't give.**
   - **Text:** "that هَٰذَا starts new words … not one word like مَرَّاق" / «وليتبيّن أن هَٰذَا ابتداء كلام جديد … كلمة واحدة كـ«مرّاق»».
   - **The problem:** النشر 1/425 says the disbelievers' words end at مَرْقَدِنَا, and هَٰذَا مَا وَعَدَ ٱلرَّحْمَٰنُ is said by others. «مرّاق» is not in the source.
   - **Replacement (EN):** "…that the disbelievers' words end at مَرْقَدِنَا, and هَٰذَا مَا وَعَدَ ٱلرَّحْمَٰنُ is said by others (the angels or the believers); and that مَنْ رَاقٍ and بَلْ رَانَ are two words each (النشر)."
   - **Replacement (AR):** «… وليتبيّن أن كلام الكفار انتهى عند مَرْقَدِنَا، وأن هَٰذَا مَا وَعَدَ ٱلرَّحْمَٰنُ من كلام غيرهم (الملائكة أو المؤمنين)، وليظهر أن مَنْ رَاقٍ و بَلْ رَانَ كلمتان لا كلمة واحدة.»
4. **MINOR: the pause length could be concrete.**
   - **Text:** "Cut the voice for a brief moment."
   - **The problem:** هداية القاري 1/407 and غاية المريد 291 both give «بقدر حركتين».
   - **Replacement:** "Cut the voice for about two counts" / «اقطع الصوت بقدر حركتين تقريبًا». Keep "listen to the reciter".

## imalah: ACCEPT
Verified:
- The only إمالة for حفص, and it is كبرى (الشاطبية v.311; هداية القاري 2/578 «وليس له غيرها في التنزيل»).
- The ر is light.
- 2 counts.
- The ر in the data carries no فتحة, only ۪, and the mark is in this one word only.
- The contrast وَمُرْسَىٰهَآ is right.
- The `why` (the ا comes from a ي) is the books' general reason for إمالة, and it is framed after the رواية.
- The Arabic is natural.

## ishmam: FIX
Verified:
- Both ways are from الشاطبية vv.773–774 (الوافي 292; هداية القاري 1/259–261).
- A plain merge without الإشمام is wrong.
- الإشمام and الروم/الاختلاس occur inside a word only here (الميزان 208).
- The mark is in this word only (data).

1. **MAJOR: الروم and الاختلاس are treated as the same amount.**
   - **Text:** term `en` "Saying a vowel quickly, with only part of it. … some books call the unmerged way by this name, others call it الروم." `how[1]` "Way one, الروم (الاختلاس): … only part of its ضمة".
   - **The problem:** the learner has just been taught (rawm-ishmam) that الروم is "about a third". الميزان 208: «والروم: الإتيان بثلث الحركة أما الاختلاس: فهو الإتيان بثلثي الحركة». الوافي 292 and هداية القاري 1/259 both name this way الاختلاس. Leading with «الروم» invites a third where these books mean the greater part.
   - **Replacement (term en):** "Saying a vowel quickly, with most of it (about two thirds, الميزان), unlike الروم at a stop (about a third). In تَأْمَ۫نَّا most books, هداية القاري and الوافي among them, call the unmerged way الاختلاس; some call it الروم."
   - **Replacement (term ar):** «النطق بالحركة مسرعًا بأكثرها، نحو ثلثيها، بخلاف الروم عند الوقف (نحو الثلث). وفي تَأْمَ۫نَّا يسمّي أكثر العلماء وجه الإظهار بهذا الاسم، ومنهم صاحبا هداية القاري والوافي، ويسمّيه بعضهم الروم.»
   - **Also:** rename the way «الاختلاس (ويسمّى الروم)» in `how[1]`, `mistakes[0].right` and `mistakes[1].right`, in both languages.
2. **MINOR: the attribution needs its second source, and المرصفي is unknown to a beginner.**
   - **Text:** `how[3]` "المرصفي reads the first way first; many teachers start with the second."
   - **Replacement (EN):** "هداية القاري (by المرصفي) reads the first way first; الوافي says the second is better known and is read by most teachers. Follow your teacher."
   - **Replacement (AR):** «ويقدّم المرصفي في هداية القاري الوجه الأول، وذكر صاحب الوافي أن الثاني أشهر وعليه أكثر أهل الأداء، فاتبع شيخك.»
3. **MINOR: an unclear Arabic imperative, and no self-check.**
   - **Text:** `ar.mistakes[0].right` «أشمّ مع الإدغام».
   - **The problem:** it can be read as «أُشِمُّ», "I do".
   - **Replacement:** «ضمّ شفتيك مع الإدغام (الإشمام)، أو اقرأ بالوجه الأول، الاختلاس.»
   - **Add to `how[2]`:** "Check in a mirror: your lips round on نَّا." / «وتحقّق بالمرآة من انضمام شفتيك عند نَّا.»

## tashil: FIX
Verified:
- التسهيل is required only in ءَا۬عْجَمِىٌّ (الشاطبية v.185; هداية القاري 2/578, from all of حفص's routes).
- It has no مد.
- The six ءَآلْ places have الإبدال (6 counts) first, then التسهيل with no مد (v.193; هداية القاري 2/501).
- Others read both همزة in full.
- The sound is taught by ear (هداية القاري 2/578, «فمتوقفة على المشافهة»), and the text refers the learner to the teacher.

1. **MAJOR: «بلين» collides with the term لين.**
   - **Text:** `ar.plain` «فتُنطق الثانية **بلين**، بين الهمزة والألف». Also `ar.how[1]` «ألين».
   - **The problem:** لين is owned by the lin lesson (a و/ي with سكون after a فتحة). The app's `termsIn` matches «بلين» (prefix ب), so once lin's text exists, tashil's "Words from other lessons" will show the حرف اللين definition. The same word would then carry a second meaning.
   - **Replacement:** «فتُنطق الثانية مسهَّلةً، بين الهمزة والألف» and «انطق الثانية أخفّ من الهمزة المحققة، مائلةً إلى الألف».
2. **MINOR: the `why` assigns the reason to one way only.**
   - **Text:** "In the ءَآلْ words the long ا keeps the question clear, so it is not heard as a statement." / «يُبقي المد الطويل الاستفهام واضحًا».
   - **The problem:** هداية القاري 2/501 gives this as the reason the second همزة (the همزة الوصل of ال) is **not dropped**, and it holds in both ways.
   - **Replacement (EN):** "In the ءَآلْ words the second همزة is the همزة الوصل of ال. It normally drops when joined, but dropping it here would make the question sound like a statement. So it is kept, as a long ا or eased."
   - **Replacement (AR):** «وفي كلمات ءَآلْ الهمزة الثانية همزة وصل، وحقها أن تسقط في الوصل، لكن حذفها هنا يُلبس الاستفهام بالخبر، فتبقى: إما ألفًا ممدودة وإما مسهّلة.»
3. **MINOR: "a long letter" is vaguer than a term the learner already has.**
   - **Text:** term `en` "between a full همزة and a long letter".
   - **Replacement:** "between a full همزة and the حرف مد that matches its vowel (here an ا)".
4. **MINOR: the mark could be named.**
   - **Text:** `spot` "an ا with a small mark above it".
   - **The problem:** هداية القاري 2/578 calls it «نقطة كبيرة».
   - **Replacement:** "an ا with a round dot (۬) above it, and no همزة sign" / «ألف فوقها نقطة مستديرة (۬)، بلا رأس همزة».

## Outside the teaching files (for the card owner)
- **MINOR: the tashil card `tip` (Arabic) «ضَعْف في سورة الروم» matches the term روم.** `OtherWords` scans the card, so the tashil Learn page will list "روم (rawm-ishmam)" for a surah name. Write «في سورة الروم» as «في الآية 54 من سورة الروم (30:54)», or add a stop-list for surah names in `termsIn`.

---

## Totals
| Severity | Count | Where |
|---|---|---|
| BLOCKER | 2 | waqf-how #1 (no stop sign claimed, yet ۠ exists and was taught in silent-letters); sakt #1 (ۜ "only at" the sakt places, yet it is on ص in 2:245 and 7:69) |
| MAJOR | 2 | ishmam #1 (الروم and الاختلاس given the same amount; the books call this way الاختلاس, two thirds); tashil #1 («بلين» collides with the term لين) |
| MINOR | 18 | mutaqaribayn 3, waqf-signs 1, waqf-how 1, rawm-ishmam 4, sakt 3, ishmam 2, tashil 3, tashil card 1 |

Verdicts:
- **ACCEPT:** imalah.
- **FIX:** waqf-how, sakt, ishmam and tashil (BLOCKER or MAJOR); mutaqaribayn, waqf-signs and rawm-ishmam (minor only).

## Fixes (round 1)
Writer, 2026-11-21. Checker (`UPDATE_GLOSSARY=1 LESSONS=` the 8 ids): **0 errors**. The only warnings are about the cards (mutaqaribayn: سكت and صفة; waqf-how: روم and إشمام), which Learn explains.

| Finding | Severity | Change |
|---|---|---|
| waqf-how #1 `spot` / `fits` | BLOCKER | `spot` now names ۠ on an ا (أَنَا۠) as the one sign of a stop change, with a pointer back to the lesson where it was taught. `fits` says "the kinds of ending" / «أنواع الأواخر». |
| sakt #1 `spot` | BLOCKER | `spot` now says ۜ is a pause sign only at the four places and مَالِيَهْ, and that ۜ on a ص inside a word (وَيَبْصُۜطُ) means "read the ص as س". |
| ishmam #1 الروم vs الاختلاس | MAJOR | The way is now «الاختلاس (ويسمّى الروم)» in `how[1]` and both `mistakes`, in both languages: about two thirds of the ضمة, more than الروم at a stop. The term text follows the review (الميزان 208; هداية القاري; الوافي). |
| tashil #1 «بلين» | MAJOR | «مسهَّلةً» and «أخفّ من الهمزة المحققة». |
| mutaqaribayn #1–3 | MINOR | The term `ar` and `ar.fits` are reworded as given. The Arabic `plain` now says «مرةً واحدة في القرآن». The tongue-tip self-check is added to `how[1]`. |
| waqf-signs #1 | MINOR | `why` now says "complete, and where it is not" / «من تمام المعنى أو عدم تمامه». |
| waqf-how #2 | MINOR | Added the ٱلْحَقُّ mistake pair (keep the doubling). |
| rawm-ishmam #1–4 | MINOR | The exclusion now reads "ضمة of ميم الجمع before a سكون (عَلَيْهِمُ ٱلْقِتَالُ → عَلَيْهِمْ)". The claim about the audio is dropped, leaving «وهو الأصل». The mirror self-check is added to `how[2]`. The Arabic «قبله» is fixed in `how[1]` and `how[3]`. |
| rawm-ishmam: the tashil card's «سورة الروم» | MINOR | Added `"not": ["سورة الروم"]` to the روم term. |
| sakt #2–4 | MINOR | The route line now names طريق الطيبة against the الشاطبية line. `why` now follows النشر 1/425: قَيِّمًا is not joined in grammar, the disbelievers' words end at مَرْقَدِنَا, and the last two are each two words. «مرّاق» is removed. The pause is "about two counts" / «بقدر حركتين تقريبًا». |
| ishmam #2–3 | MINOR | `how[3]` now cites هداية القاري (المرصفي) for the first way and الوافي (better known, most teachers) for the second. «أشمّ» is now «ضمّ شفتيك مع الإدغام (الإشمام)». The mirror check is added to `how[2]`. |
| tashil #2–4 | MINOR | `why`: the second همزة is the همزة الوصل, kept so that the question is not taken for a statement, both as a long ا and eased. The term now says "the حرف مد that matches its vowel". `spot` now says "a round dot (۬)" / «نقطة مستديرة (۬)». |

## Re-check (round 1)
Reviewer, 2026-11-21.

**How I checked**
- **Checker:** `LESSONS=<the 8 ids> npx vitest run src/content/teach.check.test.ts` passes (2 tests) with **0 errors**. There are 4 card warnings (mutaqaribayn: سكت, صفة; waqf-how: روم, إشمام). Learn shows their meaning, so they are acceptable.
- **Terms, as the app shows them:** I ran the app's own `termsIn` (with the new `not` lists) over each lesson's Arabic text plus its Arabic card, as `OtherWords` does. Every term comes from an earlier lesson or from the lesson itself. «سورة الروم» no longer yields روم.
- **Text and books:** every changed passage was read in both languages against the books cited above.

**Each fix**
- **waqf-how #1 (BLOCKER): fixed.**
  - `spot` names ۠ on أَنَا۠ as the one sign of a stop change and points back to where it was taught. This agrees with the silent-letters card and the data (66 words).
  - `fits` now says «أنواع الأواخر».
- **sakt #1 (BLOCKER): fixed.** ۜ is called a pause sign only at the five places. ۜ on a ص inside a word means "read it as س", which matches هداية القاري 2/577 and the data (2:245, 7:69).
- **ishmam #1 (MAJOR): fixed.**
  - The term and `how[1]` give الاختلاس as about two thirds, more than الروم's third (الميزان 208).
  - The way is named الاختلاس (also called الروم) throughout, as in الوافي 292 and هداية القاري 1/259.
  - The two languages agree.
- **tashil #1 (MAJOR): fixed in the teaching text.** «مسهَّلةً» and «أخفّ» are natural Arabic, and the text no longer contains لين.
- **sakt #3 (the reasons): fixed.** The new `why` follows النشر 1/425 point by point. «مرّاق» is gone. The Arabic is correct («لئلا يُظن أن قَيِّمًا متصل في الإعراب بما قبله»).
- **sakt #2 and #4: fixed.** The route is named (طريق الطيبة, against the الشاطبية line). The pause is "about two counts", from هداية القاري 1/407 and غاية المريد 291.
- **ishmam #2 and #3: fixed.** The attribution now matches هداية القاري 1/261 and الوافي 292. The imperative is now «ضمّ شفتيك». The mirror check is added.
- **tashil #2–#4: fixed.**
  - The `why` matches هداية القاري 2/501: the همزة الوصل is kept in both ways.
  - The term now says "the حرف مد that matches its vowel".
  - `spot` now says «نقطة مستديرة (۬)», agreeing with «نقطة كبيرة» in هداية القاري 2/578.
- **mutaqaribayn #1–#3: fixed.**
  - The Arabic is now «من هذا النوع / منها … زيادةً على …».
  - The Arabic `plain` now says «مرةً واحدة في القرآن», which agrees with the English.
  - The tongue-tip self-check is added.
- **waqf-signs #1: fixed.**
- **waqf-how #2: added.** The ٱلْحَقُّ pair is correct in both languages.
- **rawm-ishmam #1–#4: fixed.**
  - The ميم الجمع exclusion now uses عَلَيْهِمُ ٱلْقِتَالُ (الميزان 209).
  - The unverified claim about the audio is gone.
  - The mirror check is added.
  - «قبل الحرف الموقوف عليه» and «حرف المد قبله» now refer to the right word.

**New or remaining**
1. **MINOR (new): waqf-how now has 5 mistake pairs.** §3 allows 2–4, and the checker doesn't count them.
   - **Fix:** fold the ٱلْمُزَّمِّلُ pair ("full vowel at the stop") into how step 1, or drop it. The ٱلْحَقُّ pair teaches more.
2. **MINOR (remaining, card side): the Arabic tashil card still says «بلين».**
   - **Text:** `ar.json` lessons.tashil.definition «تُنطق الهمزة الثانية **بلين**».
   - **The problem:** `termsIn` still matches لين (lin) there. On tashil's Learn page, "Words from other lessons" will list حرف اللين.
   - **The cause:** the comment in `teach.ts` names «بلين» as a `not` example, but lin's لين term has no `not` list.
   - **Fix:** add `"not": ["بلين"]` to لين in `content/teach/lin.json`. This also covers the two «بلين» uses in lin's own notes, «تُمد بلين» and «تنساب بلين». Alternatively, reword the card as «تُنطق الهمزة الثانية مسهَّلةً».

Neither is wrong content, and neither blocks release.

**Final verdicts:**
- **ACCEPT:** mutaqaribayn, waqf-signs, rawm-ishmam, sakt, imalah, ishmam and tashil. The tashil card fix (item 2) is for the card or lin owner, not for this text.
- **ACCEPT after one minor:** waqf-how. Cut the mistakes to 4.

- Coordinator: dropped the ٱلْمُزَّمِّلُ mistake pair (now 4 in both languages); added `"not": ["بلين"]` to لين in lin.json; the checker now enforces at most 4 mistake pairs.
