// "How it works": the short version for onboarding, the full one for #/guide.
import type { ReactNode } from 'react'
import { href } from '../../app/router'
import { Card, T } from '../../components'

export const BASICS: { ar: string; en: string; body: string }[] = [
  { ar: 'المسار', en: 'The course', body: 'Ten units that follow real surahs, from الناس back to الضحى, then الفاتحة and beyond. Lessons open one after another; each unit ends with a finale passage you recite, which opens the next unit.' },
  { ar: 'الدرس', en: 'A lesson', body: 'Seven short steps, about 15 minutes: hear real words, notice the sound, learn the rule, say it, find it in an ayah, check yourself, then recite a passage. At most two new lessons a day.' },
  { ar: 'المراجعة', en: 'Review', body: 'Every rule you learn is asked daily for a week, then after 3, 7, 14, 30, 60 and 120 days. Answer right and it waits longer; answer wrong and it comes back sooner.' },
  { ar: 'الشيخ', en: 'A teacher (optional)', body: 'The app never grades your recitation. If you have a teacher, plan what to recite, log corrections in class, and they come back in your review until fixed.' },
]

export function Basics() {
  return (
    <ol className="g-basics">
      {BASICS.map((b, i) => (
        <li key={b.en} className="card card-e1 g-basic">
          <span className="g-n num" aria-hidden="true">{i + 1}</span>
          <div>
            <p><b lang="ar" className="a-lg">{b.ar}</b> · <b>{b.en}</b></p>
            <p className="t-sm"><T>{b.body}</T></p>
          </div>
        </li>
      ))}
    </ol>
  )
}

const Sec = ({ ar, en, children }: { ar: string; en: string; children: ReactNode }) => (
  <Card eyebrow={<><span lang="ar">{ar}</span> · {en}</>}>{children}</Card>
)

export function FullGuide() {
  return (
    <div className="g-full">
      <Sec ar="المسار" en="The course">
        <p><T>Ten units (0–9) that follow the surahs of the intro course by المهندس علاء حامد: الناس back towards الضحى, then الفاتحة, then rules from beyond جزء عمّ, then المخارج والصفات in full.</T></p>
        <ul className="s-bullets">
          <li>Lessons open one after another. Today always shows the next one.</li>
          <li>At most two new lessons a day. Spacing is what makes them stick.</li>
          <li>After a unit's last lesson comes its finale: a passage you recite. “I recited it” opens the next unit.</li>
          <li>Some units list lines of تحفة الأطفال or الجزرية to memorise. They are optional.</li>
        </ul>
        <p><a href={href('plan')}>Open the course map ›</a></p>
      </Sec>

      <Sec ar="الدرس" en="The seven lesson steps">
        <ol className="s-bullets">
          <li><T>اسمع Hear: three real words with the rule, from the reciter. Play each as often as you like.</T></li>
          <li><T>لاحظ Notice: two words, one with the sound you just heard and one without. Which is which, by ear? Then both are named.</T></li>
          <li><T>تعلّم Learn: the rule card, with its name, definition and examples.</T></li>
          <li><T>ردّد Say: repeat after the reciter, record yourself, compare, and say if it sounded the same.</T></li>
          <li><T>استخرج Find: tap every word in an ayah that has the rule.</T></li>
          <li><T>تحقّق Check: two or three quick questions.</T></li>
          <li><T>اقرأ Recite: a real passage that uses only rules you know. Listen, recite, record, then “I recited it”.</T></li>
        </ol>
        <p className="t-sm muted">Leave mid-lesson and it resumes at the same step the same day. Finished lessons can be replayed from the course map.</p>
      </Sec>

      <Sec ar="سبق · سبقي · منزل" en="How review works">
        <ul className="s-bullets">
          <li><T>سبق: today's new lesson.</T></li>
          <li><T>سبقي: lessons of the past week. Each is asked every day for its first week.</T></li>
          <li><T>منزل: older lessons. They return after 3, 7, 14, 30, 60, then 120 days. A wrong answer brings the rule back the next day and starts its ladder again.</T></li>
        </ul>
        <p className="t-sm">Each rule shows a level: <b>not started</b>, <b>learning</b>, <b>known</b>, <b>strong</b>. Strong means a month of right answers on different examples.</p>
        <p className="t-sm muted">If more than 15 reviews are overdue, new lessons pause until you catch up. The practice card on Today lists your recent passages to recite again.</p>
      </Sec>

      <Sec ar="الشيخ" en="With a teacher (optional)">
        <ul className="s-bullets">
          <li>Before class: Teacher tab → Plan a session. The app suggests your unit finale and corrections to re-check.</li>
          <li>In class: tap the word your teacher corrected, choose the rule and whether it was clear (جلي) or subtle (خفي).</li>
          <li>After class: mark the finale passed or not yet (passed opens the next unit). Corrections join your review.</li>
          <li>Next class: re-check each correction. “Fixed” closes it; “still wrong” sends its rule back to the start.</li>
        </ul>
      </Sec>

      <Sec ar="الأحكام والاستماع" en="Rules and listening">
        <ul className="s-bullets">
          <li>Rules tab: every rule card, the mind map, and confusing pairs. Open any card any time, even before its lesson.</li>
          <li>Colours in the Quran text are the tajweed colours of the printed coloured muṣḥaf. Turn them off in the player with “Colours off”.</li>
          <li>The player can loop, slow down, and pause after each ayah for you to repeat.</li>
          <li>Cards marked “needs teacher” have a point the sources disagree on. Ask your teacher.</li>
        </ul>
      </Sec>

      <Sec ar="بياناتك" en="Your data">
        <ul className="s-bullets">
          <li>Your progress is kept on this device by default. No account is needed.</li>
          <li>If you sign in (optional), your progress is backed up to our server and kept in step on your other devices.</li>
          <li>Your recordings never leave this device, signed in or not.</li>
          <li>Not signed in? Install the app to your home screen so the browser doesn't clear it, and save a backup file from Settings now and then.</li>
        </ul>
      </Sec>

      <Sec ar="الحساب والحلقة" en="Account and circles (optional)">
        <ul className="s-bullets">
          <li>Sign in from Settings with an email link or Google to back up and sync your progress.</li>
          <li>Teacher link: a read-only page of your progress for your teacher. You can turn it off any time.</li>
          <li><T>A circle (حلقة) is a small group of friends who see who studied on which days this week. No scores and no ranking.</T></li>
        </ul>
      </Sec>
    </div>
  )
}
