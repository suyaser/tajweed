# Review: example proposals, units 0–1

Reviewer: independent review of `docs/examples/proposals/{basics,istiadha,tabii,arid,iwad,tafkhim,ibtida,lam-q,lam-s,lam-jh,lam-jl,ghunnah}.json` (files dated 11:39:13 today) against `docs/15-example-strategy.md`, the cards in `content/rules.json`, `content/course.json`, the Quran data in `public/data/surah/`, and the books.

## How this was checked

- **Checker.** `EXAMPLES_DIR=docs/examples/proposals LESSONS=… REPORT=1 npx vitest run src/content/examples.check.test.ts` gives 0 errors. Every `text` matches the Tanzil words.
- **Recitation timing.** For every example (and every contrast), I read the word timings of `husary-muallim`, `husary` and `minshawy`, and the pause marks (`marks`), around the span. A gap of 10 ms between words means joined. Larger gaps are real pauses: for example, 4.1 s before غَيْرِ in 1:7 and 4.4 s before وَٱللَّهُ in 85:9.
- **Audio.** I downloaded these everyayah files and ran `ffmpeg silencedetect` and an RMS envelope on them: Husary_Muallim 001007, 112002, 114005, and Husary 112001, 112002.
- **Books (Shamela), opened and confirmed:**
  - غاية المريد 7311/205: the five مراتب التفخيم (المفتوح بعده ألف، المفتوح، المضموم، الساكن {اقْرَأْ}، المكسور), and «الطاء أقواها ثم الضاد فالصاد فالظاء فالقاف فالغين فالخاء».
  - غاية المريد 7311/132: العارض, «جواز قصره ومدّه», 2/4/6, with the example {الْعَالَمِينَ}.
  - الميزان 38104/92: the ل of the name is heavy after a فتحة or ضمة ({سبحانك اللهم}) and light after a كسرة, original or عارضة ({قل اللهم مالك الملك}, {لله}, {بالله}).
  - الجزرية 581/93, verses 101–103: همزة الوصل of a verb takes a ضمة when its third letter has a ضمة, and a كسرة otherwise. Nouns other than ال take a كسرة. The seven nouns include اسم.
- **Scope of the "first-week" judgement.** Every claim not listed below was checked and found correct for حفص عن عاصم (الشاطبية).

## Repetition decisions (strategy point 6)

| Word | Flagged in | Keeps it | Why | Replacement (checked in data) |
|---|---|---|---|---|
| ٱلنَّاسِ | arid #1/#7, lam-s #1, ghunnah #4 | **arid** | It is the rhyme of الناس. العارض is heard on it at every ayah end of the unit's surah, and arid has the true minimal pair (وَٱلنَّاسِ stopped / ٱلنَّاسَ joined). Sun letters and نّ are everywhere in الفاتحة and جزء عمّ. | lam-s: see lam-s F1. ghunnah: see ghunnah F1. |
| ٱلرَّحِيمِ | arid #4, rawm-ishmam #5 (27:30) | **arid** | Unit 1, الفاتحة, the learner's own recitation. rawm-ishmam (unit 8) already has a second كسرة word (ٱلْفَصْلِ 77:13) and the whole Quran to choose from. | None in my lessons. The rawm-ishmam reviewer should replace its #5. |
| قُلْ | basics #2, makharij-wasat | **basics** | Already resolved. `makharij-wasat.json` was rewritten at 11:43 and now uses سورة الملك only; a rerun of the checker no longer flags it. | None needed. |
| ٱلْمُوقَدَةُ | ibtida #6, waqf-how #8 (more) | **waqf-how** | The ة→هـ at the stop is a point of the word itself. ibtida needs a two-word span here anyway (see ibtida F1), and widening it to 104:6 w2–3 would collide with lam-jh #5 (104:6 w1–2), a checker error. | ibtida #6 → 94:5 w2–3. |

I applied all the replacements below to a scratch copy of the proposals and reran the checker on it. Result: 0 errors, and no "same word" warnings for any of them. The texts and focus strings below are copied from the data; mind the mark order, شدة before فتحة, as in `سَّٰ`.

---

## basics: ACCEPT

- **Marks.** Each mark is what the note says:
  - فتحة on مَ
  - سكون on لْ
  - شدة on بِّ (رَبْ + بِ)
  - ضمة on يُ
  - كسرة on هِ
  - تنوين on رٌ, before ح, so إظهار and نَارُنْ is heard (101:11, joined, gap 10 ms)
- **Card.** All six cases on the card are covered.
- **Untaught rules.** The two flagged words are acceptable:
  - قُلْ has a heavy ق, which is basic letter sound and doesn't touch the لْ.
  - نَارٌ has a نَا مد. A written ا is on the card itself as حرف مد.
- **Note on the `why` of #5, not a defect.** It says "the final مْ before غ is clear". In the default recording, Husary stops after عَلَيْهِمْ: 1:7 has 4.1 s of silence at 4.23–8.34 s. The كسرة on هِ is unaffected.

## istiadha: FIX

1. **MAJOR. `istiadha` (no say examples). The Say step does not use "the formula from the card", as the proposal's notes claim.**
   - Evidence: `exampleSets` in `src/screens/Learn.tsx:57-59` returns `say: say.length ? say : core`. With no say examples, the Say step asks a first-day learner to repeat the three core examples:
     - the whole of 16:98 (8 words, with العارض at the end)
     - the بسملة
     - بَرَآءَةٌ مِّنَ ٱللَّهِ, with a 4–5 count متصل and إدغام بغنة, all untaught
   - Fix, either of:
     - (a) Make the theory lessons with no say words skip Say, or show the card's formula. This is an app change.
     - (b) Keep only 1:1 as the repeatable word: move it to role `say` and accept 2 hear examples (the count is a warning only). The learner then repeats just the بسملة.

   The examples themselves are correct:
   - 16:98 is the command. The أَعُوذُ formula is not an ayah.
   - 1:1 is ayah 1 of الفاتحة in the Kufan count.
   - 9:1 has no بسملة.
   - The four ways (قطع الجميع، وصل الجميع، and the two half-joins) are right on the card, per الميزان 38104/32.

## tabii: FIX

1. **MINOR. tabii#6 يُولَدْ (112:3, say).**
   - The point is right: a مد in the first syllable stays natural at a stop.
   - But in a Say step the learner copies the strong قلقلة كبرى on the final دْ, an untaught rule (qal-k, unit 2) that changes the sound.
   - Fix: move it to `more` (it is the card's teaching point) and add a clean و say word: **101:5 w1–1 `وَتَكُونُ`, focus `كُو`**, stop false. It starts the ayah, joined to ٱلْجِبَالُ, and carries no other rule. The checker is clean.
2. **MINOR. tabii#3 فِى (114:5).**
   - The rule is right: the dotless ى after a كسرة, with no همزة or سكون after it, is a ياء مد of two counts. In the Madani muṣḥaf every final ي is written dotless.
   - But the data doesn't mark it (checker warning), so when tajweed colours are on, this hear word shows no مد colour while أَعُوذُ and إِلَٰهِ do.
   - Fix: accept, and spot-check the Hear step. Or swap the roles of #3 and #5 (ٱلَّذِينَ, which the data does colour).
   - The notice is good: مَٰلِكِ (with ا in حفص) / مَلِكِ is a true minimal pair, and the contrast has no مد. The noticeText names the anchor and the two hear words, and reads naturally.

## arid: FIX

1. **MINOR. noticeText (en and ar).**
   - Evidence: "may be held longer than a normal مد, 2, 4 or 6 counts" / «أطول من المد الطبيعي، 2 أو 4 أو 6». Two counts is not longer, and the card says all three are equally correct.
   - Fix (en): "…the ا، ي or و before the last letter may be held 2, 4 or 6 counts; all three are correct."
   - Fix (ar): «…يجوز في الألف أو الياء أو الواو قبل الحرف الأخير 2 أو 4 أو 6 حركات، وكلها صحيحة.»
   - Checked and correct:
     - Every example is an ayah end with `stop: true`.
     - The vowel cases (كسرة, فتحة, ضمة) and the letters ا/و/ي are covered.
     - The notice contrast ٱلنَّاسَ (110:2 w2) is joined in all three recordings (gap 10 ms) and carries no العارض.
   - Keeps ٱلنَّاسِ and ٱلرَّحِيمِ (see the repetition table).

## iwad: FIX

1. **MINOR. iwad#1 `why` citation unverified.**
   - "The example غاية المريد gives for مد العوض": the pages cited on the card (7311/130–132) cover البدل and العارض only; I could not find العوض or أَفْوَاجًا there.
   - The rule itself is not in doubt. Fix: cite the page that has it, or drop the claim.
   - Checked and correct:
     - All eight are ayah ends with تنوين الفتح, stopped as an ا of two counts.
     - كِذَّٰبًا is read with a شدة in حفص.
     - كَيْدًا has no قلقلة, because the stop is on the ا.
     - The ۢ of تَوَّابًۢا is not read at the stop.
     - Leaving the ة exception on the card only is the right call, because Check questions draw from every example.
     - The contrast فِيهَا (78:35) is joined to لَغْوًا and has no عوض.

## tafkhim: FIX

1. **MINOR. tafkhim#4 غَيْرِ (1:7 w5): spot-check the default clip.**
   - Evidence:
     - The `husary-muallim` timing for word 5 is 8400–8700 ms, only 300 ms; Husary has 710 ms and Minshawy 590 ms.
     - The audio onset after the 4.1 s pause is at about 8.30–8.35 s (RMS goes from 31 to 63 dB).
     - So the clip probably starts after the onset of the غ, the very letter in focus.
   - Fix: listen to it in the app. If the غ is clipped, take another level-2 letter, for example طَ from 105:3's طَيْرًا (old example; check for conflicts first), or keep غَيْرِ for another reciter only.
   - Checked and correct:
     - The levels and letters match غاية المريد 7311/205 exactly.
     - ط is the strongest letter («الطاء أقواها»).
     - صُ/سُ is a sound near-minimal pair: same makhraj and vowel, and the contrast has no heavy letter.
     - The heavy غنة of مَن طَغَىٰ follows the ط, as on the card.
     - رَبِّ: ر with فتحة is heavy (the basic rule).
   - Judged acceptable: the untaught rules flagged on #1, #2, #3 and #6 (غنة, the ل of ال, the ٱ) sit away from the heavy letter and don't change it.

## ibtida: FIX

1. **MAJOR. ibtida#6 ٱلْمُوقَدَةُ (104:6 w3–3).**
   - The note teaches "joined to ٱللَّهِ before it, the ٱ is not said: ٱللَّهِ لْمُوقَدَةُ", but the span is word 3 alone. The clip (2330–4920 ms) starts on a bare لْ, a sound that cannot begin speech. So the learner hears a cut, not a join, and the Say step asks them to start a word on a سكون, the opposite of this lesson.
   - Strategy §2.3 says a rule between two words includes the end of the first word. Widening the span to w2–3 would overlap lam-jh#5 (104:6 w1–2), a checker error. The word is also waqf-how#8 (warning).
   - Fix: **94:5 w2–3 `مَعَ ٱلْعُسْرِ`, focus `عَ ٱلْ`**, stop false.
     - Mid-ayah, joined (gap 10 ms), no pause sign.
     - The قمرية لْ makes the drop easy to hear: مَعَلْعُسْرِ.
     - The only later rule is lam-q, the next lesson, as before. The checker is clean.
   - Note: «عند وصلها بـ مَعَ قبلها تسقط همزة الوصل: مَعَلْعُسْرِ».
2. **MINOR. The "Listen for" prompt (course `notice`, shown on both Hear and Say).**
   - It promises "how the ٱ disappears when he joins it", but Hear plays only starts (#1–#3). The joined words are #5 and #6, in Say.
   - Fix: add a `noticeText`:
     - en: "Listen to how the reciter starts ٱلَّذِى, ٱهْدِنَا and ٱدْعُ: the ٱ is said, with a فتحة, a كسرة or a ضمة. In Say you will hear it disappear when the word is joined."
     - ar: «استمع كيف يبدأ القارئ بـ ٱلَّذِى وٱهْدِنَا وٱدْعُ: تُنطق همزة الوصل مفتوحة أو مكسورة أو مضمومة، وستسمع في خطوة النطق كيف تسقط عند الوصل.»

**The "starts fresh" assumption (question 2): safe for the default reciter.**

- **Default reciter.** In Husary al-Muʿallim, each ayah is its own everyayah file, recorded separately. The 114:5 and 112:2 files open from silence: RMS goes from 5–9 dB to about 60 dB within 0.1 s, a clean onset on the ٱ vowel. The word-1 timings start at 0–150 ms.
- **First ayah of a surah.** The everyayah files carry no بسملة: 114:1 starts at 250 ms and 96:1 at 0 ms. So even ayah 1 would be heard as a fresh start in this recording. Still, avoiding ayah 1 is right, because a learner who joins the بسملة to the surah drops the ٱ.
- **The other picks:**
  - ibtida#3: no ayah of الفاتحة or جزء عمّ starts with a همزة وصل verb whose third letter has a ضمة. I scanned the data: the ayah-initial ٱ verbs are 1:6, 79:17, 89:28, 96:1 and 96:3, so taking 16:125 is justified.
  - ٱقْرَأْ: the third letter has a فتحة, so the ٱ takes a كسرة (الجزرية 102).
  - بِٱسْمِ: the ٱ is not said inside a word, and اسم is one of the seven nouns.

## lam-q: FIX

1. **MINOR. lam-q#6 ٱلْأَبْتَرُ (108:3).**
   - The بْ has a قلقلة صغرى (qal-s, unit 2) in a Say word. It changes the copied sound, and a cleaner word with the same همزة case exists.
   - Fix: **87:1 w4–4 `ٱلْأَعْلَى`, focus `ٱلْأَ`**, stop true.
     - Ayah end, and the word ends on an ا, so there is no العارض and no قلقلة.
     - Note: "ل before a همزة: clear, then the همزة in full."
     - The checker is clean.
   - Checked and correct:
     - All six letters are قمرية (ابغ حجك وخف عقيمه).
     - ٱلْكَوْثَرَ at the stop has no مد لين: the وْ is before the ث, not before the last letter.
     - The m-izhar flagged on ٱلْحَمْدُ is a plain م and changes nothing.

## lam-s: FIX

1. **MAJOR. lam-s#1 ٱلنَّاسِ (114:2, anchor): the same word as the core of arid (×2) and ghunnah.** This is the exact repetition the learner complained about, and arid keeps it (see the table).
   - Fix:
     - Promote #2 **ٱلرَّحْمَٰنِ (1:3)** to `anchor`. It is the old anchor, known to every learner, and starts the ayah with the ٱ said.
     - Add a new `hear`: **79:3 w1–1 `وَٱلسَّٰبِحَٰتِ`, focus `ٱلسَّٰ`**, stop false. It starts the ayah, joined to سَبْحًا, and carries only مد طبيعي (taught). The checker is clean.
     - noticeText: "Listen to ٱلرَّحْمَٰنِ, وَٱلسَّٰبِحَٰتِ and ٱلصِّرَٰطَ: …" / «استمع إلى ٱلرَّحْمَٰنِ ووَٱلسَّٰبِحَٰتِ وٱلصِّرَٰطَ: …».
     - Coverage becomes ر س ص ت ل ض ش. The ن letter is dropped on purpose: every ن sun word carries the untaught نّ غنة.
   - Unit-surah share: 0 core examples from الناس. Justified, because الناس's only other sun word is ٱلَّذِى, the ibtida anchor.
   - Checked and correct:
     - ل is a sun letter («…لِلْكَرَمْ», تحفة 27), so وَٱلَّيْلِ is valid despite the data warning.
     - وَٱلشَّمْسِ / وَٱلْقَمَرِ is a valid notice: the contrast has no silent ل.

## lam-jh: FIX

1. **MINOR. lam-jh#7 contrast وَٱلْفَتْحُ (110:1 w5) is also rawm-ishmam#2, a core example.**
   - Contrasts are not checked for repetition, but the learner meets the word twice.
   - Fix: lam-jh keeps it as a contrast (it is the only ال word in the ayah of نَصْرُ ٱللَّهِ). The rawm-ishmam reviewer should replace its #2.
2. **MINOR. lam-jh#2 ٱللَّهُ (112:2) with a non-default reciter.**
   - The `husary` (murattal) timing puts word 1 at 1610 ms, but speech starts at about 0.6 s (RMS envelope). That clip would cut the opening ٱ and part of the heavy لّ.
   - The default reciter is fine: the file opens from silence at 0.1 s, and 112:1 ends in silence in both Husary files, so he stops before 112:2 and the start is fresh.
   - Fix: none for the example. Flag the Husary 112:2 timing for the data owner.
   - Checked and correct:
     - Every pick follows a فتحة or a ضمة, or starts on the name.
     - فَأَخَذَهُ ٱللَّهُ: no صلة before a سكون.
     - سُبْحَٰنَكَ ٱللَّهُمَّ is الميزان's own example (38104/92). The ۚ is after word 7, outside the span.

## lam-jl: FIX

1. **MAJOR. lam-jl#4 لِّلَّهِ (82:19 w9).**
   - The شدة on the first ل exists only because the تنوين of يَوْمَئِذٍ merges into it (إدغام, unit 2). Cut alone, the clip starts in the middle of a doubled ل, and the Say step asks the learner to say a written لِّ at the start of a word, which is unsayable as written.
   - It also repeats the anchor's case and word (لِلَّهِ).
   - Fix: **3:109 w1–1 `وَلِلَّهِ`, focus `لِلَّ`**, stop false.
     - It starts the ayah, joined to مَا. The pause sign is after word 7, well outside the span.
     - Same-word كسرة case, a new word, no later rule. The checker is clean.
   - Note: «بعد كسرة اللام في وَلِلَّهِ: مرققة».
2. **MINOR. lam-jl#5 بِسْمِ ٱللَّهِ (27:30) repeats what the learner just heard as the بسملة in istiadha#2 (1:1).**
   - The checker misses it because the texts differ in length. It is acceptable as the books' classic example, so fix only if the learner's repetition complaint is to be met strictly.
3. **MINOR. Arabic wording.** «تُنطق نحيفة» (noticeText) and «مرققة نحيفة» (#2): نحيفة is not the usual term. Fix: «تُرقَّق» / «مرققة» alone.
   - Checked and correct:
     - All are light after a كسرة, original or added (قُلِ ٱللَّهُمَّ and بَلِ ٱللَّهُ, exactly الميزان's two kinds).
     - The notice بِٱللَّهِ / وَٱللَّهُ is sound. Husary pauses 4.4 s at the ۚ before وَٱللَّهُ and starts on it, and it stays heavy (فتحة of و), as the `why` says.

## ghunnah: FIX

1. **MAJOR. ghunnah#4 ٱلنَّاسِ (114:3): repetition, see the table.**
   - Fix: **78:2 w2–2 `ٱلنَّبَإِ`, focus `نَّ`**, stop false.
     - Mid-ayah, joined to ٱلْعَظِيمِ, and an old ghunnah example.
     - It keeps the "نّ made by the silent ل of ال" case.
     - The other rules (ibtida, lam-s) are both taught. The checker is clean.
   - Checked and correct:
     - نّ and مّ are two counts (تحفة 17, الجزرية 62).
     - The notice ثُمَّ / أَمَاتَهُۥ is sound: the contrast has no نّ or مّ.
     - The noticeText names the anchor and the hear words.

---

## Totals

- **BLOCKER: 0.** No example misstates a rule for حفص, and no join is broken by an ayah end or a pause sign.
- **MAJOR: 5.**
  - istiadha F1 (the Say step falls back to whole ayat)
  - ibtida F1 (#6 clip has no join)
  - lam-s F1 (ٱلنَّاسِ repeat)
  - lam-jl F1 (#4 merged لِّ)
  - ghunnah F1 (ٱلنَّاسِ repeat)
- **MINOR: 11.**
  - tabii 2
  - arid 1
  - iwad 1
  - tafkhim 1
  - ibtida 1
  - lam-q 1
  - lam-jh 2
  - lam-jl 2
- **Verdicts:** basics ACCEPT; the other 11 lessons FIX.
- **Outside these lessons:** rawm-ishmam should replace #5 ٱلرَّحِيمِ (27:30) and #2 وَٱلْفَتْحُ.

## Fixes (round 1)

I checked every replacement in the data: the text is copied from `words`, there is no pause sign inside any span, and no other proposal uses these words.

**MAJOR**
- **istiadha F1.** The roles are now:
  - anchor: 16:98, the command
  - hear: 9:1, no بسملة
  - say: فَٱسْتَعِذْ (16:98 w4), the one command word
  - say: the بسملة (1:1)

  A beginner now repeats one word and the بسملة, never a whole ayah or بَرَآءَةٌ. The 1 hear / 2 say count warnings are deliberate and are explained in `notes`. I added a `noticeText` naming what Hear plays.
- **ibtida F1.** #6 is now 94:5 w2–3 مَعَ ٱلْعُسْرِ, focus `عَ ٱلْ`. waqf-how keeps ٱلْمُوقَدَةُ.
- **lam-s F1.** ٱلنَّاسِ (114:2) is removed, and ٱلرَّحْمَٰنِ (1:3) is the anchor. The hear words are وَٱلسَّٰبِحَٰتِ (79:3) and ٱلصِّرَٰطَ. The `noticeText` and `coverage` are updated (ن left out on purpose).
- **lam-jl F1.** #4 is now 3:109 وَلِلَّهِ, focus `لِلَّ`.
- **ghunnah F1.** #4 is now 78:2 ٱلنَّبَإِ, focus `نَّ`. ٱلنَّاسِ is now core in arid only.

**MINOR**
- **tabii F1.** يُولَدْ moves to `more`. The new say word is 101:5 وَتَكُونُ (focus `كُو`).
- **tabii F2.** ٱلَّذِينَ (coloured by the data) is now hear and فِى is say. The `noticeText` names ٱلَّذِينَ.
- **arid F1.** The `noticeText` now reads "2, 4 or 6 counts; all three are correct", in English and Arabic.
- **iwad F1.** The citation stays, with the page made explicit. غاية المريد printed p. 118 (shamela 7311/155) has «مد العوض وهو يكون عند الوقف على التنوين المنصوب نحو: {أفواجا}». It is not on the card's 130–132.
- **tafkhim F1.** غَيْرِ (1:7) is replaced by طَغَىٰ (79:17 w5, focus `غَ`). The غ is in the middle of the word, so a short clip cannot cut it. The stop falls on the ىٰ.
- **ibtida F2.** I added the reviewer's `noticeText`: Hear plays the starts, and Say plays the drop when joined.
- **lam-q F1.** ٱلْأَبْتَرُ is replaced by 87:1 ٱلْأَعْلَى (focus `ٱلْأَ`, stop true). The word ends on an ا, so there is no عارض and no قلقلة.
- **lam-jh F1.** وَٱلْفَتْحُ stays as the contrast (the only ال word in 110:1). rawm-ishmam should replace its #2.
- **lam-jh F2.** No change to the example. I flag the `husary` (murattal) 112:2 word-1 timing (1610 ms against speech at about 0.6 s) to the data owner.
- **lam-jl F2.** بِسْمِ ٱللَّهِ (27:30) is replaced by 30:5 بِنَصْرِ ٱللَّهِ. It starts the ayah, and the ۚ falls at the end of the span. It also forms a كسرة/ضمة pair with lam-jh's نَصْرُ ٱللَّهِ.
- **lam-jl F3.** «نحيفة» is removed from the `noticeText` and from #2.

**"Which rule is highlighted" check on the `more` examples**
- **tabii يُولَدْ:** the focus يُو shows tabii only. qal-k is on the دْ, and the also-list catches it.
- **tafkhim رَبِّ:** ra-h and ra-l are never offered as wrong answers when the words contain ر.
- **tafkhim مَن طَغَىٰ:** the also-list catches ikhfa.
- **iwad تَوَّابًۢا:** at the stop the iqlab sign ۢ is not read, so iqlab is a true wrong answer.

**Checker** (`EXAMPLES_DIR=docs/examples/proposals LESSONS=<12 ids> REPORT=1`): 0 errors and no repetition ("same words") warnings. The 29 warnings left are:
- untaught rules, each answered in `why` or `notes`
- the data not seeing the rule, in four cases: فِى, وَٱلَّيْلِ, تَوَّابًۢا and رَبِّ
- istiadha's deliberate role counts

## Re-check (round 1)

**Checker.** I reran it on all proposals, with no `LESSONS` filter: 0 errors, and no "same words" or "same word" warnings anywhere. The 51 warnings left are:
- role counts in lessons with few places in the Quran (imalah, ishmam, sakt, tashil, and istiadha by design)
- "data does not see": iwad#8, lam-s#5, tabii#5 (فِى), tafkhim#8, all answered
- untaught rules, answered in `why`

`ٱلنَّاسِ` is now a core word of arid only, and `ٱلرَّحِيمِ`, `قُلْ` and `ٱلْمُوقَدَةُ` are no longer flagged.

**Fixes verified:**
- **istiadha.** The roles are now:
  - anchor: 16:98
  - hear: 9:1
  - say: فَٱسْتَعِذْ (16:98 w4)
  - say: the بسملة (1:1)

  The word timings are good: w4 is 3870–5140 ms and joined. The note «همزة الوصل لا تُنطق» is correct. Hear plays the anchor and 9:1, which matches the new noticeText. A beginner no longer repeats a whole ayah or بَرَآءَةٌ. The 1 hear / 2 say count is a deliberate warning. OK.
- **tabii.** ٱلَّذِينَ (1:7 w2) is now hear, and the data colours it. فِى is say, وَتَكُونُ (101:5) is say, and يُولَدْ is `more`. The noticeText names أَعُوذُ, إِلَٰهِ and ٱلَّذِينَ, which are exactly Hear's words. OK.
- **iwad page.** Confirmed: shamela 7311/155 (printed p. 118) has «مد العوض وهو يكون عند الوقف على التنوين المنصوب نحو: {أَفْوَاجًا} … فيقرأ ألفًا عوضًا عن التنوين». OK.
- **lam-jl#5 بِنَصْرِ ٱللَّهِ (30:5 w1–2).**
  - The text matches the data. It starts the ayah (w1 at 450 ms) and is joined (gap 10 ms).
  - Husary then pauses 3.15 s at the ۚ after word 2, so the name is heard stopped, «بِنَصْرِ ٱللَّهْ». The ل stays light: the كسرة of رِ comes before it, and stopping does not change that (الميزان 38104/92).
  - It also makes a good pair with نَصْرُ ٱللَّهِ in lam-jh. OK.
- **lam-jl#4 وَلِلَّهِ (3:109), lam-q#6 ٱلْأَعْلَى (87:1), ibtida#6 مَعَ ٱلْعُسْرِ (94:5), ghunnah#4 ٱلنَّبَإِ (78:2), lam-s (anchor ٱلرَّحْمَٰنِ, hear وَٱلسَّٰبِحَٰتِ).** All are in place as proposed, with the noticeTexts updated. OK.
- **The other fixes.** «نحيفة» is gone from the Arabic text. arid's noticeText reads "all three are correct", and ibtida has its new noticeText. OK.

**New finding:**
1. **MINOR. tafkhim#4 طَغَىٰ (79:17 w5), focus غَ.**
   - The word, timing (5460–6740 ms) and stop are fine, and the غ is no longer at a clip edge.
   - But the غ is followed by an ا (ىٰ, read as an alif in حفص, which has no إمالة here). That makes it level 1 (المفتوح بعده ألف, غاية المريد 7311/205), not level 2 as the `why` says.
   - It also repeats طَغَىٰ, already in the same lesson as #9 مَن طَغَىٰ.
   - Level-2 coverage still holds through #1 خَ and #5 طَ, so nothing is untaught. But the label is wrong, and the learner hears غَا, not a plain غَ.
   - Fix, either of:
     - (a) Keep the word and correct the `why` and `coverage` to level 1. The note becomes «غين مفتوحة بعدها ألف: أقوى المراتب».
     - (b) Take a plain-فتحة غ with no ا after it and no clip-edge risk.

**Final verdicts:**

| Lesson | Verdict |
|---|---|
| basics | ACCEPT |
| istiadha | ACCEPT |
| tabii | ACCEPT |
| arid | ACCEPT |
| iwad | ACCEPT |
| tafkhim | FIX: 1 MINOR (#4 level label; a one-line fix, no re-review needed) |
| ibtida | ACCEPT |
| lam-q | ACCEPT |
| lam-s | ACCEPT |
| lam-jh | ACCEPT |
| lam-jl | ACCEPT |
| ghunnah | ACCEPT |

**Totals for this round:** BLOCKER 0, MAJOR 0, MINOR 1. All 16 findings from round 1 are resolved.

**Proposer's fix for the round-1 re-check finding:**
- **tafkhim#4** is now 85:14 w2 ٱلْغَفُورُ, focus `غَ`. It is a plain-فتحة غ with no ا after it (level 2), in the middle of the word, mid-ayah and joined to ٱلْوَدُودُ, with no pause sign.
- It is used by no other proposal, and it no longer repeats #9.
- The `why` and `notes` are updated.
- Checker for the 12 lessons: 0 errors, and no "same words" warnings.
