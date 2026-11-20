// The rule card body for Learn step 2 (design §5.6), with ▶ per example.
import type { Example, Lesson } from '../../core/types'
import { getLesson } from '../../content'
import { href } from '../../app/router'
import { Card, CountBeats, LetterTiles, Line, RuleChip } from '../../components'
import { countsText } from '../../core/questions'
import { isAr, t } from '../../i18n'
import { Tx } from './i18n'
import { rangeParam, verseRef } from './helpers'
import { ExampleVerse, PlayButton, useVerse, type StudyAudio } from './verse'

function ExampleRow({ ex, audio }: { ex: Example; audio: StudyAudio }) {
  const vs = useVerse(ex.verseKey)
  return (
    <li className="s-ex-row">
      <ExampleVerse
        ex={ex} vs={vs} coloured
        actions={<>
          <PlayButton audio={audio} label={verseRef(ex.verseKey)} onClick={vs.verse && (() => audio.ayah(vs.verse!))} />
          <a className="icon-btn" dir={isAr ? undefined : 'ltr'} lang={isAr ? undefined : 'en'} href={href('listen', rangeParam(ex.verseKey))} aria-label={t('Open {x} in the player', { x: verseRef(ex.verseKey) })}>{t('Player ›')}</a>
        </>}
      />
      {ex.note && <p className="t-sm"><Tx>{ex.note}</Tx></p>}
    </li>
  )
}

export function RuleBody({ lesson, audio }: { lesson: Lesson; audio: StudyAudio }) {
  const counts = lesson.counts
  return (
    <Card stripe={lesson.colour} as="article" className="s-rule-body">
      <header>
        <h2 className="a-h3" lang="ar">{lesson.nameAr}</h2>
        {!isAr && <p className="muted">{lesson.nameEn}</p>}
      </header>
      {lesson.review.status !== 'verified' && (
        <p className="s-draft">{t('Draft. Not yet checked by a teacher. Read it with your teacher before relying on it.')}</p>
      )}
      <p><Tx>{lesson.summary}</Tx></p>
      {(lesson.letters || counts) && (
        <dl className="s-facts">
          {lesson.letters && <><dt className="eyebrow">{t('Letters')}</dt><dd><LetterTiles letters={lesson.letters} colour={lesson.colour} /></dd></>}
          {counts && (
            <><dt className="eyebrow">{t('Length')}</dt>
              <dd><CountBeats min={counts.min} max={counts.max} colour={lesson.colour} /> {countsText(counts.min === counts.max ? counts.min : `${counts.min}–${counts.max}`)}
                {counts.note && <span className="t-sm muted"> · <Tx>{counts.note}</Tx></span>}</dd></>
          )}
        </dl>
      )}
      {lesson.conditions?.length ? <ul className="s-bullets">{lesson.conditions.map((c, i) => <li key={i}><Tx>{c}</Tx></li>)}</ul> : null}
      {lesson.list?.length ? (
        <ul className="s-pairs-list">
          {lesson.list.map(([a, b], i) => <li key={i}><span><Tx>{a}</Tx></span> <Line text={b} /></li>)}
        </ul>
      ) : null}
      {lesson.examples.length > 0 && (
        <>
          <p className="eyebrow">{isAr ? 'أمثلة' : <>Examples · <span lang="ar">أمثلة</span></>}</p>
          <ul className="s-ex-list">{lesson.examples.map(ex => <ExampleRow key={ex.id} ex={ex} audio={audio} />)}</ul>
        </>
      )}
      {lesson.tip && <p className="s-tip"><b>{t('Tip:')}</b> <Tx>{lesson.tip}</Tx></p>}
      {lesson.confusableWith.length > 0 && (
        <div className="s-mix">
          <p className="t-sm muted">{t('Easy to mix up with:')}</p>
          {lesson.confusableWith.map(id => {
            const l = getLesson(id)
            return l && <RuleChip key={id} nameAr={l.nameAr} colour={l.colour} href={href('rules', id)} />
          })}
        </div>
      )}
    </Card>
  )
}
