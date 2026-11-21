# Review: teaching texts, units 2–3

Reviewer: independent. Date: 2026-11-21. Standard: `docs/16-teaching-strategy.md`.
Lessons: izhar, idgh-g, idgh-n, iqlab, ikhfa, qal-s, qal-k, sakinayn, muttasil, munfasil, mithlayn.

## Summary

| Lesson | Verdict | BLOCKER | MAJOR | MINOR |
|---|---|---|---|---|
| izhar | FIX | 0 | 2 | 2 |
| idgh-g | FIX | 0 | 1 | 1 |
| idgh-n | FIX | 0 | 1 | 1 |
| iqlab | FIX | 0 | 1 | 1 |
| ikhfa | FIX | 0 | 1 | 0 |
| qal-s | FIX | 0 | 1 | 0 |
| qal-k | FIX | 0 | 0 | 2 |
| sakinayn | FIX | 0 | 2 | 2 |
| muttasil | ACCEPT | 0 | 0 | 0 |
| munfasil | ACCEPT | 0 | 0 | 0 |
| mithlayn | FIX | 0 | 1 | 1 |

Checker: `LESSONS=izhar,idgh-g,idgh-n,iqlab,ikhfa,qal-s,qal-k,sakinayn,muttasil,munfasil,mithlayn npx vitest run src/content/teach.check.test.ts` passes with no errors. Three warnings, all on the cards, not the teaching texts: idgh-n card uses سكت; mithlayn card uses لين and سكت (Learn shows their meaning).

## Evidence used

**The tanween shape in the Madinah print.** The KFGQPC text (quran.com `text_qpc_hafs`) encodes the stacked tanween as U+064B–064D and the staggered one as U+0656/0657/065E:
- 113:5 `حَاسِدٍ إِذَا`: stacked (U+064D).
- 88:2 `وُجُوهٞ يَوۡمَئِذٍ`, 93:4 `خَيۡرٞ لَّكَ`, 82:19 `نَفۡسٞ لِّنَفۡسٖ`, 111:3 `نَارٗا ذَاتَ`: staggered.
- 80:16 `كِرَامِۭ`: one كسرة and U+06ED (the small م). 96:15 `لَنَسۡفَعَۢا`: one فتحة and U+06E2.
- **The writer's question.** 11:42 `نُوحٌ ٱبۡنَهُۥ` is U+064C, the stacked form, as before a throat letter. 14:26 `خَبِيثَةٍ ٱجۡتُثَّتۡ` is stacked too. There is no small ن. So the Madinah print shows nothing to mark the كسرة on a تنوين before ٱ.

**The app's text.** `public/data/surah/*.json` (Tanzil) uses only U+064B–064D for every تنوين. For 80:16 it has `كِرَامٍۭ`: two كسرة marks (U+064D) and then ۭ. So this screen shows two vowel marks on an iqlab تنوين where the print shows one. The screen does show: the missing سكون on a hidden or merged ن (`فَمَن`, `مِن شَرِّ`), the شدة, ۢ/ۭ, ٓ and ۟.

**The books.**
- هداية القاري, from the OpenITI copy of Shamela 22869 (`1409IbnSayyidCajamiMisri.HidayatQari`):
  - 1/82–83: the cause of القلقلة, and that it is «في الساكن الموقوف عليه … أبين» (الجزرية: «وإن يكن في الوقف كان أبينا»).
  - 1/84–86: the levels of القلقلة, and **how it sounds: «يتبع حركة ما قبله … هذا هو القول المشهور وعليه الجمهور». «للفتح أقرب مطلقا» is the second view.** السمنودي prefers following the vowel before.
  - 1/163–166: الإدغام كامل and ناقص (ن م ل ر كامل «على الصحيح»; و ي ناقص). The ghunnah with م is the م's. Why there is no ghunnah with ل ر. The سكت in مَنْ رَاقٍ.
  - 1/166–171: why الإقلاب and الإخفاء happen. «كونتم»; pressing the tongue to the teeth.
- الميزان 38104/74–76: the cause of القلقلة; أحدء as a mistake; «فمن أسمع القلقلة نفسه فقط … لحن».
- الميزان 38104/75: د. أيمن سويد's reservation on the third level.
- الميزان 38104/129: «أن يكون الحرف الأول حرف مد … فيجب فيه الإظهار **لئلا يزول المد بالإدغام**». Also مَالِيَهْ هَلَكَ is a second exception (سكت).

**The two "why" lines the writer flagged:**
- mithlayn (a حرف مد is kept so its length is not lost): **verified**, الميزان 38104/129.
- qal-k (the letter is the last thing said): the ranking is in the books, but they give no reason for it. See qal-k 1.

---

## izhar — FIX

1. **MAJOR (spot: the تنوين shape).** EN: "In a printed مصحف المدينة, the two marks of a تنوين sit exactly one above the other here (حَاسِدٍ إِذَا)." AR: "وحركتا التنوين هنا في مصحف المدينة المطبوع متراكبتان…"
   - The anchor under this text is `حَاسِدٍ إِذَا`, drawn in the plain form. On this screen every تنوين looks the same, so the shape tells the learner nothing here. The text does not say so.
   - Replace EN: "The ن carries a سكون (نْ), as in مَنْ خَافَ; then check that the next letter is one of ء هـ ع ح غ خ. A تنوين has no extra sign on this screen, so in حَاسِدٍ إِذَا your sign is the letter after it, إ. In the printed مصحف المدينة the two marks of this تنوين are stacked one above the other, but this screen draws every تنوين that way."
   - Replace AR: "على النون سكون (نْ)، كما في مَنْ خَافَ؛ ثم انظر: أهو الحرف التالي من ء هـ ع ح غ خ؟ ولا علامة زائدة على التنوين في هذه الشاشة، فعلامتك في حَاسِدٍ إِذَا هي الهمزة بعده. أما في مصحف المدينة المطبوع فحركتا التنوين هنا متراكبتان، وهذه الشاشة ترسم كل تنوين على هذه الصورة."
2. **MAJOR (beginner clarity, the Arabic map).** AR fits: "وتدخل في الحرف التالي إذا كان من حروف «يرملون»".
   - The Arabic reader is never told which letters «يرملون» stands for. The English lists them (ي ر م ل و ن). The map is the point of this section (§3), and most learners read the Arabic.
   - Replace: "وتدخل في الحرف التالي إذا كان أول الكلمة التي بعدها ي أو ر أو م أو ل أو و أو ن (يجمعها لفظ «يَرْمَلُونَ»)"
3. **MINOR (accuracy of the map).** EN: "Before ي ر م ل و ن it goes into that letter".
   - This is false inside one word (دُنْيَا, صِنْوَانٌ). The rule needs those letters to start the next word (تحفة: «إلا إذا كانا بكلمة فلا تدغم»).
   - Replace: "Before ي ر م ل و ن at the start of the next word it goes into that letter". The Arabic fix in 2 already says this.
4. **MINOR (Arabic wording).** AR how[0]: "اجعل طرف اللسان على اللثة فوق الثنايا العليا".
   - Replace: "اجعل طرف اللسان على لثة الثنايا العليا".

## idgh-g — FIX

1. **MAJOR (spot: the تنوين shape).** EN: "…and in a printed مصحف المدينة a تنوين's two marks are staggered, one a little after the other." AR: "وحركتا التنوين في مصحف المدينة المطبوع متتابعتان…"
   - The text does not say that this screen does not show it. Here the learner sees a plain تنوين in `نَفْسٌ مَّا`, which looks like the stacked one, so the text contradicts the screen.
   - Replace EN: "The ن has no سكون (فَمَن). A شدة on the next letter (نَفْسٌ مَّا) means a complete merge; no شدة on the ي or و (فَمَن يَعْمَلْ) means the غنة stays. The printed مصحف المدينة also staggers a تنوين's two marks here, but this screen draws every تنوين the same way, so look at the next letter and its شدة."
   - Replace AR: "لا سكون على النون (فَمَن). فإن كان على الحرف التالي شدة (نَفْسٌ مَّا) فالإدغام كامل، وإن لم تكن، كما في فَمَن يَعْمَلْ، فهو ناقص تبقى فيه الغنة. وفي مصحف المدينة المطبوع تأتي حركتا التنوين هنا متتابعتين، لكن هذه الشاشة ترسم كل تنوين بصورة واحدة، فانظر إلى الحرف التالي وشدته."
2. **MINOR (wording).** EN how[3]: "…then the next letter's vowel opens." AR: "ثم تنفتح حركة الحرف التالي".
   - A vowel does not "open".
   - Replace EN: "…then say the next letter's vowel." AR: "ثم انطق حركة الحرف التالي."

## idgh-n — FIX

1. **MAJOR (spot: the تنوين shape).** EN: "…and in print a تنوين's marks are staggered." AR: "وحركتا التنوين متتابعتان في المصحف المطبوع".
   - "In print" does not say that this screen shows it differently. The sign the learner can see, the شدة, is already in the text.
   - Replace EN: "The ن has no سكون, and the ل or ر after it carries a شدة: عَن رَّبِّهِمْ, خَيْرٌ لَّكَ. The شدة tells you the ن is gone. A تنوين's marks are staggered in the printed muṣḥaf, but not on this screen, so the شدة is your sign here."
   - Replace AR: "لا سكون على النون، وعلى اللام أو الراء بعدها شدة: عَن رَّبِّهِمْ، خَيْرٌ لَّكَ. فالشدة علامة أن النون ذهبت كلها. وحركتا التنوين متتابعتان في المصحف المطبوع لا في هذه الشاشة، فعلامتك هنا الشدة."
2. **MINOR (clarity).** EN fits: "With the letters of يَنْمُو the غنة stayed. Here the merge is complete and the غنة goes too".
   - This reads as if the ن/م merge in the last lesson was not complete. idgh-g called it إدغام كامل, and هداية القاري 1/165 agrees.
   - Replace EN: "With the letters of يَنْمُو a two-count غنة was heard. Here the merge is complete, as with ن and م, but no غنة is heard: nothing of the ن is left."
   - Replace AR: "عرفتَ أن الغنة تُسمع مع حروف «يَنْمُو». أما هنا فالإدغام كامل كما في النون والميم، لكن بلا غنة، فلا يبقى من النون شيء."

## iqlab — FIX

1. **MAJOR (spot: what this screen shows).** EN: "On a تنوين, one vowel mark is printed and the small م takes the place of the second: كِرَامٍۭ بَرَرَةٍ." AR: "وفي التنوين تُكتب حركة واحدة، وتحل الميم الصغيرة محل الثانية".
   - This is true of the print (QPC `كِرَامِۭ`). The app's text is `كِرَامٍۭ`: two كسرة marks and then ۭ. The learner sees the opposite of what the text says.
   - Replace EN: "A small م (ۢ) sits on the ن in place of the سكون: مَنۢ بَخِلَ. On a تنوين you see the small م after the vowel marks, above for a فتحة and below for a كسرة: كِرَامٍۭ بَرَرَةٍ (the printed muṣḥaf keeps only one vowel mark there; this screen shows two). The ب after it has no شدة."
   - Replace AR: "ميم صغيرة (ۢ) فوق النون مكان السكون: مَنۢ بَخِلَ. وفي التنوين ترى الميم الصغيرة بعد الحركة، فوقها مع الفتح وتحتها مع الكسر: كِرَامٍۭ بَرَرَةٍ (والمصحف المطبوع يكتب هنا حركة واحدة، وهذه الشاشة تُظهر حركتين). ولا شدة على الباء بعدها."
2. **MINOR (§3 length, and a contradiction).** how[1] has three sentences (the limit is two). It also says "Bring the lips together" and then "others leave a very slight gap".
   - Replace EN: "Bring the lips gently for the م, without pressing: some teachers close them lightly, others leave a very slight gap. Follow your teacher."
   - Replace AR: "قرّب الشفتين للميم برفق دون ضغط: فمن المعلمين من يُطبقهما إطباقًا خفيفًا، ومنهم من يترك بينهما فرجة يسيرة جدًا. فاتبع شيخك."

## ikhfa — FIX

1. **MAJOR (spot: the تنوين shape).** EN: "In a printed مصحف المدينة a تنوين's marks are staggered, with no شدة after them: نَارًا ذَاتَ." AR: "وحركتا التنوين في مصحف المدينة المطبوع متتابعتان…"
   - The text does not say that this screen draws a plain تنوين.
   - Replace EN: "The ن has no سكون and the next letter has no شدة: مِن شَرِّ, أَنتُمْ. A تنوين works the same way: no شدة after it, as in نَارًا ذَاتَ; the printed مصحف المدينة also staggers its marks, but this screen does not. If the next letter is one of the 15, it is إخفاء."
   - Replace AR: "لا سكون على النون، ولا شدة على الحرف بعدها: مِن شَرِّ، أَنتُمْ. والتنوين كذلك لا شدة بعده، كما في نَارًا ذَاتَ؛ وحركتاه متتابعتان في مصحف المدينة المطبوع لا في هذه الشاشة. فإن كان الحرف التالي من الخمسة عشر فالحكم إخفاء."

## qal-s — FIX

1. **MAJOR (accuracy).** EN how[2]: "Most books prefer a sound leaning toward a فتحة; another view lets it follow the vowel before it." AR: "والأرجح عند كثير من العلماء أن صوتها أقرب إلى الفتح، وقيل: تتبع حركة ما قبلها."
   - هداية القاري 1/85 says the opposite. Following the vowel before is «القول المشهور وعليه الجمهور». «للفتح أقرب مطلقا» is the second view, and السمنودي prefers following the vowel before. The Arabic «وقيل» marks the majority view as the weak one.
   - The step also has three sentences.
   - Replace EN: "The bounce is not a vowel. Books differ on its colour: most let it lean toward the vowel before it, and another view leans it toward a فتحة every time; follow your teacher."
   - Replace AR: "النبرة ليست حركة. واختلفوا في صوتها: فالجمهور على أنها تتبع حركة ما قبلها، ومنهم من يجعلها أقرب إلى الفتح مطلقًا؛ فاتبع شيخك."

## qal-k — FIX (minor only)

1. **MINOR (the "why" is the writer's reasoning).** EN: "At a stop the letter is the last thing you say, and the books rank the bounce clearest there."
   - The books state the ranking without a reason: الجزرية «وإن يكن في الوقف كان أبينا»; هداية القاري 1/83 «أبين من الساكن الموصول». The first clause reads as a cause, and no book gives that cause.
   - Replace EN: "The reason is the one you learned: these letters hold sound and breath, and would be lost without the bounce. The books add that it is clearest at a stop; ابن الجزري says: «وَإِنْ يَكُنْ فِي ٱلْوَقْفِ كَانَ أَبْيَنَا»."
   - Replace AR: "السبب هو الذي عرفته: هذه الحروف ينحبس فيها الصوت والنفَس، فتضيع لولا النبرة. والعلماء يجعلونها عند الوقف أبين، كما قال ابن الجزري: «وإن يكن في الوقف كان أبينا»."
2. **MINOR (the two languages differ).** AR fits names the level ("وتسمى القلقلة الكبرى"). EN fits does not.
   - Add to EN after "the bounce is fuller": "This is called القلقلة الكبرى, the bigger bounce."

## sakinayn — FIX

1. **MAJOR (accuracy: "two exceptions").** EN how[2]: "Two exceptions: the plural م … takes a ضمة …; and مِنْ takes a فتحة". AR: "ويُستثنى اثنان".
   - The list is not complete. A plural و after a فتحة also takes a ضمة, not the كسرة of how[1]: ٱشْتَرَوُا۟ ٱلضَّلَٰلَةَ (2:16), وَلَا تَنسَوُا۟ ٱلْفَضْلَ (2:237). The app's text prints that ضمة.
   - The text also drops the card's condition "مِنْ before ال".
   - Replace EN: "Some take another vowel: the plural م of هُمْ and كُمْ (ميم الجمع) and a plural و after a فتحة take a ضمة, هُمُ ٱلْكَفَرَةُ, ٱشْتَرَوُا۟ ٱلضَّلَٰلَةَ; مِنْ before ال takes a فتحة, مِنَ ٱلَّذِينَ. The muṣḥaf prints these vowels, so read what is written."
   - Replace AR: "وبعضها يُعطى حركة أخرى: تُضم ميم الجمع في هُمْ وكُمْ، وواو الجماعة بعد فتحة: هُمُ ٱلْكَفَرَةُ، ٱشْتَرَوُا۟ ٱلضَّلَٰلَةَ؛ وتُفتح نون مِنْ قبل «ال»: مِنَ ٱلَّذِينَ. والمصحف يطبع هذه الحركات، فاقرأ ما تراه."
2. **MAJOR (spot: a تنوين, answering the writer's question).** EN: "When the first letter takes a vowel, the muṣḥaf prints it: بَلِ, هُمُ, مِنَ."
   - This is false for a تنوين, which the lesson teaches in how[3] and mistakes[3]. The Madinah print shows `نُوحٌ ٱبۡنَهُۥ` with the ordinary stacked تنوين (QPC U+064C), no small ن, and no كسرة. The app shows the plain تنوين too.
   - Replace EN: "The حرف مد stays written, so the eye wants to lengthen it; the sign is the ٱ that starts the next word: فِى ٱلْعُقَدِ. When another letter takes a vowel, the muṣḥaf prints it: بَلِ, هُمُ, مِنَ. A تنوين is the exception: in نُوحٌ ٱبْنَهُۥ the muṣḥaf, printed or on this screen, shows an ordinary تنوين and no extra ن, so the ٱ after it is your cue to say نِ."
   - Replace AR: "حرف المد يبقى مكتوبًا فتميل العين إلى مده؛ والعلامة أن الكلمة التالية تبدأ بهمزة وصل (ٱ): فِى ٱلْعُقَدِ. وإذا حُرِّك ساكن غيره طبع المصحف حركته: بَلِ، هُمُ، مِنَ. إلا التنوين: ففي نُوحٌ ٱبْنَهُۥ يظهر تنوين عادي بلا نون صغيرة، في المصحف المطبوع وفي هذه الشاشة، فالهمزة ٱ بعده هي التي تدلك على أن تقول «نِ»."
3. **MINOR (Arabic grammar).** AR how[4]: "قف على فِى تنطقها ممدودة حركتين".
   - Replace: "فإن وقفتَ على فِى نطقتَها ممدودة حركتين."
4. **MINOR (§3 length).** EN how[2] runs to one long sentence with two semicolons. The replacement in 1 has two sentences.

## muttasil — ACCEPT

The lengths (4, read first, or 5), the stop rule (4→4/6, 5→5/6), "six only on a stop" and the reason all agree with the card and with هداية القاري 1/284–286 and غاية المريد 7311/125. The spot uses ٓ, which this screen shows. The Arabic is natural.

## munfasil — ACCEPT

- 4 or 5 counts, equal to المتصل; القصر is from الطيبة (غاية المريد 7311/125, 147).
- When you stop on the first word, it is two counts.
- يَٰٓأَيُّهَا and the ۟ on قَالُوٓا۟ are right.
- The spot relies only on ٓ and the space between the words, both visible here.
- Optional: the spot lists the همزة forms as "أ or إ". It could add ءَا (وَمَآ ءَاتَىٰكُمُ).

## mithlayn — FIX

1. **MAJOR (accuracy: "the one exception").** EN fits: "The one exception: a حرف مد is never merged." AR: "ويُستثنى حرف المد، فلا يُدغم أبدًا."
   - الميزان 38104/129 gives two exceptions: the حرف مد, and مَالِيَهْ هَلَكَ, which has سكت, read first, or إدغام. The card names both, so the text and the card disagree.
   - Replace EN: "One exception you meet often: a حرف مد is never merged. One more place, مَالِيَهْ هَلَكَ, comes in a later lesson."
   - Replace AR: "ويُستثنى حرف المد، فلا يُدغم أبدًا؛ وموضع آخر هو مَالِيَهْ هَلَكَ يأتي في درس لاحق."
2. **MINOR (term definition).** المثلين en: "When the first has a سكون and the second a vowel, the first merges into the second."
   - This is too absolute; the حرف مد case contradicts it.
   - Append EN: ", unless the first is a حرف مد." AR: "، إلا أن يكون الأول حرف مد."
   - The "why" on the حرف مد is verified: «لئلا يزول المد بالإدغام», الميزان 38104/129.

## Checked and found sound (no finding)

- **The letter groups:** throat ء هـ ع ح غ خ; يرملون/ينمو; ب; the 15 from the تحفة line; قطب جد.
- **الإدغام الكامل/الناقص:** idgh-g follows هداية القاري 1/164–165: ن م ل ر are كامل, و ي are ناقص, and the غنة with م is the م's.
- **الإظهار المطلق:** the four words, and the reason (ابن بري via هداية القاري 1/163).
- **Other rules:**
  - The مَنْ رَاقٍ pause.
  - No غنة with ل ر is الشاطبية; with غنة is الطيبة.
  - The reasons for الإقلاب and الإخفاء match هداية القاري 1/166–171.
  - The light and heavy غنة in الإخفاء.
  - The ikhfa mistakes «كونتم» and the pressed tongue match هداية القاري 1/171.
  - qal-s: the cause of القلقلة (الشدة and الجهر), and "make it heard by others" (الميزان).
  - qal-k: the third level stated as one view (الميزان's reservation); أَحَدْءْ as a mistake.
- **Terms:** no term is used before its owner lesson. ميم الجمع is explained inline. Style: no "just", "simply" or exclamation marks, and no claim that the app judges recitation.

## Fixes (round 1)

Writer, 2026-11-21. Every MAJOR and MINOR above is applied, using the reviewer's wording.

- **izhar.** The spot says plainly that the stacked tanween is in the printed muṣḥaf only; the sign on this screen is the سكون on ن, or the letter after the تنوين. The Arabic map lists ي ر م ل و ن, and both languages say "at the start of the next word". The Arabic says «لثة الثنايا العليا».
- **idgh-g, idgh-n, ikhfa.** The spots lead with what this screen shows: the missing سكون on ن, and a شدة on the next letter or none. The staggered tanween is said to be in the printed muṣḥaf, not on this screen.
  - idgh-g: the "vowel opens" wording is fixed.
  - idgh-n: fits no longer implies that the ن/م merge was incomplete.
- **iqlab.** The spot describes what this screen shows for كِرَامٍۭ: two كسرة marks, then ۭ; the print keeps one. how[1] is now two sentences, and the lips wording no longer contradicts itself.
- **qal-s.** The majority view (هداية القاري 1/85) is now first in both languages: the bounce follows the vowel before it. "Closer to فتحة every time" is given as the other view.
- **qal-k.**
  - The "why" cites the الجزرية: «وَإِنْ يَكُنْ فِي ٱلْوَقْفِ كَانَ أَبْيَنَا». My unsourced cause is removed.
  - The English now names القلقلة الكبرى.
- **sakinayn.**
  - Added the plural و after a فتحة taking a ضمة (ٱشْتَرَوُا۟ ٱلضَّلَٰلَةَ), and the condition "مِنْ before ال".
  - The spot says نُوحٌ ٱبْنَهُۥ shows an ordinary تنوين with no small ن, so the ٱ is the cue.
  - The Arabic grammar in how[4] is fixed.
- **mithlayn.** مَالِيَهْ هَلَكَ is added as the second exception, pointing to a later lesson without naming سكت. The definition of المثلين now excludes the حرف مد.
- **munfasil.** The optional ءَا is not added.

Checker: `UPDATE_GLOSSARY=1 LESSONS=<the 11 ids>` gives 0 errors. Three card-only warnings are unchanged.

## Re-check (round 1)

Reviewer, 2026-11-21. I read every revised field in both languages. I checked them against the app's text (`public/data/surah`), the KFGQPC print encoding and the books.

**Checker.** `LESSONS=<the 11 ids> npx vitest run src/content/teach.check.test.ts` gives 0 errors. The 3 warnings are on the cards only and are unchanged.

**Verified:**
- **Tanween shape.** izhar, idgh-g, idgh-n and ikhfa each:
  - say plainly that the stacked or staggered shape is in the printed muṣḥaf only, not on this screen;
  - lead with a sign the screen does show: the سكون on ن or its absence, a شدة or none, or the letter after the تنوين.
- **iqlab, كِرَامٍۭ.** This is correct. The app's text has U+064D (the kasratan, two marks) followed by U+06ED, and the print (QPC) has one كسرة with ۭ. So "this screen shows two" is right.
- **qal-s.** The majority view now comes first in both languages: the bounce follows the vowel before it. This matches هداية القاري 1/85 («وعليه الجمهور»). The "toward فتحة" view is given as the other view. The step has two sentences.
- **qal-k, the verse.** It is confirmed in the المقدمة الجزرية, ed. القاسم, Shamela 581/64, verse 39: «وَبَيِّنَنْ مُقَلْقَلاً إِنْ سَكَنَا … وَإِنْ يَكُنْ فِي الوَقْفِ كَانَ أَبْيَنَا». It is also in `content/mutun.json` (jazariyya n 39) and quoted in هداية القاري 1/83. The wording matches. The only difference is that the text writes ٱلْوَقْفِ with the Quranic ٱ, while the edition and mutun.json have الوَقْفِ.
- **sakinayn.**
  - The plural و (ٱشْتَرَوُا۟ ٱلضَّلَٰلَةَ, 2:16) is right, and the app prints its ضمة.
  - "مِنْ before ال" now matches the card.
  - The تنوين spot is right: QPC 11:42 has U+064C (stacked) with no small ن.
  - The Arabic how[4] is grammatical.
- **mithlayn.** Two exceptions, as in الميزان 38104/129. The definition of المثلين excludes the حرف مد. سكت is not named.

**New findings:**
1. **iqlab, MINOR (accuracy, from my own proposed wording).** Spot: "above for a فتحة and below for a كسرة" / «فوقها مع الفتح وتحتها مع الكسر».
   - This leaves out the ضمة tanween. Its small م is also above: the app shows أَلِيمٌۢ (2:10) as U+064C + U+06E2.
   - Replace EN: "above for a فتحة or ضمة, below for a كسرة". AR: «فوقها مع الفتح والضم، وتحتها مع الكسر».
2. **mithlayn, MINOR (§3 length).** EN fits now has 5 sentences; the limit is 4.
   - Join the last two: "One exception you meet often: a حرف مد is never merged; one more place, مَالِيَهْ هَلَكَ, comes in a later lesson."
3. **qal-k, MINOR (optional).** For the matn quotation, use the edition's spelling «فِي الوَقْفِ», as in mutun.json, not «فِي ٱلْوَقْفِ».

**Final verdicts**

| Lesson | Verdict |
|---|---|
| izhar | ACCEPT |
| idgh-g | ACCEPT |
| idgh-n | ACCEPT |
| iqlab | ACCEPT after the one-line fix 1 (MINOR) |
| ikhfa | ACCEPT |
| qal-s | ACCEPT |
| qal-k | ACCEPT (3 is optional) |
| sakinayn | ACCEPT |
| muttasil | ACCEPT |
| munfasil | ACCEPT |
| mithlayn | ACCEPT after the one-line fix 2 (MINOR) |

No MAJOR or BLOCKER findings remain.
- Coordinator applied the three re-check MINORs (iqlab ضمة, mithlayn length, qal-k spelling).
