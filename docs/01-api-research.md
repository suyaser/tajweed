# 01 · Data sources research (text, tajweed markup, audio, timings, mutun)

Status: research, verified 2026-11-19 with live `curl` calls (Origin header `https://example.vercel.app`). Every claim lists the URL it was checked at.

## TL;DR

The official Quran Foundation (QF) Content API now needs OAuth2 client credentials that must live on a backend. The old unauthenticated `api.quran.com/api/v4` still answers with `Access-Control-Allow-Origin: *` and no key. But QF's Developer Terms do not allow build-time bundles of QF content, or caching it for more than 1 week. So a static app should **bundle open-licensed data at build time** and use QF only as an optional runtime extra.

## Recommendation

| Need | Use | Licence | How |
|---|---|---|---|
| Quran text (Hafs, Uthmani) | Tanzil Uthmani text, the 2017 copy pinned by cpfair | Verbatim copy only, credit + link to tanzil.net | Bundle at build time (split per surah) |
| Tajweed markup | **cpfair/quran-tajweed** annotations (character offsets into that text) | CC BY 4.0 | Bundle; convert to spans at build time |
| Ayah audio | **everyayah.com** files (the same files QF serves) | No published terms (see Unverified) | Stream at runtime with `<audio>`; service worker caches recently played files |
| Word timings (highlighting) | **cpfair/quran-align** release data | CC BY 4.0 (code MIT) | Bundle per reciter; these are the **same numbers** QF returns |
| Word audio | Play a slice of the ayah file using the timings (same reciter) | as above | `audio.currentTime = start/1000`, stop at `end` |
| Mutun | Shamela: Tuhfa = book 9632 (with al-Dabbāʿ's notes); Jazariyya = book 581 (critical edition by ʿAbd al-Muḥsin al-Qāsim) | Matn is public domain; the edition's vowelling belongs to its editor | Copy by hand, check line by line, cite the edition |
| Optional runtime extra | `api.quran.com/api/v4` (no key) | QF Developer Terms | Never bundle; cache for 1 week at most; show "Quran data provided by Quran.Foundation" |

Fallback for tajweed markup: alquran.cloud `quran-tajweed` edition. It is free, needs no key, and its terms allow storing the text ("use, store and show the text freely").

## 1. Tajweed markup

### 1a. Quran.com / QF `text_uthmani_tajweed`

- Endpoint (no key, works today): `https://api.quran.com/api/v4/quran/verses/uthmani_tajweed?chapter_number=1`. Same field via `GET /api/v4/verses/by_chapter/1?fields=text_uthmani_tajweed`. The mirror `https://api.qurancdn.com/api/qdc/verses/by_chapter/1?fields=text_uthmani_tajweed` also works.
- CORS: `access-control-allow-origin: *`, methods GET/POST/OPTIONS/HEAD, max-age 7200 (checked on all three URLs above).
- Official status: QF calls this "the older unauthenticated API". The new base is `https://apis.quran.foundation/content/api/v4/...` with OAuth2 Client Credentials and the headers `x-auth-token` and `x-client-id`. A call with no headers returns HTTP 400 `missing required headers`.
  - Source: https://api-docs.quran.foundation/docs/quickstart/migration
  - Live check: `curl https://apis.quran.foundation/content/api/v4/chapters`
- QF docs on browsers: "A browser or mobile app must not embed a Content API client_secret … call your own backend". New frontend apps get **no** Content scope. Pre-live credentials only include surahs 1–2. (https://api-docs.quran.foundation/docs/quickstart)
- Format: `<tajweed class=NAME>…</tajweed>`, plus `<span class=end>١</span>` for the ayah number. Attributes are unquoted, so parse with `DOMParser` or a regex.

Classes actually seen. In 1, 112, 113, 114: `ham_wasl, laam_shamsiyah, madda_normal, madda_permissible, madda_necessary, ghunnah, qalaqah, ikhafa, idgham_wo_ghunnah`. In the whole Quran (one call, 4 MB):

| class | count | meaning (checked against real verses) |
|---|---|---|
| `ham_wasl` | 13252 | همزة الوصل (silent in connected reading) |
| `laam_shamsiyah` | 2608 | اللام الشمسية (لام أل assimilated) |
| `slnt` | 4159 | silent letter (e.g. ألف after واو الجماعة كفروا, وْ in أولئك) |
| `madda_normal` | 9028 | مد طبيعي 2, also صلة صغرى (هُۥ) |
| `madda_permissible` | 4543 | مد عارض للسكون at verse end (الرحيم) **and** مد اللين when stopping (خوْف 106:4) |
| `madda_obligatory` | 5166 | 4–5 counts: **both** متصل (السماء 2:19) **and** منفصل (بمآ أنزل 2:4), also صلة كبرى (عنده إلا 2:255) |
| `madda_necessary` | 143 | مد لازم 6 (الضّالين 1:7, الم 2:1) |
| `ghunnah` | 4923 | النون والميم المشددتان (إنّ، ثمّ، الناس) |
| `ikhafa` | 5291 | إخفاء حقيقي (نون ساكنة/تنوين) |
| `ikhafa_shafawi` | 496 | إخفاء شفوي (م before ب) |
| `iqlab` | 562 | إقلاب |
| `idgham_ghunnah` | 3933 | إدغام بغنة (ينمو), across words |
| `idgham_wo_ghunnah` | 1036 | إدغام بلا غنة (ل، ر) |
| `idgham_shafawi` | 832 | إدغام مثلين صغير للميم (هم مّن) |
| `idgham_mutajanisayn` | 58 | e.g. يلهث ذلك 7:176, اركب معنا 11:42 (marks the first letter only) |
| `idgham_mutaqaribayn` | 13 | e.g. وقل ربّ 17:80, نخلقكّم 77:20 |
| `qalaqah` | 3834 | قلقلة, including at verse end (أحد 112:1) |

What the markup does **not** distinguish (checked by reading the verses above):

- إدغام بغنة vs بلا غنة: **is** distinguished.
- Madd: متصل and منفصل are **merged** into `madda_obligatory`. عارض and لين are **merged** into `madda_permissible`. **مد البدل is not marked** (ءامنهم 106:4 has no tag). There is no مد العوض. صلة is folded into normal/obligatory.
- **Not marked at all**: تفخيم/ترقيق الراء, تفخيم حروف الاستعلاء, لام لفظ الجلالة, الإظهار (حلقي، شفوي، قمري — it is shown only by the absence of a tag), the four سكتات of Hafs, روم/إشمام, تسهيل (ءأعجمي), and قلقلة صغرى vs كبرى.
- إدغام المثلين for letters other than م is not marked (اضرب بّعصاك 2:60 has no tag).
- The alquran.cloud colour guide swaps the Arabic names: it calls `madda_necessary` "مد واجب" and `madda_obligatory` "مد لازم". The data shows the opposite (https://alquran.cloud/tajweed-guide). Use our own labels.

### 1b. cpfair/quran-tajweed (recommended for bundling)

- https://github.com/cpfair/quran-tajweed. Last push 2021, "not actively maintained". Data is CC BY 4.0 (per README).
- Data file: `https://raw.githubusercontent.com/cpfair/quran-tajweed/master/output/tajweed.hafs.uthmani-pause-sajdah.json` (5.6 MB, CORS `*`). Shape: `[{surah, ayah, annotations:[{rule,start,end}]}]`, with code-point offsets into the pinned Tanzil text `https://github.com/cpfair/quran-tajweed/files/7281388/quran-uthmani.txt`.
- Rules seen (whole Quran): `hamzat_wasl 13252, madd_2 9028, ikhfa 5301, ghunnah 4946, madd_246 4543, silent 4174, idghaam_ghunnah 3933, qalqalah 3834, madd_munfasil 3172, lam_shamsiyyah 2733, madd_muttasil 1997, idghaam_no_ghunnah 1035, idghaam_shafawi 832, iqlab 562, ikhfa_shafawi 496, madd_6 148, idghaam_mutajanisayn 58, idghaam_mutaqaribayn 13`.
- These counts are the same as Quran.com's (13252, 9028, 4543, 3933, 3834, …), and munfasil + muttasil (5169) ≈ `madda_obligatory` (5166). Quran.com's markup is clearly this dataset with the two madds merged. **cpfair keeps متصل and منفصل separate**, which suits teaching better.
- It has the same gaps as above: no راء, no تفخيم, no بدل, and عارض and لين are merged as `madd_246`.
- Gotcha: the pinned text puts the basmala at the start of ayah 1 of every surah except 1 and 9 (e.g. 112:1 = "بِسْمِ … قُلْ هُوَ"). Strip it at build time and shift the offsets, so the word indices match quran-align.

### 1c. alquran.cloud `quran-tajweed` (fallback)

- `https://api.alquran.cloud/v1/surah/112/quran-tajweed`: 200, CORS `*`, no key.
- Compact markup `[h:8078[ٱ]`, `[q[د]`, `[l[ل]`, `[u:2596[ُن ل]`, `[n[ۥ]` (letter code → class, see https://alquran.cloud/tajweed-guide). It uses the same 17 rules as Quran.com.
- Terms (https://alquran.cloud/terms-and-conditions, updated 13 Nov 2026): free, no key, "You may use, store and show the text freely. Keep it exactly as it is"; there is a soft per-IP rate limit; recitations are free "for personal and educational use".

### 1d. Tanzil (plain text)

- https://tanzil.net/download/: "Permission is granted to copy and distribute verbatim copies … changing the text is not allowed … source (Tanzil Project) is clearly indicated, and a link is made to tanzil.net". Latest version 1.1 (Feb 2021).
- No tajweed markup. The download endpoint sends no CORS header, so fetch it at build time only.

## 2. Ayah audio

All file hosts below return `access-control-allow-origin: *` and `206` on Range requests, with `audio/mpeg` MP3 files. Hot-linking works. Even without CORS, a plain `<audio src>` would play; CORS only matters for `fetch` / Web Audio / service-worker caching.

| Reciter | QF recitation id | Pattern (verified example) |
|---|---|---|
| الحصري مرتل 64k | 6 | `https://everyayah.com/data/Husary_64kbps/001002.mp3` (= `https://mirrors.quranicaudio.com/everyayah/Husary_64kbps/001002.mp3`, which QF returns) |
| الحصري مرتل 128k | – | `https://everyayah.com/data/Husary_128kbps/SSSAAA.mp3` (listed on https://everyayah.com/recitations_ayat.html) |
| **الحصري المعلم** 128k | 12 (style "Muallim") | `https://everyayah.com/data/Husary_Muallim_128kbps/001002.mp3` |
| المنشاوي مرتل 128k | 9 | `https://everyayah.com/data/Minshawy_Murattal_128kbps/001001.mp3` (byte-identical size to QF's `https://verses.quran.com/Minshawi/Murattal/mp3/001001.mp3`) |
| المنشاوي مجود | 8 | `https://everyayah.com/data/Minshawy_Mujawwad_192kbps/…`, QF `Minshawi/Mujawwad/mp3/…` |

- Pattern: `SSSAAA.mp3`, 3-digit surah + 3-digit ayah.
- QF list of recitations: `https://api.quran.com/api/v4/resources/recitations`. Ayah files: `https://api.quran.com/api/v4/recitations/{id}/by_chapter/{ch}`. Some returned URLs are relative (`Minshawi/Murattal/mp3/001001.mp3`) and resolve against `https://verses.quran.com/` or `https://audio.qurancdn.com/`.
- Whole-surah files with verse and word timings (QF): `https://api.quran.com/api/qdc/audio/reciters/6/audio_files?chapter=112&segments=true` returns `https://download.quranicaudio.com/qdc/khalil_al_husary/murattal/112.mp3` (CORS `*`). It also works for reciter 12 (`…/muallim/112.mp3`) and 9 (`…/siddiq_minshawi/murattal/112.mp3`).
- alquran.cloud audio: `https://cdn.islamic.network/quran/audio/128/ar.husary/6222.mp3` (global ayah number). Editions: `ar.husary`, `ar.husarymujawwad`, `ar.minshawi`, `ar.minshawimujawwad`. This host sends **no** CORS header, so it is fine for `<audio>` but cannot be cached by a service worker with `fetch` (except as opaque responses).

## 3. Word timings and word audio

- **QF segments** (no key today): `https://api.quran.com/api/v4/recitations/6/by_chapter/1?fields=segments` gives `segments: [[w0, w1, startMs, endMs], …]` per ayah file. `w0` is the 0-based start word and `w1` is exclusive. Evidence: Minshawi Mujawwad 1:1 has `[2,4,…]`, one segment covering two words. Available for ids 6, 12, 9, 8.
- **cpfair/quran-align** (https://github.com/cpfair/quran-align, release `release-2016-11-24`): zip at `https://github.com/cpfair/quran-align/releases/download/release-2016-11-24/quran-align-data-2016-11-24.zip`. It contains `Husary_64kbps.json`, `Husary_Muallim_128kbps.json`, `Minshawy_Murattal_128kbps.json`, `Minshawy_Mujawwad_192kbps.json` and 8 others, about 2.3 MB each, 6236 ayat each. Data is CC BY 4.0.
  - **Its values are identical to QF's segments** (checked: Husary 1:1, 1:2 and Muallim 1:1, 1:2 match exactly).
  - Words are Tanzil Uthmani split on spaces, with no basmala.
  - Accuracy per its README: average error <73 ms, and 98.5–99.9% of words segmented.
- **Word audio files (QF)**: `https://api.quran.com/api/v4/verses/by_key/112:1?words=true` gives `audio_url: "wbw/112_001_001.mp3"`, which resolves to `https://audio.qurancdn.com/wbw/112_001_001.mp3` (also on `verses.quran.com`), MP3, CORS `*`. Only one voice is available, whatever reciter is chosen.
- Recommendation: for "hear this word", play the slice of the chosen reciter's ayah file. You get the same voice the learner is studying, with no extra files and no QF dependency.

## 4. Fallbacks if QF is locked down

| Source | Provides | CORS | Key | Terms |
|---|---|---|---|---|
| everyayah.com `/data/{folder}/SSSAAA.mp3` | Ayah MP3s; Husary, Husary Muallim, Minshawy | `*` | none | none published (see Unverified) |
| cpfair/quran-tajweed | Tajweed offsets | raw.githubusercontent `*` | none | CC BY 4.0 |
| cpfair/quran-align | Word timings for everyayah files | GitHub release (build time) | none | CC BY 4.0 |
| alquran.cloud | Text, `quran-tajweed`, audio editions | API `*`; audio CDN none | none | Free; store text verbatim; audio for personal/educational use |
| Tanzil | Text | none (build time) | none | Verbatim, credit + link |

## 5. Terms for non-commercial personal use

- **QF Developer Terms** (https://api-docs.quran.foundation/legal/developer-terms/, summarised in https://api-docs.quran.foundation/docs/tutorials/faq/):
  - "QF Content" includes text, metadata **and audio**.
  - Do not "cache or store QF Content longer than 1 week" unless it comes through Content Sync, which needs credentials.
  - Content Sync "does not itself authorize distributing a prepackaged database or build-time bundle of QF Content". Only fonts and muṣḥaf images may be bundled.
  - Attribution: "Quran data provided by Quran.Foundation", plus the reciter's name.
  - **Effect on us**: do not bundle QF responses, and set the service-worker cache for QF URLs to at most 7 days.
- **Tanzil**: verbatim copies only, with credit and a link (https://tanzil.net/download/).
- **cpfair data**: CC BY 4.0. Credit "Collin Fair, quran-tajweed / quran-align".
- **alquran.cloud**: text may be stored freely; recitations remain the reciters' copyright and may be streamed and downloaded "for personal and educational use" (https://alquran.cloud/terms-and-conditions).
- Put all credits on an About/Credits screen.

## 6. Mutun

### تحفة الأطفال: https://shamela.ws/book/9632

Fully vowelled, with notes by الشيخ علي محمد الضباع (شيخ عموم المقارئ المصرية), paged like the print edition. 61 lines (the closing line says "أبياته ندٌّ بدا", which is 61 in abjad numbering; I counted 61).

| Lines | Topic | Page |
|---|---|---|
| 1–5 | مقدمة | /book/9632/2 |
| 6–16 | النون الساكنة والتنوين: 6 overview, 7–8 إظهار, 9–12 إدغام (بغنة/بلا غنة, دنيا صنوان), 13 إقلاب, 14–16 إخفاء | /2–/3 |
| 17 | النون والميم المشددتان (غنة) | /4 |
| 18–23 | الميم الساكنة: إخفاء شفوي, إدغام صغير, إظهار شفوي, واحذر لدى واو وفا | /4 |
| 24–29 | لام أل (قمرية/شمسية) and لام الفعل | /5 |
| 30–34 | المثلان والمتقاربان والمتجانسان (صغير/كبير) | /5–/6 |
| 35–41 | أقسام المد: أصلي/فرعي, حروف المد, اللين | /6 |
| 42–47 | أحكام المد: واجب متصل 43, جائز منفصل 44, عارض 45, بدل 46, لازم 47 | /7 |
| 48–57 | أقسام المد اللازم: كلمي/حرفي, مثقل/مخفف, فواتح السور (كم عسل نقص، حي طاهر) | /7–/8 |
| 58–61 | الخاتمة | /8 |

### المقدمة الجزرية: https://shamela.ws/book/581

Critical edition by د. عبد المحسن بن محمد القاسم, 2nd ed. 1441/2020. It is checked against two manuscripts that were read to the author and carry his handwriting, plus other copies. It has **107 numbered lines** (رجز), with variant readings in the footnotes. The main text runs over pages /51–/95.

| Lines | Topic | Page |
|---|---|---|
| 1–8 | مقدمة الناظم | /51–/53 |
| 9–19 | مخارج الحروف | /54–/56 |
| 20–26 | صفات الحروف | /57–/59 |
| 27–33 | التجويد (حكمه وتعريفه) | /60–/61 |
| 34–40 | الترقيقات (المستفل، الهمز، اللام، الباء، الجيم، القلقلة 39، الحاء والسين) | /62–/65 |
| 41–43 | الراءات | /66 |
| 44 | لام لفظ الجلالة | /67 |
| 45–51 | التحذيرات: استعلاء، إطباق، سكون، شدة; إدغام المثلين والمتجانسين 50–51 | /68–/69 |
| 52–59 | الضاد والظاء (الظاءات) | /70–/73 |
| 60–61 | التحذيرات: تلاقي الضاد والظاء ونحوه | /74 |
| 62 | غنة النون والميم المشددتين | /74 |
| 63–64 | الميم الساكنة | /75 |
| 65–68 | النون الساكنة والتنوين | /76–/77 |
| 69–72 | المدود (لازم، واجب، جائز) | /78 |
| 73–78 | الوقف والابتداء | /79–/81 |
| 79–93 | المقطوع والموصول | /82–/87 |
| 94–100 | هاء التأنيث المرسومة تاءً | /88–/92 |
| 101–103 | همزات الوصل | /93 |
| 104–105 | الوقف على أواخر الكلم (روم وإشمام) | /94 |
| 106–107 | خاتمة | /95 |

Editions differ in wording and in line count. Example: al-Qāsim reads «مَنْ لَمْ يُصَحِّحِ القُرَانَ آثِمُ» in line 27; many editions read «يُجَوِّدِ» (footnote on /book/581/60). Pick one edition per matn and cite it in the UI.

Arabic Wikisource has both mutun (https://ar.wikisource.org/wiki/تحفة_الأطفال, https://ar.wikisource.org/wiki/الجزرية), but its Jazariyya has no vowels and the Tuhfa is a Word-HTML table. **Not recommended.**

Another Jazariyya edition, from Dar al-Mughni (1422/2001): https://shamela.ws/book/12093.

## Risks

1. **`api.quran.com/api/v4` may be switched off** at any time. QF already labels it legacy. Mitigation: nothing in the core flows depends on it.
2. **QF terms vs offline PWA**: QF audio counts as QF Content. The everyayah.com copies are the same files, but they are not clearly licensed (see Unverified). Keep the service-worker audio cache short (7 days) and small.
3. **Text and offset alignment**: the cpfair offsets only fit the pinned 2017 Tanzil copy, which includes the basmala. quran-align word indices fit the same text without the basmala. Add a Vitest check that word counts per ayah match between text and timings for all 6236 ayat.
4. **Markup gaps**: راء, تفخيم, بدل, سكتات and others are not machine-marked. Those lessons need hand-picked examples from the artifact, not auto-highlighting.
5. **Bundle size**: tajweed JSON is 5.6 MB, text 1.4 MB, timings about 2.3 MB per reciter. Split per surah and lazy-load.
6. **Edition copyright**: Shamela texts carry the editors' vowelling. Fine for personal study; credit the edition.

## Unverified

- everyayah.com terms of use: none found on https://everyayah.com/ or the recitations page.
- Which reciter voiced QF's `wbw/*.mp3` files: not stated in the API response, and I did not find it in the docs.
- The full letter → class table for alquran.cloud's compact codes. Only `h, q, l, u, n` were seen in the sample; the full table is in the islamic-network tools repo linked from https://alquran.cloud/tajweed-guide.
- Whether QF's legacy API has a published shutdown date (none found on the migration page).
- The rate limits of api.quran.com (no rate-limit headers were seen).
- The ~1% of words where quran-align could not segment were not measured for الحصري المعلم in particular.
