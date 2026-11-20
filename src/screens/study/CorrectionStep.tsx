// A teacher-correction review item (design §5.4, spec F3): listen → record → compare → self-rating.
import { useState } from 'react'
import type { Correction, Recording } from '../../core/types'
import { uuid } from '../../core/store'
import { getLesson } from '../../content'
import { useRecorder } from '../../audio/useRecorder'
import { playModelThenMe } from '../../audio/compare'
import { save } from '../../audio/recordings'
import { Button, Card, CorrectionTag, RecordButton, Skeleton, VerseBlock } from '../../components'
import { t } from '../../i18n'
import { Tx } from './i18n'
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
      <p className="eyebrow">{t('Teacher correction')} · <CorrectionTag severity={c.severity} gloss /></p>
      <Card level="e2">
        <VerseBlock
          text={vs.verse?.text ?? ''} size="focus" reference={verseRef(c.verseKey)}
          marks={c.wordPosition ? { [c.wordPosition]: 'ring' } : undefined}
        />
        {!vs.verse && (vs.failed ? <p className="t-sm muted">{t('The text needs a connection. Recite from your muṣḥaf.')}</p> : <Skeleton verse lines={2} />)}
        {c.note && <p><span className="muted">{t("Your teacher's note: ")}</span><Tx>{c.note}</Tx></p>}
        {lessons.length > 0 && <p className="t-sm muted"><Tx>{t('Rule: {x}', { x: lessons.map(l => l!.nameAr).join(' · ') })}</Tx></p>}
      </Card>
      <ol className="s-steps3">
        <li>
          {audio.offline
            ? <span className="t-sm muted">{t('Audio needs a connection, so skip listening today.')}</span>
            : <Button variant="secondary" disabled={!vs.verse} onClick={() => vs.verse && audio.ayah(vs.verse)}>{t('▶ Listen')}</Button>}
        </li>
        <li>
          <RecordButton
            state={micOff ? 'off' : rec.state.status === 'recording' ? 'recording' : take ? 'saved' : 'idle'}
            seconds={Math.round((take?.durationMs ?? 0) / 1000)}
            onClick={record}
            offReason={rec.state.status === 'denied' ? t('The microphone is off. You can still rate yourself.') : t('Recording is not available here. You can still rate yourself.')}
          />
        </li>
        <li><Button variant="secondary" disabled={!take || !vs.verse || audio.offline} onClick={compare}>{t('Model, then me')}</Button></li>
      </ol>
      <p className="t-lg">{t('Did you apply the fix?')}</p>
      <div className="opts">
        <Button variant={rated === true ? 'primary' : 'secondary'} disabled={!canRate || rated != null} onClick={() => rate(true)}>{t('Applied the fix')}</Button>
        <Button variant={rated === false ? 'primary' : 'secondary'} disabled={!canRate || rated != null} onClick={() => rate(false)}>{t('Not yet')}</Button>
      </div>
      <p className="t-sm muted s-center">{t('Your own rating')}{canRate ? '' : t(' · record first')}</p>
      <div aria-live="polite">
        {rated != null && (
          <>
            <Card className="s-feedback"><p>{t('Saved. Your teacher will check it.')}</p></Card>
            <Button block autoFocus onClick={onNext} className="s-study-next">{t('Next')}</Button>
          </>
        )}
      </div>
    </div>
  )
}
