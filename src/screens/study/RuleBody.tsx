// The rule card as numbered sections (docs/10 §4.4): Learn step and the lesson's Rule sheet. No tajweed colours.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Example, Lesson } from '../../core/types'
import { getLesson } from '../../content'
import { href } from '../../app/router'
import { CountBeats, LetterTiles, Line, RuleChip } from '../../components'
import { updateSettings, useData } from '../../core/store'
import { countsText } from '../../core/questions'
import { digits, t } from '../../i18n'
import { tn, Tx } from './i18n'
import { verseRef } from './helpers'
import { ExampleCard, ExampleVerse, PlayButton, useVerse, type StudyAudio } from './verse'

const SHOW = 3

/** First sentence, and the rest (until content has a `short` field). */
export function splitDefinition(s: string): [string, string] {
  const i = s.search(/[.!?؟]\s/)
  return i < 0 ? [s, ''] : [s.slice(0, i + 1), s.slice(i + 2).trim()]
}

/** Letter tiles in a letters string (labels like `الهمس:` and a bracketed gloss don't count). */
export const letterCount = (letters: string) =>
  /[A-Za-z]/.test(letters) ? 0 : letters.replace(/\([^)]*\)/g, '').split(/[\s·]+/).filter(x => x && !x.endsWith(':') && /[؀-ۿ]/.test(x)).length

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="s-sec">
      <h3 className="s-sec-h"><span className="s-sec-n" aria-hidden="true">{digits(n)}</span>{title}</h3>
      {children}
    </section>
  )
}

function MoreExample({ ex, audio }: { ex: Example; audio: StudyAudio }) {
  const vs = useVerse(ex.verseKey)
  return (
    <li className="s-ex-row">
      <ExampleVerse ex={ex} vs={vs} spanOnly reference
        actions={<PlayButton audio={audio} label={verseRef(ex.verseKey)} onClick={vs.verse && (() => audio.example(vs.verse!, ex))} />} />
      {ex.note && <p className="t-sm muted"><Tx>{ex.note}</Tx></p>}
    </li>
  )
}

/** المد المنفصل: the learner's length, asked where it is taught (review plan: just in time, not in onboarding). */
function MunfasilChoice() {
  const { settings } = useData()
  const [changed, setChanged] = useState(false)
  return (
    <div className="s-choice" role="group" aria-labelledby="munfasil-h">
      <p id="munfasil-h"><b>{t('Your choice:')}</b> <Tx>{t('4 or 5 counts. Ask your teacher; pick 4 if unsure.')}</Tx></p>
      <p className="t-sm"><Tx>{t('Both are correct for حفص من طريق الشاطبية. Keep the one you choose the same every time, and equal to your المد المتصل.')}</Tx></p>
      <div className="opts">
        {([4, 5] as const).map(n => (
          <button key={n} type="button" className="opt s-pick" aria-pressed={settings.munfasilLength === n}
            onClick={() => { updateSettings({ munfasilLength: n }); setChanged(true) }}>
            <CountBeats min={n} /><small>{countsText(n)}</small>
          </button>
        ))}
      </div>
      <p className="t-sm muted" role="status">
        {changed ? t('Saved. Questions now expect {n} counts.', { n: settings.munfasilLength }) : t('You can change it later in Settings.')}
      </p>
    </div>
  )
}

/** `onRead` fires once the Remember section has been on screen (Learn's "done"). */
/** `example`: the worked example (default the first); the others go under More. */
export function RuleBody({ lesson, audio, onRead, example }: { lesson: Lesson; audio: StudyAudio; onRead?: () => void; example?: Example }) {
  const [what, detail] = splitDefinition(lesson.summary)
  const counts = lesson.counts
  const conds = lesson.conditions ?? []
  const [allConds, setAllConds] = useState(false)
  const [played, setPlayed] = useState(false)
  const remember = useRef<HTMLDivElement>(null)
  const ex0 = example ?? lesson.examples[0]
  const moreEx = lesson.examples.filter(x => x !== ex0)
  useEffect(() => {
    const el = remember.current
    if (!el || !onRead || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { onRead(); io.disconnect() } })
    io.observe(el)
    return () => io.disconnect()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  let n = 0
  const sections: ReactNode[] = []
  sections.push(<Section key="what" n={++n} title={t('What happens')}><p className="t-lg"><Tx>{what}</Tx></p></Section>)
  if (lesson.letters)
    sections.push(
      <Section key="letters" n={++n} title={t('Which letters')}>
        <LetterTiles letters={lesson.letters} />
        {letterCount(lesson.letters) > 1 && <p className="t-sm muted">{tn('{n} letter', '{n} letters', letterCount(lesson.letters))}</p>}
      </Section>,
    )
  if (counts)
    sections.push(
      <Section key="long" n={++n} title={t('How long')}>
        <p className="s-beats"><CountBeats min={counts.min} max={counts.max} /> {!/counts|حرك/.test(counts.note ?? '') && countsText(counts.min === counts.max ? counts.min : `${counts.min}–${counts.max}`)}</p>
        {counts.note && <p className="t-sm muted"><Tx>{counts.note}</Tx></p>}
        {lesson.id === 'munfasil' && <MunfasilChoice />}
      </Section>,
    )
  if (conds.length)
    sections.push(
      <Section key="when" n={++n} title={t('When it applies')}>
        <ol className="s-numlist">{(allConds ? conds : conds.slice(0, SHOW)).map((c, i) => <li key={i}><Tx>{c}</Tx></li>)}</ol>
        {conds.length > SHOW && !allConds && (
          <button type="button" className="s-linkbtn" onClick={() => setAllConds(true)}>{tn('Show {n} more', 'Show {n} more', conds.length - SHOW)}</button>
        )}
      </Section>,
    )
  // the table is the lesson's key content where it has one (the marks in lesson 1, the cases of ر): a section, not More
  if (lesson.list?.length)
    sections.push(
      <Section key="list" n={++n} title={t('At a glance')}>
        <ul className="s-pairs-list">{lesson.list.map(([a, b], i) => <li key={i}><span><Tx>{a}</Tx></span> {b && <Line text={b} />}</li>)}</ul>
      </Section>,
    )
  if (ex0)
    sections.push(
      <Section key="ex" n={++n} title={t('Example')}>
        <ExampleCard ex={ex0} eyebrow={t('Example')} audio={audio} played={played} onPlayed={() => setPlayed(true)} />
      </Section>,
    )
  if (lesson.tip)
    sections.push(
      <Section key="tip" n={++n} title={t('Remember')}>
        <div ref={remember} className="s-remember"><Tx>{lesson.tip}</Tx></div>
      </Section>,
    )

  const hasMore = detail || moreEx.length || lesson.confusableWith.length || lesson.sources.length || lesson.review.notes
  return (
    <article className="s-rule">
      {lesson.review.status !== 'verified' && <p className="s-draft">{t('Draft · check with your teacher')}</p>}
      {sections}
      {!lesson.tip && <div ref={remember} />}
      {hasMore && (
        <details className="s-more">
          <summary>{t('More')}</summary>
          {detail && <><h4 className="eyebrow">{t('In detail')}</h4><p><Tx>{detail}</Tx></p></>}
          {moreEx.length > 0 && (
            <>
              <h4 className="eyebrow">{t('More examples ({n})', { n: moreEx.length })}</h4>
              <ul className="s-ex-list">{moreEx.map(ex => <MoreExample key={ex.id} ex={ex} audio={audio} />)}</ul>
            </>
          )}
          {lesson.confusableWith.length > 0 && (
            <>
              <h4 className="eyebrow">{t('Easy to mix up with')}</h4>
              <div className="s-chips">
                {lesson.confusableWith.map(id => {
                  const l = getLesson(id)
                  return l && <RuleChip key={id} nameAr={l.nameAr} href={href('rules', id)} />
                })}
              </div>
            </>
          )}
          {lesson.review.notes && <p className="t-sm"><Tx>{lesson.review.notes}</Tx></p>}
          {lesson.sources.length > 0 && (
            <>
              <h4 className="eyebrow">{t('Sources')}</h4>
              <ul className="s-bullets t-sm">{lesson.sources.map((s, i) => <li key={i}><Tx>{s.title}</Tx>{s.locator && <span className="muted"> · <Tx>{s.locator}</Tx></span>}</li>)}</ul>
            </>
          )}
          <p className="t-sm"><a href={href('rules', lesson.id)}>{t('Open card ›')}</a></p>
        </details>
      )}
    </article>
  )
}
