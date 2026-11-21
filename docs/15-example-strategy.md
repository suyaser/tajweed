# Example strategy: which words teach each lesson

Date: 2026-11-21. Applies to `content/rules.json` (`examples`) for all 58 lessons. The checks in §6 run as `src/content/examples.check.test.ts`.

## 1. Why
The learner found three problems: steps show examples with no plan (the step picked by list position), the same word turns up in several lessons, and some picks don't teach the rule well (أَحَدٌ at the end of an ayah heard with a sukun, for a tanween; مَٰلِكِ, a natural madd, in the marks lesson). Measured on the old data: 69 hard errors (mostly the same words in two lessons), 12 examples where the tajweed data doesn't see the lesson's rule, 50 core examples carrying rules not taught yet, and almost no examples from the unit's own surahs, which contradicts the course's promise (learning on the surahs being studied).

## 2. Principles, in priority order
1. **Correct for حفص عن عاصم من طريق الشاطبية**, as recited from مصحف المدينة: the rule really applies to the highlighted letters in the way the example is read (joined or stopped). Verified against at least one book (هداية القاري، غاية المريد، الميزان، تحفة الأطفال، الجزرية with their شروح) and the Quran text in `public/data`. When in doubt, leave the word out.
2. **Heard as taught.** The app plays the reciter's words cut from the ayah (default: الحصري المعلّم). The rule must be audible in that recitation:
   - A rule that needs joining (tanween, نون ساكنة across words, صلة، منفصل، التقاء الساكنين…) never sits on the last word of an ayah, and never across a pause sign (ۚ ۖ ۗ ۛ ۘ), where the reciter may stop.
   - A rule about stopping (العارض، القلقلة الكبرى، الروم والإشمام، العوض…) uses the ayah's end, with `stop: true`.
   - If the focus is the ayah's last letter, `stop` must be true and the note describes what is heard at the stop.
3. **One clear target.** The highlight (`focus`) is the smallest stretch of letters that shows the rule (for a rule between two words: the end of the first word and the start of the second). It never cuts a letter from its vowel mark.
4. **Only what's been taught, where possible.** In `anchor`, `hear` and `say` examples, the words should carry no rule from a later lesson that changes the sound the learner copies. A later rule elsewhere in the word that doesn't touch the target is tolerable when no clean word exists; say so in `why`.
5. **The learner's surahs first.** Search in this order and take the first clear word:
   1. the unit's own surahs (`course.json`)
   2. surahs of earlier units
   3. الفاتحة (known to every learner)
   4. the rest of جزء عمّ
   5. anywhere in the Quran, preferring the classical examples in the books (which learners meet again with a teacher)

   Units 8–9 (beyond جزء عمّ, mastery) take the classical examples first.
6. **Cover the rule's cases.** Across a lesson's examples, every condition or sub-case the rule card teaches appears at least once. For example:
   - الإخفاء: in one word and across two words, a heavy-letter and a light-letter case, with nūn and with tanween.
   - المد المتصل: a ا، و and ي.
   - لام الشمسية: several sun letters.

   A `coverage` line in the proposal maps cases to examples.
7. **One word, one lesson.** A word (same ayah and words) is a core example of one lesson only. Sharing is allowed only for a deliberate case (أَحَدٌ for two stop rules) or in `more` with a reason.

## 3. Roles (`role` on each example, in this order in the list)
| Role | Count | Used by | What to pick |
|---|---|---|---|
| `anchor` | 1 | First word of **Hear**; the example the **Learn** card explains; first on the rule card | The single clearest, most typical case. Short (one word, two if the rule is between words), from the unit's surahs. |
| `hear` | 2 | **Hear** (after the anchor) | Clear cases that, with the anchor, show the main variety (different letters or forms). |
| `say` | 3 | **Say** (repeat and record) | New words, short and sayable, covering further cases. Easy to hard. |
| `notice` | 0–1 | **Notice** (when `course.json` gives `contrastWith`) | A word with the rule, plus a `contrast` word from the contrast lesson that has that lesson's rule and **not** this one. Best is a minimal pair (same word or same letters, مَٰلِكِ / مَلِكِ); else two words that differ only in the point being noticed. |
| `more` | 0–4 | Rule card "More examples", Check questions, review | Remaining cases, edge cases, the classical book example if not used above. |

Check questions and review draw from every example of the lesson, so all of them must be as correct as the core ones.

## 4. Notes
Every example has a short `note` saying what to listen for or why it is this rule (≤ 120 characters; Arabic terms in Arabic script) and `noteAr`, the Arabic UI version. The contrast word has its own `note`/`noteAr` (what it has instead).

## 5. Proposal file (one per lesson): `docs/examples/proposals/<lessonId>.json`
```json
{
  "lesson": "ikhfa",
  "coverage": "within a word: #4; across words: #1 #2; tanween: #3 #5; heavy letter: #2; light: #1",
  "notes": "anything a reviewer should know",
  "noticeText": { "en": "Hear step prompt naming this lesson's anchor/hear words", "ar": "…" },
  "examples": [
    { "role": "anchor", "verse": "113:3", "word_from": 2, "word_to": 3, "text": "…", "focus": "…", "stop": false,
      "note": "…", "noteAr": "…", "why": "why this word, which case it covers", "source": "book and page, or 'data only'" },
    { "role": "notice", "…": "…", "contrast": { "lesson": "izhar", "verse": "…", "word_from": 1, "word_to": 2, "text": "…", "focus": "…",
      "note": "…", "noteAr": "…", "why": "…" } }
  ]
}
```
`noticeText` replaces the lesson's `notice` in `course.json` (and its Arabic in `ar.json`). It is required whenever the old prompt names words that are no longer the anchor or hear examples. `text` is copied exactly from `public/data/surah/NNN.json` (`words`, basmala already removed). `word_from`/`word_to` are 1-based.

## 6. Checks (`EXAMPLES_DIR=docs/examples/proposals npx vitest run src/content/examples.check.test.ts`, `REPORT=1` for the full analysis)
- **Errors:**
  - the text isn't the Tanzil words
  - the focus is missing or cuts a mark
  - the focus is on the ayah's last letter without `stop`
  - the same words appear in two core examples of different lessons
  - the role counts or order are wrong
  - a notice example has no valid contrast: it must come from the lesson's `contrastWith`, must not carry the noticed rule, and must not come from a later lesson
  - a note has no `noteAr`
- **Warnings (judge each):**
  - the tajweed data doesn't see the rule in the words
  - the words carry rules not yet taught
  - the span crosses a pause sign
  - fewer than 2 `hear` or 3 `say` examples
  - a missing `why`
- **Info:**
  - the other rules in each example
  - surah and unit fit
  - the share of core examples from the unit's surahs

## 7. Process
1. Five agents propose, one per group of units (0–1, 2–3, 4–6, 8, 9 plus ابتداء/وقف theory), each running the checks until there are no errors and every warning is answered in `why`/`notes`.
2. An independent reviewer per group checks each example against the books and this strategy, and lists defects with severity.
3. The proposer fixes. The reviewer re-checks the fixes.
4. `scripts/merge-examples.mjs` writes `rules.json` and `ar.json`. Then `also.json` is regenerated, the full test suite runs, and the lessons are spot-checked in the app.

Theory lessons with no examples today (ابتداء، علامات الوقف، كيف تقف، المخارج، الصفات، مراتب القراءة) get examples only where a real word clearly shows the point (e.g. a letter's makhraj in a word from the unit). Each one is the reviewer's call to accept.
