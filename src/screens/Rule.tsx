import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { ScreenProps } from '../app/App'
import { href } from '../app/router'
import { getLesson, mutun } from '../content'
import { unitOf } from '../content/course'
import { useData } from '../core/store'
import type { Example, Verse } from '../core/types'
import { getVerse, RECITERS } from '../quran'
import { usePlayer } from '../audio/usePlayer'
import {
  Button, COLOURS, CorrectionBadge, CountBeats, EmptyState, LetterTiles, LevelBadge, Line, RuleChip, T, VerseBlock, arDigits,
} from '../components'
import { fmtDay, lessonStatus, useOnline } from './library/shared'
import { rangeParam, refLabel } from './library/range'
import './library.css'
import { isAr, t } from '../i18n'

export default function Rule({ params }: ScreenProps) {
  const lesson = getLesson(params.lessonId)
  const data = useData()
  const online = useOnline()
  const reciter = RECITERS.find((r) => r.id === data.settings.reciterId) ?? RECITERS[0]
  const { state, player } = usePlayer()
  const [verses, setVerses] = useState<Record<string, Verse>>({})
  const [started, setStarted] = useState<string | null>(null) // example whose ▶ was tapped

  useEffect(() => {
    let live = true
    for (const e of lesson?.examples ?? [])
      getVerse(e.verseKey).then((v) => live && v && setVerses((m) => ({ ...m, [v.verseKey]: v })), () => {})
    return () => { live = false }
  }, [lesson])

  const matn = useMemo(() => {
    if (!lesson) return []
    const lines = mutun.filter((m) => m.lessonIds.includes(lesson.id))
    return (['tuhfa', 'jazariyya'] as const).flatMap((k) => {
      const ns = lines.filter((m) => m.matn === k).map((m) => m.n).sort((a, b) => a - b)
      return ns.length ? [{ k, name: k === 'tuhfa' ? 'تحفة الأطفال' : 'المقدمة الجزرية', range: ns.length > 1 ? `${arDigits(ns[0])}–${arDigits(ns[ns.length - 1])}` : arDigits(ns[0]) }] : []
    })
  }, [lesson])

  if (!lesson) {
    return <EmptyState title={t("This rule isn't in the library.")} action={<Button variant="secondary" href={href('rules')}>{t('All rules')}</Button>}>{t('Check the link, or browse the library.')}</EmptyState>
  }

  const s = lessonStatus(data, lesson.id)
  const corrections = data.corrections.filter((c) => !c.deletedAt && c.status === 'open' && c.lessonIds.includes(lesson.id))
  const busy = state.status === 'playing' || state.status === 'loading'

  const play = (e: Example) => {
    const v = verses[e.verseKey]
    if (!v) return
    if (busy && started === e.id) return player.stop()
    player.load([v], reciter, { skipBasmala: true }) // synchronous inside the tap (iOS)
    player.play()
    setStarted(e.id)
  }

  return (
    <article className="rule-card card card-e1 card-stripe" style={{ '--rc': lesson.colour ? `var(--t-${lesson.colour})` : 'var(--gold-ink)' } as CSSProperties}>
      <header className="rule-head">
        <h2 className="a-h3" lang="ar" dir="rtl">{lesson.nameAr}</h2>
        {lesson.colour && <RuleChip nameAr={COLOURS[lesson.colour].ar} colour={lesson.colour} />}
      </header>
      {!isAr && <p className="muted">{lesson.nameEn}</p>}
      <p>
        <LevelBadge level={s.level} detail={s.dueOn ? t('next review {day}', { day: fmtDay(s.dueOn) }) : undefined} />
      </p>
      {corrections.map((c) => (
        <p key={c.id}>
          <a href={href('listen', c.verseKey)}>
            <CorrectionBadge>{t('Teacher correction open:')} <bdi lang="ar" className="a">{refLabel(c.verseKey)}</bdi></CorrectionBadge>
          </a>
          {c.note && <span className="t-sm muted"> <T>{c.note}</T></span>}
        </p>
      ))}

      {lesson.review.status === 'verified' ? (
        <p className="rule-review t-sm"><span aria-hidden="true">✓</span> {t('Checked against the sources by a teacher.')}{lesson.review.notes ? <> <T>{lesson.review.notes}</T></> : null}</p>
      ) : (
        <div className="rule-draft" role="note">
          <b>{t('Draft.')}</b> {t('Not yet checked by a teacher. Read it with your teacher before relying on it.')}
          {lesson.review.notes && <p className="t-sm"><T>{lesson.review.notes}</T></p>}
        </div>
      )}

      <hr />
      <p><T>{lesson.summary}</T></p>

      {(lesson.letters || lesson.counts || lesson.conditions?.length || lesson.list?.length) && (
        <dl className="rule-facts">
          {lesson.letters && <><dt>{t('Letters')}</dt><dd><LetterTiles letters={lesson.letters} colour={lesson.colour} /></dd></>}
          {lesson.counts && (
            <><dt>{t('Length')}</dt><dd>
              <CountBeats min={lesson.counts.min} max={lesson.counts.max} colour={lesson.colour} />{' '}
              {lesson.counts.min === lesson.counts.max ? t('{n} counts', { n: lesson.counts.min }) : t('{min}–{max} counts', { min: lesson.counts.min, max: lesson.counts.max })}
              {lesson.counts.note && <span className="t-sm muted"> · <T>{lesson.counts.note}</T></span>}
            </dd></>
          )}
          {lesson.conditions?.length ? <><dt>{t('When')}</dt><dd><ul>{lesson.conditions.map((c, i) => <li key={i}><T>{c}</T></li>)}</ul></dd></> : null}
          {lesson.list?.length ? (
            <><dt>{t('List')}</dt><dd><ul>{lesson.list.map(([a, b], i) => <li key={i} className="rule-pair"><span><T>{a}</T></span>{b && <Line text={b} />}</li>)}</ul></dd></>
          ) : null}
        </dl>
      )}

      {lesson.examples.length > 0 && (
        <section className="rule-ex" aria-label={t('Examples')}>
          <h3 className="eyebrow">{isAr ? 'أمثلة' : <T>Examples · أمثلة</T>}</h3>
          {lesson.examples.map((e) => {
            const v = verses[e.verseKey]
            const lit = state.verseKey === e.verseKey && state.word ? state.word[0] + 1 : undefined
            const playingThis = busy && started === e.id
            return (
              <div key={e.id} className="rule-example">
                <VerseBlock
                  text={v?.text ?? e.text}
                  focus={v ? [e.wordFrom, e.wordTo] : undefined}
                  focusText={e.focus}
                  pauses={v?.marks}
                  current={lit}
                  stopping={e.stopping}
                  onWord={v ? (n) => { setStarted(null); player.playWord(v, n - 1) } : undefined}
                  reference={refLabel(e.verseKey)}
                  actions={
                    <span className="rule-ex-actions" lang={isAr ? 'ar' : 'en'} dir={isAr ? 'rtl' : 'ltr'}>
                      <button
                        type="button" className="icon-btn" onClick={() => play(e)} disabled={!v || !online}
                        aria-label={online ? `${playingThis ? t('Stop') : t('Play')} ${refLabel(e.verseKey)}` : t('Play: needs a connection')}
                      >
                        <span aria-hidden="true">{playingThis ? '■' : '▶'}</span>{!online && <small> {t('needs a connection')}</small>}
                      </button>
                      <a className="icon-btn" href={href('listen', rangeParam({ from: e.verseKey, to: e.verseKey }))} aria-label={t('Open {ref} in the player', { ref: refLabel(e.verseKey) })}>
                        {t('Player')} <span aria-hidden="true">›</span>
                      </a>
                    </span>
                  }
                />
                {e.note && <p className="t-sm muted"><T>{e.note}</T></p>}
              </div>
            )
          })}
          {(state.status === 'error' || state.status === 'offline') && <p className="t-sm" role="status">{state.error}</p>}
          <p className="t-sm muted">{t('Tap a word to hear it alone.')}</p>
        </section>
      )}

      {lesson.tip && <p className="rule-tip"><b aria-hidden="true">!</b> <T>{lesson.tip}</T></p>}

      {lesson.confusableWith.length > 0 && (
        <div className="rule-mix">
          <p className="t-sm">{t('Easy to mix up with:')}</p>
          <div className="lib-chips">
            {lesson.confusableWith.map((id) => {
              const o = getLesson(id)
              return o ? <RuleChip key={id} nameAr={o.nameAr} colour={o.colour} href={href('rules', id)} /> : null
            })}
          </div>
        </div>
      )}

      {matn.length > 0 && (
        <p className="t-sm">
          {matn.map((m, i) => (
            <span key={m.k}>{i ? ' · ' : ''}<a href={href('mutun', m.k)}>{t('R2:')} <bdi lang="ar" className="a">{m.name} {m.range}</bdi></a></span>
          ))}
        </p>
      )}

      {lesson.sources.length > 0 && (
        <details className="rule-sources">
          <summary>{t('Sources ({n})', { n: lesson.sources.length })}</summary>
          <ul>
            {lesson.sources.map((src, i) => (
              <li key={i} className="t-sm"><T>{src.title}</T>{src.locator && <span className="muted"> · <Locator text={src.locator} /></span>}</li>
            ))}
          </ul>
        </details>
      )}

      <footer className="rule-foot">
        {s.introduced ? (
          <p className="muted">{s.dueOn ? t('In your review. Next due {day}.', { day: fmtDay(s.dueOn) }) : t('In your review.')}</p>
        ) : (
          <>
            <Button block href={href('learn', lesson.id)}>{t('Learn this')}</Button>
            <p className="t-sm muted"><T>{t("Reading a card doesn't add it to your review. Learning it does. You'll meet it in unit {n} of the course.", { n: unitOf(lesson.id)?.n ?? '–' })}</T></p>

          </>
        )}
      </footer>
    </article>
  )
}

/** Source locators mix Arabic, page numbers and URLs: link the URLs, isolate the rest. */
function Locator({ text }: { text: string }) {
  return (
    <>
      {text.split(/(https?:\/\/\S+)/).map((p, i) =>
        /^https?:\/\//.test(p) ? <a key={i} href={p.replace(/[)،,.]+$/, '')} target="_blank" rel="noopener">{p.replace(/^https?:\/\//, '').replace(/[)،,.]+$/, '')} ↗</a> : <T key={i}>{p}</T>,
      )}
    </>
  )
}
