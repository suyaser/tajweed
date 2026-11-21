# Teaching strategy: the Learn step explains, the card reminds

Date: 2026-11-21. Applies to `content/teach/<lessonId>.json` (all 58 lessons). Checked by `src/content/teach.check.test.ts`.

## 1. Why
The learner's verdict: the Learn step read like revision. It was too short and too much "to the point", and it assumed knowledge, using terms like غنة and قلقلة without ever explaining them. A beginner would have to search elsewhere. The cause: Learn showed the rule card, which is a summary written for review. Teaching and reminding are different jobs.

From now on, Learn shows the **teaching text** first, then the card as **the summary** ("الخلاصة"). The card stays as it is: short, for review and the Rules tab.

## 2. Who reads it
An adult who reads Arabic with its marks and has never studied tajweed. Most will read the Arabic text, so it must be written as Arabic, not translated from English. The English text is for learners who don't read Arabic well but read the script. Every Arabic term in English text keeps its Arabic script, with a transliteration in `say` on first definition.

The learner arrives at Learn **after** hearing the lesson's examples (Hear) and comparing them (Notice). The text can say "the sound you just heard in أَعُوذُ" and build on it.

## 3. The sections (all required unless marked)
| Section | Field | What it does | Length |
|---|---|---|---|
| In plain words | `plain` | What happens, in everyday words, as if to a friend. No undefined term. | 1–2 sentences |
| New words | `terms` | Every tajweed term this lesson introduces: `term` (Arabic), `say` (transliteration), `en`/`ar` (what it means here), `literal`/`arLiteral` (the everyday sense of the word, when it helps). | as many as the lesson introduces |
| Where it fits | `fits` | What the learner already knows (earlier lessons) and what this adds. For a group, give the map. For example, the first النون الساكنة lesson names the four rulings and the letters that decide them; each later one says "this is the third of the four". | 2–4 sentences |
| What happens | `how` | Steps: what the tongue, lips, throat and nose do, in order, with a sensation the learner can check ("put a finger on your nose: it vibrates"). | 2–5 steps, each ≤ 2 sentences |
| Why | `why` | The reason the rule exists (ease of speech, clarity, keeping meaning, the letters' nature), as the books give it. | 1–3 sentences |
| Spot it in the muṣḥaf | `spot` | How مصحف المدينة shows it (marks: a sukun or no sukun, a shadda on the next letter, staggered or stacked tanween, small م, ٓ, ۜ, a round zero ۟). The app shows the lesson's anchor word below this text. `null` when the muṣḥaf has no sign (then say so in `how`). | 1–3 sentences |
| Common mistakes | `mistakes` | 2–4 pairs, `wrong` then `right`, about sound, not spelling: "Cutting the غنة short in إِنَّ" / "Hold it two full counts". | 2–4 |

Style:
- Short sentences, one idea each.
- No undefined jargon. Explain a term at its first use, or don't use it.
- Never "simply" or "just". No exclamation marks.
- Concrete: name the letters and words, and refer to the examples the learner heard.
- Never claim the app judges recitation. Where the sound is subtle, say "listen to your teacher".

## 4. Terms: defined once, in the lesson that teaches them
A term may be used in a teaching text only if this lesson or an earlier one defines it (the checker enforces this). The card may use a later term, and Learn shows its meaning under "Words from other lessons". Each term is defined in exactly one lesson:

| Lesson | Defines |
|---|---|
| basics | حركة، فتحة، ضمة، كسرة، سكون، شدة، تنوين، حرف مد، مد، همزة، وقف، وصل، مخرج، رواية، حفص |
| istiadha | الاستعاذة، البسملة |
| tabii | المد الطبيعي، لحن جلي |
| arid | المد العارض |
| iwad | العوض |
| tafkhim | تفخيم، ترقيق، استعلاء |
| ibtida | ابتداء، همزة الوصل |
| lam-q | اللام القمرية |
| lam-s | اللام الشمسية |
| lam-jh | لفظ الجلالة |
| ghunnah | غنة، الخيشوم |
| izhar | النون الساكنة، إظهار، حروف الحلق |
| idgh-g | إدغام |
| iqlab | إقلاب |
| ikhfa | إخفاء |
| qal-s | قلقلة |
| sakinayn | التقاء الساكنين |
| muttasil | المد المتصل |
| munfasil | المد المنفصل |
| mithlayn | المثلين |
| m-izhar | الميم الساكنة |
| mutajanisayn | المتجانسين |
| silah-s | صلة، هاء الضمير |
| badal | مد البدل |
| lin | لين |
| lazim-k | المد اللازم |
| mutaqaribayn | المتقاربين |
| rawm-ishmam | روم، إشمام |
| sakt | سكت |
| imalah | إمالة |
| tashil | تسهيل |
| makharij-jawf | الجوف |
| sifat-hams | صفة |

A lesson may add terms that are only its own (هَمس, جهر, القلقلة الكبرى…). The checker refuses a second definition of a term another lesson owns. If a writer needs a term earlier than its owner lesson, they say it in plain words instead.

## 5. Accuracy
Every claim must hold for حفص عن عاصم من طريق الشاطبية and agree with the lesson's card and the books in `docs/04-content-review.md` (هداية القاري، غاية المريد، الميزان، تحفة الأطفال، الجزرية). Where teachers differ (the lips in الإقلاب, the levels of التفخيم, the sound of ض), say so and refer to the teacher, as the card's review notes do. Never invent an anatomical claim. Every `how` step must match the books' description of the مخرج and صفة.

## 6. Process
1. Five writers, one per group of units (0–1, 2–3, 4–6, 8, 9), write `content/teach/<id>.json`. They run `LESSONS=<ids> npx vitest run src/content/teach.check.test.ts` until there are no errors, and at the end `UPDATE_GLOSSARY=1 …` once all files exist.
2. An independent reviewer per group checks accuracy, beginner clarity, Arabic quality and the term rules, with BLOCKER / MAJOR / MINOR findings in `docs/teach/reviews/<group>.md`.
3. The writer fixes; the reviewer re-checks.
4. The whole set is checked together (the glossary, terms in order), then built, browsed in both languages, and deployed.
