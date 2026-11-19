// The rule card body for Learn step 2 (design §5.6), with ▶ per example.
import type { Example, Lesson } from '../../core/types'
import { getLesson } from '../../content'
import { href } from '../../app/router'
import { Card, CountBeats, LetterTiles, RuleChip, T } from '../../components'
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
          <a className="icon-btn" dir="ltr" lang="en" href={href('listen', rangeParam(ex.verseKey))} aria-label={`Open ${verseRef(ex.verseKey)} in the player`}>Player ›</a>
        </>}
      />
      {ex.note && <p className="t-sm"><T>{ex.note}</T></p>}
    </li>
  )
}

export function RuleBody({ lesson, audio }: { lesson: Lesson; audio: StudyAudio }) {
  const counts = lesson.counts
  return (
    <Card stripe={lesson.colour} as="article" className="s-rule-body">
      <header>
        <h2 className="a-h3" lang="ar" style={lesson.colour && { color: `var(--t-${lesson.colour})` }}>{lesson.nameAr}</h2>
        <p className="muted">{lesson.nameEn}</p>
      </header>
      {lesson.review.status !== 'verified' && (
        <p className="s-draft">Draft. Not yet checked by a teacher. Read it with your teacher before relying on it.</p>
      )}
      <p><T>{lesson.summary}</T></p>
      {(lesson.letters || counts) && (
        <dl className="s-facts">
          {lesson.letters && <><dt className="eyebrow">Letters</dt><dd><LetterTiles letters={lesson.letters} colour={lesson.colour} /></dd></>}
          {counts && (
            <><dt className="eyebrow">Length</dt>
              <dd><CountBeats min={counts.min} max={counts.max} colour={lesson.colour} /> {counts.min === counts.max ? counts.min : `${counts.min}–${counts.max}`} counts
                {counts.note && <span className="t-sm muted"> · <T>{counts.note}</T></span>}</dd></>
          )}
        </dl>
      )}
      {lesson.conditions?.length ? <ul className="s-bullets">{lesson.conditions.map((c, i) => <li key={i}><T>{c}</T></li>)}</ul> : null}
      {lesson.list?.length ? (
        <ul className="s-pairs-list">
          {lesson.list.map(([a, b], i) => <li key={i}><span><T>{a}</T></span> <span className="muted"><T>{b}</T></span></li>)}
        </ul>
      ) : null}
      {lesson.examples.length > 0 && (
        <>
          <p className="eyebrow">Examples · <span lang="ar">أمثلة</span></p>
          <ul className="s-ex-list">{lesson.examples.map(ex => <ExampleRow key={ex.id} ex={ex} audio={audio} />)}</ul>
        </>
      )}
      {lesson.tip && <p className="s-tip"><b>Tip:</b> <T>{lesson.tip}</T></p>}
      {lesson.confusableWith.length > 0 && (
        <div className="s-mix">
          <p className="t-sm muted">Easy to mix up with:</p>
          {lesson.confusableWith.map(id => {
            const l = getLesson(id)
            return l && <RuleChip key={id} nameAr={l.nameAr} colour={l.colour} href={href('rules', id)} />
          })}
        </div>
      )}
    </Card>
  )
}
