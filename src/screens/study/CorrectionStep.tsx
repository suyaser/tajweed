// A teacher-correction review item (design §5.4, spec F3): listen → record → compare → self-rating.
import { useState } from 'react'
import type { Correction, Recording } from '../../core/types'
import { uuid } from '../../core/store'
import { getLesson } from '../../content'
import { useRecorder } from '../../audio/useRecorder'
import { playModelThenMe } from '../../audio/compare'
import { save } from '../../audio/recordings'
import { CorrectionTag, VerseBlock } from '../../components'
import { Callout } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { RecordControl, RowCard, type Takes } from './Recorder'
import { t } from '../../i18n'
import { Tx } from './i18n'
import { verseRef } from './helpers'
import { PlayButton, useVerse, type StudyAudio } from './verse'

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

  const r: Takes = {
    record, recording: rec.state.status === 'recording', last: take ?? undefined, off: micOff, seconds: Math.round((take?.durationMs ?? 0) / 1000), audio,
    alert: rec.state.status === 'error' ? rec.state.error : null,
  }

  return (
    <div className="flex min-w-0 flex-col gap-space-md">
      <p className="flex flex-wrap items-center gap-space-sm text-label font-semibold tracking-wider text-secondary uppercase rtl:normal-case">
        {t('Teacher correction')} <CorrectionTag severity={c.severity} gloss />
      </p>
      <section className="flex flex-col gap-space-sm rounded-card border border-outline-variant bg-surface-container-lowest p-space-md sm:p-space-lg">
        {vs.verse ? (
          <VerseBlock text={vs.verse.text} size="focus" reference={verseRef(c.verseKey)} marks={c.wordPosition ? { [c.wordPosition]: 'ring' } : undefined} />
        ) : vs.failed ? <p className="text-body-md text-on-surface-variant">{t('The text needs a connection. Recite from your muṣḥaf.')}</p>
          : <div role="status" className="flex flex-col gap-3 py-space-md">{[0, 1].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>}
        {c.note && <Callout variant="note" title={t("Your teacher's note: ")}><Tx>{c.note}</Tx></Callout>}
        {lessons.length > 0 && <p className="text-body-md text-on-surface-variant"><Tx>{t('Rule: {x}', { x: lessons.map(l => l!.nameAr).join(' · ') })}</Tx></p>}
      </section>
      <RowCard n={1} title={t('Listen')}>
        {audio.offline
          ? <p className="text-body-md text-on-surface-variant">{t('Audio needs a connection, so skip listening today.')}</p>
          : <PlayButton audio={audio} label={verseRef(c.verseKey)} text={t('Listen')} onClick={vs.verse && (() => audio.ayah(vs.verse!))} className="self-start" />}
      </RowCard>
      <RowCard n={2} title={t('Record yourself')}>
        <RecordControl r={r} offReason={rec.state.status === 'denied' ? t('The microphone is off. You can still rate yourself.') : t('Recording is not available here. You can still rate yourself.')} />
      </RowCard>
      <RowCard n={3} title={t('Compare')}>
        <Button variant="secondary" className="self-start" disabled={!take || !vs.verse || audio.offline} onClick={compare}>
          <Icon name="compare_arrows" size={20} />{t('Model, then me')}
        </Button>
      </RowCard>
      <section className="flex flex-col gap-space-sm rounded-card border border-outline-variant bg-surface-container-lowest p-space-md sm:p-space-lg">
        <h3 className="text-headline-md text-on-surface">{t('Did you apply the fix?')}</h3>
        <div className="grid grid-cols-2 gap-space-sm">
          <Button variant={rated === true ? 'primary' : 'secondary'} className="h-auto min-h-12 whitespace-normal" disabled={!canRate || rated != null} onClick={() => rate(true)}>{t('Applied the fix')}</Button>
          <Button variant={rated === false ? 'primary' : 'secondary'} className="h-auto min-h-12 whitespace-normal" disabled={!canRate || rated != null} onClick={() => rate(false)}>{t('Not yet')}</Button>
        </div>
        <p className="text-center text-body-md text-on-surface-variant">{t('Your own rating')}{canRate ? '' : t(' · record first')}</p>
      </section>
      <div aria-live="polite" className="flex flex-col gap-space-md">
        {rated != null && (
          <>
            <Callout variant="note" icon="check_circle">{t('Saved. Your teacher will check it.')}</Callout>
            <Button size="lg" className="w-full" autoFocus onClick={onNext}>{t('Next')}<Icon name="arrow_forward" size={20} rtlFlip /></Button>
          </>
        )}
      </div>
    </div>
  )
}
