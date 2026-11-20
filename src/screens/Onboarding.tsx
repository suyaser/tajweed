// #/onboarding: Welcome (language, backup restore) → How it works → lesson 1 (doc 12 §6). Reciter, study time and
// teacher days wait in Today's "Set up your routine" card after the first lesson; the منفصل question is asked in its lesson.
import { useRef, useState, type ReactNode } from 'react'
import { completeOnboarding, importJson } from '../core/store'
import { href, navigate } from '../app/router'
import { Band, Button, Card, VerseBlock } from '../components'
import { isAr, lang, setLang, t, type Lang } from '../i18n'
import { Tx } from './study/i18n'
import { verseRef } from './study/helpers'
import { useVerse } from './study/verse'
import { Basics } from './guide/content'
import { courseOrder } from '../content/course'

/** Device-local flag: this learner onboarded with the short flow, so Today offers the routine card (existing users never see it). */
export const ROUTINE_KEY = 'tajweed-path:routine-card'

const N = 2
// Language is fixed per page load, so module-level t() is safe.
const STEP_NAMES = [t('Welcome'), t('How it works')]

function Stars({ step }: { step: number }) {
  return (
    <div className="s-ob-top">
      <span className="s-ob-progress">
        <span className="s-ob-stars" aria-hidden="true">{Array.from({ length: N }, (_, i) => (i <= step ? '★' : '☆')).join(' ')}</span>
        <span className="t-sm muted">{t('Step {n} of {m}', { n: step + 1, m: N })} · <Tx>{STEP_NAMES[step]}</Tx></span>
      </span>
    </div>
  )
}

/** Big two-way choice with aria-pressed (44px+). */
function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" className="opt s-ob-choice" aria-pressed={on} onClick={onClick}>{children}</button>
}

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const start = () => {
    completeOnboarding({})
    try { localStorage.setItem(ROUTINE_KEY, 'pending') } catch { /* storage blocked: no card */ }
    navigate(href('learn', courseOrder[0]))
  }

  return (
    <div className="s-ob">
      {step === 0 && <Welcome onNext={() => { setStep(1); window.scrollTo(0, 0) }} />}
      {step === 1 && (
        <section className="s-study">
          <Stars step={1} />
          <header className="s-ob-head">
            <h1 className="k-h2" lang="ar">كيف يعمل</h1>
            {!isAr && <p className="t-h2">{t('How the course works')}</p>}
            <p className="muted">{t('Four things to know. You can read this again any time from Help.')}</p>
          </header>
          <Basics />
          <Button block onClick={start}>{t('Start lesson 1')}</Button>
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
      <Band size="tall" className="s-ob-band">
        <p className="k-h1" lang="ar">مسار التجويد</p>
        <p className="s-ob-brand">TAJWEED PATH</p>
        {vs.verse && <VerseBlock text={vs.verse.text} reference={verseRef('73:4')} size="inline" tajweed={false} />}
      </Band>
      <section className="s-study">
        <LangChoice />
        <Stars step={0} />
        <h1 className="t-h2">{t('A tajweed course on real Quran words, one lesson at a time.')}</h1>
        <ul className="s-ob-list">
          <li>{t('Short lessons: hear it, say it, then learn the rule')}</li>
          <li>{t('Each lesson ends on a real passage you recite')}</li>
          <li>{t('Brings rules back before you forget them')}</li>
          <li>{t("Keeps your teacher's corrections, if you have one")}</li>
        </ul>
        <Card eyebrow={t('An honest note')}>
          <p>{t('It does not grade your recitation. Only a teacher can. Your recordings stay on this device.')}</p>
        </Card>
        <Button block onClick={onNext}>{isAr ? 'ابدأ' : <>Begin · <span lang="ar">ابدأ</span></>}</Button>
        <button type="button" className="btn btn-ghost" onClick={() => file.current?.click()}>{t('I have a backup file')}</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={e => onFile(e.target.files?.[0])} />
        {err && <p role="alert" className="t-sm">{err}</p>}
      </section>
    </>
  )
}

/** First thing on Welcome: the interface language (saved on the device; switching reloads into it). */
function LangChoice() {
  const choose = (l: Lang) => setLang(l, l !== lang)
  return (
    <div className="opts s-ob-lang" role="group" aria-label="Language · اللغة">
      <Choice on={lang === 'ar'} onClick={() => choose('ar')}><span lang="ar">العربية</span></Choice>
      <Choice on={lang === 'en'} onClick={() => choose('en')}><span lang="en">English</span></Choice>
    </div>
  )
}
