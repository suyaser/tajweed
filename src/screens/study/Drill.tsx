// "Say it aloud" letter drill for مخارج / صفات lessons (learning review M3): read, record, play yourself back.
import { useEffect, useState } from 'react'
import type { Lesson, Recording } from '../../core/types'
import { noteRecording, uuid } from '../../core/store'
import { drillFor } from '../../content'
import { useRecorder } from '../../audio/useRecorder'
import { list, save } from '../../audio/recordings'
import { playMe } from '../../audio/compare'
import { Button, Card, RecordButton } from '../../components'
import type { StudyAudio } from './verse'

/** Recordings are keyed by a pseudo-range `drill:<lessonId>` (the recordings store accepts any from/to). */
export const drillKey = (lessonId: string) => `drill:${lessonId}`

export function Drill({ lesson, audio }: { lesson: Lesson; audio: StudyAudio }) {
  const syllables = drillFor(lesson)
  const key = drillKey(lesson.id)
  const rec = useRecorder()
  const [takes, setTakes] = useState<Recording[]>([])
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(0)
  const recording = rec.state.status === 'recording'
  const refresh = () => list(key, key).then(setTakes, () => setTakes([]))
  useEffect(() => { refresh() }, [key]) // eslint-disable-line react-hooks/exhaustive-deps
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
        await save({ id: uuid(), from: key, to: key, createdAt: new Date().toISOString(), durationMs: take.durationMs, mime: take.mime, blob: take.blob })
        noteRecording()
      } catch {
        setError("Couldn't save the recording. Your device may be out of space.")
      }
      refresh()
    })
  }

  if (!syllables.length) return null
  const last = takes[0]
  return (
    <Card level="e2" className="s-drill">
      <p className="t-lg">Say each one slowly, from its place. Record yourself, then listen back.</p>
      <p className="a-h3 s-center" lang="ar" dir="rtl">{syllables.join('، ')}</p>
      <RecordButton
        state={recording ? 'recording' : rec.state.status === 'unsupported' ? 'off' : last ? 'saved' : 'idle'}
        seconds={recording ? Math.max(0, Math.round((now - (rec.state.startedAt ?? now)) / 1000)) : Math.round((last?.durationMs ?? 0) / 1000)}
        onClick={onRecord} offReason="Recording isn't available in this browser. Say it aloud anyway."
      />
      <p className="t-sm muted">Recordings stay on this device.</p>
      {(error || rec.state.status === 'denied' || rec.state.error) && (
        <p className="t-sm" role="alert">{error ?? rec.state.error ?? 'The microphone is blocked. Allow it in the browser settings.'}</p>
      )}
      {last && !recording && <Button variant="secondary" onClick={() => playMe(audio.player, last)}>▶ Play my recording</Button>}
    </Card>
  )
}
