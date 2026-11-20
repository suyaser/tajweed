// The rule card as numbered sections (docs/10 §4.4): Learn step and the lesson's Rule sheet. No tajweed colours.
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { Example, Lesson, MatnLine } from '../../core/types'
import { getLesson, mutun } from '../../content'
import { href } from '../../app/router'
import { arDigits, Line, T } from '../../components'
import { updateSettings, useData } from '../../core/store'
import { countsText } from '../../core/questions'
import { digits, isAr, t } from '../../i18n'
import { Callout, CountBeats, LetterTile, SectionCard } from '@/components/kit'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
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

/** A letters string as groups (`الهمس: ف ح …· …`) of tiles, plus a bracketed note. */
export function letterGroups(letters: string) {
  const note = letters.match(/\(([^)]+)\)/)?.[1]
  const groups = letters.replace(/\([^)]*\)/g, '').split('·').map(g => {
    const m = g.match(/^\s*([^:]+):(.*)$/)
    return { label: m?.[1].trim(), tiles: (m ? m[2] : g).split(/\s+/).filter(Boolean) }
  }).filter(g => g.tiles.length)
  return { groups, note }
}

function Letters({ letters }: { letters: string }) {
  if (/[A-Za-z]/.test(letters)) return <p><T>{t(letters)}</T></p> // a description, not tiles (translated in library.json)
  const { groups, note } = letterGroups(letters)
  return (
    <div className="flex flex-col gap-space-sm" lang="ar" dir="rtl">
      {groups.map((g, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          {g.label && <span className="text-arabic-label text-secondary">{g.label}</span>}
          <div className="flex flex-wrap gap-2">{g.tiles.map((l, j) => <LetterTile key={j} letter={l} />)}</div>
        </div>
      ))}
      {note && <span className="text-arabic-label text-on-surface-variant">({note})</span>}
    </div>
  )
}

/** Section title in both languages (SectionCard shows the Arabic at the end in the English UI). */
const SECTION_AR: Record<string, string> = {
  'What happens': 'ما الذي يحدث', 'In the matn': 'من المتن', 'Which letters': 'الحروف', 'At a glance': 'باختصار', 'How long': 'المقدار', 'When it applies': 'متى يكون', Example: 'مثال',
}
const bi = (en: string) => ({ en: t(en), ar: SECTION_AR[en] })

function MoreExample({ ex, audio }: { ex: Example; audio: StudyAudio }) {
  const vs = useVerse(ex.verseKey)
  return (
    <li className="flex items-center gap-space-sm rounded-control bg-surface-container-low px-space-sm">
      <PlayButton audio={audio} label={verseRef(ex.verseKey)} onClick={vs.verse && (() => audio.example(vs.verse!, ex))} />
      <div className="min-w-0 flex-1">
        <ExampleVerse ex={ex} vs={vs} spanOnly reference />
        {ex.note && <p className="pb-2 text-caption text-on-surface-variant"><Tx>{ex.note}</Tx></p>}
      </div>
    </li>
  )
}

/** المد المنفصل: the learner's length, asked where it is taught (review plan: just in time, not in onboarding). */
function MunfasilChoice() {
  const { settings } = useData()
  const [changed, setChanged] = useState(false)
  return (
    <div className="mt-space-md flex flex-col gap-space-sm rounded-control border border-outline-variant p-space-md" role="group" aria-labelledby="munfasil-h">
      <p id="munfasil-h"><b>{t('Your choice:')}</b> <Tx>{t('4 or 5 counts. Ask your teacher; pick 4 if unsure.')}</Tx></p>
      <p className="text-body-md text-on-surface-variant"><Tx>{t('Both are correct for حفص من طريق الشاطبية. Keep the one you choose the same every time, and equal to your المد المتصل.')}</Tx></p>
      <div className="grid grid-cols-2 gap-space-sm">
        {([4, 5] as const).map(n => {
          const on = settings.munfasilLength === n
          return (
            <button key={n} type="button" aria-pressed={on} onClick={() => { updateSettings({ munfasilLength: n }); setChanged(true) }}
              className={cn('flex min-h-16 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-control border p-space-sm transition-colors',
                on ? 'border-primary bg-primary-container text-on-primary-container' : 'border-outline-variant hover:bg-surface-container-low')}>
              <CountBeats min={n} className="gap-1 [&>span]:size-6" />
              <span className="text-label font-semibold">{countsText(n)}</span>
            </button>
          )
        })}
      </div>
      <p className="text-body-md text-on-surface-variant" role="status">
        {changed ? t('Saved. Questions now expect {n} counts.', { n: settings.munfasilLength }) : t('You can change it later in Settings.')}
      </p>
    </div>
  )
}

/** Emphasis in the explanation (Stitch lesson_learn): the Arabic terms inside an English sentence in teal, semibold. */
const EMPH = '[&_bdi:lang(ar)]:font-semibold [&_bdi:lang(ar)]:text-primary'

const MATN_NAME = { tuhfa: 'تحفة الأطفال', jazariyya: 'المقدمة الجزرية' } as const

/** The lines of the matn written for this rule alone (content/mutun.json), the way the rule is memorised. */
function Matn({ lines }: { lines: MatnLine[] }) {
  const shown = lines.slice(0, 3)
  return (
    <SectionCard {...bi('In the matn')}>
      <div className="flex flex-col gap-space-sm rounded-control bg-surface-container-low p-space-md text-center">
        {shown.map(m => (
          <figure key={m.id} className="flex flex-col gap-0.5">
            <blockquote lang="ar" dir="rtl" className="font-naskh text-[19px] leading-[1.9] text-on-surface">
              {m.sadr} <span aria-hidden className="text-gold">۞</span> {m.ajz}
            </blockquote>
            {!isAr && m.gloss && <figcaption className="text-label font-normal text-on-surface-variant"><Tx>{m.gloss}</Tx></figcaption>}
          </figure>
        ))}
      </div>
      <a href={`${href('mutun', shown[0].matn)}?from=${shown[0].n}&to=${shown[shown.length - 1].n}`} lang="ar" className="mt-space-sm inline-flex min-h-11 items-center gap-1 text-arabic-label text-primary no-underline hover:underline">
        <Icon name="history_edu" size={18} />{MATN_NAME[shown[0].matn]} {arDigits(shown[0].n)}{shown.length > 1 && `–${arDigits(shown[shown.length - 1].n)}`}
      </a>
    </SectionCard>
  )
}

const SUB = 'mb-space-xs text-label font-semibold tracking-wider text-on-surface-variant uppercase rtl:normal-case'

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

  // Sections (docs/13 "Learn"): the explanation in the main column, the letters, the matn and the worked example
  // beside it from lg. Each keeps its reading order (`order`), so on phones it is one column as before.
  let n = 0
  const main: ReactNode[] = []
  const side: ReactNode[] = []
  let order = 0
  const put = (to: ReactNode[], key: string, node: ReactNode) => to.push(<div key={key} style={{ order: order++ }} className="min-w-0">{node}</div>)
  put(main, 'what', <SectionCard n={++n} {...bi('What happens')} className={EMPH}><p className="text-body-lg leading-relaxed"><Tx>{what}</Tx></p></SectionCard>)
  if (lesson.letters) {
    const c = letterCount(lesson.letters)
    put(side, 'letters',
      <SectionCard n={++n} {...bi('Which letters')}>
        <Letters letters={lesson.letters} />
        {c > 1 && <p className="mt-space-sm text-label text-on-surface-variant rtl:text-body-md">{tn('{n} letter', '{n} letters', c)}</p>}
      </SectionCard>,
    )
  }
  const matn = mutun.filter(m => m.lessonIds.length === 1 && m.lessonIds[0] === lesson.id)
  if (matn.length) put(side, 'matn', <Matn lines={matn} />)
  if (lesson.list?.length)
    // the table is the lesson's key content where it has one (the marks in lesson 1, the cases of ر): a section, not More
    put(main, 'list',
      <SectionCard n={++n} {...bi('At a glance')} className={EMPH}>
        <table className="w-full border-collapse text-body-md">
          <tbody>
            {lesson.list.map(([a, b], i) => (
              <tr key={i} className="border-b border-surface-container align-top last:border-b-0">
                <th scope="row" className="py-2.5 pe-space-sm text-start font-medium text-on-surface"><Tx>{a}</Tx></th>
                <td className="py-2.5 text-on-surface-variant">{b && <Line text={b} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionCard>,
    )
  if (counts)
    put(main, 'long',
      <SectionCard n={++n} {...bi('How long')} className={EMPH}>
        <div className="flex flex-wrap items-center justify-between gap-space-sm rounded-control bg-surface-container-low p-space-md">
          <span className="text-headline-md text-on-surface">{countsText(counts.min === counts.max ? counts.min : `${counts.min}–${counts.max}`)}</span>
          <CountBeats min={counts.min} max={counts.max} className="flex-wrap" />
        </div>
        {counts.note && <p className="mt-space-sm text-body-md text-on-surface-variant"><Tx>{counts.note}</Tx></p>}
        {lesson.id === 'munfasil' && <MunfasilChoice />}
      </SectionCard>,
    )
  if (conds.length)
    put(main, 'when',
      <SectionCard n={++n} {...bi('When it applies')} className={EMPH}>
        <ol className="flex flex-col gap-space-sm">
          {(allConds ? conds : conds.slice(0, SHOW)).map((c, i) => (
            <li key={i} className="flex gap-space-sm rounded-control bg-surface-container-low p-space-sm ps-space-md">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-container-lowest text-label font-semibold text-primary">{digits(i + 1)}</span>
              <span className="min-w-0 leading-relaxed"><Tx>{c}</Tx></span>
            </li>
          ))}
        </ol>
        {conds.length > SHOW && !allConds && (
          <Button variant="tertiary" size="sm" className="mt-space-xs" onClick={() => setAllConds(true)}>
            {tn('Show {n} more', 'Show {n} more', conds.length - SHOW)}<Icon name="expand_more" size={20} />
          </Button>
        )}
      </SectionCard>,
    )
  // the worked example sits beside the text when nothing else does; with letters or matn beside, it follows the text
  if (ex0)
    put(side.length ? main : side, 'ex',
      <SectionCard n={++n} {...bi('Example')}>
        <ExampleCard ex={ex0} eyebrow={false} className="mt-space-xs rounded-control border-0 bg-surface-container-low" audio={audio} played={played} onPlayed={() => setPlayed(true)} />
      </SectionCard>,
    )

  const hasMore = !!(detail || moreEx.length || lesson.confusableWith.length || lesson.sources.length || lesson.review.notes)
  return (
    <article className="flex min-w-0 flex-col gap-space-md">
      {lesson.review.status !== 'verified' && (
        <Badge variant="secondary" className="self-start"><Icon name="info" size={16} />{t('Draft · check with your teacher')}</Badge>
      )}
      <div className={cn('flex min-w-0 flex-col gap-space-md', side.length > 0 && 'lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start lg:gap-space-lg')}>
        <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-space-md">
          {main}
          <div ref={remember} style={{ order: order }} className={cn('min-w-0', EMPH)}>
            {lesson.tip && <Callout variant="tip" title={t('Remember')}><Tx>{lesson.tip}</Tx></Callout>}
          </div>
        </div>
        {side.length > 0 && <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-space-md">{side}</div>}
      </div>
      {hasMore && (
        <Accordion type="single" collapsible className="rounded-card border border-outline-variant bg-surface-container-lowest px-space-md">
          <AccordionItem value="more">
            <AccordionTrigger><span className="flex items-center gap-space-sm"><Icon name="library_books" size={20} className="text-secondary" />{t('More')}</span></AccordionTrigger>
            <AccordionContent className="flex flex-col gap-space-md">
              {detail && <div><h4 className={SUB}>{t('In detail')}</h4><p><Tx>{detail}</Tx></p></div>}
              {moreEx.length > 0 && (
                <div>
                  <h4 className={SUB}>{t('More examples ({n})', { n: moreEx.length })}</h4>
                  <ul className="flex flex-col gap-space-xs">{moreEx.map(ex => <MoreExample key={ex.id} ex={ex} audio={audio} />)}</ul>
                </div>
              )}
              {lesson.confusableWith.length > 0 && (
                <div>
                  <h4 className={SUB}>{t('Easy to mix up with')}</h4>
                  <div className="flex flex-wrap gap-space-sm">
                    {lesson.confusableWith.map(id => {
                      const l = getLesson(id)
                      return l && (
                        <a key={id} href={href('rules', id)} lang="ar"
                          className="inline-flex min-h-12 items-center rounded-control border border-outline-variant px-space-md text-arabic-label text-on-surface no-underline hover:bg-surface-container-low">
                          {l.nameAr}
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
              {lesson.review.notes && <p className="text-body-md"><Tx>{lesson.review.notes}</Tx></p>}
              {lesson.sources.length > 0 && (
                <div>
                  <h4 className={SUB}>{t('Sources')}</h4>
                  <ul className="list-disc ps-5 text-body-md">
                    {lesson.sources.map((s, i) => <li key={i}><Tx>{s.title}</Tx>{s.locator && <span className="text-on-surface-variant"> · <Tx>{s.locator}</Tx></span>}</li>)}
                  </ul>
                </div>
              )}
              <Button variant="tertiary" asChild className="self-start px-0">
                <a href={href('rules', lesson.id)}>{t('Open card')}<Icon name="chevron_right" size={20} rtlFlip /></a>
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </article>
  )
}
