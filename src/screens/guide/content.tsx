// "How it works": the short version for onboarding, the full one for #/guide.
import type { ReactNode } from 'react'
import { href } from '../../app/router'
import { Icon } from '@/components/ui/icon'
import { Panel } from '../path/blocks'
import { digits, isAr, t } from '../../i18n'
import { Tx } from '../study/i18n'

// Language is fixed per page load, so module-level t() is safe.
export const BASICS: { ar: string; en: string; body: string }[] = [
  { ar: 'المسار', en: t('The course'), body: t('Ten units that follow real surahs, from الناس back to الضحى, then الفاتحة and beyond. Lessons open one after another; each unit ends with a finale passage you recite, which opens the next unit.') },
  { ar: 'الدرس', en: t('A lesson'), body: t('Seven short steps, about 15 minutes: hear real words, notice the sound, learn the rule, say it, find it in an ayah, check yourself, then recite a passage. At most two new lessons a day.') },
  { ar: 'المراجعة', en: t('Review'), body: t('Every rule you learn is asked daily for a week, then after 3, 7, 14, 30, 60 and 120 days. Answer right and it waits longer; answer wrong and it comes back sooner.') },
  { ar: 'الشيخ', en: t('A teacher (optional)'), body: t('The app never grades your recitation. If you have a teacher, plan what to recite, log corrections in class, and they come back in your review until fixed.') },
]

const BASIC_ICONS = ['route', 'menu_book', 'history_edu', 'record_voice_over']
const BUL = 'flex list-disc flex-col gap-space-xs ps-5 marker:text-gold'
const NUM = 'flex list-decimal rtl:list-[arabic-indic] flex-col gap-space-xs ps-5 marker:font-semibold marker:text-secondary'

export function Basics() {
  return (
    <ol className="flex flex-col gap-space-sm">
      {BASICS.map((b, i) => (
        <li key={b.en} className="flex items-start gap-space-md rounded-card border border-outline-variant bg-surface-container-lowest p-space-md">
          <span aria-hidden className="relative grid size-11 shrink-0 place-items-center rounded-control bg-surface-container-low text-primary">
            <Icon name={BASIC_ICONS[i]} size={22} />
            <span className="absolute -end-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-secondary-container text-caption font-bold text-on-secondary-container">{digits(i + 1)}</span>
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="flex flex-wrap items-baseline gap-x-space-sm">
              {isAr ? <b className="text-body-lg font-semibold text-on-surface">{b.en}</b>
                : <><b className="text-body-lg font-semibold text-on-surface">{b.en}</b><span lang="ar" className="text-arabic-label text-secondary">{b.ar}</span></>}
            </p>
            <p className="text-body-md text-on-surface-variant"><Tx>{b.body}</Tx></p>
          </div>
        </li>
      ))}
    </ol>
  )
}

// `en` comes translated: in Arabic it is the heading alone (an Arabic gloss would repeat it).
const Sec = ({ ar, en, icon, children }: { ar: string; en: string; icon: string; children: ReactNode }) => (
  <Panel title={en} ar={ar} icon={icon}>
    <div className="-mt-space-xs flex flex-col gap-space-sm text-body-md text-on-surface">{children}</div>
  </Panel>
)

export function FullGuide() {
  return (
    <div className="flex flex-col gap-space-lg">
      <Sec ar="المسار" en={t('The course')} icon="route">
        <p><Tx>{t('Ten units (0–9) that follow the surahs of the intro course by المهندس علاء حامد: الناس back towards الضحى, then الفاتحة, then rules from beyond جزء عمّ, then المخارج والصفات in full.')}</Tx></p>
        <ul className={BUL}>
          <li>{t('Lessons open one after another. Today always shows the next one.')}</li>
          <li>{t('At most two new lessons a day. Spacing is what makes them stick.')}</li>
          <li>{t('After a unit\'s last lesson comes its finale: a passage you recite. “I recited it” opens the next unit.')}</li>
          <li>{t('Some units list lines of تحفة الأطفال or الجزرية to memorise. They are optional.')}</li>
        </ul>
        <p><a className="inline-flex min-h-12 items-center font-semibold text-primary no-underline" href={href('plan')}>{t('Open the course map ›')}</a></p>
      </Sec>

      <Sec ar="الدرس" en={t('The seven lesson steps')} icon="menu_book">
        <ol className={NUM}>
          <li><Tx>{t('اسمع Hear: three real words with the rule, from the reciter. Play each as often as you like.')}</Tx></li>
          <li><Tx>{t('لاحظ Notice: two words, one with the sound you just heard and one without. Which is which, by ear? Then both are named.')}</Tx></li>
          <li><Tx>{t('تعلّم Learn: the rule card, with its name, definition and examples.')}</Tx></li>
          <li><Tx>{t('ردّد Say: repeat after the reciter, record yourself, compare, and say if it sounded the same.')}</Tx></li>
          <li><Tx>{t('استخرج Find: tap every word in an ayah that has the rule.')}</Tx></li>
          <li><Tx>{t('تحقّق Check: two or three quick questions.')}</Tx></li>
          <li><Tx>{t('اقرأ Recite: a real passage that uses only rules you know. Listen, recite, record, then “I recited it”.')}</Tx></li>
        </ol>
        <p className="text-label text-on-surface-variant">{t('Leave mid-lesson and it resumes at the same step the same day. Finished lessons can be replayed from the course map.')}</p>
      </Sec>

      <Sec ar="سبق · سبقي · منزل" en={t('How review works')} icon="history_edu">
        <ul className={BUL}>
          <li><Tx>{t('سبق: today\'s new lesson.')}</Tx></li>
          <li><Tx>{t('سبقي: lessons of the past week. Each is asked every day for its first week.')}</Tx></li>
          <li><Tx>{t('منزل: older lessons. They return after 3, 7, 14, 30, 60, then 120 days. A wrong answer brings the rule back the next day and starts its ladder again.')}</Tx></li>
        </ul>
        <p className="text-body-md">{t('Each rule shows a level:')} <b>{t('not started')}</b>, <b>{t('learning')}</b>, <b>{t('known')}</b>, <b>{t('strong')}</b>{t('. Strong means a month of right answers on different examples.')}</p>
        <p className="text-label text-on-surface-variant">{t('If more than 15 reviews are overdue, new lessons pause until you catch up. The practice card on Today lists your recent passages to recite again.')}</p>
      </Sec>

      <Sec ar="الشيخ" en={t('With a teacher (optional)')} icon="record_voice_over">
        <ul className={BUL}>
          <li>{t('Before class: Teacher tab → Plan a session. The app suggests your unit finale and corrections to re-check.')}</li>
          <li><Tx>{t('In class: tap the word your teacher corrected, choose the rule and whether it was clear (جلي) or subtle (خفي).')}</Tx></li>
          <li>{t('After class: mark the finale passed or not yet (passed opens the next unit). Corrections join your review.')}</li>
          <li>{t('Next class: re-check each correction. “Fixed” closes it; “still wrong” sends its rule back to the start.')}</li>
        </ul>
      </Sec>

      <Sec ar="الأحكام والاستماع" en={t('Rules and listening')} icon="headphones">
        <ul className={BUL}>
          <li>{t('Rules tab: every rule card, the mind map, and confusing pairs. Open any card any time, even before its lesson.')}</li>
          <li>{t('Colours in the Quran text are the tajweed colours of the printed coloured muṣḥaf. Turn them off in the player with “Colours off”.')}</li>
          <li>{t('The player can loop, slow down, and pause after each ayah for you to repeat.')}</li>
          <li>{t('Cards marked “needs teacher” have a point the sources disagree on. Ask your teacher.')}</li>
        </ul>
      </Sec>

      <Sec ar="بياناتك" en={t('Your data')} icon="shield">
        <ul className={BUL}>
          <li>{t('Your progress is kept on this device by default. No account is needed.')}</li>
          <li>{t('If you sign in (optional), your progress is backed up to our server and kept in step on your other devices.')}</li>
          <li>{t('Your recordings never leave this device, signed in or not.')}</li>
          <li>{t('Not signed in? Install the app to your home screen so the browser doesn\'t clear it, and save a backup file from Settings now and then.')}</li>
        </ul>
      </Sec>

      <Sec ar="الحساب والحلقة" en={t('Account and circles (optional)')} icon="group">
        <ul className={BUL}>
          <li>{t('Sign in from Settings with an email link or Google to back up and sync your progress.')}</li>
          <li>{t('Teacher link: a read-only page of your progress for your teacher. You can turn it off any time.')}</li>
          <li><Tx>{t('A circle (حلقة) is a small group of friends who see who studied on which days this week. No scores and no ranking.')}</Tx></li>
        </ul>
      </Sec>
    </div>
  )
}
