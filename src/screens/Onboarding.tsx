// #/onboarding: five short steps (design §5.1), then completeOnboarding → Today.
import { useMemo, useRef, useState, type ReactNode } from 'react'
import type { Settings, Verse } from '../core/types'
import { completeOnboarding, getSnapshot, importJson, planSession, useData } from '../core/store'
import { makeWirdIcs } from '../core/ics'
import { addDays, today } from '../core/day'
import { getRange, RECITERS } from '../quran'
import { usePlayer } from '../audio/usePlayer'
import { navigate } from '../app/router'
import { download } from '../app/download'
import { Band, Button, Card, CountBeats, T, VerseBlock } from '../components'
import { verseRef } from './study/helpers'
import { useVerse } from './study/verse'
import { Basics } from './guide/content'
import './study.css'

const N = 6
const DAYS: [number, string, string][] = [[6, 'Sa', 'Saturday'], [0, 'Su', 'Sunday'], [1, 'Mo', 'Monday'], [2, 'Tu', 'Tuesday'], [3, 'We', 'Wednesday'], [4, 'Th', 'Thursday'], [5, 'Fr', 'Friday']]
const RECITER_NOTE: Record<string, string> = {
  'husary-muallim': 'Pauses for you to repeat. Recommended to start.',
  husary: 'Steady, clear murattal.',
  minshawy: 'Warm murattal.',
}

function Stars({ step, onSkip }: { step: number; onSkip?: () => void }) {
  return (
    <div className="s-ob-top">
      <span className="s-ob-stars" role="img" aria-label={`Step ${step + 1} of ${N}`}>
        {Array.from({ length: N }, (_, i) => (i <= step ? '★' : '☆')).join(' ')}
      </span>
      {onSkip && <button type="button" className="btn btn-ghost" onClick={onSkip}>Skip</button>}
    </div>
  )
}

function Head({ ar, en, children }: { ar: string; en: string; children?: ReactNode }) {
  return (
    <header className="s-ob-head">
      <h1 className="k-h2" lang="ar">{ar}</h1>
      <p className="t-h2"><T>{en}</T></p>
      {children && <p className="muted"><T>{children}</T></p>}
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
    introCourseDone: settings.introCourseDone, reciterId: settings.reciterId, munfasilLength: settings.munfasilLength,
    wirdTime: settings.wirdTime, teacherDays: settings.teacherDays, teacherName: settings.teacherName,
  }))
  const [askMunfasil, setAskMunfasil] = useState(false)
  const set = (p: Partial<Settings>) => setDraft(d => ({ ...d, ...p }))
  const next = () => { setStep(s => s + 1); window.scrollTo(0, 0) }

  const finish = () => {
    completeOnboarding(draft)
    if (askMunfasil) {
      // "Not sure yet": the question goes into the first session plan (design §5.1)
      const days = draft.teacherDays ?? []
      const t = today()
      const on = Array.from({ length: 7 }, (_, i) => addDays(t, i)).find(d => days.includes(new Date(d + 'T00:00:00Z').getUTCDay())) ?? t
      planSession({ on, notes: 'Ask: المد المنفصل 4 or 5?', plannedPassages: [] })
    }
    navigate('today')
  }

  return (
    <div className="s-ob">
      {step === 0 && <Welcome onNext={next} />}
      {step === 1 && (
        <section className="s-study">
          <Stars step={1} onSkip={next} />
          <Head ar="كيف يعمل" en="How your path works">Four things to know. You can read this again any time from Help.</Head>
          <Basics />
          <Button block onClick={next}>Got it</Button>
        </section>
      )}
      {step === 2 && (
        <section className="s-study">
          <Stars step={2} onSkip={next} />
          <Head ar="من أين تبدأ" en="Where you're starting">
            Have you finished the intro course (six episodes, by المهندس علاء حامد)?
          </Head>
          <div className="opts">
            <Choice on={!!draft.introCourseDone} onClick={() => set({ introCourseDone: true })}>Yes, I've watched it</Choice>
            <Choice on={!draft.introCourseDone} onClick={() => set({ introCourseDone: false })}>Not yet</Choice>
          </div>
          <p className="t-sm muted">If you have, the episode tasks of phase 1 start ticked. You'll start from the first lesson either way.</p>
          <Button block onClick={next}>Next</Button>
        </section>
      )}
      {step === 3 && <ReciterStep value={draft.reciterId!} onChange={id => set({ reciterId: id })} onNext={next} />}
      {step === 4 && (
        <MunfasilStep
          value={draft.munfasilLength!} onChange={n => { set({ munfasilLength: n }); setAskMunfasil(false) }}
          onNotSure={() => { set({ munfasilLength: 4 }); setAskMunfasil(true); next() }} onNext={next}
        />
      )}
      {step === 5 && (
        <section className="s-study">
          <Stars step={5} onSkip={finish} />
          <Head ar="الورد اليومي" en="When will you study?" />
          <label className="s-field">
            <span>Wird time</span>
            <input type="time" value={draft.wirdTime} onChange={e => set({ wirdTime: e.target.value || '05:30' })} />
          </label>
          <p className="t-sm muted">About 40 minutes. A fixed time makes it a habit.</p>
          <fieldset className="s-field">
            <legend>Teacher day</legend>
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
            <span>Teacher's name <small className="muted">(optional)</small></span>
            <input type="text" dir="auto" value={draft.teacherName ?? ''} placeholder="الشيخ …" onChange={e => set({ teacherName: e.target.value || undefined })} />
          </label>
          <Button variant="secondary" onClick={() => downloadIcs(draft)}>
            <span aria-hidden="true">📅</span> Add my wird to calendar
          </Button>
          <Button block onClick={finish}>Start my path</Button>
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
        ? 'This file is from a newer version of Tajweed Path. Update the app first.'
        : "This file isn't a Tajweed Path backup.")
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
        <Stars step={0} />
        <h1 className="t-h2">A companion for your study with your teacher.</h1>
        <ul className="s-ob-list">
          <li>Plans each day's wird</li>
          <li>Brings rules back before you forget them</li>
          <li>Lets you listen, repeat and record</li>
          <li>Keeps your teacher's corrections</li>
        </ul>
        <Card eyebrow="An honest note">
          <p>It does not grade your recitation. Only a teacher can. Your recordings stay on this device.</p>
        </Card>
        <Button block onClick={onNext}>Begin · <span lang="ar">ابدأ</span></Button>
        <button type="button" className="btn btn-ghost" onClick={() => file.current?.click()}>I have a backup file</button>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={e => onFile(e.target.files?.[0])} />
        {err && <p role="alert" className="t-sm">{err}</p>}
      </section>
    </>
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
      <Stars step={3} onSkip={onNext} />
      <Head ar="القارئ القدوة" en="Your model reciter">You'll repeat after one voice until it becomes your own.</Head>
      <div className="s-ob-reciters" role="radiogroup" aria-label="Model reciter">
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
              ? <span className="t-sm muted">Sample needs a connection</span>
              : <button type="button" className="btn btn-secondary" onClick={() => play(r.id)} aria-label={`${playingId === r.id && playing ? 'Stop' : 'Play'} sample: ${r.nameEn}`}>
                  {playingId === r.id && playing ? '❚❚' : '▶'} Sample
                </button>}
          </div>
        ))}
      </div>
      {playing && shown && (
        <div className="s-ob-sample"><span className="t-sm muted">Sample:</span><VerseBlock text={shown.text} reference={verseRef(shown.verseKey)} tajweed={false} /></div>
      )}
      <Button block onClick={() => { player.stop(); onNext() }}>Next</Button>
    </section>
  )
}

function MunfasilStep({ value, onChange, onNotSure, onNext }: { value: 4 | 5; onChange: (n: 4 | 5) => void; onNotSure: () => void; onNext: () => void }) {
  const vs = useVerse('108:1')
  return (
    <section className="s-study">
      <Stars step={4} onSkip={onNext} />
      <Head ar="المد المنفصل" en="How long is your المد المنفصل?" />
      {vs.verse && <VerseBlock text={vs.verse.text} focus={[1, 1]} reference={verseRef('108:1')} size="read" tajweed={false} />}
      <div className="opts">
        {([4, 5] as const).map(n => (
          <Choice key={n} on={value === n} onClick={() => onChange(n)}>
            <CountBeats min={n} /><span>{n} counts</span>
          </Choice>
        ))}
      </div>
      <p><T>Both are correct for حفص من طريق الشاطبية. Ask your teacher which they teach, then keep it the same every time. You can change it in Settings.</T></p>
      <Button block onClick={onNext}>Next</Button>
      <button type="button" className="btn btn-ghost" onClick={onNotSure}>Not sure yet</button>
    </section>
  )
}
