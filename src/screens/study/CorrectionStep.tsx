// A teacher-correction review item (design §5.4, spec F3): listen → record → compare → self-rating.
import { useState } from 'react'
import type { Correction, Recording } from '../../core/types'
import { uuid } from '../../core/store'
import { getLesson } from '../../content'
import { useRecorder } from '../../audio/useRecorder'
import { playModelThenMe } from '../../audio/compare'
import { save } from '../../audio/recordings'
import { Button, Card, CorrectionTag, RecordButton, Skeleton, T, VerseBlock } from '../../components'
import { verseRef } from './helpers'
import { useVerse, type StudyAudio } from './verse'

export function CorrectionStep({ c, audio, onRate, onNext }: {
  c: Correction; audio: StudyAudio; onRate: (applied: boolean) => void; onNext: () => void
}) {
  const vs = useVerse(c.verseKey)
  const rec = useRecorder()
  const [take, setTake] = useState<Recording | null>(null)
  const [rated, setRated] = useState<boolean | null>(null)
  const lessons = c.lessonIds.map(getLesson).filter(Boolean)

  const record = async () => {
    if (rec.state.status === 'recording') return rec.stop()
    audio.stop()
    const r = await rec.start()
    if (!r) return
    const t: Recording = { id: uuid(), from: c.verseKey, to: c.verseKey, createdAt: new Date().toISOString(), ...r }
    setTake(t)
    save(t).catch(() => { /* kept in memory for this compare */ })
  }
  const compare = () => {
    if (!take || !vs.verse) return
    audio.player.load([vs.verse], audio.reciter)
    playModelThenMe(audio.player, take)
  }
  const micOff = rec.state.status === 'unsupported' || rec.state.status === 'denied' || rec.state.status === 'error'
  const canRate = !!take || micOff
  const rate = (applied: boolean) => { if (rated == null) { setRated(applied); onRate(applied) } }

  return (
    <div className="s-study">
      <p className="eyebrow">Teacher correction · <CorrectionTag severity={c.severity} gloss /></p>
      <Card level="e2">
        <VerseBlock
          text={vs.verse?.text ?? ''} size="focus" reference={verseRef(c.verseKey)}
          marks={c.wordPosition ? { [c.wordPosition]: 'ring' } : undefined}
        />
        {!vs.verse && (vs.failed ? <p className="t-sm muted">The text needs a connection. Recite from your muṣḥaf.</p> : <Skeleton verse lines={2} />)}
        {c.note && <p><span className="muted">Your teacher's note: </span><T>{c.note}</T></p>}
        {lessons.length > 0 && <p className="t-sm muted"><T>{`Rule: ${lessons.map(l => l!.nameAr).join(' · ')}`}</T></p>}
      </Card>
      <ol className="s-steps3">
        <li>
          {audio.offline
            ? <span className="t-sm muted">Audio needs a connection, so skip listening today.</span>
            : <Button variant="secondary" disabled={!vs.verse} onClick={() => vs.verse && audio.ayah(vs.verse)}>▶ Listen</Button>}
        </li>
        <li>
          <RecordButton
            state={micOff ? 'off' : rec.state.status === 'recording' ? 'recording' : take ? 'saved' : 'idle'}
            seconds={Math.round((take?.durationMs ?? 0) / 1000)}
            onClick={record}
            offReason={rec.state.status === 'denied' ? 'The microphone is off. You can still rate yourself.' : 'Recording is not available here. You can still rate yourself.'}
          />
        </li>
        <li><Button variant="secondary" disabled={!take || !vs.verse || audio.offline} onClick={compare}>Model, then me</Button></li>
      </ol>
      <p className="t-lg">Did you apply the fix?</p>
      <div className="opts">
        <Button variant={rated === true ? 'primary' : 'secondary'} disabled={!canRate || rated != null} onClick={() => rate(true)}>Applied the fix</Button>
        <Button variant={rated === false ? 'primary' : 'secondary'} disabled={!canRate || rated != null} onClick={() => rate(false)}>Not yet</Button>
      </div>
      <p className="t-sm muted s-center">Your own rating{canRate ? '' : ' · record first'}</p>
      <div aria-live="polite">
        {rated != null && (
          <>
            <Card className="s-feedback"><p>Saved. Your teacher will check it.</p></Card>
            <Button block autoFocus onClick={onNext} className="s-study-next">Next</Button>
          </>
        )}
      </div>
    </div>
  )
}
