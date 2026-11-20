// Record yourself and play it back (Drill, lesson Say/Recite steps, unit finale). Recordings stay on the device.
import { useEffect, useState, type ReactNode } from 'react'
import type { Recording, VerseKey } from '../../core/types'
import { noteRecording, uuid } from '../../core/store'
import { useRecorder } from '../../audio/useRecorder'
import { list, save } from '../../audio/recordings'
import { playMe, playModelThenMe } from '../../audio/compare'
import { Passage } from '../../components'
import { Callout, Chip } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { digits, t } from '../../i18n'
import { useVerses } from '../path/ui'
import { listenHref } from '../path/helpers'
import { rangeRef } from './helpers'
import { Tx } from './i18n'
import { PlayOptions, type StudyAudio } from './verse'

const mmss = (s: number) => digits(`${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`)

/**
 * The takes for `from`/`to` (a verse range, or a pseudo-range like `drill:<id>`) and the record action.
 * `onStatus` reports a saved take, or that recording is off here.
 */
export function useTakes(from: string, to: string, audio: StudyAudio, onStatus?: (s: 'saved' | 'off') => void) {
  const rec = useRecorder()
  const [takes, setTakes] = useState<Recording[]>([])
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(0)
  const recording = rec.state.status === 'recording'
  const refresh = () => list(from, to).then(setTakes, () => setTakes([]))
  useEffect(() => { refresh() }, [from, to]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [recording])

  const record = () => {
    if (recording) return rec.stop()
    audio.stop()
    setError(null)
    setNow(Date.now())
    rec.start().then(async take => {
      if (!take) return
      try {
        await save({ id: uuid(), from, to, createdAt: new Date().toISOString(), durationMs: take.durationMs, mime: take.mime, blob: take.blob })
        noteRecording()
      } catch {
        setError(t("Couldn't save the recording. Your device may be out of space."))
      }
      refresh()
    })
  }
  const last = takes[0] as Recording | undefined
  const off = rec.state.status === 'unsupported' || rec.state.status === 'denied'
  useEffect(() => { if (last || off) onStatus?.(last ? 'saved' : 'off') }, [!!last, off]) // eslint-disable-line react-hooks/exhaustive-deps
  const seconds = recording ? Math.max(0, Math.round((now - (rec.state.startedAt ?? now)) / 1000)) : Math.round((last?.durationMs ?? 0) / 1000)
  const alert = error ?? rec.state.error ?? (rec.state.status === 'denied' ? t('The microphone is blocked. Allow it in the browser settings.') : null)
  return { record, recording, last, off: rec.state.status === 'unsupported', alert, seconds, audio }
}
export type Takes = ReturnType<typeof useTakes>

/** The 56px record button with its state line: Record · Stop 0:04 · ✓ Recorded 0:04 (Record again). */
export function RecordControl({ r, offReason = t("Recording isn't available here. Say it aloud, then rate yourself.") }: { r: Takes; offReason?: string }) {
  if (r.off) return <Callout variant="note" icon="mic_off">{offReason}</Callout>
  return (
    <div className="flex flex-col items-center gap-space-sm">
      <button type="button" onClick={r.record} aria-label={r.recording ? t('Stop recording') : r.last ? t('Record again') : t('Record')}
        className={cn('grid size-14 cursor-pointer place-items-center rounded-full bg-error text-on-error shadow-card transition-transform active:scale-95',
          r.recording && 'ring-4 ring-error-container motion-safe:animate-pulse')}>
        <Icon name={r.recording ? 'stop' : 'mic'} size={28} fill />
      </button>
      <span className="text-body-md text-on-surface-variant" aria-live="polite">
        {r.recording ? t('Recording {time}', { time: mmss(r.seconds) })
          : r.last ? <Chip tone="success" icon="check_circle" fill>{t('Recorded {time}', { time: mmss(r.seconds) })}</Chip>
            : t('Tap to record')}
      </span>
      {r.alert && <p className="text-body-md text-error" role="alert">{r.alert}</p>}
    </div>
  )
}

/** [▶ Reciter] [▶ Me] [▶ Both], Both the filled one (review plan "Now" 2). Needs a take. */
export function CompareControl({ r, reciter, model }: { r: Takes; reciter?: () => void; model?: (rec: Recording) => void }) {
  const { audio, last } = r
  if (!last || r.recording) return <p className="text-body-md text-on-surface-variant">{t('Record first, then compare.')}</p>
  const btn = 'h-auto min-h-14 flex-1 flex-col gap-0.5 px-2 py-2'
  return (
    <div className="flex gap-space-sm" role="group" aria-label={t('Compare')}>
      {reciter && !audio.offline && (
        <Button variant="secondary" className={btn} onClick={() => { audio.stop(); reciter() }}><Icon name="play_circle" size={20} />{t('Reciter')}</Button>
      )}
      <Button variant="secondary" className={btn} onClick={() => { audio.stop(); playMe(audio.player, last) }}><Icon name="play_circle" size={20} />{t('Me')}</Button>
      {model && !audio.offline && (
        <Button className={cn(btn, 'bg-primary-container text-on-primary-container hover:bg-primary-container/80')} onClick={() => { audio.stop(); model(last) }}>
          <Icon name="compare_arrows" size={20} />{t('Both')}
        </Button>
      )}
    </div>
  )
}

const Private = () => <p className="text-caption text-on-surface-variant"><Icon name="lock" size={14} className="me-1 align-[-2px]" />{t('Recordings stay on this device.')}</p>

/**
 * Record and compare in one block (drill, Recite fallback). With `model` (reciter, then me) and `reciter` (the
 * reciter alone) the compare row has all three.
 */
export function Recorder({ from, to = from, audio, model, reciter, onStatus }: {
  from: string; to?: string; audio: StudyAudio; model?: (rec: Recording) => void; reciter?: () => void; onStatus?: (s: 'saved' | 'off') => void
}) {
  const r = useTakes(from, to, audio, onStatus)
  return (
    <div className="flex flex-col gap-space-md">
      <RecordControl r={r} />
      {r.last && !r.recording && <CompareControl r={r} reciter={reciter} model={model} />}
      <Private />
    </div>
  )
}

/** A numbered sub-card (Say and Recite rows): number, title, optional status at the end. */
export function RowCard({ n, title, status, children }: { n: number; title: string; status?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-space-md rounded-card border border-outline-variant bg-surface-container-lowest p-space-md sm:p-space-lg">
      <h3 className="flex items-center gap-space-sm">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-container text-label font-bold text-primary">{digits(n)}</span>
        <span className="min-w-0 flex-1 text-headline-md text-on-surface">{title}</span>
        {status}
      </h3>
      {children}
    </section>
  )
}

/**
 * A passage to recite (lesson Recite step, unit finale), in numbered cards (docs/10 §4.8): listen, record, compare,
 * then `doneLabel`. No tajweed colours. `onReady` fires once listening finished or a take exists (or neither is possible).
 */
export function PassageRecite({ from, to, audio, doneLabel, onDone, onReady }: {
  from: VerseKey; to: VerseKey; audio: StudyAudio; doneLabel?: string; onDone?: () => void; onReady?: () => void
}) {
  const { verses, ayahs, error, loading } = useVerses(from, to)
  const r = useTakes(from, to, audio, s => (s === 'saved' || audio.offline) && onReady?.())
  const listen = () => {
    if (audio.busy) return audio.stop()
    if (!verses) return
    audio.passage(verses)
    audio.player.whenDone().then(ok => ok && onReady?.())
  }
  return (
    <div className="flex flex-col gap-space-md">
      {!onReady && <p className="text-body-lg text-on-surface"><Tx>{t('Recite {x}. Listen first, then recite it yourself and record.', { x: rangeRef(from, to) })}</Tx></p>}
      <section className="rounded-card border border-outline-variant bg-surface-container-lowest p-space-md sm:p-space-lg">
        <p className="mb-space-xs flex items-center gap-1.5 text-label font-semibold tracking-wider text-secondary"><Icon name="bookmark" size={16} /><span lang="ar">{rangeRef(from, to)}</span></p>
        {loading && <div role="status" className="flex flex-col gap-3 py-space-md"><span className="sr-only">{t('Loading the text…')}</span>{[0, 1, 2].map(i => <Skeleton key={i} className="h-6 w-full" />)}</div>}
        {error && <p className="text-body-md text-on-surface-variant">{error}</p>}
        {ayahs && <Passage ayahs={ayahs} size="read" tajweed={false} />}
      </section>
      <RowCard n={1} title={t('Listen to the reciter')}>
        <div className="flex flex-wrap items-center gap-space-sm">
          {audio.offline ? <p className="text-body-md text-on-surface-variant">{t('Audio needs a connection. Read it aloud instead.')}</p> : (
            <Button variant="secondary" aria-pressed={audio.busy} onClick={listen} disabled={!verses}>
              <Icon name={audio.busy ? 'pause' : 'play_arrow'} fill size={20} />{audio.busy ? t('Stop') : t('Listen')}
            </Button>
          )}
          <Button variant="tertiary" asChild><a href={listenHref(from, to)}>{t('Open in the player')}<Icon name="chevron_right" size={20} rtlFlip /></a></Button>
        </div>
        <PlayOptions audio={audio} />
      </RowCard>
      <RowCard n={2} title={t('Record yourself')}>
        <RecordControl r={r} />
        <Private />
      </RowCard>
      <RowCard n={3} title={t('Compare')}>
        <CompareControl r={r} reciter={() => verses && audio.passage(verses)}
          model={take => { if (verses) { audio.player.load(verses, audio.reciter); playModelThenMe(audio.player, take) } }} />
      </RowCard>
      {onDone && <Button size="lg" className="w-full" onClick={onDone}>{doneLabel}</Button>}
    </div>
  )
}
