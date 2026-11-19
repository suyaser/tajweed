# Tajweed Path v2: a self-contained course

Agreed with the learner on 2026-11-20 (see the conversation summary in `07-decision-log.md`, rows 18 on). v2 turns the app from a companion to an outside plan into the course itself. Everything in v1 that still fits (review cycle, player, recording, rule cards, mind map, teacher log, offline, style B) stays.

## 1. Principles
- **Practical first.** Every lesson starts by hearing and saying real Quran words; the rule's name and definition come after. Theory questions are the review layer.
- **Real surahs.** Units follow the learner's YouTube course (المهندس علاء حامد): الناس back towards الضحى, الفاتحة as the capstone, then beyond جزء عمّ. Each lesson closes on a real passage that contains only rules already learned.
- **Honest.** The app never grades recitation. "Say it" and closing passages are self-checked against the reciter; a teacher is optional.
- **Learn in a block, review mixed.** New rules are introduced one at a time; review interleaves all learned rules (and confusable pairs).

## 2. Course map (content/course.json)
58 lessons in units 0–9 (49 from v1 + 9 new: `basics`, `istiadha`, `tafkhim`, `sakinayn`, `silent-letters`, `aqwa-maddayn`, `dad-zha`, `rawm-ishmam`, `maratib`).

Current order (generated from `content/course.json`; it changed during the build, see decision log rows 25 and 40):

| Unit | Lessons | Finale |
|---|---|---|
| 0 البداية | basics | — |
| 1 سورة الناس | istiadha, tabii, arid, iwad, tafkhim, ibtida, lam-q, lam-s, lam-jh, lam-jl, ghunnah | الناس ١–٣ |
| 2 الناس · الفلق · الإخلاص | izhar, idgh-g, idgh-n, iqlab, ikhfa, qal-s, qal-k, sakinayn | الفلق |
| 3 المسد · النصر · الكافرون | muttasil, munfasil, mithlayn | الكافرون ١–٢ |
| 4 الكوثر ← الفيل | m-izhar, m-idgham, m-ikhfa, mutajanisayn, silent-letters | الفيل |
| 5 الهمزة ← البينة | silah-s, silah-k, badal, lin, ra-h, ra-l | العاديات |
| 6 القدر ← الضحى | dad-zha, lazim-k, lazim-h, aqwa-maddayn | الضحى |
| 7 الفاتحة | capstone (no new lesson) | الفاتحة |
| 8 ما بعد جزء عمّ | mutaqaribayn, waqf-signs, waqf-how, rawm-ishmam, sakt, imalah, ishmam, tashil | المؤمنون ٩٣–٩٧ |
| 9 الإتقان | makharij-jawf, makharij-halq, makharij-aqsa, makharij-wasat, makharij-taraf, makharij-shafatan, sifat-hams, sifat-shidda, sifat-istila, sifat-safir, sifat-inhiraf, maratib | الملك |

Schema:
```jsonc
{
  "units": [{ "id": "u1", "n": 1, "nameAr": "", "nameEn": "", "surahs": "", "intro": "",
              "lessons": ["istiadha", ...],
              "finale": { "from": "114:1", "to": "114:6", "label": "الناس" } | null,
              "mutun": [{ "matn": "tuhfa" | "jazariyya", "from": 1, "to": 7, "note": "" }] }],
  "lessons": { "<lessonId>": {
      "closing": { "from": "1:4", "to": "1:5" } | null,   // only rules learned so far (checked by test)
      "contrastWith": "<older lessonId>" | null,          // the Notice step's comparison
      "notice": "What to listen for" | null } }
}
```
`closing` and `finale` are computed by `src/content/course.build.test.ts` (run with `UPDATE_COURSE=1`) from the ayah-level lesson detection in `src/content/rulemap.ts`, and verified on every test run. Lesson content itself (definition, examples, facts, sources, review status) stays in `content/rules.json`.

## 3. Lesson anatomy (#/learn/:lessonId)
1. **Hear (اسمع).** 3 example words from the lesson, played one at a time from the word timings, slowed, looped on tap. Prompt: the lesson's `notice` text.
2. **Notice (لاحظ).** One example of this lesson next to one of `contrastWith` (both real recitation). "Which one has …?" answered by ear; then both are revealed. Skipped when there is no contrast lesson.
3. **Learn (تعلّم).** The rule card (v1 RuleBody).
4. **Say (ردّد).** Repeat after the reciter word by word, record, play reciter-then-me, self-rate "same / not yet". Letter drills for مخارج lessons (v1 Drill).
5. **Find (استخرج).** Tap the words in an ayah (from the closing passage, else an example verse) that show the rule; checked against the tajweed data (`findTargets`). Skipped when the rule can't be detected from data.
6. **Check (تحقّق).** 2–3 theory questions (v1 questions incl. one discrimination question). Counts toward review.
7. **Recite (اقرأ).** The closing passage in the player: listen, recite, record, compare, then "I recited it". This marks the lesson done (`introduceLesson`).

Resumable per step (as v1). A finished lesson can be replayed from its unit page.

## 4. Progress and unlocking
- Lessons unlock in course order. The next lesson opens when the previous one is done.
- Pace: at most **2 new lessons a day**; new lessons pause while more than 15 reviews are overdue (v1 `BACKLOG_LIMIT`). The weekly cap and phases are retired.
- **Unit finale:** after its last lesson, each unit offers its finale passage (listen, recite, record, "I recited it"). The next unit opens after the finale. Unit 7 is the finale only.
- `UserData` schema v2 adds `finales: { unitId: string; on: Day }[]`. v1 data migrates as is: every introduced lesson counts as done; units whose lessons are all done count their finale as done.
- Review: unchanged سبق · سبقي · منزل ladder, now fed by the course.

## 5. Screens
- **Today → "Continue"**: one primary card (next lesson, or the unit finale, or "come back tomorrow" when the pace limit is hit, or "review first" on backlog), the review card, a practice card (recite recent closing passages), and the current unit's progress. Teacher card stays when a teacher day is near.
- **Path tab → course map** (#/plan): units as a vertical path; each unit shows its lessons (done / next / locked), finale, and optional mutun extras. Progress (#/progress) stays.
- **Unit page** (#/unit/:unitId): intro, lessons list, finale, mutun lines (optional memorise: show the first half-line, recall the second, reveal).
- **Rules, mind map, Listen, Teacher:** unchanged; teacher is an optional side feature.
- **Onboarding:** same settings steps; the how-it-works step explains units and the lesson steps; ends on "Start lesson 1".

## 6. Account, sync, circles (R3, Supabase)
Optional. The app works fully offline without an account.
- **Sign-in:** email link (magic link) and Google, PKCE flow (the code arrives in the query string, so the hash router is untouched). Project URL and publishable key in `.env`.
- **Sync:** table `user_data(user_id pk, doc jsonb, updated_at)`. The client merges local and remote with a pure `mergeData(a, b)`: union by id for append-only lists (attempts, introductions, finales, corrections, sessions) taking the newer `updatedAt`; settings by `updatedAt`. Sync on sign-in, on app open, and a few seconds after each change. Recordings never sync.
- **Teacher link:** `share_links(token, user_id, created_at, revoked_at)`; a `security definer` function `shared_progress(token)` returns a read-only summary (lessons done and levels, open corrections, recent activity) for a valid token. Page `#/shared/:token` renders it without an account. Revocable from Settings.
- **Circles (حلقة):** `circles(id, name, owner, invite_code)`, `circle_members(circle_id, user_id, display_name)`, `activity(user_id, day)`; a function `circle_week(circle_id)` returns each member's studied days this week. Invite by code or link. No scores, no ranking, no public listing.
- **Row-level security** on every table: a user reads and writes only their own rows; circle members read their circle's members and activity; nobody reads `user_data` except its owner (the teacher link goes through the function).
- **Sign-in prompts:** after the first finished lesson, a card "Your progress is saved only on this device. Sign in to keep it safe and use it on any device." (Sign in / Later); a "Not backed up" mark in Settings and Progress; one reminder at each unit finale. Never blocking.

## 7. Content work
- 9 new lessons in `content/rules.json` with definition, examples (verified against Tanzil text), facts, sources and review status, same standard as `04-content-review.md`.
- For every lesson: `notice` prompt and `contrastWith`.
- Mutun placement per unit (تحفة الأطفال and الجزرية line ranges).
- `basics` lesson: the marks (حركات، سكون، شدة، تنوين) and counting a حركة, on words from الفاتحة and الناس.

## 8. Out of scope tonight (deferred, noted in the decision log)
Sharing recordings with the teacher; push reminders; a public leaderboard; readings other than حفص.
