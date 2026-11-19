# Content review · rule cards, examples, facts

Date: 2026-11-19. Scope: the `RULES`/`CATS` content of `docs/reference/artifact-v3.html`, reviewed for رواية حفص عن عاصم من طريق الشاطبية and converted into `content/rules.json` (49 lessons, 269 examples, 94 fact questions) and `content/pairs.json` (19 confusable pairs). Every example is checked against the pinned Tanzil Uthmani text by `scripts/check-content.mjs`.

This is an agent review against books (spec §10.1 answer 3). It does **not** replace C1: every card still needs the teacher's review before the learner reaches its phase. `review.status = verified` means "checked against at least two sources and against the muṣḥaf text"; `needs-teacher` means "sources differ, or a point of performance that only a teacher can settle".

## How it was checked

- **Sources actually read** (each lesson's `sources` has the exact locator):
  - متن تحفة الأطفال (Shamela 9632, matn pages)
  - المقدمة الجزرية, ed. عبد المحسن القاسم (Shamela 581)
  - هداية القاري للمرصفي (Shamela 22869; printed volume and page via the OpenITI copy of that Shamela text)
  - غاية المريد لعطية قابل نصر (Shamela 7311)
  - الميزان في أحكام تجويد القرآن (Shamela 38104; written for حفص من الشاطبية)
  - متن الشاطبية (Shamela 7754) and الوافي للقاضي (Shamela 38075)
  - النشر (Shamela 22642)
- **Sources not available online:** هداية المستفيد and الحصري's أحكام قراءة القرآن are not on Shamela, so they are not cited. هداية القاري and الميزان stand in for them.
- **Page numbers in هداية القاري** come from the OpenITI copy's page markers. Spot-check a few against the print edition before you show locators to users.
- **Examples** were found with a script over الفاتحة and جزء عمّ, using the muṣḥaf's own marks (sukun, shadda, madda, the iqlab ميم). Each was then read by hand: the next word, any stop, and whether a different rule takes over. A build step maps each typed highlight onto the exact Tanzil characters; Tanzil writes the shadda before the vowel, so hand-typed highlights never match byte for byte. Out-of-جزء-عمّ verses are used only where جزء عمّ has too few or none: المتجانسين، المتقاربين، اللازم الحرفي, and the word-specific حفص lessons.
- **Tanzil data notes:**
  - The file is CRLF.
  - Ayah 1 of every surah except 1 and 9 starts with the 4-word basmala. In 95:1 and 97:1 its first word is spelled «بِّسْمِ», with a shadda, so the strip compares without the shadda.
  - The text has **no waqf marks** (no ۛ ۜ ۖ). The sakt and تعانق examples cannot highlight the mark itself.

## Corrections to the artifact content

| # | Lesson | What the artifact said | What it says now | Source |
|---|---|---|---|---|
| 1 | idgh-g | Merging rule with no exception for the opening letters | Adds: حفص من الشاطبية reads يسٓ ۝ وَٱلْقُرْءَانِ and نٓ ۚ وَٱلْقَلَمِ with **إظهار** when joined (إدغام there is from الطيبة) | الشاطبية v.281 (7754/29); الوافي 38075/134 |
| 2 | tashil | "The second همزة is softened"; only ءاعجمي shown | Required only in ءَا۬عْجَمِىٌّ (41:44). Adds the 6 places (ءآلذكرين ×2، ءآلآن ×2، ءآلله ×2) where حفص has **الإبدال (6 counts, read first) or التسهيل** | الشاطبية v.192–193; هداية القاري 2/501، 2/578; الميزان 38104/176 |
| 3 | muttasil | "4 or 5 counts · 6 when stopping on the همزة" | 4 (التوسط, read first) or 5. Stopping on a final همزة: after 4 read 4 or 6, after 5 read 5 or 6. Six while joining is الطيبة | هداية القاري 1/284–286; غاية المريد 7311/125 |
| 4 | munfasil, muttasil | "المتصل must never be shorter than المنفصل" | In this route the two are read **equal**: 4 with 4, or 5 with 5. القصر of المنفصل is الطيبة | غاية المريد 7311/125، 7311/147; النشر 1/351 |
| 5 | ibtida | فتحة with ال; ضمة if the verb's third letter has ضمة; else كسرة | Adds: a ضمة on the third letter that is **not original** gives كسرة (ٱمْشُوا۟، ٱقْضُوا۟، ٱئْتُوا۟، ٱبْنُوا۟), plus the seven nouns | هداية القاري 2/480–488; الميزان 38104/223; الجزرية vv.101–103 |
| 6 | silah-s | Exceptions: يرضه لكم short, فيه مهانا long | Adds أَرْجِهْ (7:111، 26:36) and فَأَلْقِهْ (27:28) with سكون, and وَيَتَّقْهِ (24:52, ق ساكنة so no صلة). "Short" made precise: short ضمة, no صلة | غاية المريد 7311/271–272; هداية القاري 1/359–360 |
| 7 | sakt | "Four places in حفص" | Four, when joining, in طريق الشاطبية. Adds the optional ones: مَالِيَهْ ۜ هَلَكَ (سكت read first, or إدغام), and الأنفال→التوبة (الوقف، السكت، الوصل, without البسملة). Notes the general سكت (ال، شيء، ساكن before همزة) is الطيبة | الشاطبية vv.830–831; غاية المريد 7311/292; هداية القاري 1/237; الوافي 38075/48 |
| 8 | iqlab, m-ikhfa | "Close the lips gently… don't leave a gap" | States both الإطباق and الفرجة and tells the learner to follow the teacher (a modern difference in performance, not a route matter) | هداية القاري 1/183; غاية المريد 7311/79 |
| 9 | ishmam | الإشمام as the way, "can also be read with الروم" | Both ways from الشاطبية; هداية القاري reads الاختلاس first | الشاطبية vv.773–774; هداية القاري 1/261 |
| 10 | mutaqaribayn | ق ← ك merges (no detail) | أَلَمْ نَخْلُقكُّم: الإدغام الكامل read first, الناقص also correct | الميزان 38104/135; هداية القاري 1/255; النشر 1/221 |
| 11 | idgh-n | "with no غنة" | Same, marked as the الشاطبية way (with غنة is الطيبة) | الشاطبية v.286 via الوافي 38075/136; هداية القاري 1/287 |
| 12 | lin | No link to العارض | When both come in one recitation, اللين may not be longer than العارض (6 allowed combinations listed) | غاية المريد 7311/152–153; هداية القاري 1/351 |
| 13 | ra-l | "Both ways in فِرْقٍ. When stopping مصر heavy, القطر light" | فِرْقٍ: both, light read first; مصر both (heavy preferred), القطر both (light preferred); adds يَسْرِ، وَنُذُرِ، أَسْرِ (both on a stop, light preferred) | هداية القاري 1/122–132; الميزان 38104/100–101; النشر 2/103 |
| 14 | ra-h, ra-l | Three heavy cases, three light cases | Adds the stop cases: after a ساكن that follows فتحة/ضمة (heavy: وَٱلْفَجْرْ، خُسْرْ), or follows كسرة (light: حِجْرْ، ٱلذِّكْرْ), and right after كسرة (light). The heavy letter after كسرة must be in the same word and not مكسور | الجزرية vv.41–43; هداية القاري 1/122–132; الميزان 38104/100 |
| 15 | lam-jh | "after فتحة or ضمة" | Adds starting from the name: the همزة الوصل has فتحة, so the ل is heavy | هداية القاري 1/119 |
| 16 | qal-k | "Strongest when that letter has شدة" (as fact) | "Many teachers count a third, strongest level…" — one view, not agreed | الميزان 38104/75; هداية القاري 1/85–86 |
| 17 | izhar | "Say the نون… clearly, with no غنة" | "…without holding a غنة": the نون keeps the غنة it always has | هداية القاري 1/180–183 |
| 18 | tashil (tip) | ضَعْف (30:54) "may be read with فتحة or ضمة" | Same, فتحة read first | الشاطبية v.723; هداية القاري 2/577 |
| 19 | lazim-h | "ع may be 4 or 6" | 4 or 6, **6 preferred** (الشاطبية «والطول فضلا»; تحفة «والطول أخص») | الشاطبية v.177 (7754/21); تحفة 9632/8; الوافي 38075/79 |
| 20 | lazim-k | آلْآنَ is مخفف | Same, noted as its first way (الإبدال); its other way is التسهيل | الشاطبية vv.192–193 |
| 21 | mithlayn | Exception for حرف مد only | Adds: a لين letter does merge (أَو وَّزَنُوهُمْ); مَالِيَهْ هَلَكَ cross-reference | الميزان 38104/129; هداية القاري 1/235–236 |
| 22 | waqf-signs | Example "لَا رَيْبَ ۛ فِيهِ ۛ" with the dots highlighted | The Tanzil text has no waqf marks, so the example cannot be highlighted; this is now a fact lesson (7 questions). Adds the رأس آية note (stopping there is سنة; some disagree when لا is printed) | الميزان 38104/194–204; هداية القاري 1/368 |
| 23 | waqf-how | Three stop changes + الروم/الإشمام | Adds: a ت written open (رَحْمَتَ) stays ت ساكنة in حفص | هداية القاري 2/462; الميزان 38104/208–210 |
| 24 | makharij | "17 points in 5 areas" | 17 in the view of الخليل/ابن الجزري; سيبويه 16, الفراء 14 | النشر 1/198; غاية المريد 7311/76; الجزرية v.9 |
| 25 | munfasil (example) | `{يَا أَ}يُّهَا` 2:21 as a two-word منفصل | The muṣḥaf writes يَٰٓأَيُّهَا as one word; kept, with a note that يا is its own word | Tanzil 2:21 |
| 26 | makharij, sifat | Two summary cards | Split into 11 lessons (C2) with definitions, letters and 6–7 fact questions each | الجزرية vv.9–26; هداية القاري 1/61–86 |

Conversion-only changes, not counted as corrections:
- All 84 hand-typed artifact examples were re-anchored to Tanzil word ranges.
- 2:27 «يَقْطَعُونَ» is «وَيَقْطَعُونَ» in the muṣḥaf.
- Examples that highlighted two places (2:28 ثُمَّ…ثُمَّ, 114:6, 1:3) now keep one highlight.

All other artifact verse references were correct.

## C6 resolutions

| C6 item | Resolution | Source |
|---|---|---|
| السكت places | 4 required (when joining) from الشاطبية; optional: مَالِيَهْ هَلَكَ (سكت first, or إدغام) and الأنفال→التوبة (وقف، سكت، وصل). Both optional ones are now on the card and in the examples (69:28, 8:75). The general سكت is الطيبة only | الشاطبية vv.830–831; غاية المريد 7311/292; هداية القاري 1/237، 1/287–288 |
| ر words with both readings | فِرْقٍ: both, ترقيق first. If you stop on مِصْرَ: both, heavy preferred. ٱلْقِطْرِ: both, light preferred. يَسْرِ، وَنُذُرِ، أَنْ أَسْرِ، فَأَسْرِ: both on a stop, light preferred. **Open:** فِرْقٍ on a stop (see needs-teacher) | هداية القاري 1/123–130; الميزان 38104/100–101; النشر 2/103 |
| ع in كهيعص / حم عسق | 4 or 6, 6 preferred. Two counts (القصر) is الطيبة | الشاطبية v.177; تحفة 9632/8; الوافي 38075/79 |
| Lengths of العارض and اللين, consistency | Both 2/4/6. Keep one length for like cases (التسوية, «واللفظ في نظيره كمثله»). اللين may not exceed العارض | الجزرية v.31; غاية المريد 7311/146، 7311/152–153 |
| المنفصل 4 or 5 من الشاطبية | Confirmed: 4 (read first) or 5; القصر is الطيبة. It is read equal to المتصل in this route | هداية القاري 1/284–286; غاية المريد 7311/125–127 |
| Own lesson for الإظهار المطلق? | **No separate lesson.** It is four words (دنيا، بنيان، صنوان، قنوان), the condition is on the الإدغام بغنة card, and it is a confusable pair (`idgh-g` / `izhar`) in `pairs.json`. Revisit if the teacher wants it drilled on its own | تحفة 9632/3; غاية المريد 7311/74; الوافي 38075/136 |

## Left as needs-teacher

| Lesson | Why |
|---|---|
| iqlab, m-ikhfa | الإطباق vs الفرجة for the lips. A modern difference in performance; no book source for الفرجة was found (only forum reports). The card says "follow your teacher". |
| ra-l | فِرْقٍ when stopping: هداية القاري allows both readings in وصل and وقف; الميزان says the stop is heavy by agreement. The preferences on the other words are sourced, but the teacher should confirm what the learner reads. |
| mutaqaribayn | نخلقكم: the books read give الكامل and الناقص with الكامل first. A forum تحرير says only الكامل from الشاطبية. |
| ishmam | Which way to drill first in تأمنا: هداية القاري puts الاختلاس first; many teachers start with الإشمام. |
| qal-k | Whether to teach a third level (stopped مشدد). It is one view; د. أيمن سويد has a reservation. |
| waqf-signs | The sign meanings rest on secondary sources (الميزان، مساعد الطيار); the مصحف المدينة end notes were not read directly. Also, stopping at a رأس آية marked لا is a scholarly difference. |

Other open points:
- Spot-check the هداية القاري page numbers against print (see "How it was checked").
- Word-specific حفص words not covered as lessons (candidates for later): نُۨجِى (21:88), يَبْصُۜطُ / بَصْۜطَةً, ٱلْمُصَۣيْطِرُونَ / بِمُصَيْطِرٍ.

## Example and fact counts per lesson

Identify lessons need ≥ 6 examples. Fact lessons need ≥ 6 facts. Word-specific حفص lessons (`exhaustive: true`) list every occurrence instead. السكت has the 4 required places plus the 2 optional ones; الإمالة and الإشمام have one word each; التسهيل has the required word plus the 6 second-way places.

| id | lesson | phase | examples | facts | review |
|---|---|---|---|---|---|
| ibtida | الابتداء وهمزة الوصل | 1 | 0 | 7 | verified |
| makharij-jawf | الجوف | 2 | 0 | 6 | verified |
| makharij-halq | الحلق | 2 | 0 | 7 | verified |
| makharij-aqsa | أقصى اللسان | 2 | 0 | 6 | verified |
| makharij-wasat | وسط اللسان وحافته | 2 | 0 | 6 | verified |
| makharij-taraf | طرف اللسان | 2 | 0 | 6 | verified |
| makharij-shafatan | الشفتان والخيشوم | 2 | 0 | 7 | verified |
| sifat-hams | الهمس والجهر | 2 | 0 | 6 | verified |
| sifat-shidda | الشدة والتوسط والرخاوة | 2 | 0 | 7 | verified |
| sifat-istila | الاستعلاء والإطباق | 2 | 0 | 7 | verified |
| sifat-safir | الصفير والقلقلة واللين | 2 | 0 | 7 | verified |
| sifat-inhiraf | الانحراف والتكرير والتفشي والاستطالة | 2 | 0 | 7 | verified |
| izhar | الإظهار الحلقي | 3 | 10 | 0 | verified |
| idgh-g | الإدغام بغنة | 3 | 9 | 0 | verified |
| idgh-n | الإدغام بلا غنة | 3 | 9 | 0 | verified |
| iqlab | الإقلاب | 3 | 9 | 0 | needs-teacher |
| ikhfa | الإخفاء الحقيقي | 3 | 10 | 0 | verified |
| m-ikhfa | الإخفاء الشفوي | 3 | 8 | 0 | needs-teacher |
| m-idgham | الإدغام الشفوي | 3 | 8 | 0 | verified |
| m-izhar | الإظهار الشفوي | 3 | 9 | 0 | verified |
| ghunnah | الغنة المشددة | 3 | 8 | 0 | verified |
| lam-q | اللام القمرية | 3 | 8 | 0 | verified |
| lam-s | اللام الشمسية | 3 | 9 | 0 | verified |
| lam-jh | تفخيم لام لفظ الجلالة | 3 | 8 | 0 | verified |
| lam-jl | ترقيق لام لفظ الجلالة | 3 | 6 | 0 | verified |
| ra-h | تفخيم الراء | 4 | 10 | 0 | verified |
| ra-l | ترقيق الراء | 4 | 9 | 0 | needs-teacher |
| qal-s | القلقلة الصغرى | 4 | 8 | 0 | verified |
| qal-k | القلقلة الكبرى | 4 | 8 | 0 | needs-teacher |
| tabii | المد الطبيعي | 4 | 8 | 0 | verified |
| iwad | مد العوض | 4 | 7 | 0 | verified |
| silah-s | مد الصلة الصغرى | 4 | 7 | 0 | verified |
| badal | مد البدل | 4 | 8 | 0 | verified |
| muttasil | المد الواجب المتصل | 4 | 8 | 0 | verified |
| munfasil | المد الجائز المنفصل | 4 | 8 | 0 | verified |
| silah-k | مد الصلة الكبرى | 4 | 7 | 0 | verified |
| arid | المد العارض للسكون | 4 | 8 | 0 | verified |
| lin | مد اللين | 4 | 7 | 0 | verified |
| lazim-k | المد اللازم الكلمي | 4 | 8 | 0 | verified |
| lazim-h | المد اللازم الحرفي | 4 | 8 | 0 | verified |
| mithlayn | إدغام المثلين | 5 | 7 | 0 | verified |
| mutajanisayn | إدغام المتجانسين | 5 | 10 | 0 | verified |
| mutaqaribayn | إدغام المتقاربين | 5 | 7 | 0 | needs-teacher |
| waqf-signs | علامات الوقف | 5 | 0 | 7 | needs-teacher |
| waqf-how | كيفية الوقف | 5 | 0 | 8 | verified |
| sakt | السكت | 5 | 6 | 0 | verified |
| imalah | الإمالة | 5 | 1 | 0 | verified |
| ishmam | الإشمام | 5 | 1 | 0 | needs-teacher |
| tashil | التسهيل | 5 | 7 | 0 | verified |

Totals: 49 lessons · 269 examples · 94 facts · 19 confusable pairs.

## Re-running the check

```
curl -sSL -o /tmp/quran-uthmani.txt https://github.com/cpfair/quran-tajweed/files/7281388/quran-uthmani.txt
node scripts/check-content.mjs /tmp/quran-uthmani.txt
```
