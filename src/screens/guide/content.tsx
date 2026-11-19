// "How it works": the short version for onboarding, the full one for #/guide.
import type { ReactNode } from 'react'
import { href } from '../../app/router'
import { Card, T } from '../../components'

export const BASICS: { ar: string; en: string; body: string }[] = [
  { ar: 'المسار', en: 'The path', body: 'Six phases, about 16 weeks to the end of phase 5. Each phase has rule lessons and ends with a passage you recite to your teacher. When your teacher passes it, the next phase opens.' },
  { ar: 'الورد', en: 'Every day', body: 'Today lists your wird, about 40 minutes in four steps: listen and repeat, one new lesson (السبق), recite and record, then review. Do them in order and tick each one.' },
  { ar: 'المراجعة', en: 'Review', body: 'Every rule you learn is asked daily for a week, then after 3, 7, 14, 30, 60 and 120 days. Answer right and it waits longer; answer wrong and it comes back sooner.' },
  { ar: 'الشيخ', en: 'Your teacher', body: 'Before class, plan what to recite. During class, log each correction in a few taps. Corrections come back in your review until your teacher says they are fixed.' },
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
      <Sec ar="المسار" en="The path">
        <p><T>Your plan has six phases: التأسيس، المخارج والصفات، النون والميم والغنة، المد والقلقلة والتفخيم، الوصل والوقف، الإتقان.</T></p>
        <ul className="s-bullets">
          <li>Each phase has rule lessons. The app gives you a new one on most days, at most four a week.</li>
          <li>Each phase also has tasks (watch, memorise, drill). Your next tasks show on Today; tick them there or on the Path tab.</li>
          <li>When all lessons of a phase are learned, the phase moves to its milestone: passages you recite to your teacher.</li>
          <li>Once your teacher passes half the milestone passages, the next phase opens. The rest stay on your session plan.</li>
        </ul>
        <p><a href={href('plan')}>Open the Path tab ›</a></p>
      </Sec>

      <Sec ar="الورد اليومي" en="Your daily wird">
        <ol className="s-bullets">
          <li><T>الاستماع والترديد (10′): play the passage, repeat after the reciter in the pause. Tap any word to hear it alone.</T></li>
          <li><T>السبق (10′): one new rule. You guess first, read the card, answer a few checks, then say examples aloud.</T></li>
          <li><T>التلاوة والتسجيل (15′): recite the ayahs listed (one for each rule of this week, and any open corrections). Record yourself and play “reciter, then me”.</T></li>
          <li><T>المراجعة (5′): short questions on rules that are due. Only 10 minutes today? Do just this.</T></li>
        </ol>
        <p className="t-sm muted">The study day changes at 03:00, so a late-night wird still counts for the day before.</p>
      </Sec>

      <Sec ar="سبق · سبقي · منزل" en="How review works">
        <ul className="s-bullets">
          <li><T>سبق: today's new lesson.</T></li>
          <li><T>سبقي: lessons of the past week. Each is asked every day for its first week.</T></li>
          <li><T>منزل: older lessons. They return after 3, 7, 14, 30, 60, then 120 days. A wrong answer brings the rule back the next day and starts its ladder again.</T></li>
        </ul>
        <p className="t-sm">Each rule shows a level: <b>not started</b>, <b>learning</b>, <b>known</b>, <b>strong</b>. Strong means a month of right answers on different examples.</p>
        <p className="t-sm muted">If more than 15 reviews are overdue, new lessons pause until you catch up.</p>
      </Sec>

      <Sec ar="الشيخ" en="With your teacher">
        <ul className="s-bullets">
          <li>Before class: Teacher tab → Plan a session. The app suggests your milestone passage and corrections to re-check.</li>
          <li>In class: tap the word your teacher corrected, choose the rule and whether it was clear (جلي) or subtle (خفي).</li>
          <li>After class: mark milestone passages passed or not yet. Corrections join your review and recite list.</li>
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
          <li>Everything stays on this device. Nothing is sent anywhere.</li>
          <li>Install the app to your home screen so the browser doesn't clear it.</li>
          <li>Back up from Settings now and then. A backup file restores everything on a new phone.</li>
        </ul>
      </Sec>
    </div>
  )
}
