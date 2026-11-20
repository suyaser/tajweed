// #/onboarding: Welcome (language, backup restore) → How it works → lesson 1 (doc 12 §6). Reciter, study time and
// teacher days wait in Today's "Set up your routine" card after the first lesson; the منفصل question is asked in its lesson.
import { useRef, useState, type ReactNode } from 'react'
import { completeOnboarding, importJson } from '../core/store'
import { href, navigate } from '../app/router'
import { isAr, lang, setLang, t, type Lang } from '../i18n'
import { Tx } from './study/i18n'
import { verseRef } from './study/helpers'
import { useVerse } from './study/verse'
import { Basics } from './guide/content'
import { courseOrder } from '../content/course'
import { Callout, Chip } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

/** Device-local flag: this learner onboarded with the short flow, so Today offers the routine card (existing users never see it). */
export const ROUTINE_KEY = 'tajweed-path:routine-card'

const N = 2
// Language is fixed per page load, so module-level t() is safe.
const STEP_NAMES = [t('Welcome'), t('How it works')]

function Steps({ step }: { step: number }) {
  return (
    <p className="flex items-center justify-center gap-space-sm text-label text-on-surface-variant">
      <span aria-hidden className="flex gap-1">
        {Array.from({ length: N }, (_, i) => <span key={i} className={cn('h-1.5 rounded-full', i === step ? 'w-4 bg-primary' : i < step ? 'w-1.5 bg-primary' : 'w-1.5 bg-surface-container-highest')} />)}
      </span>
      <span>{t('Step {n} of {m}', { n: step + 1, m: N })} · <Tx>{STEP_NAMES[step]}</Tx></span>
    </p>
  )
}

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const start = () => {
    completeOnboarding({})
    try { localStorage.setItem(ROUTINE_KEY, 'pending') } catch { /* storage blocked: no card */ }
    navigate(href('learn', courseOrder[0]))
  }

  return (
    <div className="mx-auto flex w-full max-w-[560px] flex-col gap-space-lg">
      {step === 0 && <Welcome onNext={() => { setStep(1); window.scrollTo(0, 0) }} />}
      {step === 1 && (
        <section className="flex flex-col gap-space-lg">
          <Steps step={1} />
          <header className="flex flex-col items-center gap-space-xs text-center">
            <h1 lang="ar" className="text-arabic-headline text-primary">كيف يعمل</h1>
            {!isAr && <p className="text-headline-md text-on-surface">{t('How the course works')}</p>}
            <p className="text-body-md text-on-surface-variant">{t('Four things to know. You can read this again any time from Help.')}</p>
          </header>
          <Basics />
          <Button size="lg" className="w-full" onClick={start}>{t('Start lesson 1')}<Icon name="arrow_forward" size={20} rtlFlip /></Button>
        </section>
      )}
    </div>
  )
}

function Welcome({ onNext }: { onNext: () => void }) {
  const vs = useVerse('73:4')
  const file = useRef<HTMLInputElement>(null)
  const [err, setErr] = useState<string | null>(null)
  const onFile = async (f?: File) => {
    if (!f) return
    try {
      importJson(await f.text())
      navigate('today')
    } catch (e) {
      setErr(/newer/i.test((e as Error).message)
        ? t('This file is from a newer version of Tajweed Path. Update the app first.')
        : t("This file isn't a Tajweed Path backup."))
    }
  }
  return (
    <>
      <header className="flex flex-col items-center gap-space-xs pt-space-md text-center">
        <span aria-hidden className="grid size-14 place-items-center rounded-full bg-secondary-container text-on-secondary-container"><Icon name="auto_stories" size={28} /></span>
        <p lang="ar" className="mt-space-xs font-naskh text-[32px] leading-[1.4] font-bold text-primary">مسار التجويد</p>
        <p lang="en" className="text-label tracking-[0.2em] text-on-surface-variant uppercase">Tajweed Path</p>
        <span aria-hidden className="mt-space-xs h-0.5 w-12 rounded-full bg-gold" />
      </header>

      <figure className="flex flex-col items-center gap-space-sm rounded-card border border-outline-variant bg-surface-container-lowest px-space-md py-space-lg text-center shadow-card">
        {vs.verse
          ? <p lang="ar" dir="rtl" className="text-quran text-on-surface">{vs.verse.text}</p>
          : <Skeleton className="h-14 w-3/4" />}
        <figcaption><Chip tone="gold" icon="bookmark"><span lang="ar">{verseRef('73:4')}</span></Chip></figcaption>
      </figure>

      <LangChoice />

      <section className="flex flex-col gap-space-md">
        <Steps step={0} />
        <h1 className="text-center text-headline-md text-on-surface">{t('A tajweed course on real Quran words, one lesson at a time.')}</h1>
        <ul className="flex flex-col gap-space-sm">
          {([
            ['headphones', t('Short lessons: hear it, say it, then learn the rule')],
            ['menu_book', t('Each lesson ends on a real passage you recite')],
            ['history_edu', t('Brings rules back before you forget them')],
            ['record_voice_over', t("Keeps your teacher's corrections, if you have one")],
          ] as const).map(([icon, text]) => (
            <li key={icon} className="flex items-center gap-space-md rounded-card border border-outline-variant bg-surface-container-lowest p-space-md">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-container-low text-primary"><Icon name={icon} size={22} /></span>
              <span className="text-body-lg text-on-surface">{text}</span>
            </li>
          ))}
        </ul>
        <Callout variant="note" title={t('An honest note')}>
          {t('It does not grade your recitation. Only a teacher can. Your recordings stay on this device.')}
        </Callout>
      </section>

      <div className="flex flex-col items-center gap-space-xs">
        <Button size="lg" className="w-full" onClick={onNext}>
          {isAr ? 'ابدأ' : <>Begin · <span lang="ar">ابدأ</span></>}<Icon name="arrow_forward" size={20} rtlFlip />
        </Button>
        <Button variant="ghost" onClick={() => file.current?.click()}><Icon name="history" size={20} />{t('I have a backup file')}</Button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={e => onFile(e.target.files?.[0])} />
        {err && <p role="alert" className="text-body-md text-error">{err}</p>}
      </div>
    </>
  )
}

/** Big two-way choice with aria-pressed (48px+). */
function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cn(
        'flex min-h-16 flex-1 cursor-pointer items-center justify-between gap-space-sm rounded-card border px-space-md text-start transition-colors',
        on ? 'border-2 border-primary bg-surface-container-lowest text-primary' : 'border-outline-variant bg-surface-container-low text-on-surface hover:bg-surface-container',
      )}>
      {children}
      <Icon name={on ? 'check_circle' : 'radio_button_unchecked'} size={22} fill={on} className={on ? 'text-primary' : 'text-outline'} />
    </button>
  )
}

/** First thing on Welcome: the interface language (saved on the device; switching reloads into it). */
function LangChoice() {
  const choose = (l: Lang) => setLang(l, l !== lang)
  return (
    <div role="group" aria-label="Language · اللغة" className="flex flex-col gap-space-sm">
      <p className="flex items-center gap-1.5 text-label text-on-surface-variant" aria-hidden>
        <Icon name="translate" size={16} /><span lang="en">Language</span> · <span lang="ar">اللغة</span>
      </p>
      <div className="flex gap-space-sm">
        <Choice on={lang === 'ar'} onClick={() => choose('ar')}><span lang="ar" className="font-arabic text-body-lg font-semibold">العربية</span></Choice>
        <Choice on={lang === 'en'} onClick={() => choose('en')}><span lang="en" className="font-ui text-body-lg font-semibold">English</span></Choice>
      </div>
    </div>
  )
}
