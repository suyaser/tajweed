import { useEffect, useMemo, useRef, useState } from 'react'
import type { ScreenProps } from '../app/App'
import { href } from '../app/router'
import { addListenSeconds, noteRecording, planSession, suggestPassages, updateSession, updateSettings, useData, uuid } from '../core/store'
import { today } from '../core/day'
import type { ColourKey, Recording, Verse } from '../core/types'
import { getRange, RECITERS, ruleColour, tajweedSpans } from '../quran'
import { usePlayer } from '../audio/usePlayer'
import { useRecorder } from '../audio/useRecorder'
import { segForWord, segsOf } from '../audio/player'
import { list, remove, save, KEEP } from '../audio/recordings'
import { playMe, playModelThenMe, type ComparePhase } from '../audio/compare'
import {
  Actions, AudioTransport, Button, EmptyState, Legend, Msg, Nudge, Passage, RecordButton, Sheet, Skeleton, T, ToggleChip, fieldCls, type PassageAyah,
} from '../components'
import { Page, Panel, Sep } from '@/components/kit'
import { Icon } from '@/components/ui/icon'
import { DEFAULT_RANGE, MAX_AYAT, capRange, parseRange, rangeLabel, refLabel } from './library/range'
import { Hint } from './study/Hint'
import { digits, locale, t } from '../i18n'

const LOOPS = [1, 3, 5, 10]
const MIC_KEY = 'tajweed-path:mic-explained'
const mmss = (ms: number) => { const s = Math.round(ms / 1000); return digits(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`) }
const micExplained = () => { try { return localStorage.getItem(MIC_KEY) === '1' } catch { return false } }
const fmtWhen = (iso: string) => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(iso))
const typing = (el: EventTarget | null) => el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName))

export default function Listen({ params }: ScreenProps) {
  const parsed = parseRange(params.range)
  const wanted = parsed ?? DEFAULT_RANGE
  const range = capRange(wanted)
  const { from, to } = range
  const label = rangeLabel(range)
  const data = useData()

  const [reciterId, setReciterId] = useState(data.settings.reciterId)
  const reciter = RECITERS.find((r) => r.id === reciterId) ?? RECITERS[0]

  // text
  const [verses, setVerses] = useState<Verse[] | null>(null)
  const [textError, setTextError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let live = true
    setVerses(null)
    setTextError(false)
    getRange(from, to).then((v) => live && setVerses(v), () => live && setTextError(true))
    return () => { live = false }
  }, [from, to, attempt])

  // player
  const { state, player } = usePlayer(verses ?? undefined, reciter)
  useEffect(() => { player.setGap(reciter.style === 'muallim' ? 'off' : 'same') }, [player, reciter]) // spec F5 default
  // tajweed colours: off by default, remembered in settings (doc 10 §1.1)
  const colours = data.settings.tajweedColours
  const setColours = (on: boolean) => updateSettings({ tajweedColours: on })
  const [isolate, setIsolate] = useState<ColourKey | null>(null)
  const [dotted, setDotted] = useState<string | null>(null)
  const compare = useRef<{ cancel(): void } | null>(null)
  const [phase, setPhase] = useState<ComparePhase | null>(null)
  const busy = state.status === 'playing' || state.status === 'loading' || state.status === 'gap'

  // listening time → today's log (flushed every 15 s and on leave)
  useEffect(() => {
    let acc = 0
    const timer = setInterval(() => {
      if (player.state.status === 'playing' && !player.state.clip && ++acc >= 15) { addListenSeconds(acc); acc = 0 }
    }, 1000)
    return () => { clearInterval(timer); if (acc) addListenSeconds(acc) }
  }, [player])
  const listenDone = !!data.days.find((d) => d.id === today())?.parts.listen

  // recorder
  const rec = useRecorder()
  const [recs, setRecs] = useState<Recording[]>([])
  const [saved, setSaved] = useState<number | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [askMic, setAskMic] = useState(false)
  const [now, setNow] = useState(Date.now())
  const recording = rec.state.status === 'recording'
  const refresh = () => list(from, to).then(setRecs, () => setRecs([]))
  useEffect(() => { refresh() }, [from, to]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!recording) return
    const timer = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(timer)
  }, [recording])

  const [asked, setAsked] = useState<string | null>(null)

  const cancelCompare = () => { compare.current?.cancel(); compare.current = null; setPhase(null) }

  const startRecording = () => {
    cancelCompare()
    player.stop()
    setSaved(null)
    setSaveError(null)
    rec.start().then(async (take) => {
      if (!take) return
      const r: Recording = { id: uuid(), from, to, createdAt: new Date().toISOString(), durationMs: take.durationMs, mime: take.mime, blob: take.blob }
      try {
        await save(r)
        noteRecording()
        setSaved(take.durationMs)
      } catch {
        setSaveError(t("Couldn't save the recording. Your device may be out of space."))
      }
      refresh()
    })
  }
  const onRecord = () => {
    if (recording) return rec.stop()
    if (!micExplained()) return setAskMic(true)
    startRecording()
  }

  // All play calls below run synchronously inside the tap/key handler (iOS).
  const modelThenMe = (r: Recording) => {
    if (!verses || recording) return
    cancelCompare()
    const c = playModelThenMe(player, r, (p) => setPhase(p === 'done' ? null : p))
    compare.current = c
  }
  const me = (r: Recording) => {
    if (recording) return
    cancelCompare()
    setPhase('me')
    playMe(player, r).finally(() => setPhase((p) => (p === 'me' ? null : p)))
  }
  const togglePlay = () => {
    if (phase) return cancelCompare()
    if (recording) return
    player.toggle()
  }
  const cycleLoop = () => player.setLoops(LOOPS[(LOOPS.indexOf(state.loops) + 1) % LOOPS.length])
  const toggleRate = () => player.setRate(state.rate === 1 ? 0.75 : 1)
  const toggleGap = () => player.setGap(state.gap === 'off' ? 'same' : 'off')

  const onWord = (key: string, w: number) => {
    const v = verses?.find((x) => x.verseKey === key)
    if (!v || recording) return
    cancelCompare()
    player.playWord(v, w - 1)
    setDotted(segForWord(segsOf(v, reciter.id), w - 1) ? null : `${key}/${w}`)
  }

  const askTeacher = () => {
    const next = data.sessions.filter((s) => !s.deletedAt && s.status === 'planned').sort((a, b) => a.on.localeCompare(b.on))[0]
    const passage = { from, to, reason: 'ask' as const }
    if (next?.plannedPassages.some((p) => p.from === from && p.to === to)) return setAsked(t('Already in your next session plan.'))
    if (next) updateSession(next.id, { plannedPassages: [...next.plannedPassages, passage] })
    else planSession({ plannedPassages: [...suggestPassages(), passage] })
    setAsked(t('Added to your next session plan.'))
  }

  // keyboard (design §5.7); never while typing, never over a focused control's own Space/Enter
  const keys = useRef<(e: KeyboardEvent) => void>()
  keys.current = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || document.querySelector('[role="dialog"]')) return
    const onControl = e.target instanceof HTMLElement && !!e.target.closest('button, a, [role="button"]')
    const k = e.key.toLowerCase()
    if (k === ' ' && !onControl) { e.preventDefault(); togglePlay() }
    else if (k === 'r') onRecord()
    else if (k === 'm' && recs[0]) modelThenMe(recs[0])
    else if (k === 'l') cycleLoop()
    else if (k === 'g') toggleGap()
    else if (k === 's') toggleRate()
    else if (k === 'arrowleft' && !onControl) player.next()
    else if (k === 'arrowright' && !onControl) player.prev()
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => keys.current?.(e)
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  // keep the lit word (or ayah) in view
  useEffect(() => {
    if (!busy) return
    const el = document.querySelector('[data-listen] .w[data-mark="lamp"]') ?? document.querySelector('[data-listen] .ayah[data-current]')
    el?.scrollIntoView?.({ block: 'nearest' })
  }, [busy, state.verseKey, state.word])

  // Memoised: the player re-renders this screen several times a second (M7).
  const ayahs = useMemo<PassageAyah[]>(() => (verses ?? []).map((v) => ({
    key: v.verseKey, n: +v.verseKey.split(':')[1], text: v.text, pauses: v.marks, ...(colours ? { segments: tajweedSpans(v) } : {}),
  })), [verses, colours])
  const shownColours = useMemo(() => colours && verses
    ? [...new Set(verses.flatMap((v) => v.tajweed.map((s) => ruleColour(s.rule)).filter((c): c is ColourKey => !!c)))]
    : [], [verses, colours])
  const speaker = phase === 'me' || state.clip ? t('You') : reciter.nameAr
  const unavailable =
    state.status === 'offline' ? t('Audio needs a connection. The text is here; recording still works.')
    : state.status === 'error' ? t("Couldn't load the recitation.") : undefined
  const marks = useMemo(() => (dotted && busy ? { [dotted]: 'lamp-dotted' as const } : undefined), [dotted, busy])
  const lit = state.word && !state.clip && state.verseKey ? { key: state.verseKey, word: state.word[0] + 1 } : undefined
  const recOff =
    rec.state.status === 'denied' ? t("Recording is off. You can turn the microphone on in your browser's site settings.")
    : rec.state.status === 'unsupported' ? t("This browser can't record. Try Safari or Chrome.") : undefined
  const [s1, a1] = from.split(':')
  const [s2, a2] = to.split(':')
  const quranCom = `https://quran.com/${s1}/${s1 === s2 ? (a1 === a2 ? a1 : `${a1}-${a2}`) : a1}`

  return (
    <Page width="wide" className="lg:max-w-[1120px]">
    <Hint id="listen">{t('Play to hear the reciter, repeat in the pause after each ayah. Tap a word to hear it alone. Record yourself, then play “reciter, then me”.')}</Hint>
    <div data-listen className="grid items-start gap-space-lg lg:grid-cols-[minmax(0,1fr)_360px]">
      <header className="flex flex-wrap items-center justify-between gap-x-space-md gap-y-space-sm lg:col-span-2">
        <h2 className="font-naskh text-[24px] leading-snug font-bold sm:text-[28px]" lang="ar" dir="rtl">{label}</h2>
        <label className="flex items-center gap-space-sm">
          <span className="text-label font-semibold text-on-surface-variant">{t('Reciter')}</span>
          <select value={reciter.id} onChange={(e) => { cancelCompare(); setReciterId(e.target.value) }} dir="auto"
            className={fieldCls('w-auto max-w-[240px] cursor-pointer font-arabic text-body-md')}>
            {RECITERS.map((r) => <option key={r.id} value={r.id} lang="ar">{r.nameAr}</option>)}
          </select>
        </label>
        {listenDone && <p className="flex basis-full items-center gap-1 text-body-md text-success" role="status"><Icon name="check_circle" size={18} fill />{t('Listening counted for today')}</p>}
      </header>

      {(params.range && !parsed) || range.to !== wanted.to ? (
        <div className="flex flex-col gap-space-sm lg:col-span-2">
          {params.range && !parsed && <Nudge><T>{t("That passage link isn't valid, so here is {label}.", { label })}</T></Nudge>}
          {range.to !== wanted.to && <Nudge><T>{t('That passage is long, so here are its first {n} ayat: {label}.', { n: MAX_AYAT, label })}</T></Nudge>}
        </div>
      ) : null}

      <div className="flex min-w-0 flex-col gap-space-md rounded-card border border-outline-variant bg-surface-container-lowest p-space-md sm:p-space-lg [&_.w]:scroll-mt-20 [&_.w]:scroll-mb-[300px]">
        {textError ? (
          <EmptyState icon="cloud_off" title={t("Couldn't load the text.")} action={<Button variant="secondary" onClick={() => setAttempt((n) => n + 1)}>{t('Try again')}</Button>}>
            {t('Check your connection. Text you have opened before works offline.')}
          </EmptyState>
        ) : !verses ? (
          <Skeleton verse lines={4} label={t('Loading {label}…', { label })} />
        ) : (
          <>
            <Passage
              ayahs={ayahs}
              tajweed={colours}
              isolate={isolate}
              currentAyah={state.status !== 'idle' || state.index > 0 ? state.verseKey ?? undefined : undefined}
              current={lit}
              marks={marks}
              onWord={onWord}
              onAyah={(k) => {
                if (state.status === 'gap') return player.skipGap()
                cancelCompare()
                player.seek(verses.findIndex((v) => v.verseKey === k))
              }}
            />
            {colours && (
              <div className="flex flex-col gap-space-sm rounded-control bg-surface-container-low p-space-md text-body-md">
                <Legend colours={shownColours} isolate={isolate} onIsolate={setIsolate} />
                <p className="text-on-surface-variant"><T>{t('Colours come from the quran-tajweed markup. It does not mark every rule (for example الراء and الإظهار), so a word without colour may still carry a rule.')}</T></p>
              </div>
            )}
            <p className="flex items-center gap-space-xs text-body-md text-on-surface-variant"><Icon name="touch_app" size={18} />{t('Tap a word to hear it alone. Tap an ayah number to jump to it.')}</p>
          </>
        )}
      </div>

      <aside className="flex flex-col gap-space-md max-lg:contents lg:sticky lg:top-24">
        <div className="sticky bottom-0 z-20 -mx-gutter md:-mx-gutter-md md:px-gutter-md flex flex-col gap-space-sm border-t border-outline-variant bg-surface-container-lowest px-gutter pt-space-sm pb-[max(var(--spacing-space-sm),env(safe-area-inset-bottom))] shadow-bar max-lg:order-none lg:static lg:mx-0 lg:rounded-card lg:border lg:p-space-lg lg:shadow-card"
          onClick={(e) => { if (state.status === 'gap' && e.target === e.currentTarget) player.skipGap() }}>
          <AudioTransport
            playing={busy || !!phase}
            loading={state.status === 'loading'}
            unavailable={!verses ? t('Loading…') : unavailable}
            label={refLabel(state.verseKey ?? from)}
            speaker={phase === 'silence' ? undefined : speaker}
            loop={state.loops}
            rate={state.rate}
            gap={state.gap !== 'off'}
            ayahCount={verses && verses.length > 1 ? verses.length : undefined}
            ayahIndex={state.index}
            yourTurn={state.status === 'gap' ? state.gapLeft : null}
            onPlayPause={togglePlay}
            onPrev={() => { cancelCompare(); player.prev() }}
            onNext={() => { cancelCompare(); player.next() }}
            onLoop={cycleLoop}
            onRate={toggleRate}
            onGap={toggleGap}
            onSeekAyah={(i) => { cancelCompare(); player.seek(i) }}
            chips={<ToggleChip icon="palette" label={t('Colours')} value={colours ? t('on') : t('off')} pressed={colours} onClick={() => { setColours(!colours); setIsolate(null) }} />}
          />
          {(state.status === 'gap' || state.status === 'error' || state.status === 'offline') && (
            <div className="flex justify-center">
              {state.status === 'gap' && <Button variant="ghost" onClick={() => player.skipGap()}><Icon name="skip_next" size={20} />{t('Skip the pause')}</Button>}
              {(state.status === 'error' || state.status === 'offline') && <Button variant="secondary" onClick={() => player.play()}><Icon name="refresh" size={20} />{t('Try again')}</Button>}
            </div>
          )}
        </div>

        <Panel aria-label={t('Record yourself')}>
          <RecordButton
            state={recOff ? 'off' : recording ? 'recording' : saved != null ? 'saved' : 'idle'}
            seconds={recording && rec.state.startedAt ? (now - rec.state.startedAt) / 1000 : (saved ?? 0) / 1000}
            onClick={onRecord}
            offReason={recOff}
          />
          {rec.state.status === 'error' && <Msg error>{rec.state.error ?? t('Recording failed.')} {t('Try again.')}</Msg>}
          {saveError && <Msg error>{saveError}</Msg>}
          {recs[0] && (
            <Actions>
              <Button variant={saved != null ? 'primary' : 'secondary'} onClick={() => modelThenMe(recs[0])} disabled={!verses || recording}><Icon name="compare_arrows" size={20} />{t('Model, then me')}</Button>
              <Button variant="ghost" onClick={() => me(recs[0])} disabled={recording}><Icon name="play_arrow" size={20} fill />{t('Me')}</Button>
            </Actions>
          )}
          {phase && (
            <p className="text-body-md text-primary" aria-live="polite">
              {phase === 'model' ? <>{t('Now:')} <bdi lang="ar" className="font-arabic">{reciter.nameAr}</bdi></> : phase === 'silence' ? t('Now: your turn is next…') : t('Now: You')}
            </p>
          )}

          {recs.length > 0 && (
            <details className="group rounded-control bg-surface-container-low">
              <summary className="flex min-h-12 cursor-pointer list-none items-center gap-space-sm px-space-md text-body-md font-semibold [&::-webkit-details-marker]:hidden">
                <Icon name="library_music" size={20} className="text-secondary" />
                <span className="flex-1">{t('Recordings · {n} · latest {time}', { n: recs.length, time: mmss(recs[0].durationMs) })}</span>
                <Icon name="expand_more" size={20} className="transition-transform group-open:rotate-180" />
              </summary>
              <ul className="flex flex-col divide-y divide-outline-variant px-space-md">
                {recs.map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center justify-between gap-x-space-sm gap-y-1 py-space-xs">
                    <span className="text-body-md tabular-nums">{fmtWhen(r.createdAt)}<Sep />{mmss(r.durationMs)}</span>
                    <span className="flex flex-wrap items-center">
                      <Button variant="ghost" size="sm" onClick={() => me(r)} disabled={recording} aria-label={t('Play me, {when}', { when: fmtWhen(r.createdAt) })}><Icon name="play_arrow" size={18} fill />{t('Me')}</Button>
                      <Button variant="ghost" size="sm" onClick={() => modelThenMe(r)} disabled={!verses || recording} aria-label={t('Model, then me, {when}', { when: fmtWhen(r.createdAt) })}>{t('Model, then me')}</Button>
                      <Button variant="ghost" size="sm" className="w-11 px-0 hover:text-error" onClick={() => remove(r.id).then(refresh)} aria-label={t('Delete recording {when}', { when: fmtWhen(r.createdAt) })}>
                        <Icon name="delete" size={20} /><span className="sr-only">{t('Delete')}</span>
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="px-space-md pb-space-md text-body-md text-on-surface-variant">{t('Keeps your last {n} for this passage. They stay on this device.', { n: KEEP })}</p>
            </details>
          )}

          <p className="flex flex-wrap items-center gap-x-space-sm text-body-md">
            <Button variant="tertiary" className="px-0" onClick={askTeacher}><Icon name="record_voice_over" size={20} />{t('Not sure? Ask your teacher')}</Button>
            {asked && <span role="status">{asked} <a href={href('teacher')} className="font-medium text-primary">{t('See sessions')}</a></span>}
          </p>
        </Panel>

        <div className="flex flex-col gap-space-sm text-body-md">
          <a href={quranCom} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-1 font-medium text-primary"><T>{t('Open on Quran.com')}</T><Icon name="open_in_new" size={18} /></a>
          <p className="hidden text-caption text-on-surface-variant lg:block" aria-hidden="true"><T>{t('Keys: Space play · R record · M model, then me · L loop · G gap · S speed · ← next · → previous')}</T></p>
        </div>
      </aside>

      <Sheet open={askMic} onClose={() => setAskMic(false)} title={t('Record yourself')}>
        <p>{t('Your recordings stay on this device. They are never uploaded. Allow the microphone to record yourself.')}</p>
        <Actions>
          <Button onClick={() => {
            try { localStorage.setItem(MIC_KEY, '1') } catch { /* asks again next time */ }
            setAskMic(false)
            startRecording()
          }}><Icon name="mic" size={20} />{t('Allow microphone')}</Button>
          <Button variant="ghost" onClick={() => setAskMic(false)}>{t('Not now')}</Button>
        </Actions>
      </Sheet>
    </div>
    </Page>
  )
}
