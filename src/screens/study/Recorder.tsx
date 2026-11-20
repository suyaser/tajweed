// Record yourself and play it back (Drill, lesson Say/Recite steps, unit finale). Recordings stay on the device.
import { useEffect, useState } from 'react'
import type { Recording, VerseKey } from '../../core/types'
import { noteRecording, uuid } from '../../core/store'
import { useRecorder } from '../../audio/useRecorder'
import { list, save } from '../../audio/recordings'
import { playMe, playModelThenMe } from '../../audio/compare'
import { Button, Passage, RecordButton, Skeleton } from '../../components'
import { t } from '../../i18n'
import { useVerses } from '../path/ui'
import { listenHref } from '../path/helpers'
import { rangeRef } from './helpers'
import { Tx } from './i18n'
import { PlayOptions, type StudyAudio } from './verse'

/**
 * `from`/`to` key the recordings (a verse range, or a pseudo-range like `drill:<id>`). With `model` (reciter, then
 * me) and `reciter` (the reciter alone) the compare row is [▶ Reciter] [▶ Me] [▶ Both], Both the filled one (review
 * plan "Now" 2). `onStatus` reports a saved take, or that recording is off here.
 */
export function Recorder({ from, to = from, audio, model, reciter, onStatus }: {
  from: string; to?: string; audio: StudyAudio; model?: (rec: Recording) => void; reciter?: () => void; onStatus?: (s: 'saved' | 'off') => void
}) {
  const rec = useRecorder()
  const [takes, setTakes] = useState<Recording[]>([])
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(0)
  const recording = rec.state.status === 'recording'
  const refresh = () => list(from, to).then(setTakes, () => setTakes([]))
  useEffect(() => { refresh() }, [from, to]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!recording) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [recording])

  const onRecord = () => {
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

  const last = takes[0]
  const off = rec.state.status === 'unsupported' || rec.state.status === 'denied'
  useEffect(() => { if (last || off) onStatus?.(last ? 'saved' : 'off') }, [!!last, off]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="s-rec">
      <RecordButton
        state={recording ? 'recording' : rec.state.status === 'unsupported' ? 'off' : last ? 'saved' : 'idle'}
        seconds={recording ? Math.max(0, Math.round((now - (rec.state.startedAt ?? now)) / 1000)) : Math.round((last?.durationMs ?? 0) / 1000)}
        onClick={onRecord} offReason={t("Recording isn't available here. Say it aloud, then rate yourself.")}
      />
      {(error || rec.state.status === 'denied' || rec.state.error) && (
        <p className="t-sm" role="alert">{error ?? rec.state.error ?? t('The microphone is blocked. Allow it in the browser settings.')}</p>
      )}
      {last && !recording && (
        <div className="s-compare" role="group" aria-label={t('Compare')}>
          {reciter && !audio.offline && <Button variant="secondary" onClick={() => { audio.stop(); reciter() }}>{t('▶ Reciter')}</Button>}
          <Button variant="secondary" onClick={() => { audio.stop(); playMe(audio.player, last) }}>{t('▶ Me')}</Button>
          {model && !audio.offline && <Button onClick={() => { audio.stop(); model(last) }}>{t('▶ Both')}</Button>}
        </div>
      )}
      <p className="t-sm muted">{t('Recordings stay on this device.')}</p>
    </div>
  )
}

/**
 * A passage to recite (lesson Recite step, unit finale), in numbered rows (docs/10 §4.8): listen, record, compare,
 * then `doneLabel`. No tajweed colours. `onReady` fires once listening finished or a take exists (or neither is possible).
 */
export function PassageRecite({ from, to, audio, doneLabel, onDone, onReady }: {
  from: VerseKey; to: VerseKey; audio: StudyAudio; doneLabel?: string; onDone?: () => void; onReady?: () => void
}) {
  const { verses, ayahs, error, loading } = useVerses(from, to)
  const listen = () => {
    if (audio.busy) return audio.stop()
    if (!verses) return
    audio.passage(verses)
    audio.player.whenDone().then(ok => ok && onReady?.())
  }
  return (
    <div className="s-study">
      {!onReady && <p className="t-lg"><Tx>{t('Recite {x}. Listen first, then recite it yourself and record.', { x: rangeRef(from, to) })}</Tx></p>}
      {loading && <Skeleton verse lines={3} label={t('Loading the text…')} />}
      {error && <p className="muted">{error}</p>}
      {ayahs && <Passage ayahs={ayahs} size="read" tajweed={false} />}
      <ol className="s-rows">
        <li>
          <p className="s-row-h">{t('Listen to the reciter')}</p>
          <div className="s-part-actions">
            {audio.offline ? <span className="t-sm muted">{t('Audio needs a connection. Read it aloud instead.')}</span> : (
              <Button variant="secondary" aria-pressed={audio.busy} onClick={listen} disabled={!verses}>
                {audio.busy ? t('❚❚ Stop') : t('▶ Listen')}
              </Button>
            )}
            <a className="btn btn-ghost" href={listenHref(from, to)}>{t('Open in the player ›')}</a>
          </div>
          <PlayOptions audio={audio} />
        </li>
        <li>
          <p className="s-row-h">{t('Record yourself, then compare')}</p>
          <Recorder from={from} to={to} audio={audio}
            onStatus={s => (s === 'saved' || audio.offline) && onReady?.()}
            reciter={() => verses && audio.passage(verses)}
            model={r => { if (verses) { audio.player.load(verses, audio.reciter); playModelThenMe(audio.player, r) } }} />
        </li>
      </ol>
      {onDone && <Button block onClick={onDone}>{doneLabel}</Button>}
    </div>
  )
}
