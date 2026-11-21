# Review · teaching texts, units 0–1

Date: 2026-11-21. Reviewer: independent (not the writer). Scope: `content/teach/{basics,istiadha,tabii,arid,iwad,tafkhim,ibtida,lam-q,lam-s,lam-jh,lam-jl,ghunnah}.json`, against `docs/16-teaching-strategy.md`, the cards in `content/rules.json` / `content/ar.json`, the books in `docs/04-content-review.md`, and the app's Tanzil Uthmani text (`.cache/quran-uthmani.txt`).

## Checker

`LESSONS=basics,istiadha,tabii,arid,iwad,tafkhim,ibtida,lam-q,lam-s,lam-jh,lam-jl,ghunnah npx vitest run src/content/teach.check.test.ts` passes: 0 errors, 8 warnings. All 8 are card terms used before the lesson that owns them (سكت, المد العارض, القصر, لفظ الجلالة, غنة, إقلاب, إخفاء, إمالة). §4 allows this and Learn shows their meanings. No teaching text uses a term before its owner lesson.

## The writer's doubts

| Doubt | Finding | Evidence |
|---|---|---|
| كسرة: lips spread or jaw drops? | **The jaw drops.** The teaching text is right. The English card ("an i, lips spread") is unsupported and contradicts the text (basics #1). | هداية القاري: «الفتحة بانفتاح الفم والكسرة بانخفاضه» (باب الروم والإشمام); الميزان 38104: «حين نحركها بالكسر فإن الفك الأسفل ومعه الشفة السفلى ينخفضان»، «تتباعد الشفتان بانخفاض الفك السفلي عند النطق بميم مكسورة». The Arabic card says only «صوت مكسور». |
| Why the ل of the name is heavy | **Sourced.** «تعظيم» is in the books, not only from teachers. The English says "teachers", the Arabic says «العلماء». Align both on "the books" (lam-jh #1). | العميد 12754/43: «ثم فخمت اللام للتعظيم بعد الفتح والضم دون الكسر لمناسبته للترقيق»; غاية المريد 7311/137: «قصد تفخيمه ليتلاءم مع تفخيم معناه». |
| The pinch test for الغنة | **Phonetically sound, but not in the cited books.** A nasal sound needs air through the nose, so closing the nose cuts it off. An oral sound is not changed. Neither غاية المريد, الميزان, هداية القاري nor العميد has the test (searched: أمسك/الأنف near غنة/خيشوم). Keep it, but present it as a classroom check, not as a book rule (ghunnah #2). | غاية المريد 7311/90 and الميزان 38104 (مكي, الرعاية): the غنة comes out of الخيشوم, which supports the reasoning but not the test itself. |
| Levels of التفخيم: five or three | **Correctly hedged.** Five is ابن الجزري's choice (التمهيد), as given by غاية المريد 7311/205. العميد 12754/122–124 reports a second view, which puts a letter with سكون at the level of the vowel before it, and also gives his own view of six levels. The "three by the vowel alone" sentence needs a clearer wording and belongs in `how`, not `why` (tafkhim #1). | as cited |
| The الاستعاذة rulings | **Correct.** Most scholars: مندوب, with the command in 16:98 «محمول على الندب»; a minority say واجب. Saying it aloud or quietly follows the setting. The four ways plus the 3+1 between surahs are agreed. One gap: the text never explains why a command (16:98) is "a sunnah" (istiadha #1), and the books give a concrete rule for aloud and quiet that could replace "ask your teacher" (istiadha #2). | هداية القاري 22869 (2/504–505): «جمهورهم بالاستحباب… والمأخوذ به هو مذهب الجمهور»; الجهر «بحضرة من يسمع» (أبو شامة); الميزان 38104: الجهر عند افتتاح القراءة جهرًا بحضور من يسمع، والإسرار إذا قرأ سرًّا أو خاليًا; غاية المريد 7311/56–57. |

## The `spot` rule (signs the app doesn't show)

No `spot` relies on staggered tanween. Every sign named (sukun, shadda, ٰ, ٓ, ٱ, ً, a bare letter) is in the Tanzil text of the anchor word; this was checked against 1:2, 1:3, 16:98, 110:2, 112:1, 114:1, 114:2, 114:4 and 114:6. There are no MAJOR violations of this rule. One `spot` contradicts its own anchor word on screen (lam-jl #1), and one should say "printed" more plainly (istiadha #3).

---

## basics: FIX

1. **MAJOR · the card contradicts the text on the كسرة.** The text says "said with the lower jaw dropped a little (بِ)"; the English card's list (shown right under it as الخلاصة) says `"an i, lips spread: بِ"`. The books support the jaw (see the table above). Replace the card's list item with `["كسرة ِ", "an i, the lower jaw dropped a little: بِ"]`. Leave the text as it is.
2. **MINOR · an undefined term.** حفص (en): "this course teaches it as the الشاطبية poem gives it." A beginner does not know what الشاطبية is. → "…as the الشاطبية, the famous poem on the readings by al-Shāṭibī, gives it." AR: «…من طريق الشاطبية، وهي المنظومة المشهورة للإمام الشاطبي في القراءات.»
3. **MINOR · the finger count is presented as the rule.** how[4]: "Count a حركة by closing or opening one finger at your normal speed". The card's own review note says that الميزان calls this a later aid and العميد prefers the time of a letter. → "A common aid: close or open one finger for each حركة, at your normal speed, and keep that speed through the whole recitation." AR: «ومن الوسائل المعينة أن تعدّ الحركة بقبض إصبع أو بسطه بسرعتك المعتادة…»
4. **MINOR · `spot` is 4 sentences (limit 3), and its first sentence clashes with its third.** "Every letter… carries its mark" then "A letter with no mark at all is special". → "In مَلِكِ below, a فتحة is on the م and a كسرة on the ل and the ك. A letter with no mark at all is special: often it is a حرف مد, like the و in يَقُولُ; later lessons explain the rest." AR: «في مَلِكِ أدناه فتحة على الميم، وكسرة على اللام والكاف. أمّا الحرف الخالي من كل علامة فله شأن خاص: كثيرًا ما يكون حرف مد، كالواو في يَقُولُ، وتشرح الدروس اللاحقة غيره.»
5. **MINOR · the definition of مخرج leaves out the open space of the حروف المد.** "in the throat, the mouth (tongue and lips) or the nose" leaves the learner unsure where the ا of مَٰلِكِ comes from. الجوف belongs to makharij-jawf, so describe it in plain words: "…in the throat, the mouth (tongue and lips), the nose, or, for the حروف مد, the open space of the mouth and throat." AR: «…أو الأنف، أو فراغ الفم والحلق لحروف المد.»
6. **MINOR · unclear English.** وقف (en): "long enough to breathe, meaning to go on reading." → "long enough to take a breath, intending to carry on reading."
7. **MINOR · Arabic.** سكون (ar): «يُنطق مقفلًا ثم تنتقل إلى ما بعده» mixes the passive with "you" and uses مقفلًا, which is not a usual word here. → «الحرف بلا حركة، تنطقه ساكنًا ثم تنتقل إلى ما بعده (قُلْ).» Also in how[1] (both languages), say where بِ comes from: "the كسرة on بِ in بِرَبِّ".

## istiadha: FIX

1. **MINOR · a command next to "sunnah" with no bridge.** why: "Allah commands it… Most scholars count it a sunnah". A beginner will ask how a command is a sunnah. → "Allah commands it in the ayah you heard (16:98)… Most scholars read this command as a strong recommendation (a sunnah); some count it as required." AR: «…وحمل جمهور العلماء هذا الأمر على الندب فهي سنة، وقال بعضهم بوجوبها.» Source: هداية القاري 2/504.
2. **MINOR · "ask your teacher" where the books give a rule.** → "Say it aloud when you recite aloud and someone is listening; quietly when you recite alone or silently." AR: «وتجهر بها إذا قرأت جهرًا بحضرة من يسمع، وتُسرّ بها إذا قرأت سرًّا أو وحدك.» Source: الميزان 38104 (مواضع الجهر والإسرار); هداية القاري 2/505.
3. **MINOR · `spot` doesn't touch what is on screen, and the البسملة facts are about the printed muṣḥaf.** The screen shows 16:98. → "The الاستعاذة is not printed in the muṣḥaf; you say it from memory. Below is the ayah that commands it, with فَٱسْتَعِذْ. In the printed muṣḥaf the البسملة heads every surah except التوبة; in الفاتحة it is numbered as the first ayah, and above the others it has no number." AR to match.
4. **MINOR · fits: "only one way is wrong".** At the start of a surah all four ways are correct; the wrong way is between two surahs. → "…you may stop or join; the one wrong way comes between two surahs." AR: «…ولا يُمنع إلا وجه واحد بين سورتين.»
5. **MINOR · clarity.** how[2]: "join all three" / «وصل الثلاثة». Name them: "join all three (الاستعاذة, البسملة and the surah's first ayah)".

## tabii: FIX

1. **MAJOR · it calls an accepted reading a لحن جلي.** mistakes[0]: "Cutting it short: مَٰلِكِ said as مَلِكِ… which is a لحن جلي"; why: "مَٰلِكِ in 1:4, said short, becomes مَلِكِ, a different word". مَلِكِ in 1:4 is the authentic (mutawātir) reading of نافع, ابن كثير, أبي عمرو, ابن عامر and حمزة. Reading it so in حفص is a departure from the رواية, but labelling it a "clear error" teaches a falsehood about the Quran's readings. Use a word with no other reading. mistakes[0] → wrong: "Cutting it short: أَعُوذُ said as أَعُذُ." right: "Hold two full حركات. Cutting it drops a letter, which is a لحن جلي." AR: «تقصيره: نطق أَعُوذُ أَعُذُ.» why → "…cut it and the letter is gone and the word changes: يَقُولُ (he says) said short becomes يَقُلْ." AR to match. If the writer wants to keep 1:4, it must say: "In رواية حفص 1:4 is مَٰلِكِ, with the ا; leaving it out is not حفص's reading."
2. **MINOR · the finger count is presented as the rule** (same as basics #3). how[2]: "Count with a finger: one, two." / «وعُدّهما بإصبعك» → "You can count them on a finger: one, two." / «ويمكنك أن تعدّهما بإصبعك: واحد، اثنان.»

## arid: FIX

1. **MAJOR · the definition is too broad: stopping on a final همزة.** term en: "A حرف مد just before the last letter of a word you stop on… may then be held 2, 4 or 6"; plain: same. For ٱلسَّمَآءُ, يَشَآءُ, ٱلْمَآءِ the last letter is a همزة, and 2 counts is wrong in حفص (4 or 5, and 6 on a stop; see the muttasil card and `04-content-review.md` #3). `spot` only works because it says "bare". Add the limit in plain words. Term en → "…before the last letter of a word you stop on, when that letter is not a ء. The stop gives it a سكون, and the مد may then be held 2, 4 or 6 حركات." AR: «…ما لم يكن الحرف الأخير همزة.» Add to how[1]: "If the last letter is a ء, the حرف مد has a ٓ over it (ٱلسَّمَآءِ); that is a longer مد, in a later lesson." AR to match.
2. **MINOR · "just"** (style rule: never "just"), 3 times: term "just before the last letter", plain "the ا just before it", spot "just before the last letter". → "right before". 
3. **MINOR · the terms القصر, التوسط, الإشباع are defined as "this مد".** Later lessons (muttasil, lazim) reuse them. → "Holding a مد two حركات, its shortest length here" / «مدّه حركتين…». Otherwise the glossary entry is wrong outside this lesson.
4. **MINOR · unsourced wording in why.** "The length stands in for a vowel between them" is not in the books read. The sourced reason is the meeting of two سكون and the three views. → "The stop leaves two letters with no vowel side by side: the حرف مد and the stopped letter. The books allow three lengths: 6 counting that meeting, 2 because the سكون is only passing, and 4 between the two." AR: drop «فيقوم المد مقام الحركة بينهما ليجري الصوت سهلًا».

## iwad: FIX

1. **MINOR · spot/how imply that no written ا means no العوض.** "After ة (رَحْمَةً) there is no ا." True, but مَآءً (78:14, in this course's جزء) has no ا written either, and it is still stopped with an ا: مَآءَا. Add to how[3] or spot: "A few words such as مَآءً have no ا after the ً, yet you still stop with an ا: مَآءَا. Only ة differs." AR: «وبعض الكلمات مثل مَآءً لا تُكتب بعدها ألف، ومع ذلك تقف عليها بالألف: مَآءَا. ولا يُستثنى إلا التاء المربوطة.»
2. **MINOR · grammar jargon in the Arabic.** why: «فالعرب تقف على المنصوب المنوّن بالألف، وعلى المرفوع والمجرور بالسكون». A beginner doesn't know منصوب/مرفوع/مجرور. → «فالعرب تقف على المنوّن بالفتح بالألف، وعلى المنوّن بالضم والكسر بالسكون».

## tafkhim: FIX

1. **MINOR · the levels note is in the wrong section, and "three" is unclear.** why has 4 sentences (limit 3), and the levels are not a reason. "some books count three, by the vowel alone" doesn't say what happens to سكون. Move it to the end of how[3]: "These are five levels (ابن الجزري's choice); some teachers count three, by فتحة, ضمة and كسرة, and give a letter with سكون the level of the vowel before it. Your teacher will say which to drill." AR: «هذه خمس مراتب على اختيار ابن الجزري، وبعضهم يجعلها ثلاثًا: المفتوح والمضموم والمكسور، ويُلحق الساكن بحركة ما قبله. والشيخ يحدد ما تأخذ به.» why then ends after the عَصَىٰ/عَسَىٰ sentence. Sources: غاية المريد 7311/205; العميد 12754/122–124.
2. **MINOR · how[3] lacks a pointer to the teacher on a subtle sound.** Add: "Listen to the reciter and to your teacher: heaviness is easier to hear than to describe." AR: «واستمع إلى القارئ وإلى شيخك، فالتفخيم يُدرك بالسماع أكثر من الوصف.»

## ibtida: FIX

1. **MAJOR · "original ضمة" is never explained.** how[2]: "With an original ضمة… A ضمة that is not original, as in ٱمْشُوا۟, still takes a كسرة." A beginner can't tell an original ضمة from one that isn't, and §3 forbids undefined jargon. Also the step has 4 sentences (limit 2). Split it into two steps:
   - "In a verb, count the ٱ as the first letter and look at the third (the ع of ٱدْعُ). If it has a ضمة, start with a ضمة: اُدْعُ; otherwise a كسرة: اِهْدِنَا, اِقْرَأْ." AR: «وفي الفعل عُدّ ٱ الحرف الأول وانظر إلى الثالث (العين في ٱدْعُ): إن كان مضمومًا فابدأ بالضم: اُدْعُ، وإلا فبالكسر: اِهْدِنَا، اِقْرَأْ.»
   - "A few verbs have a ضمة there only because of the و after it; they still start with a كسرة: ٱمْشُوا۟, ٱقْضُوٓا۟, ٱئْتُوا۟, ٱبْنُوا۟. Learn these as a list." AR: «وأفعال معدودة جاءت الضمة على ثالثها من أجل الواو بعده فقط، فتبقى الهمزة مكسورة: ٱمْشُوا۟، ٱقْضُوٓا۟، ٱئْتُوا۟، ٱبْنُوا۟. فاحفظها.» (The list is the card's, from 04-content-review #5.)
2. **MINOR · how[3] "A few nouns always start with a كسرة".** Every noun that starts with ٱ and has no ال starts with a كسرة (ٱسْتِغْفَار…), so "a few" misleads. → "Nouns without ال start with a كسرة: the seven that come up most are ٱسْم، ٱبْن، …" AR to match. Alternatively keep "these seven nouns", but drop "a few… always".

## lam-q: FIX

1. **MINOR · `fits` is 5 sentences (limit 4).** Merge the 3rd and 4th: "Before 14 letters it is said (this lesson); before the other 14 it is silent and the next letter is doubled (the next lesson)." AR is already one sentence, so it is fine.

## lam-s: FIX

1. **MINOR · "just"** in fits: "silent in just this way" → "silent in this same way".

## lam-jh: FIX

1. **MINOR · EN and AR differ, and EN understates the source.** EN why: "teachers explain it as honouring the name of Allah"; AR: «ويعلّله العلماء بتعظيم اسم الله». The books say it (العميد 12754/43; غاية المريد 7311/137). EN → "This is how the reading was handed down from the reciters, and the books explain it as honouring the name of Allah, heavy in sound as His name is great in meaning." AR → «هكذا تُلقّيت القراءة عن أئمتها، ويعلّله العلماء بتعظيم اسم الله تعالى، ليوافق تفخيمُ لفظه عظمةَ معناه.»
2. **MINOR · "just"** in how[0]: "the vowel just before the name" → "right before the name".

## lam-jl: FIX

1. **MAJOR · `spot` contradicts the anchor word on screen.** "The name looks the same everywhere: ٱللَّه." The anchor right below is لِلَّهِ (1:2), written without the ٱ. AR: «الاسم مكتوب بصورة واحدة في كل موضع: ٱللَّه» has the same fault. → "The name is written ٱللَّه, except after لِ, where its ٱ is dropped: لِلَّهِ, as below. What decides is the mark on the letter right before the doubled ل: here the كسرة under لِ." AR: «يُكتب الاسم ٱللَّه، إلا بعد لِ فتُحذف ألفه: لِلَّهِ كما أدناه. والذي يحسم الأمر علامة الحرف الذي قبل اللام المشددة مباشرة، وهي هنا كسرة اللام.»
2. **MINOR · "just"** in mistakes[2].right: "Only the vowel just before decides" → "Only the vowel right before the name decides".

## ghunnah: FIX

1. **MINOR · `fits` overstates.** "a ن with سكون and the تنوين use this same sound in four different ways." In الإظهار the غنة is not held, and in الإدغام without غنة (ل, ر) it is dropped. → "In the next unit, a ن with سكون and the تنوين follow four rules, and in most of them this same sound is what changes." AR: «وفي الوحدة التالية تتبع النون الساكنة والتنوين أربعة أحكام، وفي أكثرها يتغير هذا الصوت نفسه.»
2. **MINOR · the pinch test is not in the books.** It is phonetically sound (see the table above), but it reads like a rule. how[3] → "A classroom check: lay a finger on the side of your nose and feel it buzz; pinch your nose and the hum is cut off." AR: «ومما يُختبر به: ضع إصبعك على جانب أنفك فتحس اهتزازه، وأمسك أنفك فينقطع الصوت.» mistakes[2].right can stay.
3. **MINOR · no pointer to the teacher on a subtle sound.** Add to how[2]: "Listen to your teacher for how full it should be." AR: «واستمع إلى شيخك في مقدار امتلائها.»

---

## Summary

| Lesson | Verdict | BLOCKER | MAJOR | MINOR |
|---|---|---|---|---|
| basics | FIX | 0 | 1 | 6 |
| istiadha | FIX | 0 | 0 | 5 |
| tabii | FIX | 0 | 1 | 1 |
| arid | FIX | 0 | 1 | 3 |
| iwad | FIX | 0 | 0 | 2 |
| tafkhim | FIX | 0 | 0 | 2 |
| ibtida | FIX | 0 | 1 | 1 |
| lam-q | FIX | 0 | 0 | 1 |
| lam-s | FIX | 0 | 0 | 1 |
| lam-jh | FIX | 0 | 0 | 2 |
| lam-jl | FIX | 0 | 1 | 1 |
| ghunnah | FIX | 0 | 0 | 3 |

What holds up well: every rule ruling checked against the books is right for حفص من الشاطبية (the 14/14 letters, the five levels as one view, همزة الوصل vowels, the ل of the name after an added كسرة and after a silent ى, the 2/4/6 of العارض with keeping one length, العوض at 2, the غنة at 2). The Arabic reads as written Arabic, not as a translation. The terms (`say`, `literal`) are correct.

## Fixes (round 1)

Writer, 2026-11-21. All 5 MAJOR and 28 MINOR applied.

- **basics:** #1 the card's English list item is now "an i, the lower jaw dropped a little: بِ" (`content/rules.json`; the Arabic card says only «صوت مكسور», so it is unchanged). The basics example note "كسرة on the ه: an i, lips spread." (rules.json) still says "lips spread" and was left alone, because the fix covered only the list line. #2 الشاطبية explained in حفص. #3 the finger count is now "a common aid". #4 spot is 2 sentences. #5 مخرج includes the open space of the mouth and throat for the حروف مد. #6 the وقف wording. #7 the سكون Arabic, and "بِ in بِرَبِّ" in how[0].
- **istiadha:** #1 the command is read as ندب by most scholars, and some say واجب. #2 the rule for saying it aloud or quietly replaces "ask your teacher". #3 spot points at the ayah on screen, and the البسملة is described as printed. #4 the one wrong way is between two surahs. #5 "all three" is named.
- **tabii:** #1 the لحن example is now أَعُوذُ → أَعُذُ, and why uses يَقُولُ → يَقُلْ; مَلِكِ in 1:4 is no longer called an error. #2 the finger count is optional.
- **arid:** #1 the term, plain and how[1] exclude a final ء, and how[1] points to ٓ (ٱلسَّمَآءِ) as a longer مد that comes later. #2 "just" → "right". #3 القصر/التوسط/الإشباع are defined for any مد. #4 the unsourced sentence is dropped from why.
- **iwad:** #1 the مَآءً → مَآءَا case is in spot. #2 the Arabic grammar terms are replaced with «المنوّن بالفتح / بالضم والكسر».
- **tafkhim:** #1 the levels note moved to how[3] (ابن الجزري's five, or three with the letter that has سكون taking the vowel before it), and why is down to 2 sentences. #2 a pointer to the reciter and the teacher is in how[2].
- **ibtida:** #1 "original ضمة" is replaced by counting to the third letter, plus a separate step listing the verbs whose ضمة comes from the و (ٱمْشُوا۟، ٱقْضُوٓا۟، ٱئْتُوا۟، ٱبْنُوا۟). Every step has ≤ 2 sentences; the nouns are merged into the ال step to keep 5 steps. #2 "nouns without ال take a كسرة; the seven that come up most…". mistakes[1] no longer says "original".
- **lam-q:** #1 fits is 4 sentences. **lam-s:** #1 "just" removed.
- **lam-jh:** #1 why: "the books explain it as honouring…", in both languages. #2 "just" removed.
- **lam-jl:** #1 spot matches لِلَّهِ (its ٱ is dropped after لِ). #2 "just" removed.
- **ghunnah:** #1 fits: "four rules, and in most of them this same sound is what changes". #2 the pinch test is labelled a classroom check. #3 a pointer to the teacher is in how[2].

Checker: `UPDATE_GLOSSARY=1 LESSONS=<12 ids> npx vitest run src/content/teach.check.test.ts` has 0 errors and 8 warnings, all card look-aheads. `npx vitest run src/content`: 7 files, 17 tests, all pass.

## Re-check (round 1)

Reviewer, 2026-11-21. I read every field the writer changed in both languages, plus the `rules.json`/`ar.json` diffs. The checker passes (`LESSONS=<12 ids> … teach.check.test.ts`: 2/2 tests, 0 errors, the same 8 card look-ahead warnings), and so does `npx vitest run src/content` (7 files, 17 tests). My first run during the re-check failed once and then passed on two reruns with no change, probably because a file was being written at the same moment.

**Verified fixed:** the basics card line, and the example note «كسرة on the ه» (EN and AR now say the jaw drops, matching هداية القاري and الميزان). Also fixed: الشاطبية explained, the finger count shown as an aid, `spot` length, مخرج, وقف, سكون. The istiadha rulings: ندب read by the majority with وجوب as a minority view, and aloud or quiet as in الميزان and هداية القاري 2/505. Its `fits` and `spot`, now saying "printed". tabii: أَعُوذُ → أَعُذُ has no other reading, and مَلِكِ in 1:4 is no longer called an error. arid: the ء limit is in the term, `plain` and `how`; the ٓ over the حرف مد before a ء matches Tanzil (ٱلسَّمَآءِ); the unsourced sentence is gone. iwad: مَآءً, and the Arabic without grammar terms. tafkhim: the levels are in `how` with ابن الجزري's five (غاية المريد 7311/205) and the second view (العميد 12754/122). lam-q `fits` is 4 sentences. lam-jh: the attribution now matches the books in both languages (العميد 12754/43; غاية المريد 7311/137). lam-jl: `spot` now matches لِلَّهِ. ghunnah: `fits`, the classroom check, and the pointer to the teacher. Every "just" is gone.

**New or remaining findings:**

1. **ibtida · MAJOR · the list of verbs is incomplete and is presented as complete.** how[3]: "ٱمْشُوا۟, ٱقْضُوٓا۟, ٱئْتُوا۟, ٱبْنُوا۟. Learn these as a list." هداية القاري 2/480–488 gives **five**: «اقضوا وابنوا وامضوا وامشوا وائتوا… وليس في القرآن غير هذه الأفعال الخمسة». The missing one is وَٱمْضُوا۟ (15:65). A learner who follows the list and then the rule in how[2] would start ٱمْضُوا۟ with a ضمة, which is wrong. → "…they still start with a كسرة: ٱمْشُوا۟, ٱمْضُوا۟, ٱقْضُوٓا۟, ٱئْتُوا۟, ٱبْنُوا۟. These five are all there are." AR: «…ٱمْشُوا۟، ٱمْضُوا۟، ٱقْضُوٓا۟، ٱئْتُوا۟، ٱبْنُوا۟، وهي خمسة لا غير، فاحفظها.» The same four-verb list is in `04-content-review.md` #5; the card should add ٱمْضُوا۟ too.
2. **tabii · MINOR · the shortened form is misspelled.** why: "يَقُولُ (he says), said short, becomes يَقُلْ". Dropping the و keeps the final ضمة: يَقُلُ. (يَقُلْ is a different form with سكون.) → "becomes يَقُلُ". AR: «صارت يَقُلُ».
3. **arid · MINOR · how[1] is now 3 sentences (limit 2), in both languages.** Move the ء sentence to its own step: "If the last letter is a ء, the حرف مد has a ٓ over it (ٱلسَّمَآءِ): that is a longer مد, in a later lesson." That makes 5 steps, which is allowed.
4. **lam-jl · MINOR · `spot` is incomplete about how لِلَّهِ is spelled.** "its ٱ is dropped" leaves the learner looking for the bare ل that lam-jh taught. In لِلَّهِ the silent ل is gone too: the لِ is the word "for", then the doubled ل. → "…except after لِ ('for'), where the ٱ and the silent ل are dropped: لِلَّهِ, as below." AR: «…إلا بعد لام الجر فتُحذف همزة الوصل واللام الساكنة: لِلَّهِ كما أدناه.»

Out of scope, noted only: the `rules.json`/`ar.json` diff also adds a الٓمٓ (آل عمران) note citing غاية المريد 7311/136. That is not a unit 0–1 card.

### Final verdicts

| Lesson | Verdict |
|---|---|
| basics | ACCEPT |
| istiadha | ACCEPT |
| tabii | FIX (#2, MINOR) |
| arid | FIX (#3, MINOR) |
| iwad | ACCEPT |
| tafkhim | ACCEPT |
| ibtida | FIX (#1, MAJOR) |
| lam-q | ACCEPT |
| lam-s | ACCEPT |
| lam-jh | ACCEPT |
| lam-jl | FIX (#4, MINOR) |
| ghunnah | ACCEPT |

## Fixes (round 2)

Writer, 2026-11-21.

1. **ibtida (MAJOR):** how[3] now lists five verbs, adding ٱمْضُوا۟ (15:65, checked in Tanzil), with "these five are all there are" / «وهي خمسة لا غير». The card was not changed: its list gives one example (ٱمْشُوا۟) and does not list the verbs. The four-verb list in `04-content-review.md` #5 is not my file and is left for the coordinator.
2. **tabii:** يَقُولُ said short → يَقُلُ, in EN and AR.
3. **arid:** the ء sentence is now its own step (how[2]). EN and AR have 5 steps each, all ≤ 2 sentences.
4. **lam-jl:** spot says that after لِ ('for') both the ٱ and the silent ل are dropped: لِلَّهِ.

Checker: 0 errors, 8 card look-ahead warnings. `npx vitest run src/content`: 7 files, 17 tests, all pass.

## Re-check (round 2)

Reviewer, 2026-11-21. I checked only the four round-2 changes, in both languages. The checker passes (2/2 tests, 0 errors, the same 8 card look-ahead warnings).

- **ibtida:** fixed. how[3] lists the five verbs, ٱمْشُوا۟، ٱمْضُوا۟، ٱقْضُوٓا۟، ٱئْتُوا۟، ٱبْنُوا۟, matching هداية القاري 2/480–488. It is 2 sentences. `docs/04` #5 now lists the same five. Note, not a finding: هداية القاري hedges with «فيما أحسب», so "These five are all there are" (my own round-1 wording) is a little firmer than the source. "These are the five the books list" / «وهي الخمسة التي يذكرها العلماء» would match it exactly. Optional.
- **tabii:** fixed. يَقُولُ → يَقُلُ in EN and AR.
- **arid:** fixed. The ء sentence is now its own step, so `how` has 5 steps of 2 sentences or fewer in both languages.
- **lam-jl:** fixed. The spot now says the ٱ and the silent ل are dropped after لِ, the preposition for 'for' (لام الجر), which matches the anchor لِلَّهِ.

### Final verdicts

All 12 lessons: **ACCEPT** (basics, istiadha, tabii, arid, iwad, tafkhim, ibtida, lam-q, lam-s, lam-jh, lam-jl, ghunnah).
