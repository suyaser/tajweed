// Record yourself and play it back (Drill, lesson Say/Recite steps, unit finale). Recordings stay on the device.
import { useEffect, useState } from 'react'
import type { Recording, VerseKey } from '../../core/types'
import { noteRecording, uuid } from '../../core/store'
import { useRecorder } from '../../audio/useRecorder'
import { list, save } from '../../audio/recordings'
import { playMe, playModelThenMe } from '../../audio/compare'
import { Button, Passage, RecordButton, Skeleton, T } from '../../components'
import { useVerses } from '../path/ui'
import { listenHref } from '../path/helpers'
import { rangeRef } from './helpers'
import type { StudyAudio } from './verse'

/** `from`/`to` key the recordings (a verse range, or a pseudo-range like `drill:<id>`). `model` plays the reciter before "me". */
export function Recorder({ from, to = from, audio, model }: { from: string; to?: string; audio: StudyAudio; model?: (rec: Recording) => void }) {
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
        setError("Couldn't save the recording. Your device may be out of space.")
      }
      refresh()
    })
  }

  const last = takes[0]
  return (
    <div className="s-rec">
      <RecordButton
        state={recording ? 'recording' : rec.state.status === 'unsupported' ? 'off' : last ? 'saved' : 'idle'}
        seconds={recording ? Math.max(0, Math.round((now - (rec.state.startedAt ?? now)) / 1000)) : Math.round((last?.durationMs ?? 0) / 1000)}
        onClick={onRecord} offReason="Recording isn't available in this browser. Say it aloud anyway."
      />
      {(error || rec.state.status === 'denied' || rec.state.error) && (
        <p className="t-sm" role="alert">{error ?? rec.state.error ?? 'The microphone is blocked. Allow it in the browser settings.'}</p>
      )}
      {last && !recording && (
        <div className="s-part-actions">
          {model && !audio.offline && <Button variant="secondary" onClick={() => model(last)}>▶ Reciter, then me</Button>}
          <Button variant="secondary" onClick={() => playMe(audio.player, last)}>▶ Play me</Button>
        </div>
      )}
      <p className="t-sm muted">Recordings stay on this device.</p>
    </div>
  )
}

/** A passage to recite: the text, ▶ the reciter, record, compare, then `doneLabel` (lesson Recite step, unit finale). */
export function PassageRecite({ from, to, audio, doneLabel, onDone }: {
  from: VerseKey; to: VerseKey; audio: StudyAudio; doneLabel: string; onDone?: () => void
}) {
  const { verses, ayahs, error, loading } = useVerses(from, to)
  return (
    <div className="s-study">
      <p className="t-lg"><T>{`Recite ${rangeRef(from, to)}. Listen first, then recite it yourself and record.`}</T></p>
      {loading && <Skeleton verse lines={3} label="Loading the text…" />}
      {error && <p className="muted">{error}</p>}
      {ayahs && <Passage ayahs={ayahs} size="read" tajweed />}
      <div className="s-part-actions">
        {!audio.offline && <Button variant="secondary" onClick={() => verses && audio.passage(verses)} disabled={!verses}>▶ Listen</Button>}
        <a className="btn btn-ghost" href={listenHref(from, to)}>Open in the player ›</a>
      </div>
      <Recorder from={from} to={to} audio={audio} model={r => { if (verses) { audio.player.load(verses, audio.reciter); playModelThenMe(audio.player, r) } }} />
      {onDone && <Button block onClick={onDone}>{doneLabel}</Button>}
    </div>
  )
}
