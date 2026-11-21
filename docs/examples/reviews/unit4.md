# Review: unit 4 examples (m-izhar, m-idgham, m-ikhfa, mutajanisayn, silent-letters)

Reviewer: independent, 2026-11-21. Standard: `docs/15-example-strategy.md`.

## What was checked
- **Text:** every example and contrast span was compared with `public/data/surah/NNN.json` (`words`, 1-based). All 48 spans match exactly.
- **Pause signs:** read from each ayah's `marks`. None of the joined spans crosses a sign. Confirmed: 7:176 has ۚ after word 20 (يَلْهَث), 98:8 has ۚ after word 17, and 2:256 has ۖ after word 4 (before قَد).
- **Checker:** `EXAMPLES_DIR=docs/examples/proposals LESSONS=m-izhar,m-idgham,m-ikhfa,mutajanisayn,silent-letters REPORT=1 npx vitest run src/content/examples.check.test.ts` gives 0 errors and 4 warnings. The warnings: m-idgham#2 has بدل; mutajanisayn#3 has ض/ظ and ۟; mutajanisayn#5 and #9 are not seen by the data. Each is answered in `why`. The only overlaps with other lessons are contrast words (105:3, 5:61, 2:256), which is allowed.
- **Data scans over the whole Quran** (cross-word merges carrying a shadda):
  - ت دّ: only 7:189 and 10:89
  - ب مّ: only 11:42
  - ث ذّ: only 7:176
  - ذ ظّ: only 4:64 and 43:39
  - ط followed by ت: only بَسَطتَ, فَرَّطتُمْ, أَحَطتُ, فَرَّطتُ
  - In the unit's surahs (105–108): م before ب only at 105:4; م before م only at 106:4 (twice); a ۟ letter only at 106:3; no المتجانسين pair at all.

  So the proposers' "only place" and "not in the unit" claims hold.

## Sources read
- **الجزرية** (581/75), lines 63–64: «المِيمَ إِنْ تَسْكُنْ بِغُنَّةٍ لَدَى … بَاءٍ عَلَى المُخْتَارِ مِنْ أَهْلِ الأَدَا / وَأَظْهِرَنْهَا عِنْدَ بَاقِي الأَحْرُفِ … وَاحْذَرْ لَدَى وَاوٍ وَفَا أَنْ تَخْتَفِي». So الإخفاء is م before ب, and الإظهار covers every other letter, و and ف included. Together with تحفة 18–23 («والثاني إدغامٌ بمثلها أتى»), الإدغام is م before م.
- **هداية القاري**, ج1 ص241–243 (Shamela 22869/204–206), الإدغام الواجب في المتجانسين:
  - «الذال… في الظاء في موضعين… {إذ ظلمتم} {إذ ظلموا} ولا ثالث لهما»
  - «الدال… في التاء… {قد تبين}… {حصدتم}…»
  - «تاء التأنيث… في الدال في موضعين لا ثالث لهما: {أثقلت دعوا}… {أجيبت دعوتكما}… وفي الطاء…»
  - «الطاء… في التاء نحو {أحطت} {بسطت} {فرطتم}»
  - م before ب: «تخفى… مع الغنة في أحد القولين»
- **الميزان** (38104/131–132):
  - «إدغام متجانسين صغير بغنة… الباء مع الميم: ارْكَبْ مَعَنا (هود ٤٢)… الإظهار لحفص من طريق ضعيف»
  - The incomplete merge without غنة is only ط into ت: أحطت، بسطت، فرطت.
  - ت with د «في موضعين فقط».

  Together with the muṣḥaf, which marks the merge (shadda on مَّ, no sukun on ب), الإدغام in ٱرْكَب مَّعَنَا is the reading for حفص from الشاطبية. In the الشاطبية line «وفي اركب هدى بر قريب بخلفهم», the إظهار belongs to others (البزي، قالون، خلاد), not to حفص.
- **The incomplete merge:** بَسَطتَ / أَحَطتُ are written with no sukun on ط and no shadda on ت, which is the Madina muṣḥaf's mark for an incomplete merge. The notes (keep الإطباق, no قلقلة) are right.
- **Silent letters:**
  - هداية القاري ج2 ص524–525 (22869/473–474): الظنونا والرسولا والسبيلا وقواريرا (the first) «قرأ حفص فيها بحذف الألف وصلاً وبإثباتها وقفاً». أنا before a همزة: «حفص… بحذف الألف وصلاً وبإثباتها وقفاً».
  - هداية القاري ج2 ص549 (22869/498): the extra ا of مائة, the second ي of بأييد and the و of أولئك «لا يتلفظ بها… لا في الوصل ولا في الوقف».
  - غاية المريد ص199 (7311/253): «قواريرا الموضع الأول… أما الثاني فمحذوف وصلا ووقفًا».

  Every silent-letter claim checks out.

No example has wrong tajweed or wrong text.

---

## m-izhar: ACCEPT
- The anchor (أَلَمْ تَرَ) and 6 of the 7 core examples come from the unit.
- و and ف (the card's warning) are covered by #2, #4 and #9. The one-word case is #3.
- Notice: أَلَمْ against لَّمَّا (ghunnah). The contrast has a مّ مشددة, which is the غنة rule, and no ميم ساكنة; the shadda on its ل comes from idgh-n, which is already taught.
- Notes and Arabic match.

## m-idgham: ACCEPT
- Both unit cases (106:4) are the anchor and the first hear example.
- Covers مِّ, مَّ and مُّ, the classic كَم مِّن, and a non-pronoun أَم مَّن.
- The notice pair عَلَيْهِم مُّؤْصَدَةٌ / عَلَيْهِمْ طَيْرًا is a true minimal pair (the same word), and the contrast is from the unit.
- The بدل in وَءَامَنَهُم is two counts and is answered in `why`.
- `noticeText` names the new anchor, and the Arabic matches the English.

## m-ikhfa: FIX (3 MINOR)
1. **MINOR, m-ikhfa#1:** the English note says "lips close lightly". The card's tip, its review status (`needs-teacher`) and the proposal's own `notes` leave الإطباق or الفرجة to the teacher (هداية القاري 1/206: «في أحد القولين»). The `noteAr` correctly says nothing about the lips, so English and Arabic also differ.
   - Fix: "The م before ب is hidden with a two-count hum, then the ب."
   - Also, `why` calls تَرْمِيهِم بِحِجَارَةٍ "the book example (تحفة)", but the verses of تحفة quote no ayah. Say "the common example in the شروح" or cite a شرح.
2. **MINOR, m-ikhfa#6:** the English note "then a hidden نۢ before ب" misdescribes الإقلاب: the ن is turned into a م, which is then hidden. The `noteAr` («نون مقلوبة») is right.
   - Fix: "A hidden م, then in بِذَنۢبِهِمْ the نۢ turns into a hidden م too (إقلاب)."
3. **MINOR, m-ikhfa#4 (say):** in فَبَشِّرْهُم the رْ after a كسرة is light (ترقيق الراء, ra-l, unit 5), right next to the target. The learner copies it untaught, and the checker cannot see ر rules.
   - Replacement, checked in the data: **96:14 words 2–3 «يَعْلَم بِأَنَّ»**. It has no ر, is from العلق (unit 6, ahead of the rest of جزء عمّ), no pause sign, no other lesson uses it, and the م ends a verb, not هم/كم. That also adds the one variety the lesson lacks: every current core word ends in a pronoun.

## mutajanisayn: FIX (3 MINOR)
Every pair, every "only place" claim and every note is correct. 109:4 عَبَدتُّمْ is the one case in the learner's surahs, so 0 of 7 from the unit is unavoidable. Leaving out ث←ذ (7:176, a ۚ right after يَلْهَث) is justified.
1. **MINOR, mutajanisayn#6 (say) ٱرْكَب مَّعَنَا:** the رْ is heavy (after the همزة الوصل's كسرة when starting, or after the فتحة of يَٰبُنَىَّ when joined). That is ra-h, unit 5, not yet taught, and `why` does not say so (strategy §2.4). It is the only ب←م in the Quran, so keep it and add to `why`: "the heavy رْ (unit 5) is away from the target; no other place exists."
2. **MINOR, mutajanisayn#2:** 3:122 **«إِذْ هَمَّت طَّآئِفَتَانِ»** (words 2–3, also الميزان's example «همت طائفتان») is in this lesson's own closing passage (3:121–122). Using it means the learner meets the Hear word again when reciting the closing. It has no pause sign in the span (ۗ is after word 8), no other lesson uses it, and the مّ غنة in it is taught. Swap it in for 3:72, or move 3:72 to `more`.
3. **MINOR, mutajanisayn#8 (more):** قَد تَّبَيَّنَ (2:256) is nearly the same words as the notice example وَقَد تَّبَيَّنَ (29:38), and it is also mutaqaribayn's contrast. It adds nothing new to Check questions.
   - Replacement, checked: **9:117 words 1–2 «لَّقَد تَّابَ»**. It is الميزان's «لَقَدْ تابَ», no other lesson uses it, and the ۚ is after word 23.

## silent-letters: ACCEPT
All of these match the books and the muṣḥaf marks:
- ۟ never said (ا after واو الجماعة, و of أُو۟لَٰٓئِكَ, مِا۟ئَةَ, بِأَيْي۟دٍ, لَأَا۟ذْبَحَنَّهُۥٓ)
- ۠ said only at a stop (أَنَا۠ joined at 109:4 and 2:258; ٱلظُّنُونَا۠ at the ayah end with `stop: true`)
- قَوَارِيرَا۟ (76:16) never with ا

Other points:
- The new notice pair أَنَا۠ أُحْىِۦ / إِنَّآ أَعْطَيْنَٰكَ (munfasil, from the unit) fixes the old prompt's error: عَابِدٌ does not start with a همزة.
- The contrast note's "4 or 5 counts" is right for الشاطبية.
- `noticeText` names the anchor and hear#2 correctly in both languages.
- A note for the proposer, not a defect: hear#3 أَنَا۠ is a single word, so the learner hears أَنَ without its neighbour. That is acceptable because the audio is cut from the joined recitation.

---

## General note
The checker has no ر rules (ra-h / ra-l never appear in "also" lines), so "untaught rules" warnings never cover the ر. Findings m-ikhfa#4 and mutajanisayn#6 come from reading the words by hand. Other groups may have the same gap.

## Totals
| Severity | Count |
|---|---|
| BLOCKER | 0 |
| MAJOR | 0 |
| MINOR | 6 |

ACCEPT: m-izhar, m-idgham, silent-letters. FIX: m-ikhfa (3 MINOR), mutajanisayn (3 MINOR).

## Fixes (round 1)

Proposer, 2026-11-21. Every replacement was checked in `public/data`. Checker: 0 errors.

- **m-ikhfa#1:**
  - The note is now "The م before ب is hidden with a two-count hum, then the ب." It takes no side on the lips.
  - `why` no longer credits the word to تحفة. تحفة states the rule without an example word; الإطباق/الفرجة is left to the teacher.
- **m-ikhfa#6:** the note now says the نۢ of بِذَنۢبِهِمْ turns into a hidden م (إقلاب).
- **m-ikhfa#4:** فَبَشِّرْهُم is replaced by يَعْلَم بِأَنَّ (96:14 w2–3). It has no ر, no pause sign, and its م belongs to a verb. Coverage updated.
- **mutajanisayn#2:** now إِذْ هَمَّت طَّآئِفَتَانِ, using words 2–3 of 3:122 (هَمَّت طَّآئِفَتَانِ). This is the lesson's closing passage; the ۗ is after word 8.
- **mutajanisayn#6:** kept. `why` now names the heavy رْ (ra-h, unit 5): it is away from the target, and no other ب←م place exists.
- **mutajanisayn#8:** now لَّقَد تَّابَ (9:117 w1–2). The ۚ is after word 23.
- **mutajanisayn coverage:** the numbers were off by one in places. It now reads "د←ت #1 #7 #8; ت←ط #2; ذ←ظ #3; ت←د #4 #10; ط←ت #5 #9; ب←م #6".

## Re-check (round 1)

Reviewer, 2026-11-21. Checker re-run (same command): 0 errors, the same 4 warnings, all already answered. All spans still match `public/data` word for word. The three new spans overlap no other lesson's example.

- **m-ikhfa#1:** fixed.
  - The note is now teacher-neutral and matches `noteAr`.
  - `why` no longer credits تحفة with an example word.
- **m-ikhfa#6:** fixed. The English note now describes الإقلاب correctly, and `noteAr` (نون مقلوبة) was already right.
- **m-ikhfa#4:** fixed. 96:14 w2–3 «يَعْلَم بِأَنَّ» matches the data.
  - It has no ayah-end or pause mark in the ayah.
  - The م is sakin (مجزوم after لم) and comes before ب, so it is الإخفاء الشفوي.
  - It has no ر in the span (the ر of يَرَىٰ is outside it), and the checker sees only the taught غنة.
  - The coverage line adds "a verb's م: #4".
- **mutajanisayn#2:** fixed. 3:122 w2–3 «هَمَّت طَّآئِفَتَانِ» matches the data and has the shadda on ط (a complete merge).
  - It is الميزان's example, and هداية القاري 1/242 lists ت into ط as obligatory.
  - The ۗ is after word 8, outside the span.
  - The extra rules (the مّ غنة, the متصل, تفخيم) are all taught.
  - A wording slip, not a defect: the proposer's fixes list says "now إِذْ هَمَّت…", but the stored text is correctly words 2–3 only.
- **mutajanisayn#6:** fixed. `why` now names the heavy رْ (unit 5) and why the example is kept.
- **mutajanisayn#8:** fixed. 9:117 w1–2 «لَّقَد تَّابَ» matches the data.
  - It is الميزان's «لقد تاب», and هداية القاري lists د into ت (with قد) as obligatory.
  - The ۚ is after word 23.
- **mutajanisayn coverage:** the numbers now match the examples.
- **The ر note:** answered for quizzes by the `quizAlso` change. Hear and Say copying is accepted by design.

Nothing new broke.

### Final verdicts
| Lesson | Verdict |
|---|---|
| m-izhar | ACCEPT |
| m-idgham | ACCEPT |
| m-ikhfa | ACCEPT |
| mutajanisayn | ACCEPT |
| silent-letters | ACCEPT |

Open findings: 0 BLOCKER, 0 MAJOR, 0 MINOR.
