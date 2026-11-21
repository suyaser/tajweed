# Review: unit 9 teaching texts (المخارج والصفات)

Reviewer: independent. Date: 2026-11-21. Standard: `docs/16-teaching-strategy.md`; the cards in `content/rules.json`; the agreed points in `docs/examples/reviews/unit9.md`.

Files: `content/teach/{makharij-jawf,makharij-halq,makharij-aqsa,makharij-wasat,makharij-taraf,makharij-shafatan,sifat-hams,sifat-shidda,sifat-istila,sifat-safir,sifat-inhiraf,maratib}.json`.

## How it was checked
- **Checker:** `LESSONS=<the 12 ids> npx vitest run src/content/teach.check.test.ts` passes with 0 errors and 1 warning. The warning is for the card, not the text: «makharij-taraf card: uses الصفير before its lesson (sifat-safir); Learn shows its meaning».
- **هداية القاري:** I read the OpenITI copy of Shamela 22869 (`OpenITI/1425AH/data/1409IbnSayyidCajamiMisri/…HidayatQari.Shamela0022869-ara1`, page markers `PageV01P0xx`):
  - المخارج: 1/60–69.
  - الصفات: 1/77–89.
  - The ض mistakes: 1/138–139.
- **النشر 1/219** (Shamela 22642/227): the mistakes for ر, ش and ض.
- **الجزرية** (Shamela 581): vv. 9–25 (pp. 54–58), v. 43 (p. 66) and v. 52 (p. 70, «والضاد باستطالة ومخرج ميز من الظاء»).
- **Mechanical checks:**
  - Every section was counted against the §3 lengths.
  - Unit numbers were checked against `content/course.json`: تفخيم is unit 1, قلقلة unit 2, لين unit 5, dad-zha unit 6, and units 0–8 hold the rules.
  - Every term in the 12 files was checked for the «صفة»/«مرتبة» prefixes and for clashes with `content/glossary.json`.

**Verified correct (no finding):**
- **The counts:** 5 general places and 17 specific ones (1/3/10/2/1); 10 on the tongue (2+3+5); 11 letters on its tip at 5 places; 5 pairs with opposites (التوسط sits with الشدة, as in هداية 1/78) and 7 single صفات; 10 مهموسة and 19 مجهورة; 8 شديدة, 5 متوسطة and the rest رخوة; 7 مستعلية, 4 مطبقة, 6 مذلقة.
- **Every مخرج description:** these match هداية 1/64–69 and الجزرية vv. 10–19. This covers ق "above" and ك "lower, toward the mouth"; ر "أدخل إلى ظهر اللسان"; ص س ز with "a narrow gap"; showing the tongue tip for ظ ذ ث (هداية 1/68); و with rounded lips; الخيشوم as the place of the غنة's sound, not of its letters.
- **The self-check:** «همزة with a vowel, then a سكون» is هداية 1/61 («يسكن أو يشدد ويدخل عليه همزة الوصل»).
- **The pinched-nose test for الغنة.**
- **The order of strength in الصفير** (ص, then ز, then س): هداية 1/82.
- **The cause of القلقلة** (الشدة + الجهر): هداية 1/82.
- **ز and س differ only in الجهر:** I checked all their صفات.
- **الإطباق implies الاستعلاء, not the reverse:** هداية 1/81.

---

## Cross-cutting

**X1. MINOR. `spot: null` without the sentence §3 requires (11 lessons, all except jawf).**
- §3 says: «`null` when the muṣḥaf has no sign (then say so in `how`)». None of the 11 does.
- **Fix:** add one sentence to the last `how` step of each lesson.
  - EN: «The muṣḥaf has no mark for this; you learn it by ear.»
  - AR: «ولا علامة لهذا في المصحف، وإنما يُعرف بالسماع.»

**X2. MINOR. `how` steps longer than «≤ 2 sentences».**
- Over the limit (counted in EN):
  - jawf 1–3.
  - halq 1–2 (4 each).
  - aqsa 1.
  - wasat 1 (4) and 3.
  - taraf 3.
  - shafatan 1–3.
  - hams 2 (4) and 4.
  - shidda 1–3 (4 each).
  - istila 1–3.
  - safir 1, 2 and 4.
  - inhiraf 1–4.
  - maratib 5 (4).
- None of them is a wall of text. Most open with a bare «Say أَقْ.» sentence.
- **Fix:** join the prompt to the next sentence with a colon, as taraf already does («Say أَنْ: the tip touches…»). Split anything still over 2 sentences.

**X3. MINOR. «just», which §3 bans.**
- The four uses:
  - halq, mistakes[2].right: «just before the mouth».
  - aqsa, how[1]: «just in front of ق's point».
  - taraf, fits: «just next to».
  - taraf, how[2]: «just above».
- **Fix:** use «right before», «a little in front of», «next to» and «a little above».

---

## makharij-jawf: FIX

1. **MAJOR. `why`: «That is why only they carry مد.» / «ولذلك اختصّت بالمد.»**
   - This is false for a learner who did `lin` in unit 5: وْ/يْ after a فتحة are lengthened 2/4/6 at a stop (مد اللين).
   - The books say only that their open place lets them be lengthened past the natural length: هداية 1/64, «ولذا قبلت الزيادة على المد الطبيعي».
   - **Replace with:**
     - EN: «That is why they can be drawn out beyond their two counts.»
     - AR: «ولذلك قبلت الزيادة على مقدارها الطبيعي.»
2. **MINOR. `mistakes[2]`: «Drawing out the وْ of خَوْفٍ like the و of يَقُولُ.» / «After a فتحة it is لين, not a حرف مد: say it lightly.»**
   - At a stop it may be drawn out: مِّنْ خَوْفٍۭ ends سورة قريش. The sentence contradicts `lin` there.
   - **Replace with:**
     - EN wrong: «Drawing out the وْ of خَوْفٍ like the و of يَقُولُ while you keep reading.»
     - EN right: «Joined to what follows, it is لين, not a حرف مد: say it lightly.»
     - AR wrong: «مدّ الواو في خَوْفٍ كواو يَقُولُ عند الوصل.»
     - AR right: «هي في الوصل حرف لين لا مد، فانطقها بخفّة.»
3. **MINOR. `how[3]`: the AR «والياء من منتصف اللسان مع الحنك» has no counterpart in EN, and الحنك is not glossed.**
   - This is the unit's first use of الحنك; aqsa glosses it later.
   - **Fix:**
     - AR: «…والياء من وسط اللسان مع الحنك الأعلى (سقف الفم).»
     - EN: «…the ي from the middle of the tongue against the roof of the mouth.»
4. X1 does not apply. X2 does: steps 1–3.

## makharij-halq: FIX (cross-cutting only)
- Anatomy, examples and Arabic: correct. أقصى is glossed «at the bottom of the throat near the chest», as هداية has «أبعده مما يلي الصدر».
- X1, X2 (steps 1–2) and X3 («just before the mouth») apply.

## makharij-aqsa: FIX (cross-cutting only)
- Correct. الحنك is glossed «(سقف الفم)» and "palate" is glossed. ك "a little in front, toward the mouth" matches هداية «أقرب إلى مقدم الفم».
- X1, X2 (step 1) and X3 («just in front») apply.

## makharij-wasat: FIX

1. **MAJOR. The text names the sound of ض, which §5 says to leave to the teacher.**
   - The quoted text:
     - `why`: «ض said with the tip of the tongue … comes out like د or ظ.» / «…وصارت كالدال أو الظاء.»
     - `mistakes[0]`: «Saying ض with the tip of the tongue, like a heavy د.» / «…كأنها دال مفخّمة.»
   - Why this is wrong:
     - "A heavy د" is how critics describe the common modern ض. The reciters in the app (Husary, Minshawi) use that ض.
     - The dad-zha card is marked `needs-teacher` for exactly this reason, and §5 says to refer «the sound of ض» to the teacher.
     - The books list other mistakes. النشر 1/219: ظ, mixed with ذ, a heavy ل, a hint of ز. هداية 1/139: ظ or a ط.
     - Calling "a heavy د" wrong tells the learner the audio they just heard is wrong.
   - **Replace with:**
     - `why` EN: «Each of these letters has its own spot, and a small shift turns one into another. ض moved to the tip of the tongue loses its place and comes out like ظ.»
     - `why` AR: «…فإذا نُطقت الضاد بطرف اللسان فقدت مخرجها وقاربت الظاء.»
     - `mistakes[0]` EN wrong: «Saying ض with the tip of the tongue on the front teeth, so it sounds like ظ.»
     - `mistakes[0]` EN right: «Keep the tip back and press the side of the tongue on the upper molars. Learn the exact sound of ض from your teacher.»
     - `mistakes[0]` AR wrong: «نطق الضاد بطرف اللسان على الثنايا حتى تشبه الظاء.»
     - `mistakes[0]` AR right: «أبعد طرف اللسان، واعتمد بحافته على الأضراس العليا، وخذ صوت الضاد من معلّمك مشافهة.»
2. X1 and X2 (steps 1 and 3) apply.

## makharij-taraf: FIX (cross-cutting only)
- All five places match هداية 1/66–68 and v. 15–18. الثنايا is glossed «(الأسنان الأمامية)», and "roots", "gum" and "edges" are explained.
- X1, X2 (step 3) and X3 (×2) apply.

## makharij-shafatan: FIX (cross-cutting only)
- Correct. The term الحروف الشفوية does not clash with `شفوي` (m-izhar).
- X1 and X2 (steps 1–3) apply.

## sifat-hams: FIX

1. **MINOR. `fits` is 5 sentences (§3: 2–4) and garbles the map.**
   - The quoted text: «Next come: the sound stopping or running; the tongue rising (استعلاء) or covering the palate; and the seven single ones».
   - Pairs 3 and 4 are run together, and pair 5 (الإذلاق/الإصمات) is missing. The text has just said "five pairs".
   - **Replace with:**
     - EN: «You now know every letter's مخرج, but some letters share one, like س and ز; only their صفات tell them apart. الجزرية gives five pairs of opposite صفات and seven with no opposite. This lesson is the first pair; next come the sound (stopping or running), the tongue (rising, then pressing on the palate), lightness, and the seven single ones, among them قلقلة and لين, which you know.»
     - AR to match: «…ثم الصوت (انحباسه وجريانه)، ثم اللسان (ارتفاعه ثم انطباقه على الحنك)، ثم الخفة، ثم الصفات السبع المفردة…»
2. X1 and X2 (steps 2 and 4) apply.

## sifat-shidda: FIX

1. **MINOR. `why`: «a letter with الرخاوة is the longest, then one with صفة التوسط, and one with صفة الشدة is the shortest.»**
   - No source read ranks the صفات by length. A stopped نْ or مْ (صفة التوسط) carries a غنة and is not "shorter" than a رخو letter in any useful sense.
   - **Replace with:**
     - EN: «These صفات decide what a letter with a سكون sounds like: its sound runs on, part-runs, or stops.»
     - AR: «بهذه الصفات يتحدّد صوت الحرف الساكن: يجري، أو يجري بعضه، أو ينقطع.»
   - Keep the second sentence (on قلقلة), which هداية 1/82 supports.
2. X1 and X2 (steps 1–3) apply.

## sifat-istila: FIX

1. **MAJOR. `why`: «These صفات separate letters that share one مخرج: ص from س, ط from ت, ظ from ذ. … only the raised, pressing tongue makes the first one.»**
   - AR: «…والطاء من التاء… ولا يفرّق بينها إلا ارتفاع اللسان والتصاقه.»
   - "Only" is false for ط and ت: ط is مجهورة and has قلقلة, while ت is مهموسة.
   - The classical statement pairs ط with **د**: without الإطباق, ط would become د, ص would become س, ظ would become ذ, and ض would leave the language (سيبويه, quoted in the شروح). ط and د share الجهر, الشدة and القلقلة.
   - **Replace with:**
     - EN: «These صفات separate letters that share one مخرج. Take away the raised, pressing tongue and ص becomes س, ظ becomes ذ, and ط becomes د.»
     - AR: «بهذه الصفات تتميّز حروف يجمعها مخرج واحد: فلولا الاستعلاء والإطباق لصارت الصاد سينًا، والظاء ذالًا، والطاء دالًا.»
2. **MINOR. الإذلاق and الإصمات are defined in `terms` and named in `fits`, but `how` never mentions them.**
   - هداية 1/82 says this pair «لا دخل لهما في تجويد الحروف». The الإصمات gloss, «take more effort to say», is also looser than the book: «a word of 4 or 5 root letters is never built from them alone; it always has one of فِرَّ مِن لُّبٍّ».
   - **Add to `how`:**
     - EN: «The fifth pair is light: «فِرَّ مِن لُّبٍّ» come quickly from the tip of the tongue or the lips (الإذلاق); the rest are heavier (الإصمات). It does not change how you recite.»
     - AR: «والزوج الخامس خفيف الأثر: حروف «فِرَّ مِن لُّبٍّ» تخرج بخفة من طرف اللسان أو الشفتين (الإذلاق)، وسائر الحروف أثقل (الإصمات)، ولا أثر لهما في الأداء.»
3. X1 and X2 (steps 1–3) apply.

## sifat-safir: FIX

1. **MINOR. `how[2]`: «the lips part a little to release the bounce, without opening into a فتحة or rounding into a ضمة.»**
   - Teachers differ on which vowel the bounce leans toward: toward the vowel before it (هداية 1/85: «المشهور وعليه الجمهور»), or toward فتح always. Under §5 that disagreement must be stated.
   - **Append:**
     - EN: «Teachers differ on which vowel the bounce leans toward; follow your teacher.»
     - AR: «واختلف العلماء في جهة ميلها، فاتبع معلّمك.»
2. X1 and X2 (steps 1, 2 and 4) apply.

## sifat-inhiraf: FIX

1. **MAJOR. ض and د (the writer's first flag): not supported, and it takes a side on the sound of ض.**
   - The quoted text:
     - `why`: «ض without الاستطالة can come out like د» / «فالضاد بلا استطالة قد تصير كالدال».
     - `mistakes[2]`: «Cutting the ضّ of يَحُضُّ short, like د.» / «قطع الضاد في يَحُضُّ كأنها دال.»
   - What the books say:
     - الجزرية v. 52 (581/70) and هداية 1/138: الاستطالة, with the مخرج, is what separates ض from **ظ** («ولولاهما لكانت إحداهما الأخرى»).
     - Neither النشر 1/219 nor هداية 1/139 lists د among the mistakes.
     - A ض "cut short like د" is the disputed modern sound. It is what Husary reads at يَحُضُّ, and dad-zha refers it to the teacher.
   - **Replace with:**
     - `why` EN: «These صفات keep their letters apart: without الاستطالة and its own place, ض would be ظ («والضاد باستطالة ومخرج ميز من الظاء»).»
     - `why` AR: «…فالضاد لولا الاستطالة والمخرج لكانت ظاءً: «والضاد باستطالة ومخرج ميز من الظاء».»
     - `mistakes[2]` EN wrong: «Saying the ض of ٱلْأَرْضِ with the tongue tip on the teeth, like ظ.»
     - `mistakes[2]` EN right: «Press the side of the tongue on the upper molars and let the sound run along it; take the exact sound from your teacher.»
     - `mistakes[2]` AR wrong: «نطق الضاد في ٱلْأَرْضِ بطرف اللسان على الثنايا كأنها ظاء.»
     - `mistakes[2]` AR right: «اعتمد بحافة اللسان على الأضراس، ودع الصوت يمتد عليها، وخذ صوت الضاد من معلّمك.»
2. **MAJOR. التكرير (the writer's second flag): only half right, and inconsistent.**
   - The text:
     - `terms`: «learned in order to avoid it».
     - `why`: «avoid overdoing it».
     - `how[1]`: «Keep the ر to one firm touch».
     - `mistakes[0]`.right: «Hold the رّ with the tip steady» / AR «اثبت بطرف اللسان».
   - What the books say:
     - «One firm touch» is supported: هداية 1/87 quotes الجعبري, «يلصق … لصقًا محكمًا مرة واحدة بحيث لا يرتعد».
     - النشر 1/219 warns against the opposite error just as strongly: «وقد يبالغ قوم في إخفاء تكريرها مشددة فيأتي بها محصرمة شبيهة بالطاء، وذلك خطأ لا يجوز … نبوة واحدة … من غير مبالغة في الحصر».
     - "Hold the رّ" pushes the learner toward that error.
   - **Fix:**
     - `why` EN: «التكرير is named so that you hide it: «وَأَخْفِ تَكْرِيراً إِذَا تُشَدَّدُ». Hide it without pressing so hard that the ر sounds like ط; Ibn al-Jazari calls that a mistake too.»
     - `why` AR: «…ويُعرف التكرير ليُخفى: «وَأَخْفِ تَكْرِيراً إِذَا تُشَدَّدُ»، من غير مبالغة في الحصر حتى تشبه الراء الطاء، فذلك خطأ أيضًا كما قال ابن الجزري.»
     - `mistakes`: add «Pressing the رّ so hard that it sounds like ط» → «One firm tap, then release: no trill, no squeeze». AR: «حصر الراء المشددة حتى تشبه الطاء» → «طرقة واحدة محكمة بلا ارتعاد ولا حصر».
     - `mistakes[0]`.right EN: «Say the رّ with one firm tap of the tongue; it must not shake.»
     - `mistakes[0]`.right AR: «انطق الراء المشددة بطرقة واحدة محكمة لا يرتعد معها اللسان.»
3. **MAJOR. `how[0]`: «Ibn al-Jazari says the ر leans from the place of ن toward ل.» / «وذكر ابن الجزري أن الراء انحرفت عن مخرج النون إلى جهة اللام.»**
   - No such statement is in الجزرية, and I found none in النشر 1/219 either. The attribution is unsupported.
   - The step also gives the learner nothing to feel: «it leans toward a neighbouring one».
   - هداية 1/86–87 says: «اللام فيها انحراف إلى طرف اللسان، والراء فيها انحراف إلى ظهره وميل قليل إلى جهة اللام، ولذلك يجعلها الألثغ لامًا».
   - **Replace with:**
     - EN: «Say أَلْ and أَرْ. The sound turns aside from its place: for ل toward the tip of the tongue, for ر toward its top, leaning a little toward ل. That is why a child who can't yet say ر says ل. This is الانحراف.»
     - AR: «قل: أَلْ وأَرْ. ينحرف الصوت عن مخرجه: في اللام إلى طرف اللسان، وفي الراء إلى ظهره مع ميل قليل إلى جهة اللام، ولذلك يجعلها الألثغ لامًا. وهذا الانحراف.»
4. **MINOR. `why`: «ش without التفشي, before ج or at a stop, can come close to ج.»**
   - النشر 1/219 asks for extra care with التفشي at a stop, and in شَجَرَ «للتجانس» (shared place). It does not say a stopped ش becomes ج.
   - **Replace with:**
     - EN: «ش needs its التفشي most at a stop and before ج, which shares its place (as in شَجَرَ).»
     - AR: «والشين يُعتنى بتفشيها في الوقف وقبل الجيم لاتحاد مخرجهما، كما في شَجَرَ.»
5. X1 and X2 (steps 1–4) apply.

## maratib: FIX

1. **MINOR. AR `how[0]`: «مرتبة التحقيق أبطؤها … وهو للتعلم والتعليم».**
   - The pronoun has the wrong gender for مرتبة.
   - **Fix:** «وهي للتعلم والتعليم».
2. **MINOR. A bare «التحقيق» after the term is defined as «مرتبة التحقيق».**
   - It occurs in `how[4]` («close to التحقيق» / «قريبة من التحقيق») and in `mistakes[3]` (EN and AR).
   - The learner also met تحقيق الهمزة in `tashil`.
   - **Fix:** use «مرتبة التحقيق» in each.
3. X1 and X2 (step 5) apply.
- Otherwise correct against the card and its sources:
  - The three speeds.
  - The two views of الترتيل.
  - «كل تحقيق ترتيل…».
  - The counts kept in الحدر: no قصر المنفصل for حفص من الشاطبية.
  - Consistency in lengths.

---

## Totals

| Severity | Count | Where |
|---|---|---|
| BLOCKER | 0 | |
| MAJOR | 6 | jawf 1 («only they carry مد»); wasat 1 (ض as «heavy د»); istila 1 (ط/ت «only»); inhiraf 1 (ض/د), 2 (التكرير), 3 (الانحراف misattributed) |
| MINOR | 9 + X1–X3 | jawf 2–3; hams 1; shidda 1; istila 2; safir 1; inhiraf 4; maratib 1–2; X1, X2, X3 |

**The writer's two flags:**
- «ض without الاستطالة comes out like د»: **reject.** The books say it becomes ظ, and the "د" wording sides with one view in the dispute over ض.
- The التكرير advice: **keep «one firm tap».** هداية/الجعبري support it. Add النشر's warning against squeezing the ر into a ط, and make the term, the why and the mistakes say the same thing.

**Verdicts:**
- FIX with substantive findings: jawf, wasat, hams, shidda, istila, safir, inhiraf, maratib.
- FIX with cross-cutting findings only: halq, aqsa, taraf, shafatan.
- No lesson is ACCEPT as written, because X1 and X2 apply to all twelve. halq, aqsa, taraf and shafatan become ACCEPT once X1–X3 are applied.

## Fixes (round 1)

Writer. Every replacement is the reviewer's text unless noted.

| Finding | Change |
|---|---|
| X1 MINOR | All 11 lessons with `spot: null` end their last `how` step with «The muṣḥaf has no mark for this; you learn it by ear.» / «ولا علامة لهذا في المصحف، وإنما يُعرف بالسماع.». In the صفات lessons it reads «for these صفات», in shafatan «for these places» (the غنة itself has marks), and in maratib «for the pace … from your teacher». |
| X2 MINOR | Every `how` step in EN and AR is now at most 2 sentences. The prompt is joined with a colon (EN) or «؛» (AR). Checked by script: no step has more than 2. |
| X3 MINOR | «just» removed: «right before the mouth», «a little in front of ق's point», «next to», «a little above». A grep finds no «just» left. |
| jawf 1 MAJOR | `why`: «…so they can be drawn out beyond their two counts» / «ولذلك قبلت الزيادة على مقدارها الطبيعي» (هداية 1/64). |
| jawf 2 MINOR | `mistakes[2]` now says «while you keep reading» / «عند الوصل», as given. |
| jawf 3 MINOR | `how[3]`: ي «from the middle of the tongue against the roof of the mouth» / «من وسط اللسان مع الحنك الأعلى (سقف الفم)». |
| wasat 1 MAJOR | `why` and `mistakes[0]`: the ض moved to the tip comes out like ظ; the exact sound goes to the teacher. No «د» claim remains. |
| hams 1 MINOR | `fits` replaced, with all five pairs in order. AR: «خمسة أزواج من الصفات المتضادة». |
| shidda 1 MINOR | The length ranking is removed. `why`: «its sound runs on, part-runs, or stops». The قلقلة sentence is kept. |
| istila 1 MAJOR | `why`: without الاستعلاء and الإطباق, ص→س, ظ→ذ, ط→د. |
| istila 2 MINOR | New `how[4]` on الإذلاق/الإصمات («does not change how you recite» / «لا أثر لهما في الأداء»). The الإصمات term now gives هداية 1/82's sense (no 4- or 5-letter root built from them alone). |
| safir 1 MINOR | `how[2]` adds «Teachers differ on which vowel the bounce leans toward; follow your teacher.» / «واختلف العلماء في جهة ميلها، فاتبع معلّمك.» |
| inhiraf 1 MAJOR | `why` uses الجزرية v. 52 (ض vs ظ). `mistakes` now has ض in ٱلْأَرْضِ said like ظ, with the sound left to the teacher. No «د» claim remains anywhere in the unit (checked by grep). |
| inhiraf 2 MAJOR | التكرير is said the same way in the term, `how[1]`, `why` and `mistakes`: «one firm tap» / «طرقة واحدة محكمة», with النشر 1/219's warning against squeezing the ر into a ط. That warning is a new mistake. |
| inhiraf 3 MAJOR | `how[0]` replaced with هداية 1/86–87: ل toward the tip, ر toward the top with a slight lean toward ل, «ولذلك يجعلها الألثغ لامًا». The Ibn al-Jazari attribution is removed. |
| inhiraf 4 MINOR | ش: «needs its التفشي most at a stop and before ج, which shares its place (شَجَرَ)». |
| maratib 1 MINOR | «وهي للتعلم والتعليم». |
| maratib 2 MINOR | «مرتبة التحقيق» in `how[4]` and `mistakes[3]`, EN and AR. The quotation «كل تحقيق ترتيل…» is left as quoted. |

Checker: `UPDATE_GLOSSARY=1 LESSONS=<the 12 ids>` gives 0 errors; the only warning for these lessons is the taraf card's الصفير. The whole-folder run also passes.

## Re-check (round 1)

Reviewer.

**How I checked:**
- **Checker:** `LESSONS=<the 12 ids> npx vitest run src/content/teach.check.test.ts` passes, with 0 errors. The only warning is the old one about the taraf card's الصفير.
- **Script over all 12 files:**
  - No `how` step has more than 2 sentences, in EN or in AR.
  - «just», «simply» and «!» do not appear.
  - Every lesson with `spot: null` says in `how` that the muṣḥaf has no mark. In maratib this is in `how[3]`.
  - Every remaining «د»/«دال» refers to the letter د itself (ط د ت, ت/د, قَدْ, the قلقلة). None describes the sound of ض.
- **Texts:** I re-read every changed section in both languages against the sources cited in round 0.

**Fix by fix:**
- **ض (wasat 1, inhiraf 1): fixed.**
  - ض moved to the tip of the tongue comes out like ظ, which agrees with النشر 1/219 and هداية 1/139.
  - The `why` quotes الجزرية v. 52 (581/70) word for word.
  - Both lessons send the exact sound to the teacher, which matches the dad-zha card.
- **التكرير (inhiraf 2): fixed.**
  - The term, `how[1]`, `why` and `mistakes` all say «one firm tap / طرقة واحدة محكمة» (هداية 1/87, quoting الجعبري).
  - The new mistake, «Pressing the رّ so hard that it sounds like ط», carries النشر 1/219's warning («محصرمة شبيهة بالطاء … خطأ»), and it is attributed correctly.
- **الانحراف (inhiraf 3): fixed.**
  - It now follows هداية 1/86–87, including الألثغ.
  - The unsourced Ibn al-Jazari quotation is gone.
- **ش (inhiraf 4): fixed.** It matches النشر («لا سيما في الوقف … شَجَرَ … للتجانس»).
- **jawf 1: fixed.** «beyond their two counts» / «قبلت الزيادة على مقدارها الطبيعي» is هداية 1/64. It no longer contradicts `lin`.
- **jawf 2: fixed.** The وْ is limited to joining.
- **jawf 3: fixed.** الحنك is glossed, and EN matches AR.
- **istila 1: fixed.** ص→س, ظ→ذ, ط→د is the classical statement, and nothing in it is false.
- **istila 2: fixed.**
  - الإصمات now has هداية 1/82's sense, and the new `how[4]` says this pair does not change how you recite.
  - The lesson now has 5 `how` steps, within the limit.
- **hams 1: fixed.** The five pairs come in order, and `fits` is 3 sentences.
- **shidda 1: fixed.** The length ranking is gone; the قلقلة sentence stays (هداية 1/82).
- **safir 1: fixed.** The disagreement over which vowel the bounce leans toward is stated and referred to the teacher (هداية 1/85).
- **maratib 1–2: fixed.**
  - «وهي للتعلم والتعليم».
  - «مرتبة التحقيق» is used throughout, except inside the quotation from النشر, which must stay as written.

Nothing new broke. The new sentences agree with the cards and with earlier lessons (`lin`, `qal-s`, dad-zha), and the Arabic reads naturally.

### Final verdicts
| Lesson | Verdict |
|---|---|
| makharij-jawf | ACCEPT |
| makharij-halq | ACCEPT |
| makharij-aqsa | ACCEPT |
| makharij-wasat | ACCEPT |
| makharij-taraf | ACCEPT |
| makharij-shafatan | ACCEPT |
| sifat-hams | ACCEPT |
| sifat-shidda | ACCEPT |
| sifat-istila | ACCEPT |
| sifat-safir | ACCEPT |
| sifat-inhiraf | ACCEPT |
| maratib | ACCEPT |

Findings left: 0 BLOCKER, 0 MAJOR, 0 MINOR.
