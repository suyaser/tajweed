// #/onboarding: five short steps (design §5.1), then completeOnboarding → lesson 1.
import { useMemo, useRef, useState, type ReactNode } from 'react'
import type { Settings, Verse } from '../core/types'
import { completeOnboarding, getSnapshot, importJson, planSession, useData } from '../core/store'
import { makeWirdIcs } from '../core/ics'
import { addDays, today } from '../core/day'
import { getRange, RECITERS } from '../quran'
import { usePlayer } from '../audio/usePlayer'
import { href, navigate } from '../app/router'
import { download } from '../app/download'
import { Band, Button, Card, CountBeats, VerseBlock } from '../components'
import { countsText } from '../core/questions'
import { isAr, lang, setLang, t, type Lang } from '../i18n'
import { Tx } from './study/i18n'
import { verseRef } from './study/helpers'
import { useVerse } from './study/verse'
import { Basics } from './guide/content'
import { courseOrder } from '../content/course'
import './study.css'

const N = 5
// Language is fixed per page load, so module-level t() is safe.
const STEP_NAMES = [t('Welcome'), t('How it works'), t('Reciter'), t('المد المنفصل'), t('Study time')]
const DAYS: [number, string, string][] = [[6, t('Sa'), t('Saturday')], [0, t('Su'), t('Sunday')], [1, t('Mo'), t('Monday')], [2, t('Tu'), t('Tuesday')], [3, t('We'), t('Wednesday')], [4, t('Th'), t('Thursday')], [5, t('Fr'), t('Friday')]]
const RECITER_NOTE: Record<string, string> = {
  'husary-muallim': t('Pauses for you to repeat. Recommended to start.'),
  husary: t('Steady, clear murattal.'),
  minshawy: t('Warm murattal.'),
}

function Stars({ step, onSkip }: { step: number; onSkip?: () => void }) {
  return (
    <div className="s-ob-top">
      <span className="s-ob-progress">
        <span className="s-ob-stars" aria-hidden="true">{Array.from({ length: N }, (_, i) => (i <= step ? '★' : '☆')).join(' ')}</span>
        <span className="t-sm muted">{t('Step {n} of {m}', { n: step + 1, m: N })} · <Tx>{STEP_NAMES[step]}</Tx></span>
      </span>
      {onSkip && <button type="button" className="btn btn-ghost" onClick={onSkip}>{t('Skip')}</button>}
    </div>
  )
}

/** `en` comes translated; an empty Arabic value hides that line (the Arabic heading already says it). */
function Head({ ar, en, children }: { ar: string; en: string; children?: string }) {
  return (
    <header className="s-ob-head">
      <h1 className="k-h2" lang="ar">{ar}</h1>
      {en && <p className="t-h2"><Tx>{en}</Tx></p>}
      {children && <p className="muted"><Tx>{children}</Tx></p>}
    </header>
  )
}

/** Big two-way choice with aria-pressed (44px+). */
function Choice({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" className="opt s-ob-choice" aria-pressed={on} onClick={onClick}>{children}</button>
}

export default function Onboarding() {
  const { settings } = useData()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Partial<Settings>>(() => ({
    reciterId: settings.reciterId, munfasilLength: settings.munfasilLength,
    wirdTime: settings.wirdTime, teacherDays: settings.teacherDays, teacherName: settings.teacherName,
  }))
  const [askMunfasil, setAskMunfasil] = useState(false)
  const set = (p: Partial<Settings>) => setDraft(d => ({ ...d, ...p }))
  const next = () => { setStep(s => s + 1); window.scrollTo(0, 0) }

  const finish = (to = 'today') => {
    completeOnboarding(draft)
    // "Not sure yet": the question goes into the plan for the next teacher day; no teacher day, no plan (UX M1)
    const days = draft.teacherDays ?? []
    const td = today()
    const on = Array.from({ length: 7 }, (_, i) => addDays(td, i)).find(d => days.includes(new Date(d + 'T00:00:00Z').getUTCDay()))
    if (askMunfasil && on) planSession({ on, notes: t('Ask: المد المنفصل 4 or 5?'), plannedPassages: [] })
    navigate(to)
  }

  return (
    <div className="s-ob">
      {step === 0 && <Welcome onNext={next} />}
      {step === 1 && (
        <section className="s-study">
          <Stars step={1} onSkip={next} />
          <Head ar="كيف يعمل" en={t('How the course works')}>{t('Four things to know. You can read this again any time from Help.')}</Head>
          <Basics />
          <Button block onClick={next}>{t('Got it')}</Button>
        </section>
      )}
      {step === 2 && <ReciterStep value={draft.reciterId!} onChange={id => set({ reciterId: id })} onNext={next} />}
      {step === 3 && (
        <MunfasilStep
          value={draft.munfasilLength!} onChange={n => { set({ munfasilLength: n }); setAskMunfasil(false) }}
          onNotSure={() => { set({ munfasilLength: 4 }); setAskMunfasil(true); next() }} onNext={next}
        />
      )}
      {step === 4 && (
        <section className="s-study">
          <Stars step={4} onSkip={() => finish()} />
          <Head ar="الورد اليومي" en={t('When will you study?')}>{t('A teacher is optional. If you have one, pick the day you meet.')}</Head>
          <label className="s-field">
            <span>{t('Daily study time (wird)')}</span>
            <input type="time" value={draft.wirdTime} onChange={e => set({ wirdTime: e.target.value || '05:30' })} />
          </label>
          <p className="t-sm muted">{t('About 20 minutes: a lesson and your review. A fixed time makes it a habit.')}</p>
          <fieldset className="s-field">
            <legend>{t('Teacher day')}</legend>
            <div className="s-chips">
              {DAYS.map(([d, short, long]) => {
                const on = draft.teacherDays!.includes(d)
                return (
                  <button key={d} type="button" className="s-daychip" aria-pressed={on} aria-label={long}
                    onClick={() => set({ teacherDays: on ? draft.teacherDays!.filter(x => x !== d) : [...draft.teacherDays!, d] })}>
                    {short}
                  </button>
                )
              })}
            </div>
          </fieldset>
          <label className="s-field">
            <span>{t("Teacher's name")} <small className="muted">{t('(optional)')}</small></span>
            <input type="text" dir="auto" value={draft.teacherName ?? ''} placeholder="الشيخ …" onChange={e => set({ teacherName: e.target.value || undefined })} />
          </label>
          <Button variant="secondary" onClick={() => downloadIcs(draft)}>
            <span aria-hidden="true">📅</span> {t('Add my wird to calendar')}
          </Button>
          <Button block onClick={() => finish(href('learn', courseOrder[0]))}>{t('Start lesson 1')}</Button>
        </section>
      )}
    </div>
  )
}

function downloadIcs(draft: Partial<Settings>) {
  const s = { ...getSnapshot().settings, ...draft }
  download('tajweed-wird.ics', makeWirdIcs(s, location.href), 'text/calendar')
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

function ReciterStep({ value, onChange, onNext }: { value: string; onChange: (id: string) => void; onNext: () => void }) {
  const [sample, setSample] = useState<Verse[] | null>(null)
  const { state, player } = usePlayer()
  const [playingId, setPlayingId] = useState<string | null>(null)
  const offline = state.status === 'offline' || navigator.onLine === false
  const play = async (id: string) => {
    const r = RECITERS.find(r => r.id === id)!
    if (playingId === id && (state.status === 'playing' || state.status === 'loading')) { player.stop(); setPlayingId(null); return }
    let vs = sample
    if (!vs) {
      try { vs = await getRange('1:1', '1:2'); setSample(vs) } catch { return }
    }
    player.load(vs, r)
    player.play()
    setPlayingId(id)
  }
  const playing = playingId && (state.status === 'playing' || state.status === 'loading')
  const shown = useMemo(() => sample?.find(v => v.verseKey === state.verseKey), [sample, state.verseKey])
  return (
    <section className="s-study">
      <Stars step={2} onSkip={onNext} />
      <Head ar="القارئ القدوة" en={t('Your model reciter')}>{t("You'll repeat after one voice until it becomes your own.")}</Head>
      <div className="s-ob-reciters" role="radiogroup" aria-label={t('Model reciter')}>
        {RECITERS.map(r => (
          <div key={r.id} className="s-ob-reciter">
            <label>
              <input type="radio" name="reciter" checked={value === r.id} onChange={() => onChange(r.id)} />
              <span>
                <b lang="ar" className="a-lg">{r.nameAr}</b>
                <small className="muted">{RECITER_NOTE[r.id]}</small>
              </span>
            </label>
            {offline
              ? <span className="t-sm muted">{t('Sample needs a connection')}</span>
              : <button type="button" className="btn btn-secondary" onClick={() => play(r.id)} aria-label={playingId === r.id && playing ? t('Stop sample: {x}', { x: isAr ? r.nameAr : r.nameEn }) : t('Play sample: {x}', { x: isAr ? r.nameAr : r.nameEn })}>
                  {playingId === r.id && playing ? '❚❚' : '▶'} {t('Sample')}
                </button>}
          </div>
        ))}
      </div>
      {playing && shown && (
        <div className="s-ob-sample"><span className="t-sm muted">{t('Sample:')}</span><VerseBlock text={shown.text} reference={verseRef(shown.verseKey)} tajweed={false} /></div>
      )}
      <Button block onClick={() => { player.stop(); onNext() }}>{t('Next')}</Button>
    </section>
  )
}

function MunfasilStep({ value, onChange, onNotSure, onNext }: { value: 4 | 5; onChange: (n: 4 | 5) => void; onNotSure: () => void; onNext: () => void }) {
  const vs = useVerse('108:1')
  return (
    <section className="s-study">
      <Stars step={3} onSkip={onNext} />
      <Head ar="المد المنفصل" en={t('How long is your المد المنفصل?')}>{t("You'll learn this in unit 3. If you're not sure, pick 4; you can change it in Settings.")}</Head>
      {vs.verse && <VerseBlock text={vs.verse.text} focus={[1, 1]} reference={verseRef('108:1')} size="read" tajweed={false} />}
      <div className="opts">
        {([4, 5] as const).map(n => (
          <Choice key={n} on={value === n} onClick={() => onChange(n)}>
            <CountBeats min={n} /><span>{countsText(n)}</span>
          </Choice>
        ))}
      </div>
      <p className="t-sm muted"><Tx>{t('A مد before a همزة in the next word. Both 4 and 5 are correct for حفص من طريق الشاطبية; ask your teacher which they teach, then keep it the same every time.')}</Tx></p>
      <Button block onClick={onNext}>{t('Next')}</Button>
      <button type="button" className="btn btn-ghost" onClick={onNotSure}>{t('Not sure yet')}</button>
    </section>
  )
}
