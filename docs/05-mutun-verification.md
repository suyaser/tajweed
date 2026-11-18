# 05 · Mutun verification (C7)

Status: script cross-check done. The two-person check against the printed book (spec C7) has **not** been done yet. Data: `content/mutun.json`.

## Summary

| Matn | Edition (wins) | Lines | Checked against a second copy | Word-level differences found |
|---|---|---|---|---|
| تحفة الأطفال | Shamela 9632 (notes of علي الضباع) | **61** | 61 / 61 | 13 (1 real reading, 12 spelling) |
| المقدمة الجزرية | Shamela 581 (ed. عبد المحسن القاسم) | **107** | 107 / 107 | 37 (23 real readings or copy errors, 14 spelling) + 6 spacing typos |

Both counts match the expected 61 and 107. No line is left unverified at word level.

What `verified: "two-copies"` means here: a script compared the line word by word with a second copy and every difference is listed below. That is not the C7 two-person check, and it does not prove the diacritics are right (see "What this does not cover").

## Method

1. **Fetch.** `shamela.ws` is not reachable from the build machine's shell (TCP connect times out), so the pages were read in Chrome. A script inside the page fetched every page of both books (9632 pp. 1–8; 581 pp. 45–100) and parsed the verse lines:
   - تحفة: every `<p>` in `.nass` with the ` ... ` separator (61 found).
   - الجزرية: every line `N - صدر … عجز` (107 found, numbered 1–107 in order).
   - Footnote markers like `(٣)` were removed. Everything else is kept as published: the editor's «» and () marks, the tatweel in «نِعْمَتُـ» ـهَا (line 95), and Unicode code-point order.
2. **Copy to disk without retyping errors.** The parsed lines were moved to `scratchpad/mutun/shamela_lines.psv` (format `text|n|page|sadr|ajuz`) and the SHA-256 of the whole file was checked against the SHA-256 computed in the browser from the live pages. They match: `cc7e3afe6076fa385195d44774428c6a55d2bf86d311c50bdf4ea4a55eb5886b`. So every character in `mutun.json` is byte-identical to the Shamela page. `build.py` asserts that the JSON lines still equal that file.
   - Note: the Jazariyya pages store shadda **before** the vowel (U+0651 U+064E), while Unicode NFC orders it after. We keep the page's order. The app should NFC-normalise before comparing text, and display the stored string.
3. **Second copies.** Compared by `scratchpad/bin/compare.py`. Matching ignores diacritics. Each difference is classed as:
   - *lexical*: a different word or form;
   - *orthographic*: same word, different spelling (hamza seat, alif of وا, ى/ي, ة/ه, ابن/بن, the final ي of الثانِ/الثاني, or a written vs dropped hamzat al-wasl, as in لِاطْبَاقَ/الاِطْبَاقَ);
   - *spacing*: words run together or split in the other copy, which is a typing error. These are listed but kept out of `variants`.
4. **Al-Qasim's apparatus.** Al-Qasim's footnotes record the readings of his ten manuscripts (أ–ي). For each Jazariyya difference, the footnotes on that Shamela page were searched for the other copy's reading. A reading the footnotes record is a real manuscript variant. A reading they do not record is most likely an error in the other copy, but it is also where a typing error on the Shamela side could hide, so those lines go to the print check list.
5. **Rules and glosses** were assigned by hand from the line content (`scratchpad/bin/build.py`). Sections are the edition's own headings, used as app labels.

Raw data kept in the scratchpad (`/private/tmp/claude-501/-Users-suyaser-orca-workspaces-tajweed-tajweed/c7c50110-f367-4736-a48e-730f3d538dc3/scratchpad/mutun/`): `shamela_lines.psv` (hash-verified), `second/mughni_12093.psv` (hash-verified, NFC), the three Quranpedia Word files with text exports, and `diffs.json` (every word and diacritic difference). The raw Shamela HTML is **not** saved: the shell cannot reach Shamela, and the browser could not write to disk (Chrome blocked the page from posting to a local port). The hash check replaces it. To keep the HTML, open the pages in a browser and use "Save page".

## Sources

### تحفة الأطفال

| Role | Copy | Independence |
|---|---|---|
| Edition (wins) | Shamela 9632, *تحفة الأطفال والغلمان في تجويد القرآن*, with the short notes of علي محمد الضباع. https://shamela.ws/book/9632/2 to /8 | — |
| B | Quranpedia book 21438, same الضباع edition, Word file (https://quranpedia.net/book/21438) | **Not independent.** Identical to Shamela in every word and diacritic (0 differences), with the same quirks (الْمِيهِىِّ with ى, بَداَ, the stray fatha in the heading أَحْكَامُ َالمِيمِ). Shamela's text and this file come from the same digital source. Useful only to confirm Shamela renders that source faithfully. |
| C | Quranpedia book 18289, *الشرح المبسط المفيد لما تضمنه نظم الجمزورية* (https://quranpedia.net/book/18289) | Independent typing. Covers 58 of 61 lines (lines 39, 50, 51 are not in it), and some lines have no vowels. |
| **D (main check)** | Quranpedia book 21539, *تحفة الأطفال والغلمان*, ed. ابن سالم, 2006 (https://quranpedia.net/book/21539) | Independent edition with its own vowelling. Covers all 61 lines (match ≥ 0.97 for every half-line). |

Shamela has no second edition of the Tuhfa (checked the whole التجويد والقراءات category). Arabic Wikisource is excluded by the spec.

### المقدمة الجزرية

| Role | Copy | Independence |
|---|---|---|
| Edition (wins) | Shamela 581, critical edition by د. عبد المحسن بن محمد القاسم, from ten manuscripts, variants in footnotes. Text on https://shamela.ws/book/581/51 to /95 | — |
| Second copy | Shamela 12093, *المقدمة الجزرية* ط المغني (https://shamela.ws/book/12093/1 to /25) | Independent edition and typing. Aligned line by line, all 107 lines. Many of its lines have no vowels and it has typing errors. |

## Line counts

- **تحفة الأطفال: 61.** Matches line 59 «أَبْيَاتُهُ نَدٌّ بَداَ» (ن 50 + د 4 + ب 2 + د 4 + ا 1 = 61 in abjad).
- **المقدمة الجزرية: 107**, numbered by al-Qasim. The Mughni copy has **109**. It adds «أبياتها قاف وزاي بالعدد / مَنْ يُحْسِنِ التَّجْوِيدَ يَظْفَرْ بِالرَّشَدْ» (after line 106) and a closing line «عَلَى النَّبِيِّ المصطفى واله / وصحبه وتابعي منواله». The abjad line is not in al-Qasim's text. His footnote on line 107 records the closing line only as an addition in manuscript ي, and gives different added lines for ج (by عبد الدائم الأزهري) and ط. He also records that manuscript ح counts 107 lines and manuscript ي counts 108. Both extra lines are left out, and our numbering is al-Qasim's.
- Line 10: Mughni breaks the hemistichs in a different place (وَهِي is at the start of its second half). The words are the same.

## Variant list

The edition's wording is used in every case. "fn" = recorded in al-Qasim's footnotes.

### المقدمة الجزرية (al-Qasim vs Mughni, Shamela 12093)

Lexical (real readings, or errors in the Mughni copy):

| Line | al-Qasim (used) | Mughni | In al-Qasim's footnotes? |
|---|---|---|---|
| 8 | بِـ «هَا» | بتا | no → print check |
| 27 | يُصَحِّحِ القُرَانَ | يُجَوِّدِ الْقُرَآنَ | yes: يُجوِّد in ج د هـ و ي; القرْآن in أ ج هـ ز ح ط. Al-Qasim says the author's own hand has يُصَحِّحِ. |
| 37 | وَاحْرِصْ | فاحرص | yes (ج د هـ) |
| 56 | وَ «ظَلْتَ | فظلت | yes (ح) |
| 58 | «هَلْ» | وهل | no → print check |
| 59 | «ظَنِينٍ» | ضَنِيْنٍ | yes (د هـ ط ي) |
| 63 | لَدَى / بَاءٍ … الأَدَا | عند الباء … الأداء | no (breaks the metre, a Mughni error) → print check |
| 68 | لِاخْفَا | إخفا | no (fn has لِإِخفا only) → print check |
| 74 | تُقْسَمُ | تنقسم | yes (ح) |
| 77 | الوَقْفُ | يوقف | yes (ج د هـ و ز; al-Qari prefers يوقف) |
| 79 | المُصْحَفِ | مُصْحَفِ | yes (ج د و ي) |
| 82 | لَا أَقُولَ | لا إله | no (a Mughni error) → print check |
| 82 | وَالمَفْتُوحَ | كالمفتوح | no → print check |
| 88 | ظُلَّةٍ | شعراء | yes (أ ج ز ح: شُعَرَا) |
| 92 | صِلْ؛ وَوُهِّلَا | وصلا ووهلا | no → print check |
| 93 | وَزَنُوهُمُ، وَكَالُوهُمْ | ووزنزهم كالوهم | no (a Mughni typo) → print check |
| 93 | «الْ» وَ «هَا» وَ «يَا» | أل ويا وها | yes, order ها/يا (أ ز ح) |
| 94 | وَ «رَحْمَتُ» | ورحمتا | no → print check |
| 98 | وَأُخْرَى | وَحَرْفَ | yes (ج د ط و ب) |
| 104 | فَبَعْضُ الحَرَكَهْ | فَبَعْضُ حَرَكَهْ | yes (ب ز ح ي) |
| 107 | لَهَا خِتَامُ | له خِتَامُ | no → print check |

Orthographic (same word): 1 ابْنُ/بْنُ · 40 يَسْطُو يَسْقُو/يَسْطُوا يَسْقُوا · 45 لِاطْبَاقَ/الاِطْبَاقَ (fn) · 50 وَأَوَّلَيْ/وَأَوَّلَى · 54 أُغْلُظْ/اُغْلُظْ · 63 الأَدَا/الأداء · 65 إِخْفَا/اخْفَا · 80 مَلْجَأً/مَلْجَإٍ (fn) · 85 لَانْعَامَ/اَلانْعَامِ · 87 يَبْلُو/يَبْلُوا (fn) · 94 لَاعْرَافِ/الاَعْرَافِ · 102 وَفِي لَاسْمَاءِ/وَفِى الاَسْمَاءِ (fn) · 106 القُرَانِ تَقْدِمَهْ/القُرْآنِ تقدمة (fn, القرْآن breaks the metre).

Spacing typos in Mughni (not readings, not in JSON): 16 الثناياو الصفير · 33 إلارياضة · 44 اوضم · 75 أوكان · 95 نِعْمَتُهَا (the edition splits it as «نِعْمَتُـ» ـهَا) · 100 مااختلف.

Diacritics: 279 word-level diacritic differences with Mughni. Most are the two editions' conventions (sukun on the lam of ال, tanween on the alif or the letter before it) and case endings that al-Qasim's footnotes already discuss. They are in `diffs.json` and are not listed here.

### تحفة الأطفال (Shamela 9632 vs C and D)

| Line | Edition (used) | Other | Source | Kind |
|---|---|---|---|---|
| 59 | تَارِيخُهَا | تَارِيخُهُ | D | **lexical** → print check |
| 4 | الْمِيهِىِّ | الْمِيهِيِّ | C, D | orthographic (the edition copy writes ى inside the word, which looks like a typing slip) → print check |
| 9, 12, 21 | وَالثَّانِ | وَالثَّانِي | D (21 also C) | orthographic (ي dropped in writing for the metre) |
| 18 | لِذِي | لِذِى | C | orthographic |
| 22 | الْبَقِيَّهْ | الْبَقِيَّةْ | C | orthographic |
| 29 | وأظْهِرَنَّ | واظْهِرَنْ | C | orthographic + nun with shadda vs sukun |
| 35 | أَصْلِيٌّ وَفَرْعِيٌّ | أَصْلِىُّ وَفَرْعِىٌّ | C | orthographic |
| 48 | أَرْبَعَهْ | أَرْبَعَةْ | C | orthographic |
| 55 | سِوَى | سِوَي | C | orthographic |
| 59 | لِذِ النُّهَى | لِذِيْ النُّهَى | D | orthographic |

Spacing typos in the other copies: 15 ضَمَّنتُهَ ا (D) · 26 فيأَرْبَعِ (C) · 36 مَالاَ (C) · 37 جَابَعْدَ (C).

Diacritics: 54 lines differ from edition D in at least one diacritic (122 word-level differences), and C differs as well. These are different editions with different vowelling, so the list is in `diffs.json` and is not a basis for changing the text. Two diacritic points for the print check: line 15 «قَد ضَّمَّنْتُهَا» (the edition puts a shadda on the ض; C and D do not), and line 59 «بَداَ» (a fatha written after the alif; D has it too).

## Lines to check against the printed book first

No line is unverified at word level. These lines have a difference the second copy and the apparatus do not settle. Check them against the printed pages before release:

- الجزرية: 8, 58, 63, 68, 82, 92, 93, 94, 107 (the second copy differs and al-Qasim's footnotes are silent).
- تحفة: 4 (الْمِيهِىِّ with ى), 15 (shadda on ض), 59 (تَارِيخُهَا vs تَارِيخُهُ; بَداَ).

## What this does not cover

- **The C7 two-person check is still required.** This work is a machine cross-check of digital copies. It does not replace one person typing or reading the line and a second person checking it against the printed page.
- **Diacritics are checked against a single copy.** The second copies are other editions, so they can confirm the words but not the edition's vowelling. For the Tuhfa, the only same-edition copy (B) shares Shamela's digital source. For the Jazariyya there is no second digital copy of al-Qasim's edition. In both, every diacritic is exactly as on the Shamela page (hash-verified), but whether Shamela matches the printed book is for the C7 check.
- **Rule mapping is first-pass** and goes to review with C1. Choices to confirm:
  - Tuhfa 29 (لام الفعل) has no rule id, so `rules: []`.
  - الجزرية 27–33 (ruling and definition of tajweed) are tagged `intro`.
  - المقطوع والموصول (79–93) and التاءات (94–100) are tagged `waqf-how`, because their practical use is how to stop on those words. A rasm lesson may replace this.
  - الوقف والابتداء (73–78) is tagged `waqf-signs` + `ibtida`.
  - The ترقيق/تفخيم lines 34–40 and 45–49 are tagged `sifat`.
- `variants[].word` is the edition word without its «» or () marks, and a split proclitic is joined to its word (بِـ «هَا» shows as بِهَا).
