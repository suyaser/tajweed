# Athan · voices we can bundle, and a name

Research date: 2026-11-21. This follows on from [01-plan.md](01-plan.md) §6.4 (athan audio rights) and §14 open decisions 2 (store name) and 4 (voices). It is research only: no audio was added to the repo. Licence and uploader facts come from the Wikimedia Commons API, Freesound pages, Internet Archive metadata and the RDAP registries, all read on the date above. Sources are linked inline.

**What I couldn't check:** I did not listen to the recordings. Style (Makkah, Madinah, Egyptian), whether a Fajr recording really has الصلاة خير من النوم, and recording quality all need someone to listen before anything is picked.

---

## Part 1 · Athan recordings

### 1.1 Bottom line

- **No openly licensed Makkah, Madinah or famous-muezzin recording exists with clean provenance.** Every "Makkah", "Madinah", Mishary or Sabah Fakhri file marked CC0 or public domain was uploaded by someone who is not the rights holder (see 1.4). Bundling one of these brings the same takedown risk that 01-plan §6.4 already flags.
- **Open source prayer apps are not a source.** Mihrab (AGPL) bundles 17 athans (`adhan_makkah`, `adhan_madina`, `adhan_egypt`, Abdul Basit, Minshawi and others) and says only that the audio is "the property of their respective authors" ([NOTICE](https://github.com/MihrabHQ/Mihrab/blob/HEAD/NOTICE)). Al-Azan (AGPL) bundles `masjid_an_nabawi.mp3`, Abdul Basit, Ragheb Ghalwash and Moazen-zade with no credit ([repo tree](https://github.com/meypod/al-azan-compose/tree/HEAD/app/src/main/res/raw)). Neither has a licence for the audio. [abodehq/Athan-MP3](https://github.com/abodehq/Athan-MP3) has no licence at all. RUKN ships the Internet Archive "Doha, Qatar" set and cites the item's Public Domain Mark ([rukn.one/licenses](https://rukn.one/licenses/)), which isn't a licence (see #6 below).
- **What is clean is amateur or field audio:** CC0, CC BY or CC BY-SA, either recorded on the street from a loudspeaker or by a small mosque. These are fine as placeholders or as a "local mosque" voice. They are not the polished Makkah/Madinah voice users expect.
- **Recommendation (unchanged from 01-plan, now backed by evidence):** commission two voices, each with a Fajr version, under a short written agreement. Until then, ship the best clean placeholders below. The cheapest real lead is **ICR**, a mosque that already publishes its own athans under CC0 (#2): ask them in writing for their other athans, including Fajr.

### 1.2 Ranked candidates (all open licences, none no-derivatives)

| # | Recording | Style / prayer (from metadata, not listened) | Duration · format | Licence and attribution | Doubts |
|---|---|---|---|---|---|
| 1 | **ICR Friday Prayer 1st Adhan, Asim Javed** · [archive.org](https://archive.org/details/icr-friday-prayer-1st-adhan-17th-may-2024-9th-dhul-qadah-1445-by-asim-javed) (2nd adhan: [same series](https://archive.org/details/icr-friday-prayer-2nd-adhan-17th-may-2024-9th-dhul-qadah-1445-by-asim-javed)) | A mosque's own recording; likely UK/South-Asian community style; Jumuʿah/Dhuhr | 3:40 · WAV and FLAC (lossless desk feed) | **CC0 1.0**. Courtesy credit: "Athan by Asim Javed, ICR. CC0." | The uploader is the mosque's media archive (hundreds of ICR khutbahs and salāhs). The same account also re-uploads Haramain recitations without a licence, so it is not careful about rights in general; its *own* recordings are the believable ones. Confirm the muezzin's consent by email. Best-quality clean option. |
| 2 | **Adhan.ogg** (Aishatu98) · [Commons](https://commons.wikimedia.org/wiki/File:Adhan.ogg) | Probably Nigeria (the uploader's other files are Nigerian); prayer not stated | 0:42 · Ogg Vorbis mono 44.1 kHz, about 80 kb/s | **CC0** (`{{self|cc-zero}}`, "own work"). Courtesy credit: "Adhan by Aishatu98, Wikimedia Commons, CC0." | Established uploader (1,143 edits, not blocked). At 42 s it may be a partial athan. Lossy, low bitrate. A sister file, [Iqamah.ogg](https://commons.wikimedia.org/wiki/File:Iqamah.ogg), is CC0 too. |
| 3 | **Dhuhr Adhan, Hamtramck MI** (RJStefanski) · [Freesound #255231](https://freesound.org/s/255231) | Loudspeaker athan heard from about 100 ft; Dhuhr | Unedited field recording · WAV 96 kHz/24-bit stereo | **CC BY 3.0**. Attribution: "Islamic Call to Prayer (Dhuhr Adhan…) by RJStefanski, freesound.org/s/255231, CC BY 3.0, cut and faded." | Street ambience. The muezzin is not named (see 1.5 on performers). The placeholder already named in 01-plan. |
| 4 | **Adhan in Al-Azhar Park, Cairo** (AhmadAiuby) · [Freesound #683120](https://freesound.org/s/683120) | **Egyptian**; several mosques heard from the park; Dhuhr (12:09) | 1:04 · WAV 48 kHz/16-bit stereo | **CC0** | Field recording with running water and several mosques overlapping. The only Egyptian-style clean option, and it may be unusable as an alarm. |
| 5 | **Morning call to prayer, Bodufolhudhoo, Maldives** (jrosin) · [Freesound #861625](https://freesound.org/s/861625) | **Fajr** (stated in the description) | 4:44 · FLAC 48 kHz/24-bit stereo | **CC BY 4.0**. Attribution: "Morning call to prayer on Bodufolhudhoo by jrosin, freesound.org/s/861625, CC BY 4.0, cut and faded." | Crickets, air conditioning and sea in the background. Listen for الصلاة خير من النوم. The only clean *Fajr* file with a stated prayer. |
| 6 | **Adhan Recordings from Doha, Qatar** · [archive.org](https://archive.org/details/adhan.recordings.from.doha.qatar) | Gulf; five files, **including Fajr** | 2:58–3:37 each · MP3 VBR | **Public Domain Mark 1.0**. That is a *claim* the work is already in the public domain, not a dedication. For 2013–14 recordings the claim is wrong unless the uploader made them. | Uploader `abd.al.rahman@…` also posted "Adhan Notifications" (Mishary, Nasser al-Qatami…) under the same mark, which is plainly not public domain. **Medium–high risk; use only with written confirmation.** |
| 7 | **Athan in Ramadan / Athan during Ramadan 2** (daSupremo) · [Commons 1](https://commons.wikimedia.org/wiki/File:Athan_in_Ramadan.wav), [Commons 2](https://commons.wikimedia.org/wiki/File:Athan_during_Ramadan_2.wav) | Ghana, *Wiki Loves Ramadan 2026* campaign | 0:37 and 1:24 · WAV | **CC BY-SA 4.0**. Attribution: "Athan in Ramadan by daSupremo, Wikimedia Commons, CC BY-SA 4.0, cut and faded." | Genuine campaign uploads. Share-alike: see 1.3. |
| 8 | **Call to prayer from the Prophet's mosque** (ejaz215) · [Commons](https://commons.wikimedia.org/wiki/File:33937_ejaz215_call-to-prayer-from-the-prophet-s-mo.ogg) | **Madinah** (by its title) | 3:06 · Ogg | **CC BY 3.0**, imported from Freesound #33937 | **Red flag:** the Freesound original [now returns "Page not found"](https://freesound.org/people/ejaz215/sounds/33937/) (deleted). It is probably a capture of the Ḥaram broadcast. **Don't use.** It is listed only because it is the sole "Madinah" result. |

Also clean but weaker (field ambience, often several mosques at once): Marrakech [#469702](https://freesound.org/s/469702) (CC0), Jaffa [#506830](https://freesound.org/s/506830) (CC0), Mashhad [#648427](https://freesound.org/s/648427) (CC0), Khan el-Khalili, Cairo [#511003](https://freesound.org/s/511003) (CC0, 5:36, evening), Aroumd, Morocco [#807484](https://freesound.org/s/807484) (CC BY 4.0, early morning), Tindouf 5 am [#44465](https://freesound.org/s/44465) (CC BY 4.0, Fajr, noise-reduced), Patara 1992 dawn [#28775](https://freesound.org/s/28775) (CC BY 4.0, Turkish), Sabra camp, Lebanon [#262229](https://freesound.org/s/262229) (CC BY 4.0).

**Against the brief** (one Makkah, one Madinah, one Egyptian/other, one Fajr):
- Makkah: **none clean.**
- Madinah: **none clean** (#8 is suspect).
- Egyptian/other: #4 (Cairo, field), or #1/#2 as "other".
- Fajr: #5 (CC BY 4.0), or #6 if the Doha uploader confirms in writing.

### 1.3 Licence implications for an app, and the ≤29 s iOS cut

- **No-derivatives:** none of the eight ranked files is ND, so cutting a ≤29 s clip with a fade is allowed. Avoid the ND items that came up in the search: the Cambridge Cairo city-wide athans are **CC BY-NC-ND** ([repository](https://www.repository.cam.ac.uk/handle/1810/237156)), and archive.org `TvQuran.com01.athan` is **CC BY-ND**.
- **CC0:** no conditions. Credit them anyway, as a courtesy.
- **CC BY:** credit title, author, source link and licence, and say that the file was changed ("cut and faded"). Put this on an About → Credits screen and in the store description footer.
- **CC BY-SA:** the 29 s cut is an *adaptation*, so the cut itself must be released under CC BY-SA. Bundling the file in the app is a *collection*: the app's code and other assets are not affected. In practice: publish our cuts under the same licence.
- **The 4.0 "no technological measures" clause** (CC BY and BY-SA 4.0 §2(a)(5)(C); 3.0 has a similar DRM clause): App Store FairPlay encryption could count as restricting recipients. The usual fix is to **also publish the bundled audio files openly**, for example at `<domain>/audio/` with a LICENSES file. This costs nothing; do it for every CC BY or BY-SA voice.
- **Public Domain Mark** (archive.org): this is not a licence and grants nothing. Treat it as "rights unknown".
- **Performers:** a street recording is the recordist's copyright, so the recordist can license it, but the muezzin's performance is his. In some places, Egypt and the EU among them, performers hold neighbouring rights. The practical risk is low for a loudspeaker call heard in public, but **for a devotional app the better practice is a recording the muezzin agreed to.** That is one more reason to commission.

### 1.4 Rejected (licence claimed, but the uploader is not the rights holder)

| File | Claim | Why rejected |
|---|---|---|
| [Beautiful adhan.ogg](https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg) (2:34) and [Azan.ogg](https://commons.wikimedia.org/wiki/File:Azan.ogg) (3:03) | CC0 / CC BY-SA 4.0, "own work" | The uploaders Adam-synagda and Andrewler are **both indefinitely blocked for "abusing multiple accounts"** (Commons user API), and their uploads are the same Islamic set. The "own work" claim can't be trusted. |
| [Call to prayer by Sabah Fakhry.mp3](https://commons.wikimedia.org/wiki/File:Call_to_prayer_by_Sabah_Fakhry.mp3) | PD-Old / PD-US-expired | A 1985 recording ripped from YouTube. The "permission" text argues that the *adhan* dates from 622 CE, which confuses the text with the recording. Not PD. |
| [The Adhan – Aaqib Azeez.mp3](https://commons.wikimedia.org/wiki/File:The_Adhan_-_Muslim_Call_to_Prayer_-_Aaqib_Azeez.mp3) | CC BY-SA 4.0, "own work" | The file is named after a different performer, and the uploader's other uploads are full Qurʾān recitations. Provenance unclear. |
| archive.org [MakkahAzan-ramadan](https://archive.org/details/MakkahAzan-ramadan), [28MayFajrAdhanMakkah](https://archive.org/details/28MayFajrAdhanMakkah), [MakkahAzan_201711](https://archive.org/details/MakkahAzan_201711), [zied_hadj_hassen1](https://archive.org/details/zied_hadj_hassen1) (Qubāʾ) | CC0 / PD Mark | Captures of the Ḥaram broadcast or of named muezzins, uploaded by third parties. |
| archive.org [adhan.notifications](https://archive.org/details/adhan.notifications) | PD Mark | Mishary al-Afasy, Nasser al-Qatami and others: commercial recordings. |
| Freesound [#639494](https://freesound.org/s/639494) | CC0 | "Extracted from [YouTube] and processed." |
| Freesound [#570199](https://freesound.org/s/570199) | CC0 | Filed as "Music"; no source given; probably a rip. |
| archive.org [basim_alkarbalaee](https://archive.org/details/basim_alkarbalaee) | CC BY 3.0 | Probably a Shia athan, with different wording from the Sunni athan we need. |
| Pixabay | none found | No athan found. Its licence also leaves third-party consent to the user ("It is your responsibility to check whether you require the consent of a third party", [summary](https://pixabay.com/service/license-summary/)), so a Pixabay re-upload of a famous muezzin would be no safer. |
| archive.org [MadinahFajrAzan](https://archive.org/details/MadinahFajrAzan) (Faisal Numan) | CC0 (set by the uploader, 2010) | A capture of the Masjid an-Nabawi Fajr athan by Sheikh Faisal Numan. The uploader is a private account, not the muezzin or the Haram's broadcaster, so the CC0 grants nothing. The other "Madinah Fajr" items (citiesoflight.me, haramain.info, haramainrecordings.com) are broadcast captures with no licence or a PD claim. Checked 2026-11-22. |
| GitHub [Kiwifu/adhan-mp3](https://github.com/Kiwifu/adhan-mp3) | none | 200+ MP3s of famous muezzins and reciters (Abdul Basit, Mishary, al-Hussary, the Haramain) with **no licence file**. "Free for Islamic apps" in the description is the aggregator's claim; it doesn't own these recordings. |
| GitHub [DBChoco/Muezzin](https://github.com/DBChoco/Muezzin) | MIT (code only) | The bundled athans (Mecca, al-Aqsa, Ahmed al-Nufais) are cited to YouTube videos in the README. MIT covers the code, not the audio. |
| ElevenLabs "melodic call to prayer" SFX | free with credit | AI-generated. Not appropriate for an athan. |

Developer questions to AlAdhan about bundling athan audio ([#255](https://community.islamic.network/d/255-permission-to-bundle-an-adhan-audio-file-in-our-android-app-nurafiq), [#256](https://community.islamic.network/d/256-audio-licensing-query-for-azan-pro-app)) still have no visible answer.

### 1.5 Next steps

1. Listen to #1, #2, #4 and #5 (and #6 if wanted): check style, Fajr wording, noise, and whether a clean 25–29 s takbīr + shahādah cut exists.
2. Email ICR (the media archive contact on the archive.org items) asking for written permission covering ICR's athans, including a Fajr one if they have it. Their unlicensed uploads include Isha athans by Shafkat Salam ([2017](https://archive.org/details/ICRIshaAdhan26thRamadan143820thJune2017ShafkatSalam), [2021](https://archive.org/details/icr-4th-ramadan-15th-april-2021-isha-beautiful-adhan-by-hafiz-shafkat-salam)).
3. Commission: one Hijazi-style (Makkah-like) and one Egyptian-style muezzin, each recording a regular and a Fajr athan in a quiet room, at 48 kHz/24-bit. The agreement should grant a perpetual, worldwide, irrevocable licence to edit, cut and distribute the recordings in apps and on the website, with name credit. The muezzin's *style* is not copyrightable; only the recording is.
4. Publish whatever ships, and the cuts, at `<domain>/audio/` with a LICENSES file (covers 1.3).

---

## Part 2 · Name

### 2.1 What the stores look like

The prayer-times category is saturated with one-word Arabic names. Searches of the App Store (US, SA and EG storefronts, via the iTunes Search API) and of Google Play's web search found **at least 5–10 apps each** for *Miqat/ميقات*, *Nida/نداء*, *Falah*, *Hayya*, *Waqt*, *Sakina/سكينة* and *Awqat*, most of them prayer apps. Exact-name collisions are the norm, and Apple requires an app name to be unique. The one thing in the space that is not crowded is **our own family name, مسار + a noun**. Neither "مسار الصلاة" nor "مسار الأذان" has an exact match in either store.

**One watch-out for the مسار family:** *El Massar Establishment for Software* publishes AlMosaly (about 76k ratings) and ذكر. "Massar" is their company name, not an app name, so it isn't a store conflict, but it is the nearest thing to a trademark neighbour in the same category. Do a formal search before enrolling (WIPO Global Brand Database, class 9; USPTO; the Saudi SAIP and Egyptian registers). I ran only the store and web checks.

### 2.2 Ten candidates

Domain status: **free** = RDAP 404 at the registry (Google Registry for .app, Verisign for .com) and no NS records; **taken** = registered.

| Name | Meaning | Stores | .app | .com | Verdict |
|---|---|---|---|---|---|
| **مسار الصلاة · Salah Path** | "Path of prayer"; sister to مسار التجويد · Tajweed Path | AR: no exact match. EN: **"SalahPath"** on iOS (Sarah E. J. Yildirim, released 2026-10-20, 0 ratings). Crowded "X Path" neighbours: Prayer Path, Muslim Path, Iman Path | salahpath.app **free** | salahpath.com taken (Cloudflare) | Best family fit. Title it "مسار الصلاة · Salah Path" (not identical to "SalahPath") |
| **مسار الأذان · Athan Path** | "Path of the athan"; keeps the working name | **No exact match** in either store | athanpath.app **free** | athanpath.com **free** | Cleanest availability; narrower meaning (doesn't say qibla or adhkar) |
| **ميقات · Miqat Path / مسار الميقات** | "Appointed time" | "Miqat" alone: 8+ prayer apps on each store; "Miqat Path": no exact match | miqat.app taken; miqatpath.app **free** | miqat.com taken; miqatpath.com **free** | Lovely word, but too crowded alone |
| **على وقتها · Ala Waqtiha** | "On its time", from the hadith "الصلاة على وقتها" | **"Ala Wakteha \| على وقتها"** on iOS (2026-11-18) and **"Ala Waqteha"** on Play | waqtuha.app taken | waqtuha.com taken | Taken days ago; drop |
| **نداء · Nida** | "The call" | "nida — prayer times & athan" (Play), Nidaa (iOS), Nidam… | nida.app taken | — | Drop |
| **حيّ · Hayya** | From حيّ على الصلاة | "Hayya" is **Qatar's government visitor platform** (Hayya to Qatar); several Hayya prayer apps | hayya.app taken | hayya.com taken | Trademark risk; drop |
| **فلاح · Falah** | "Success", from حيّ على الفلاح | 10+ Falah prayer apps; Bank Alfalah | falah.app taken | falah.com taken | Drop |
| **وقت · Waqt** | "Time" | 6+ Waqt prayer apps | waqt.app parked | waqt.com taken | Drop |
| **سكينة · Sakina** | "Tranquillity", fits "calm" | 10+ Sakina apps, including prayer apps | sakina.app taken (no NS) | — | Drop |
| **منادي · Munadi** | "The caller" | Munādī (iOS), Munadi Connect, `app.munadi` on Play | munadi.app taken | munadi.com taken | Drop |

Also checked: Masar alone (dozens of مسار apps: taxis, Qatar University, finance), Masarat/مسارات (Salatuk by "MASARAT APP" is a prayer app; masarat.app/.com taken), Awqat (10+), Iqama (several).

### 2.3 Top 5

1. **مسار الصلاة · Salah Path.** Reads as a sibling of مسار التجويد, says what the app is for, and covers prayer as a whole rather than only the athan. The Arabic is unique in both stores. The English is near a 0-rating iOS app "SalahPath", so use the bilingual title. salahpath.app free.
2. **مسار الأذان · Athan Path.** The most available option: no store match, and .app and .com both free. Keeps the working name. It is weaker if the app grows beyond the athan.
3. **مسار الميقات · Miqat Path.** Free in both stores and domains as a two-word name, but "Miqat" alone is so crowded that search will bury it.
4. **مسار · Masar (umbrella), with the app titled "مسار · الصلاة".** Only worth it if both apps rebrand to "Masar Tajweed / Masar Salah". "Masar" alone is heavily used outside the category.
5. **على وقتها · Ala Waqtiha.** The best meaning in the list, but two apps took it this month. Keep it only as a tagline: *"الصلاة على وقتها"*.

### 2.4 Shared domain and app ids

The domain is permanent once it is in the app ids. It also has to host the privacy policy, account deletion, `/.well-known/assetlinks.json` and (from 1.3) `/audio/`.

| Domain | Status | App ids (reversed) | Notes |
|---|---|---|---|
| **masarpath.app** ✔ recommended | **free** (RDAP 404, no NS); masarpath.com also **free**, masarpath.dev free | `app.masarpath.tajweed`, `app.masarpath.salah` | Names the family ("Masar · Path"), not one app, so a third app fits. Buy .app and .com together. |
| tajweedpath.app | free (.com free too) | `app.tajweedpath.tajweed`, `app.tajweedpath.salah` | Reads oddly for the prayer app. |
| salahpath.app | free (.com taken) | — | Ties the root to one app. |
| masar.app / masar.dev / masar.io | taken (masar.io is for sale on Afternic) | — | Short, but an aftermarket price and too generic. |
| masarlabs.app, masarhq.app, masarstudio.app, usemasar.app | free | — | Fallbacks; "labs/studio" sounds corporate. |

**Recommendation:** buy **masarpath.app** (plus masarpath.com as a redirect). Use the ids `app.masarpath.tajweed` and `app.masarpath.salah` (or `.athan`). Name the prayer app **مسار الصلاة · Salah Path**. docs/19-play-store-plan.md suggested `com.<owned-domain>.tajweedpath`; with this domain the reversed form is `app.masarpath.*`. Decide that before the Tajweed Path store enrolment, because the id can never change. Re-run the RDAP checks on the day of purchase; they were all done 2026-11-21.

---

## Sources

- Wikimedia Commons file pages and API (licence and uploader metadata, `list=users` block info): [Adhan.ogg](https://commons.wikimedia.org/wiki/File:Adhan.ogg) · [Iqamah.ogg](https://commons.wikimedia.org/wiki/File:Iqamah.ogg) · [Athan in Ramadan.wav](https://commons.wikimedia.org/wiki/File:Athan_in_Ramadan.wav) · [Athan during Ramadan 2.wav](https://commons.wikimedia.org/wiki/File:Athan_during_Ramadan_2.wav) · [33937 ejaz215…](https://commons.wikimedia.org/wiki/File:33937_ejaz215_call-to-prayer-from-the-prophet-s-mo.ogg) · [Beautiful adhan.ogg](https://commons.wikimedia.org/wiki/File:Beautiful_adhan.ogg) · [Azan.ogg](https://commons.wikimedia.org/wiki/File:Azan.ogg) · [Sabah Fakhry](https://commons.wikimedia.org/wiki/File:Call_to_prayer_by_Sabah_Fakhry.mp3) · [Aaqib Azeez](https://commons.wikimedia.org/wiki/File:The_Adhan_-_Muslim_Call_to_Prayer_-_Aaqib_Azeez.mp3) · [Adhan wiki.oga](https://commons.wikimedia.org/wiki/File:Adhan_wiki.oga) (CC BY-SA 3.0 / GFDL, 26 s "simple reading", not ranked) · [Category:Adhan](https://commons.wikimedia.org/wiki/Category:Adhan)
- Freesound: [255231](https://freesound.org/s/255231) · [683120](https://freesound.org/s/683120) · [861625](https://freesound.org/s/861625) · [469702](https://freesound.org/s/469702) · [506830](https://freesound.org/s/506830) · [648427](https://freesound.org/s/648427) · [511003](https://freesound.org/s/511003) · [807484](https://freesound.org/s/807484) · [44465](https://freesound.org/s/44465) · [28775](https://freesound.org/s/28775) · [262229](https://freesound.org/s/262229) · [185172](https://freesound.org/s/185172) · [260102](https://freesound.org/s/260102) · [639494](https://freesound.org/s/639494) · [570199](https://freesound.org/s/570199)
- Internet Archive (metadata API): [ICR 1st adhan](https://archive.org/details/icr-friday-prayer-1st-adhan-17th-may-2024-9th-dhul-qadah-1445-by-asim-javed) · [Doha, Qatar](https://archive.org/details/adhan.recordings.from.doha.qatar) · [Adhan Notifications](https://archive.org/details/adhan.notifications) · [MakkahAzan-ramadan](https://archive.org/details/MakkahAzan-ramadan) · [28MayFajrAdhanMakkah](https://archive.org/details/28MayFajrAdhanMakkah)
- Open source apps: [Mihrab (F-Droid)](https://f-droid.org/en/packages/com.prayer_times/) · [Mihrab repo](https://github.com/MihrabHQ/Mihrab) · [Al-Azan (F-Droid)](https://f-droid.org/en/packages/com.github.meypod.al_azan) · [al-azan-compose](https://github.com/meypod/al-azan-compose) · [Athan-MP3](https://github.com/abodehq/Athan-MP3) · [RUKN licences](https://rukn.one/licenses/)
- Licences: [Pixabay licence summary](https://pixabay.com/service/license-summary/) · [CC BY 4.0 legal code](https://creativecommons.org/licenses/by/4.0/legalcode) · [CC BY-SA 4.0 legal code](https://creativecommons.org/licenses/by-sa/4.0/legalcode) · [Public Domain Mark](https://creativecommons.org/publicdomain/mark/1.0/) · [Cambridge Cairo athans (CC BY-NC-ND)](https://www.repository.cam.ac.uk/handle/1810/237156)
- Stores: iTunes Search API (`itunes.apple.com/search`, storefronts us/sa/eg) and Google Play web search (`play.google.com/store/search`), queried 2026-11-21. Examples: [Ala Waqteha (Play)](https://play.google.com/store/apps/details?id=com.h.alawakteha) · [nida (Play)](https://play.google.com/store/apps/details?id=com.nidaapp.nida) · [Hayya to Qatar (Play)](https://play.google.com/store/apps/details?id=com.pl.qatar) · [AlMosaly (Play)](https://play.google.com/store/apps/details?id=com.moslay)
- Domains: RDAP at `pubapi.registry.google/rdap/domain/<name>` (.app, .dev), `rdap.verisign.com/com/v1/domain/<name>` (.com), `rdap.org` (others), plus `dig NS`.
