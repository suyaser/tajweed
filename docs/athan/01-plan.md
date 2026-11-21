# Athan · أذان — plan (research and MVP)

Working name **Athan**. A mobile-only sibling of Tajweed Path (مسار التجويد). It ships on **Google Play and the App Store from day one**, with both platforms weighted equally. This file is planning only and will move to the app's own repo. Research date: 2026-11-21. Sources are linked inline and listed in §14.

---

## 1. Problem and who it's for

**The job:** "Tell me reliably when it's time to pray, wherever I am, point me to the qibla, and give me the day's adhkar, without selling me or my location."

**Who it's for:**
- **Arabic-first Muslims in Egypt and the Gulf**, the same audience as Tajweed Path, who want the right local method (Egyptian, Umm al-Qura, Dubai and so on) without opening settings.
- **Muslims in the West, especially at high latitudes**, where the method and the high-latitude rule matter, and where trust is low after the Muslim Pro data story.
- **Travellers**, who need correct times in a new city with no network.

**What's broken today** (evidence in §2):
1. **Ads and upsell everywhere.** Muslim Pro reviewers report constant ads and inappropriate ads, and say ads kept showing even after they paid. IslamicFinder's Athan and Salaat First also carry ads.
2. **Location data abuse.** In 2020 Muslim Pro shared location data with X-Mode, a broker whose data reached US military contractors ([Middle East Eye](https://www.middleeasteye.net/news/us-military-buying-location-data-popular-muslim-app), [Christian Century](https://www.christiancentury.org/article/news/popular-muslim-prayer-app-ends-relationship-firm-selling-data-us-military)). Many users have not forgotten.
3. **The athan doesn't fire, or fires late.** This is the most common complaint about Muslim Pro ([Dhaka Tribune](https://www.dhakatribune.com/amp/feature/tech/420193/muslim-pro-alternatives-5-ad-free-prayer-and)). Salaat First users report a delay of about 3 minutes ([unitq](https://unitq.com/unitq-scorecards/salaatfirstprayertimes)). Mawaqit users report notifications stopping until they reopen the app.
4. **Clutter.** Feature-packed apps (stories, video, shop, Qalbox) bury the three things people open them for.

**Positioning in one line:** *Accurate prayer times, an athan that arrives, qibla and adhkar. Calm, Arabic-first, no ads, no account, and your location never leaves the phone.*

Pillars proves there is demand for this. It has no ads, its App Store label says "Data Not Collected", it is rated about 4.8, and reviewers praise exactly the missing ads and the privacy ([App Store](https://apps.apple.com/us/app/-/id1559086853), [justuseapp](https://justuseapp.com/en/app/1559086853/pillars-prayer-times-qibla/reviews)). Mawaqit (non-profit, ad-free) proves the same. Athan's edge over both: it is **Arabic-first**, chooses **regional method defaults** for Egypt and the Gulf, shares an identity with the tajweed app, and is designed with **one action per screen**.

---

## 2. Competitors

| App | Model | Rating (approx.) | Praised for | Complaints | Privacy |
|---|---|---|---|---|---|
| **Muslim Pro** | Free with ads; Premium about $35/yr | Play about 4.0 (about 1.9M reviews); Trustpilot 2.2 | Everything in one app: Quran, times, qibla | Heavy ads, including after paying; athan failing to fire; wrong times reported in March 2025 ([unitq](https://unitq.com/unitq-scorecards/muslimproramadan2023), [Islamtics](https://islamtics.com/?p=21176), [grand-screen](https://grand-screen.com/apps/muslim-pro-quran-athan-prayer/reviews/)) | 2020 X-Mode location sharing (above) |
| **Athan (IslamicFinder)** | Free with ads; Premium $11.99/yr, Remove Ads $3.99 | Play about 4.8 (about 300k) | Athan alarms, Quran, duas, "menstrual mode" | Ads, including inappropriate ones ([justuseapp](https://justuseapp.com/en/app/505858403/athan-prayer-times-al-quran/reviews), [App Store](https://apps.apple.com/qa/app/athan-ramadan-2026-al-quran/id505858403)) | Ad SDKs |
| **Pillars** | Free, no ads, optional IAP | iOS about 4.8 | Design, privacy, streaks, widgets, angle and manual corrections | Wants more features | "Data Not Collected" ([App Store](https://apps.apple.com/sa/app/id1559086853)) |
| **Mawaqit** | Free, non-profit endowment, no ads | Self-reported 4.7 | Mosque's own iqamah times | Notifications stop until the app is reopened ([App Store](https://apps.apple.com/us/app/id1460522683)) | "Data Not Collected" |
| **Muslim App (ex-Muslim Assistant)** | Free with ads; subscription removes them | — | Feature breadth | "Amount of ads is annoying" | Ad SDKs |
| **Salaat First** | Free with ads; Remove-Ads IAP | Play about 4.4–4.6 | Widgets, simplicity, Arabic | Freezes; adhan about 3 min late ([unitq](https://unitq.com/unitq-scorecards/salaatfirstprayertimes), [App Store](https://apps.apple.com/app/id1181948844)) | Ads |
| **Al-Moazin (Parfield)** | Lite free; full version paid | About 4.4 (374k, aggregator) | Accuracy, Gulf methods, watches | Pre/post-prayer reminders and methods are behind the paywall ([App Store](https://apps.apple.com/us/app/al-moazin/id637678038)) | — |
| **Athan Pro** | Subscription from $2.99/wk | iOS 4.7 (6.3k) | Design | Aggressive pricing ([App Store](https://apps.apple.com/app/id1587151803)) | — |
| **iPray / Azan Alarm (iOS)** | Paid or IAP | — | — | Openly say the full athan is not possible from an iOS alert; "tap the notification" ([iPray](https://apps.apple.com/us/app/id288054534), [Azan Alarm](https://apps.apple.com/app/azan-alarm/id959275299)) | — |
| **حصن المسلم apps** (many) | Mostly free; some with ads | Varies | Offline adhkar, audio | Ads; unsourced or ungraded texts | Varies |

**What to learn from them:**
- **Copy Pillars' privacy stance.** Beat it on regional defaults and Arabic.
- **Copy Mawaqit's "open the app to keep notifications working" fallback.** It is the honest answer to iOS's 64-notification limit (§6.3).
- **Don't copy the feature sprawl.** No stories, video, shop, or community.

---

## 3. Feature list: MVP / v1.1 / later / never

The rule: MVP is what someone needs on day one to delete their current app. Each row gives the reason for its tier.

| Feature | Tier | Why |
|---|---|---|
| Prayer times anywhere, computed offline | **MVP** | It's the product. No network means private and reliable. |
| Auto method by country, with a confirm screen | **MVP** | Wrong method is the top accuracy complaint, and Egypt and the Gulf need the right default without settings. |
| Asr madhab, high-latitude rule, per-prayer ± minute adjustment | **MVP** | Needed to match the local mosque, and essential in Europe and Canada. |
| Athan notification per prayer: athan / short tone / silent / off | **MVP** | Core. |
| Full athan audio (Android: whole recording; iOS: a cut of 30 s or less, tap for the full one) | **MVP** | Core expectation; the platform limits are covered in §6. |
| "Make sure the athan arrives" check (permissions, battery, OEM) | **MVP** | Reliability is the number-one complaint category. |
| Qibla compass, with an accuracy and calibration state | **MVP** | Explicitly in the brief, and cheap. |
| Adhkar: morning, evening, after salah, before sleep, on waking, each with a tap counter | **MVP** | In the brief. The counter makes a separate tasbih screen unnecessary for MVP. |
| Hijri date (Umm al-Qura) with a ±2-day adjustment | **MVP** | Shown on Today; the adjustment handles local moon sighting. |
| Arabic and English, RTL, light and dark | **MVP** | Matches the sibling app. |
| Manual city (offline list) instead of GPS | **MVP** | For privacy-minded users and for denied permission. |
| Home-screen widget, plus iOS lock-screen and Android "next prayer" widget | **v1.1** | Highly expected, but native code on both platforms (§7). Ship the MVP first, then this as the first update. |
| Ramadan: imsak, suhoor and iftar times; Isha +30 in Ramadan for Umm al-Qura | **v1.1** | Seasonal. It must ship before the next Ramadan (around 8 Feb 2027): a hard deadline. |
| Pre-prayer reminder ("15 min to Asr") | **v1.1** | Small, but it spends iOS notification budget, so the scheduler needs to be proven first. |
| Jumuʿah reminder (Kahf, duʿāʾ hour) | **v1.1** | Small. |
| Month timetable (view and share as an image) | **v1.1** | Useful for mosques and families. Read-only. |
| Travel detection: "You're in a new city, update times?" | **v1.1** | Triggered when the time zone or a stored coarse location changes. Never tracks in the background. |
| Standalone tasbih counter | **v1.1** | Trivial once the adhkar counter exists. |
| iOS AlarmKit "Fajr alarm" (breaks through silent mode) | **v1.1 spike** | iOS 26 and newer only; forum reports of late firing. Needs a proof first (§6.3). |
| Apple Watch and Wear OS complication | **later** | Separate native targets. Do after widgets prove the data-sharing path. |
| Live Activity: iftar or next-prayer countdown | **later** | The 8-hour cap fits a Ramadan countdown the user starts, not an all-day one (§6.3). |
| Private prayer log (on device, no streak pressure) | **later** | Pillars has one, but streaks invite riyāʾ and guilt. The user rejected public rankings in the tajweed app. Needs a careful design. |
| Islamic events calendar (Ramadan, Eids, ʿĀshūrāʾ, white days) | **later** | Easy from the Hijri table, but not core. |
| Qibla on an offline map, or sun/landmark qibla | **later** | Fixes compass distrust, but map tiles mean network access and size. |
| Mosque iqamah times (for example via Mawaqit) | **later** | Needs a network and a partner, and breaks the "nothing leaves the phone" story. Opt-in only. |
| More adhkar categories (travel, rain, distress …) | **later** | The content-review cost is per item. |
| Quran reader or listener | **never (here)** | Link to Tajweed Path and a muṣḥaf app instead. Two apps, two jobs. |
| Ads, ad SDKs, analytics or tracking SDKs, data brokers | **never** | The differentiator. |
| Required account or sign-in | **never** | Nothing to sync except settings, and the OS backup covers those. |
| Stories, video feed, community, shop | **never** | Clutter and moderation load. |
| Fatwa or AI Q&A, zakat calculator, dating, horoscopes | **never** | Out of scope, and a liability. |
| AR qibla | **never** | Gimmick; less accurate than the compass with a good calibration state. |

---

## 4. Prayer-time calculation

**Library:** [`adhan_dart`](https://pub.dev/packages/adhan_dart) 2.0.1, MIT, no dependencies, actively published. It is a port of batoulapps **Adhan** ([MIT](https://github.com/batoulapps/Adhan)), the reference implementation most prayer apps use. It supports MWL, ISNA, Egyptian, Umm al-Qura, Karachi, Dubai, Kuwait, Qatar, Singapore, Turkiye, Tehran, Moonsighting Committee, Gulf, Jordan, Morocco, Algeria, Tunisia, France, Russia, Portugal, Indonesia, and Other (custom angles). It supports the high-latitude rules middle-of-the-night, seventh-of-the-night and twilight-angle, plus a `recommended()` helper (seventh above 48°). It also provides `Qibla.qibla(coords)`. The older `adhan` package (MIT) was last published about 3 years ago, so skip it.

**Parameters (from [adhan-js METHODS.md](https://raw.githubusercontent.com/batoulapps/adhan-js/master/METHODS.md) and [praytimes.org](https://praytimes.org/calculation)):**
- Egyptian: Fajr 19.5°, Isha 17.5°.
- Umm al-Qura: Fajr 18.5°, Isha = Maghrib + 90 min (+120 in Ramadan). Isha is **not** automatic in the library, so set it in Ramadan mode.
- Karachi: 18°/18°.
- Dubai: 18.2°/18.2° (AlAdhan calls this unofficial: [aladhan.com](https://aladhan.com/calculation-methods)).
- Moonsighting Committee: seasonal, with the 1/7 rule above 55°.

**Default by country:** a small table bundled in the app. Country comes from the device time-zone ID through the tz database's `zone1970.tab`, which is offline and needs no reverse geocoding. Draft table:

| Country | Method | Asr |
|---|---|---|
| SA | Umm al-Qura | Shāfiʿī (standard) |
| EG, SY, LB, SD, LY | Egyptian | standard |
| AE | Dubai | standard |
| KW / QA / BH / OM | Kuwait / Qatar / Gulf / Gulf | standard |
| JO, MA, DZ, TN | Jordan / Morocco / Algeria / Tunisia | standard |
| TR | Turkiye (Diyanet approximation) | standard |
| PK, IN, BD, AF | Karachi | **Ḥanafī** |
| IR | Tehran | standard |
| MY, SG, BN, ID | Singapore / Indonesia (JAKIM has no preset; Singapore's 20°/18° is close) | standard |
| US, CA | ISNA *(open decision, §12: many North American mosques use ISNA; Moonsighting Committee is common too)* | standard |
| GB, IE | Moonsighting Committee *(open)* | standard |
| FR, RU, PT | France / Russia / Portugal | standard |
| everything else | MWL | standard |

High latitude defaults to `recommended()`. **The confirm screen shows the result in words** ("Egyptian General Authority · Asr: standard"), with one *Change* link. Every value is checked by one table-driven test against published timetables for Makkah, Cairo, Dubai, Karachi, Istanbul, London, Oslo, Toronto and Jakarta, accepting ±1 minute.

**Manual adjustments:** ± minutes per prayer (the "match my mosque" adjustment), plus a global DST-safe offset. All times are computed in the location's time zone, not the phone's, so a manually chosen city in another zone still shows correctly.

**Location:** ask only for **approximate** location (Android `ACCESS_COARSE_LOCATION`; iOS "Precise: off" is fine). Times shift by about a minute per 15–25 km east–west, so a coarse fix of 1–3 km is plenty. One-shot only, when the app is in use. **No background location, ever.** Alternative: an offline city search (GeoNames `cities15000`, CC BY 4.0, about 1 MB compressed).

**Hijri:** the [`hijri`](https://pub.dev/packages/hijri) package (BSD-2-Clause) does Umm al-Qura conversion. Check it against R.H. van Gent's Umm al-Qura tables ([Utrecht](https://webspace.science.uu.nl/~gent0113/islam/ummalqura_table.htm)) in one test. Actual sighting can land up to 2 days after the Umm al-Qura date ([van Gent](https://webspace.science.uu.nl/~gent0113/islam/ummalqura_adjust.htm)), so offer a −2…+2 day adjustment and never claim to announce Ramadan or Eid.

---

## 5. Qibla

- **Bearing:** the great-circle initial bearing from the user to the Kaʿbah (21.4225° N, 39.8262° E), measured from **true** north. `adhan_dart`'s `Qibla` does this. Computed offline.
- **Heading must be true, not magnetic.**
  - **iOS:** `CLHeading.trueHeading` (CoreLocation applies declination; it needs a location fix, and the coarse fix we already have is enough).
  - **Android:** take the rotation-vector azimuth (magnetic) and add `android.hardware.GeomagneticField(lat, lon, alt, time).getDeclination()`, which is built into the OS.
  - In Flutter, `flutter_compass` is commonly reported as magnetic-only ([true_compass comparison](https://pub.dev/packages/true_compass)). Options: a ~60-line platform channel on each side, or `true_compass` (bundles the public-domain WMM2025). **Spike both; prefer the OS APIs** (no model file to update; WMM2025 is valid until late 2029: [NOAA](https://www.ncei.noaa.gov/news/world-magnetic-model-2025-released)).
- **Accuracy state** (the one thing that makes a compass trustworthy):
  - iOS: `headingAccuracy`.
  - Android: `SensorManager` accuracy (`SENSOR_STATUS_ACCURACY_LOW` and so on).
  - When accuracy is low, the screen's single action becomes **"Calibrate"**: a figure-8 animation plus "move away from metal, magnets and phone cases with magnets".
  - Near the magnetic poles (WMM "blackout zones"), say the compass is unreliable and show the bearing in degrees.
- **Feedback:** a gentle haptic tick when within ±3° of the qibla. No sound.
- **The iOS Simulator has no compass**, so test on devices only.

---

## 6. Notifications and the athan: platform constraints and how we handle each

This is the hardest part of the app and the reason competitors get one-star reviews. It is designed per platform, with native code where Flutter plugins are weak.

### 6.1 Shared design
- **One scheduler** in Dart computes the next *N* events (prayers, optional reminders, adhkar reminders) from settings, then hands a flat list to the platform layer.
- **Reschedule triggers:** app open, settings change, location change, time or time-zone change, reboot, and app update.
- **Delivery modes per prayer:**
  - Athan: Android plays the full recording; iOS plays a cut of 30 s or less.
  - Short tone (a takbīr of about 5 s).
  - Silent (notification only).
  - Off.
- **Fajr has its own athan** (with الصلاة خير من النوم).
- **Ringer mode** decides by default: if the phone is on silent or vibrate, no athan audio plays. There's a per-user override, "Play athan even on silent", which works on Android only (on iOS only AlarmKit can do this, see §6.3).

### 6.2 Android

| Constraint | Fact | What we do |
|---|---|---|
| **Exact alarms** | Since Android 14, `SCHEDULE_EXACT_ALARM` is **denied by default** for new installs of apps targeting 33 or higher, unless they are alarm or calendar apps ([Android](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)). `USE_EXACT_ALARM` is granted at install, but Play limits it to apps whose "core, user facing functionality requires precisely-timed actions" (alarm, timer and calendar given as examples). It needs a Play Console declaration and review, and apps that don't qualify can be blocked ([Play policy](https://support.google.com/googleplay/android-developer/answer/13161072)). | **Declare `USE_EXACT_ALARM`** and argue the athan *is* an alarm clock for the five prayers: user-set, at precise times, the app's core function. Prayer apps already declare it ([a2salah](https://sites.google.com/view/a2salah/home), [Quran Oasis](https://sites.google.com/view/quran-oasis-app/home)), though no public record of Play's decisions turned up. **Fallback if rejected:** switch to `SCHEDULE_EXACT_ALARM`, with an in-app explainer and a button to `ACTION_REQUEST_SCHEDULE_EXACT_ALARM`, and listen for the permission-state broadcast. Build both paths behind one flag from day one. |
| **Doze** | Inexact alarms are batched in Doze; only exact `setAlarmClock` / `setExactAndAllowWhileIdle` fire on time. | Use `AlarmManager.setAlarmClock()`. It's the most Doze-proof, shows the alarm icon, and fits the "alarm clock" justification. **Schedule only the next event**; when it fires, it schedules the following one, plus a daily WorkManager safety net that rebuilds the chain. |
| **Full athan audio** | A notification-channel sound can't be stopped or controlled well. From the background, a foreground service may start when "your app invokes an exact alarm to complete an action that the user requests" ([Android FGS restrictions](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start)). Android 14+ requires the FGS type `mediaPlayback` and `FOREGROUND_SERVICE_MEDIA_PLAYBACK` ([FGS types](https://developer.android.com/guide/components/fg-service-types)). | Alarm → `BroadcastReceiver` → **foreground service of type `mediaPlayback`** plays the full athan on the alarm audio stream (`USAGE_ALARM`), with a notification whose actions are *Stop* and *Mute this prayer today*. Volume-down stops it. Audio focus pauses music. Stop on an incoming call. **Native Kotlin, about 300 lines**, behind a method channel. Don't fight `flutter_local_notifications` for this. |
| **Full-screen intent** | From Jan 2025, `USE_FULL_SCREEN_INTENT` is granted by default only to calling and alarm apps ([AOSP](https://source.android.com/docs/core/permissions/fsi-limits), [Play](https://support.google.com/googleplay/android-developer/answer/13392821)). | **Not used in MVP.** A heads-up notification with Stop is enough. Revisit for a "Fajr wake-up" mode. |
| **Reboot, time change, update** | Alarms are cleared on reboot. | Receivers for `BOOT_COMPLETED`, `LOCKED_BOOT_COMPLETED`, `TIME_SET`, `TIMEZONE_CHANGED` and `MY_PACKAGE_REPLACED` rebuild the chain. |
| **OEM battery killers** | Xiaomi, Samsung, Huawei, OnePlus and others kill or freeze background apps. Updates can reset exemptions ([dontkillmyapp](https://dontkillmyapp.com/problem), [OneSignal](https://onesignal.com/blog/manufacturers-interfere-with-reliable-notifications/), [dev.to](https://dev.to/stoyan_minchev/what-android-oems-do-to-background-apps-and-the-11-layers-i-built-to-survive-it-28bb)). `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` is itself Play-restricted. | **"Make sure the athan arrives" screen**, shown in onboarding and again whenever a check fails. Its checklist: notifications on, exact alarm allowed, battery "unrestricted". The *Fix* buttons open `ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS` (needs no permission). Per-manufacturer steps link to dontkillmyapp. **Self-check:** each delivered athan writes a timestamp. If the app opens and finds a prayer whose athan didn't fire, it shows the check screen once ("The Asr athan didn't arrive. Here's how to fix it."). |
| **Notification permission** | `POST_NOTIFICATIONS` is a runtime permission on Android 13+. | Asked on the onboarding screen whose one action is "Allow the athan". |

### 6.3 iOS

| Constraint | Fact | What we do |
|---|---|---|
| **64 pending local notifications** | iOS keeps at most 64 pending local notifications per app. The rest are dropped silently (the older docs say the soonest-firing 64 are kept) ([Apple forums](https://developer.apple.com/forums/thread/811171), [forums](https://developer.apple.com/forums/thread/106829)). | **Fill the budget in time order:** 5 prayers a day is about 11 days. Optional pre-prayer reminders and morning/evening adhkar reminders cut that to about 5–7 days, so the settings screen shows the cost ("Reminders cover the next 6 days unless you open the app"). **The last slot is reserved** for an honest "Open Athan to keep the athan coming" notification at the end of the window (Mawaqit's pattern). |
| **Rescheduling** | No exact background wake on iOS. `BGAppRefreshTask` is opportunistic: the system decides when, based on usage, and may never run it for a rarely opened app. | Reschedule (1) on every app open and on return to the foreground, (2) in `BGAppRefreshTask` (registered, earliest begin date 12 h), (3) on the system time-zone change notification. Widget timeline reloads (v1.1) can't schedule notifications, so don't count on them. Most users open a prayer app daily, so the 64-slot window almost never runs out. Measure that in TestFlight. |
| **30-second sound limit** | Custom notification sounds must be shorter than 30 s, in aiff, wav or caf, bundled in the app; longer files fall back to the default sound ([Apple](https://developer.apple.com/documentation/usernotifications/unnotificationsound)). Muslim Pro and Mawaqit both document this ([Muslim Pro help](https://support.muslimpro.com/hc/en-us/articles/200588785-The-app-is-not-playing-the-full-Adhan-iOS-Android), [Mawaqit](https://help.mawaqit.net/en/articles/15434897-why-does-the-adhan-cut-out-on-my-iphone)). | Ship a **cut of 29 s or less** of each athan: the takbīrāt and first shahādah, with a clean fade. **Tapping the notification opens the "athan" screen, which plays the full recording** in-app. That's what good iOS apps do, and we say it plainly in settings: "On iPhone the athan in a notification is limited to 30 s by Apple. Tap it to hear the whole athan." **No background-audio hacks** (a silent loop to keep the app alive is a review rejection and a battery drain). |
| **Focus and silent mode** | Notifications obey the ring/silent switch and Focus. The `timeSensitive` interruption level can break through Focus if the user allows it; it needs the *Time Sensitive Notifications* capability, no Apple approval. | Mark prayer notifications `.timeSensitive`. Onboarding explains: "Allow Athan in your Focus modes to hear Fajr while sleeping". Silent mode still silences it; see AlarmKit below. |
| **Critical alerts** | An entitlement that bypasses silent mode and Focus. Apple grants it for health, safety, security and emergency (glucose monitors, emergency alerts) and usually answers others with "use Time Sensitive" ([guide](https://newly.app/how-to/critical-alerts-entitlement), [forums](https://developer.apple.com/forums/thread/690030)). | **Not realistic. Don't plan on it.** We may request it once (it costs nothing), but nothing depends on it. |
| **AlarmKit (iOS 26+)** | Third-party alarms that ring like the Clock app: they break through silent mode, with a custom sound. Needs user authorisation and `NSAlarmKitUsageDescription`. Forum reports: the custom sound plays once instead of looping, there's no duration control, and densely scheduled alarms fire late or not at all ([WWDC25](https://developer.apple.com/videos/play/wwdc2025/230/), [forums](https://developer.apple.com/forums/thread/825427), [forums](https://developer.apple.com/forums/thread/807752)). | **v1.1 spike: an opt-in "Fajr alarm" only** (one alarm a day, which avoids the dense-scheduling bug). If it holds up on devices, also offer it as "athan even on silent" per prayer. If not, drop it. The plugin is native Swift behind a channel; no maintained Flutter wrapper is assumed. |
| **Widgets (v1.1)** | WidgetKit: home-screen and lock-screen (`accessoryCircular`, `accessoryRectangular`, `accessoryInline`) families. Timelines are budgeted by the system. | Dart writes the **next 7 days of computed times** as JSON to an App Group, via [`home_widget`](https://pub.dev/packages/home_widget). A SwiftUI widget reads it and builds a timeline with one entry per prayer. The countdown uses `Text(date, style: .timer)`, so it needs no refreshes. No prayer maths in Swift: one source of truth. |
| **Live Activities (later)** | They end after **8 h active** plus up to 4 h on the Lock Screen. Apple says use them for events with a clear start and end ([ActivityKit](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities), [HIG](https://developer.apple.com/design/human-interface-guidelines/live-activities)). They start only from the foreground without push. | Not an all-day countdown. Later: a user-started "**Iftar countdown**" in Ramadan, or "until next prayer", started from the app and ended at the prayer. |
| **Location permission** | `NSLocationWhenInUseUsageDescription`; approximate is allowed. Guideline 5.1.5: explain the purpose. | When-in-use, one-shot, purpose text: "to calculate prayer times and the qibla on your phone. Your location never leaves it." |
| **Heading** | CoreLocation `trueHeading` and `headingAccuracy`. | See §5. |
| **Apple Watch (later)** | A separate watchOS target. A complication can read the same App Group JSON through a watch app. | Later, after widgets. |

### 6.4 Athan audio rights
- No source confirmed that famous recordings (Makkah, Madinah, Mishary) are free to bundle. Developers ask AlAdhan the same question in public, with no visible answer ([community.islamic.network](https://community.islamic.network/d/255-permission-to-bundle-an-adhan-audio-file-in-our-android-app-nurafiq)).
- **The plan:** for MVP, ship **2 voices plus a Fajr variant**, each with **written permission** from the muezzin or rights holder: a recording made for us, a local muezzin, or a written licence. A CC BY field recording such as [Freesound #255231](https://freesound.org/s/255231) can serve as a placeholder.
- Credit every voice on the About screen.
- **Never stream audio**; bundle it so it works offline and leaks nothing.

---

## 7. Content: adhkar and sources

| Content | Source | Licence status | Plan |
|---|---|---|---|
| Arabic text of the adhkar | **Ḥiṣn al-Muslim** (Saʿīd al-Qaḥṭānī) | Printed editions carry a notice allowing anyone to **print and distribute it free of charge**, changes included, with conditions ([archive.org scan](https://archive.org/download/7sn-muslem/7sn_muslem.pdf)). That covers free distribution, and Athan is free with no ads. It is not an open licence. | Use the Arabic texts. Record the edition used. **Email the publisher or rights holders for written confirmation** before launch (open decision). |
| Hadith references and grading | Primary collections (Bukhārī, Muslim, the Sunan) and al-Albānī's gradings as cited in Ḥiṣn al-Muslim | The facts are free; check each by hand | Every item gets a `source` field (collection + number) and a `grade`. Content review like the tajweed app's `04-content-review.md`. **Ship only ṣaḥīḥ or ḥasan items in MVP.** |
| Qurʾānic adhkar (Āyat al-Kursī, al-Muʿawwidhāt, end of al-Baqarah) | Tanzil Uthmani text | Tanzil licence: verbatim, credit and link; already used by Tajweed Path | Reuse the tajweed app's pipeline. |
| English translation | Darussalam's *Fortress of the Muslim* is commercial. Other editions have unclear licences ([search](https://enc.islamhouse.com/en/books/819/1)). JSON repos on GitHub show no licence ([ecosyste.ms](https://awesome.ecosyste.ms/projects/github.com%2Frn0x%2Fhisn_almuslim_json)). | **Unclear: don't copy** | **Write our own plain-English meaning** (as the tajweed app did for 58 lessons), reviewed. It's short: about 60 items in MVP. |
| Transliteration | Our own | Ours | Optional and hidden by default (Arabic-first). |
| Adhkar audio | hisnmuslim.com and similar, licence unstated | **Unclear** | Not in MVP. Later: our own recordings, or a written licence. |
| City list | GeoNames `cities15000` | CC BY 4.0 | Credit on About. |
| Time-zone → country | IANA tz `zone1970.tab` | Public domain | Bundled. |
| Magnetic model (if used) | WMM2025 | Public domain ([NOAA](https://www.ncei.noaa.gov/products/world-magnetic-model)) | Only if the OS-API spike fails. |

**MVP adhkar scope (about 60 items):** morning, evening, after the obligatory prayer, before sleep, on waking. Each item has: Arabic (with tashkīl), meaning, count, source and grade, and an optional "why" line (its virtue, sourced). **Guideline 1.1.5 (inaccurate or misleading quotations of religious texts)** applies to us directly, so the review is mandatory, not optional.

---

## 8. Architecture

**Flutter** (stable channel), matching the Flutter port of Tajweed Path that is being planned in parallel. Nothing in the research argues against it. The hard parts are platform-native in *any* cross-platform stack (the Android alarm FGS, iOS notifications and WidgetKit, the compass). Flutter keeps prayer maths, settings and UI in one codebase, and native code stays at the edges, behind about 4 small method channels.

```
lib/
  core/        prayer.dart (adhan_dart wrapper + country defaults), hijri.dart, qibla.dart, schedule.dart (next-N events)
  data/        settings.dart (one immutable Settings object, JSON in shared_preferences), adhkar.json (bundled)
  ui/          today/, qibla/, adhkar/, settings/, onboarding/, athan/ (now-playing)
  theme/       tokens.dart (Sand & Ink), type.dart   ← candidates for the shared package (§10)
  i18n/        ar.json, en.json
android/…/     AthanAlarmReceiver.kt, AthanService.kt (mediaPlayback FGS), BootReceiver.kt, Compass.kt
ios/Runner/    Notifications.swift (64-slot scheduler), Compass.swift (trueHeading); v1.1: Widget extension, AlarmKit
```

**Packages (keep the list short):**

| Need | Package | Note |
|---|---|---|
| Prayer times, qibla bearing | `adhan_dart` | MIT |
| Hijri | `hijri` | BSD-2; one test against van Gent |
| Location (one-shot, coarse) | `geolocator` | Or a 20-line channel, if its permission flow is too heavy |
| Time zones | `timezone` + `flutter_timezone` | Compute in the location's zone |
| iOS local notifications | `flutter_local_notifications` | iOS only: scheduling plus `.timeSensitive`. Android uses our native alarm chain |
| Settings | `shared_preferences` | One JSON blob; no database needed |
| Audio in-app (the full-athan screen) | `just_audio` | Or the platform channel we already have |
| Widgets (v1.1) | `home_widget` | Data bridge; the UI stays native (SwiftUI, Glance) |
| State | plain `ValueNotifier`/`ChangeNotifier` | No Riverpod or Bloc until something hurts |

- **Offline-first:** the app needs **no network at all**. No backend, no account, no analytics, no crash SDK in MVP (see §11 for the trade-off). Settings survive reinstall through OS backup (Android Auto Backup, iOS device backup).
- **Settings model:** location (coords, name, tz), method, asr, high-lat rule, per-prayer adjustments, per-prayer delivery mode, voice, hijri offset, language, theme, reminders. One object, one JSON file, versioned for migrations.
- **Tests:** a table test for times in 9 cities, a Hijri table test, a qibla bearing test (London ≈ 118.99°, NYC ≈ 58.5°), a scheduler test (the 64-slot budget and ordering), and device checklists for alarms and the compass (no framework).

---

## 9. MVP screens: one primary action each

Navigation: **three tabs: Today · Qibla · Adhkar** (اليوم · القبلة · الأذكار), with settings behind a gear on Today only. No ornamental headers, no nudge cards (lessons from docs/17).

| # | Screen | Purpose (one line) | The one primary action |
|---|---|---|---|
| 1 | **Welcome** | Name, one line of promise, language picker. | **Continue** |
| 2 | **Location** | Explain why and that it stays on the phone. | **Use my approximate location** (secondary text link: *Choose a city*) |
| 3 | **City search** | Offline list, for when GPS is denied or unwanted. | **Pick a city** (tap a row) |
| 4 | **Your times** | Shows today's 6 times and the chosen method in words. | **These look right** (link: *Change method*) |
| 5 | **Allow the athan** | Notification permission, plus the exact alarm (Android) or Time Sensitive (iOS) explainer. | **Allow the athan** |
| 6 | **Make sure it arrives** (Android; iOS shows only the Focus tip) | Checklist of permissions, battery and OEM steps. Also reached later from settings or after a missed athan. | **Fix next item** (the first failing check) |
| 7 | **Today** (tab) | Next prayer, large, with a countdown. The day's six times. Hijri and Gregorian date on one line. | **Contextual, one only**: after Fajr until noon → *Morning adhkar*; after Asr → *Evening adhkar*; within 20 min after a prayer → *Adhkar after prayer*; otherwise none. Times are read, not tapped. |
| 8 | **Prayer sound** (tap a time row on Today) | Delivery mode for this prayer: athan / tone / silent / off, plus ± minutes. | **Done** |
| 9 | **Qibla** (tab) | Compass dial, a degrees label, and the accuracy state. | None when calibrated (the action is turning the phone). **Calibrate** when accuracy is low. |
| 10 | **Adhkar** (tab) | Five categories; the time-relevant one is listed first. | **Open the category** (tap a row) |
| 11 | **Dhikr reader** | One dhikr per screen: Arabic large, meaning folded, source line. | **Tap anywhere to count**. It moves to the next item on reaching the count, with a haptic. |
| 12 | **Athan playing** | Opens from the notification (iOS: plays the full athan; Android: controls the running service). | **Stop** |
| 13 | **Settings** | Method, asr, high latitude, adjustments, voice, Hijri ±, language, theme, "Make sure it arrives", About and credits. | No primary; a plain list of rows. |

Thirteen screens; onboarding is 5 taps to a working athan.

---

## 10. What to share with Tajweed Path

| Thing | Share how |
|---|---|
| **Colour tokens**: Sand & Ink (`background #f8f5ef`, ink `#1c1a17`, teal `primary #115e57` / dark `#5fd3c2`, fill `#23756a`, gold `secondary #77561a` and `gold #94702a`, success and error roles) | The **same role names** as `src/styles/app.css` → a Dart `ColorScheme` plus a `ThemeExtension` for gold, focus and success. The contrast rules from docs/18 carry over. Athan may take its own *accent* (for example a deeper teal or night-blue for the Isha/Fajr hours) but keeps the roles. |
| **Type**: Noto Sans Arabic (UI), Noto Naskh Arabic (headings), Amiri Quran (āyāt), Inter (Latin); Arabic never below 14 px; Arabic sizes one step up | The same scale as `docs/13-design-system.md` → `TextTheme`. Bundle the fonts (offline; no Google Fonts fetch at runtime). |
| **Radii, spacing, 48 px targets** (`radius-control 14`, `radius-card 18`, spacing xs–xl) | Constants in the same file. |
| **i18n**: Arabic is the default until a language is chosen; strings keyed by the English text in JSON files per area; Arabic-Indic digits; `، ` as the separator | The same convention, so translators and reviewers work the same way in both apps. Whatever the Flutter port picks (ARB or JSON), Athan uses the same. |
| **Content-review discipline** (each claim against a source, a review doc) | Reuse the process and the doc template for the adhkar. |
| **Tanzil pipeline** | Reuse for Qurʾānic adhkar. |
| **Cross-links** | Athan's About gets one row: "Learn tajweed → Tajweed Path", and the reverse. No other coupling. |

**A shared Flutter package?** Yes, eventually: `sand_ink` (theme, type scale, RTL helpers, Arabic digits, Hijri formatting, i18n loader).
- **Don't create it first.** Start by copying `tokens.dart`/`type.dart` from the tajweed port (or Athan writes them first and the port copies them).
- Extract to a package (a git dependency or a small monorepo `packages/sand_ink`) once **both apps use it in production** and the API has stopped moving. Rule of two; likely right after Athan's MVP.
- Nothing else is shared: no backend, Supabase, or accounts.

---

## 11. App Store and Google Play release

**Accounts:**
- Apple Developer Program, $99/yr. An individual account shows the legal name as seller; an organisation needs a D-U-N-S number.
- Google Play, $25 once. **A personal account created after 13 Nov 2023 must run a closed test with at least 12 testers opted in for 14 continuous days before it can apply for production** ([Play help](https://support.google.com/googleplay/android-developer/answer/14151465)). That's about 3 weeks on the Android launch path. Recruit testers (family, the tajweed learners' circle) in phase 0. An organisation account avoids this but needs D-U-N-S (up to about 30 days).

**Testing:**
- iOS: TestFlight internal (no review), then external (needs Beta App Review, usually about a day).
- Android: internal track, then the closed track (the 14-day clock), then production.
- **Device matrix for alarms:** Pixel, Samsung (One UI), Xiaomi/Redmi (HyperOS), plus one Oppo/Realme or Huawei if available; iPhone on the current and previous iOS.

**Privacy declarations:**
- **App Store privacy label: "Data Not Collected".** Apple: "Data that is processed only on device is not 'collected' and does not need to be disclosed" ([Apple](https://developer.apple.com/app-store/app-privacy-details/)). This holds only while there are **no crash or analytics SDKs**. Adding Crashlytics or Sentry would mean declaring "Diagnostics", so MVP ships without them. Use OS crash reports (Xcode Organizer, Play Console vitals) instead.
- **Play Data safety: "No data collected, no data shared."** Google exempts data accessed only on the device and never sent off it ([Play](https://support.google.com/googleplay/android-developer/answer/10787469)).
- **A privacy policy URL is still required on both stores.** Host one page saying exactly the above (GitHub Pages, like the tajweed app).
- Apple's export compliance: `ITSAppUsesNonExemptEncryption = NO`.

**Play declarations:**
- `USE_EXACT_ALARM` (core-functionality declaration; possible rejection → fallback, §6.2).
- **Foreground service type `mediaPlayback`** (App content declaration, including a **demo video** of the athan playing and being stopped: [Play](https://support.google.com/googleplay/android-developer/answer/13392821)).
- Notifications: no declaration needed.
- Target the API level Play currently requires (check at release; it rises each August).

**App Review guidelines that matter:**
- **4.2 Minimum Functionality:** fine. Native notifications, compass and offline computation are "app-like".
- **4.3(b) Spam / saturated categories:** prayer apps are a crowded category. Lower risk because we're not a template clone, but **say in the review notes what's different**: no ads, no data collection, Arabic-first, regional defaults, sourced adhkar.
- **1.1.5:** "inaccurate or misleading quotations of religious texts" → the sourced, reviewed adhkar (§7).
- **1.1.1:** no commentary on other groups. We have none.
- **5.1.5 Location:** purpose string, when-in-use only, the app works without it (city search).
- **4.5.4:** the app must work without notifications (it does: times, qibla, adhkar), and no promotional notifications.
- **Background modes:** **don't** declare the `audio` background mode to "keep the athan alive". The full athan plays only while the app is in the foreground after a tap. Declaring audio without continuous playback is a common rejection.
- AlarmKit (v1.1) needs `NSAlarmKitUsageDescription`, and the alarm should be user-initiated (the user turns on "Fajr alarm").

**Store presence:** Arabic and English listings; screenshots in both. Category: Lifestyle (Apple) and Lifestyle (Play). Rated 4+ / Everyone. Name check: "Athan" is taken as a store title by IslamicFinder and others, so we need a distinct store name (open decision).

---

## 12. Risks

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| Play rejects `USE_EXACT_ALARM` for a prayer app | Medium / High (late athan on new installs) | Dual path behind a flag; `SCHEDULE_EXACT_ALARM` with a clear explainer; the self-check detects missed athans. |
| OEM battery killers silence the athan | High on Xiaomi and Samsung / High | Alarm-clock alarms, the reboot and time receivers, the "Make sure it arrives" screen, missed-athan detection, dontkillmyapp steps. Device-matrix testing before every release. |
| iOS users expect the full athan from a notification | Certain / Medium (1-star "athan cuts off") | A good ≤29 s cut, tap for the full athan, an honest line in settings and the App Store description. AlarmKit spike for Fajr. |
| iOS 64-slot window runs out for users who rarely open the app | Low–Medium / High for that user | Budget display, a reserved "open the app" notification, BGAppRefresh. |
| Athan audio rights | Medium / High (takedown) | Bundle only recordings with written permission; credit them. |
| Adhkar content error | Medium / High (trust, guideline 1.1.5) | Ṣaḥīḥ/ḥasan only, per-item source, a review document, a second reviewer. |
| Ḥiṣn al-Muslim text permission is narrower than we think | Low–Medium / Medium | Written confirmation; the fallback is building the list from primary hadith sources directly (the facts are free). |
| "Your times don't match my mosque" | High / Medium | Country defaults, a method shown in words, ± minutes per prayer. Later: "match my mosque". |
| Compass inaccuracy (magnetic cases, metal) | High / Medium | True heading, accuracy state, calibrate action, a degrees readout. Later: a sun or map qibla. |
| Hijri date disputes (Ramadan/Eid) | High / Low | ±2-day adjustment; never "announce" dates. |
| App Store 4.3(b) saturated category | Low–Medium / Medium | Clear differentiation in the review notes. |
| Flutter plugin gaps or breakage (notifications, compass) | Medium / Medium | Own the critical paths in small native files rather than in heavy plugins. |
| Solo maintenance of OS-policy churn (Android 17, iOS 27) | Certain / Medium | Keep native surfaces small; follow the Play policy calendar. |
| Play's 12-tester, 14-day gate delays the Android launch | Certain (personal account) / Low | Start the closed test in phase 2, not at the end. |

---

## 13. Phases and effort (both platforms)

Assumes one developer working with AI assistance, at roughly the pace of the tajweed app, with Android and iOS built together from one codebase. "Week" means a focused working week.

| Phase | Scope | Android | iOS | Shared | Elapsed |
|---|---|---|---|---|---|
| **0. Spikes** | Exact alarm + FGS athan on Pixel, Samsung and Xiaomi; 64-slot scheduler + 29 s caf; true heading on both; `adhan_dart` against 9 city timetables; Hijri table check. Recruit 12+ Play testers; enrol both developer accounts. | 3 d | 2 d | 2 d | **~1.5 wk** |
| **1. Core** | Settings model, country defaults, location and city search, onboarding 1–4, Today, Hijri, theme tokens, i18n AR/EN | — | — | 2 wk | **2 wk** |
| **2. Athan delivery** | Android native alarm chain + FGS + receivers + "Make sure it arrives"; iOS scheduler + Time Sensitive + BGAppRefresh + athan-playing screen; prayer sound screen; missed-athan self-check. **Start the Play closed test** with a build that has times + athan. | 1.5 wk | 1 wk | 0.5 wk | **~3 wk** |
| **3. Qibla** | Native heading channels, dial, calibration state, haptics | 2 d | 2 d | 1 d | **1 wk** |
| **4. Adhkar** | Content: about 60 items, sources, grades, English meanings, review (**the long pole; can run in parallel from phase 1**). UI: categories, reader with counter, contextual button on Today. | — | — | content 2 wk (parallel) + UI 1 wk | **1 wk** after content |
| **5. Release** | Audio rights cleared and voices recorded or edited; store listings AR/EN; privacy page; Play declarations (exact alarm, FGS video); TestFlight external; device-matrix pass; fixes | 0.5 wk | 0.5 wk | 1 wk | **~2 wk** (the Play 14-day clock already running) |
| **MVP total** | | | | | **≈ 10–11 weeks** to both stores |
| **v1.1** | Widgets (SwiftUI home and lock screen + Android Glance, from shared JSON), Ramadan mode, pre-prayer and Jumuʿah reminders, month timetable, travel prompt, tasbih, AlarmKit Fajr spike | 1 wk | 1.5 wk | 1.5 wk | **~4 wk** (must ship before Ramadan, about 8 Feb 2027) |
| **Later** | Watch and Wear OS, Live Activity iftar, events calendar, private log, map qibla, more adhkar, mosque times (opt-in) | | | | as wanted |

iOS costs less than Android in the athan phase (the scheduler is simpler) but more in v1.1 (WidgetKit, AlarmKit, App Groups). Overall the two platforms cost roughly the same.

**Calendar check:** starting in early December 2026, the MVP lands around mid-February 2027, about when Ramadan 1448 begins (expected around 8 Feb 2027 by Umm al-Qura; verify). **Ramadan mode doesn't fit unless it moves into the MVP and something else is cut** (see open decision 1).

---

## 14. Open decisions for the user

**Decided 2026-11-21:** (1) b, launch before Ramadan 2027; (2) a new name, lead candidate ميقات / Miqat, availability in docs/athan/02-voices-and-name.md; (3) personal accounts shared by both apps, one bought domain for both app ids; (4) openly licensed recordings only (see 02); no accounts; (10) yes. **Theme:** the user wants Tajweed Path's Sand & Ink theme replicated (§10), with changes only where the prayer app needs them (e.g. a night accent for Fajr/Isha, the large time display). The rest below follow the recommendations.


1. **Ramadan 2027:** (a) launch the MVP after Ramadan with Ramadan mode in v1.1 for 2028, or (b) cut adhkar to morning/evening only and move Ramadan mode (imsak, suhoor, iftar, Isha +30) into the MVP to launch before about 8 Feb 2027. *Recommendation: (b). Ramadan is when people install prayer apps.*
2. **Store name.** "Athan" is taken in both stores. Candidates: "Athan · أذان" with a suffix, a distinct Arabic name (for example "مواقيت" or "حيّ على الصلاة"), or a name that sits beside "Tajweed Path" (for example "Salah Path · مسار الصلاة"). Needs a decision before store enrolment.
3. **Developer account:** personal (live in about 3 weeks, but the 12-tester rule applies) or organisation (D-U-N-S, up to about 30 days, no tester gate, and an organisation name shown as the seller). Also decide whether both apps publish under the same account.
4. **Athan voices:** whose voices, and who asks for the written permission? Is commissioning a recording an option?
5. **North America and UK defaults:** ISNA or Moonsighting Committee? (It matters for Fajr and Isha by up to 30+ min in summer.)
6. **Ḥiṣn al-Muslim:** OK to email the publisher for written confirmation? Who reviews the adhkar content (the same reviewer as the tajweed content)?
7. **Crash reporting:** no SDK, keeping "Data Not Collected" (recommended), or opt-in Sentry with a "Diagnostics" label?
8. **Play exact-alarm path:** try `USE_EXACT_ALARM` first (recommended), or go straight to the user-granted `SCHEDULE_EXACT_ALARM` to avoid review risk?
9. **Monetisation:** free forever with no IAP, or an optional "support the app" tip, or a waqf/donation link? (It affects the store labels only if IAP is added.)
10. **Shared package timing:** happy to copy the tokens now and extract `sand_ink` after the MVP?

---

## 15. Sources

**Competitors and privacy:**
- Muslim Pro and X-Mode, 2020: [Middle East Eye](https://www.middleeasteye.net/news/us-military-buying-location-data-popular-muslim-app) · [Christian Century](https://www.christiancentury.org/article/news/popular-muslim-prayer-app-ends-relationship-firm-selling-data-us-military) · [The Week](https://theweek.com/speedreads/950264/military-reportedly-bought-location-data-from-muslim-prayer-dating-apps-used-by-nearly-100-million-people)
- Muslim Pro reviews: [unitq](https://unitq.com/unitq-scorecards/muslimproramadan2023) · [Islamtics](https://islamtics.com/?p=21176) · [grand-screen](https://grand-screen.com/apps/muslim-pro-quran-athan-prayer/reviews/) · [justuseapp](https://justuseapp.com/en/app/388389451/muslim-pro-quran-athan/reviews) · [Dhaka Tribune](https://www.dhakatribune.com/amp/feature/tech/420193/muslim-pro-alternatives-5-ad-free-prayer-and) · [Muslim Pro help: full adhan](https://support.muslimpro.com/hc/en-us/articles/200588785-The-app-is-not-playing-the-full-Adhan-iOS-Android)
- IslamicFinder Athan: [App Store](https://apps.apple.com/qa/app/athan-ramadan-2026-al-quran/id505858403) · [appfollow](https://apps.appfollow.io/android/athan-prayer-times-al-quran/com.athan?country=in) · [justuseapp](https://justuseapp.com/en/app/505858403/athan-prayer-times-al-quran/reviews)
- Pillars: [App Store](https://apps.apple.com/sa/app/id1559086853) · [justuseapp](https://justuseapp.com/en/app/1559086853/pillars-prayer-times-qibla/reviews) · [The Muslim Vibe](https://themuslimvibe.com/western-muslim-culture/meet-the-founders-of-the-pillars-app-the-young-muslim-duo-behind-an-innovative-new-islamic-app)
- Mawaqit: [App Store](https://apps.apple.com/us/app/id1460522683) · [help: adhan cut on iPhone](https://help.mawaqit.net/en/articles/15434897-why-does-the-adhan-cut-out-on-my-iphone)
- Salaat First: [App Store](https://apps.apple.com/app/id1181948844) · [unitq](https://unitq.com/unitq-scorecards/salaatfirstprayertimes)
- Al-Moazin: [App Store](https://apps.apple.com/us/app/al-moazin/id637678038)
- Athan Pro: [App Store](https://apps.apple.com/app/id1587151803)
- iPray: [App Store](https://apps.apple.com/us/app/id288054534)
- Azan Alarm: [App Store](https://apps.apple.com/app/azan-alarm/id959275299)

**Calculation:**
- [adhan_dart](https://pub.dev/packages/adhan_dart) · [batoulapps/Adhan](https://github.com/batoulapps/Adhan) · [adhan-js METHODS.md](https://raw.githubusercontent.com/batoulapps/adhan-js/master/METHODS.md) · [praytimes.org](https://praytimes.org/calculation) · [AlAdhan methods](https://aladhan.com/calculation-methods) · [hijri](https://pub.dev/packages/hijri) · [van Gent Umm al-Qura](https://webspace.science.uu.nl/~gent0113/islam/ummalqura_table.htm) · [van Gent adjustments](https://webspace.science.uu.nl/~gent0113/islam/ummalqura_adjust.htm)

**Qibla:**
- [NOAA WMM2025](https://www.ncei.noaa.gov/news/world-magnetic-model-2025-released) · [WMM product page](https://www.ncei.noaa.gov/products/world-magnetic-model) · [true_compass](https://pub.dev/packages/true_compass) · [flutter_qiblah](https://pub.dev/packages/flutter_qiblah)

**Android:**
- [Exact alarms denied by default](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms) · [Play exact-alarm policy](https://support.google.com/googleplay/android-developer/answer/13161072) · [FGS background-start exemptions](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start) · [FGS types](https://developer.android.com/guide/components/fg-service-types) · [FSI limits](https://source.android.com/docs/core/permissions/fsi-limits) · [Play FGS/FSI declarations](https://support.google.com/googleplay/android-developer/answer/13392821) · [dontkillmyapp](https://dontkillmyapp.com/problem) · [OneSignal on OEMs](https://onesignal.com/blog/manufacturers-interfere-with-reliable-notifications/) · [Play Data safety](https://support.google.com/googleplay/android-developer/answer/10787469) · [Play 12-tester rule](https://support.google.com/googleplay/android-developer/answer/14151465)

**iOS:**
- [UNNotificationSound (30 s)](https://developer.apple.com/documentation/usernotifications/unnotificationsound) · [64-notification limit](https://developer.apple.com/forums/thread/811171) · [limit workaround thread](https://developer.apple.com/forums/thread/106829) · [Critical alerts guide](https://newly.app/how-to/critical-alerts-entitlement) · [Critical alerts for alarm clocks (forum)](https://developer.apple.com/forums/thread/690030) · [AlarmKit WWDC25](https://developer.apple.com/videos/play/wwdc2025/230/) · [AlarmKit late firing](https://developer.apple.com/forums/thread/825427) · [AlarmKit sound once](https://developer.apple.com/forums/thread/807752) · [Live Activities](https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities) · [HIG Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities) · [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) · [App privacy details](https://developer.apple.com/app-store/app-privacy-details/) · [home_widget](https://pub.dev/packages/home_widget)

**Content:**
- [Ḥiṣn al-Muslim scan with the free-distribution notice](https://archive.org/download/7sn-muslem/7sn_muslem.pdf) · [IslamHouse editions](https://enc.islamhouse.com/en/books/819/1) · [hisn JSON repos (no licence)](https://awesome.ecosyste.ms/projects/github.com%2Frn0x%2Fhisn_almuslim_json) · [AlAdhan adhan-bundling question](https://community.islamic.network/d/255-permission-to-bundle-an-adhan-audio-file-in-our-android-app-nurafiq) · [Freesound CC BY adhan](https://freesound.org/s/255231) · [Quran Complex audio licence](https://qurancomplex.gov.sa/en/?p=3979)
