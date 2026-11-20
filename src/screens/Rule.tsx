import { useEffect, useMemo, useState } from 'react'
import type { ScreenProps } from '../app/App'
import { href } from '../app/router'
import { getLesson, lessons, mutun, topics } from '../content'
import { unitOf } from '../content/course'
import { useData } from '../core/store'
import type { Example, Verse } from '../core/types'
import { getVerse, RECITERS } from '../quran'
import { usePlayer } from '../audio/usePlayer'
import { Button, COLOURS, EmptyState, Line, T, VerseBlock, arDigits } from '../components'
import { fmtDay, lessonStatus, useOnline } from './library/shared'
import { rangeParam, refLabel } from './library/range'
import { ColourDot, LevelChip, Letters } from './library/ui'
import { isAr, t } from '../i18n'
import { cn } from '@/lib/utils'
import { Callout, Chip, CountBeats, Page, SectionCard, Sep } from '@/components/kit'
import { Icon } from '@/components/ui/icon'

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
    return (
      <Page>
        <EmptyState icon="search_off" title={t("This rule isn't in the library.")} action={<Button variant="secondary" href={href('rules')}>{t('All rules')}</Button>}>{t('Check the link, or browse the library.')}</EmptyState>
      </Page>
    )
  }

  const s = lessonStatus(data, lesson.id)
  const topic = topics.find((x) => x.id === lesson.topicId)
  const siblings = lessons.filter((l) => l.topicId === lesson.topicId)
  const corrections = data.corrections.filter((c) => !c.deletedAt && c.status === 'open' && c.lessonIds.includes(lesson.id))
  const busy = state.status === 'playing' || state.status === 'loading'
  const facts = !!(lesson.letters || lesson.counts || lesson.conditions?.length || lesson.list?.length)
  let n = 1

  const play = (e: Example) => {
    const v = verses[e.verseKey]
    if (!v) return
    if (busy && started === e.id) return player.stop()
    player.load([v], reciter, { skipBasmala: true }) // synchronous inside the tap (iOS)
    player.play()
    setStarted(e.id)
  }

  return (
    <Page width="wide">
      <div className="grid items-start gap-space-lg lg:grid-cols-[240px_1fr]">
        {topic && (
          <nav aria-label={t('Topics')} className="hidden rounded-card border border-outline-variant bg-surface-container-lowest p-space-sm lg:sticky lg:top-space-lg lg:block">
            <p lang="ar" className="px-space-sm pt-space-xs pb-space-xs font-naskh text-body-lg font-bold text-secondary">{topic.nameAr}</p>
            <ul className="flex flex-col gap-0.5">
              {siblings.map((l) => (
                <li key={l.id}>
                  <a href={href('rules', l.id)} aria-current={l.id === lesson.id ? 'page' : undefined}
                    className={cn('flex min-h-11 items-center gap-space-sm rounded-control px-space-sm no-underline transition-colors',
                      l.id === lesson.id ? 'bg-primary-fill text-on-primary' : 'text-on-surface hover:bg-surface-container')}>
                    <ColourDot colour={l.colour} />
                    <span lang="ar" className="text-arabic-label">{l.nameAr}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <article className="flex min-w-0 flex-col gap-space-lg">
          <header className="flex flex-col gap-space-sm rounded-card border border-outline-variant bg-surface-container-lowest p-space-md sm:p-space-lg">
            <div className="flex flex-wrap items-center gap-space-xs">
              {topic && <Chip tone="gold">{topic.nameAr}{!isAr && <><Sep /><span className="font-normal opacity-80">{topic.nameEn}</span></>}</Chip>}
              {lesson.colour && <Chip tone="outline"><ColourDot colour={lesson.colour} /><span lang="ar">{COLOURS[lesson.colour].ar}</span></Chip>}
            </div>
            <h2 lang="ar" className="font-naskh text-[30px] leading-[1.5] font-bold text-on-surface sm:text-[36px]">{lesson.nameAr}</h2>
            {!isAr && <p className="-mt-space-xs text-headline-md font-medium text-on-surface-variant">{lesson.nameEn}</p>}
            <div className="flex flex-wrap items-center gap-space-xs">
              <LevelChip level={s.level} detail={s.dueOn ? t('next review {day}', { day: fmtDay(s.dueOn) }) : undefined} />
            </div>
            {corrections.map((c) => (
              <p key={c.id} className="flex flex-wrap items-center gap-space-sm">
                <a href={href('listen', c.verseKey)} className="inline-flex min-h-11 items-center gap-1 rounded-control bg-error-container px-3 text-label font-semibold text-on-error-container no-underline">
                  <Icon name="flag" size={16} fill />{t('Teacher correction open:')} <bdi lang="ar" className="font-arabic">{refLabel(c.verseKey)}</bdi>
                </a>
                {c.note && <span className="text-body-md text-on-surface-variant"><T>{c.note}</T></span>}
              </p>
            ))}
            {lesson.review.status === 'verified'
              ? <p className="flex gap-space-xs text-body-md text-on-surface-variant"><Icon name="verified" size={18} fill className="mt-0.5 text-primary" />
                  <span>{t('Checked against the sources by a teacher.')}{lesson.review.notes ? <> <T>{lesson.review.notes}</T></> : null}</span></p>
              : (
                <div role="note">
                  <Callout variant="note" icon="edit_note" title={t('Draft.')}>
                    {t('Not yet checked by a teacher. Read it with your teacher before relying on it.')}
                    {lesson.review.notes && <p className="mt-1 text-on-surface-variant"><T>{lesson.review.notes}</T></p>}
                  </Callout>
                </div>
              )}
          </header>

          <SectionCard n={n++} en="What it is" ar="التعريف">
            <p className="text-body-lg"><T>{lesson.summary}</T></p>
          </SectionCard>

          {facts && (
            <SectionCard n={n++} en="How it works" ar="الضابط">
              <dl className="flex flex-col gap-space-md">
                {lesson.letters && <Fact label={t('Letters')}><Letters letters={lesson.letters} /></Fact>}
                {lesson.counts && (
                  <Fact label={t('Length')}>
                    <span className="flex flex-wrap items-center gap-space-sm">
                      <CountBeats min={lesson.counts.min} max={lesson.counts.max} />
                      <span className="font-semibold">{lesson.counts.min === lesson.counts.max ? t('{n} counts', { n: lesson.counts.min }) : t('{min}–{max} counts', { min: lesson.counts.min, max: lesson.counts.max })}</span>
                    </span>
                    {lesson.counts.note && <span className="text-on-surface-variant"><T>{lesson.counts.note}</T></span>}
                  </Fact>
                )}
                {lesson.conditions?.length ? (
                  <Fact label={t('When')}>
                    <ul className="flex flex-col gap-1">{lesson.conditions.map((c, i) => <li key={i} className="flex gap-space-sm"><Icon name="check" size={18} className="mt-0.5 text-primary" /><span><T>{c}</T></span></li>)}</ul>
                  </Fact>
                ) : null}
                {lesson.list?.length ? (
                  <Fact label={t('List')}>
                    <ul className="flex flex-col divide-y divide-outline-variant">
                      {lesson.list.map(([a, b], i) => <li key={i} className="flex flex-col gap-1 py-space-sm sm:flex-row sm:items-center sm:justify-between"><span><T>{a}</T></span>{b && <Line text={b} />}</li>)}
                    </ul>
                  </Fact>
                ) : null}
              </dl>
            </SectionCard>
          )}

          {lesson.examples.length > 0 && (
            <SectionCard n={n++} en="Examples" ar="أمثلة">
              <div className="flex flex-col gap-space-md" aria-label={t('Examples')} role="group">
                {lesson.examples.map((e) => {
                  const v = verses[e.verseKey]
                  const lit = state.verseKey === e.verseKey && state.word ? state.word[0] + 1 : undefined
                  const playingThis = busy && started === e.id
                  return (
                    <div key={e.id} className="flex flex-col gap-space-xs rounded-control bg-surface-container-low p-space-md">
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
                          <span className="flex flex-wrap items-center gap-space-xs" lang={isAr ? 'ar' : 'en'} dir={isAr ? 'rtl' : 'ltr'}>
                            <Button variant="secondary" size="sm" onClick={() => play(e)} disabled={!v || !online}
                              aria-label={online ? `${playingThis ? t('Stop') : t('Play')} ${refLabel(e.verseKey)}` : t('Play: needs a connection')}>
                              <Icon name={playingThis ? 'stop' : 'volume_up'} size={18} fill={playingThis} />
                              {online ? (playingThis ? t('Stop') : t('Play')) : t('needs a connection')}
                            </Button>
                            <Button variant="tertiary" size="sm" href={href('listen', rangeParam({ from: e.verseKey, to: e.verseKey }))} aria-label={t('Open {ref} in the player', { ref: refLabel(e.verseKey) })}>
                              {t('Player')}<Icon name={isAr ? 'arrow_back' : 'arrow_forward'} size={18} />
                            </Button>
                          </span>
                        }
                      />
                      {e.note && <p className="text-body-md text-on-surface-variant"><T>{e.note}</T></p>}
                    </div>
                  )
                })}
                {(state.status === 'error' || state.status === 'offline') && <p className="text-body-md" role="status">{state.error}</p>}
                <p className="flex items-center gap-space-xs text-body-md text-on-surface-variant"><Icon name="touch_app" size={18} />{t('Tap a word to hear it alone.')}</p>
              </div>
            </SectionCard>
          )}

          {lesson.tip && <Callout variant="tip"><T>{lesson.tip}</T></Callout>}

          {(lesson.confusableWith.length > 0 || matn.length > 0) && (
            <div className="flex flex-col gap-space-md rounded-card bg-surface-container p-space-md sm:p-space-lg">
              {lesson.confusableWith.length > 0 && (
                <div className="flex flex-col gap-space-sm">
                  <p className="text-label font-semibold text-on-surface-variant">{t('Easy to mix up with:')}</p>
                  <div className="flex flex-wrap gap-space-sm">
                    {lesson.confusableWith.map((id) => {
                      const o = getLesson(id)
                      return o ? (
                        <a key={id} href={href('rules', id)} className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-outline-variant bg-surface-container-lowest px-space-md no-underline hover:bg-surface-container-low">
                          <ColourDot colour={o.colour} /><span lang="ar" className="text-arabic-body font-semibold text-on-surface">{o.nameAr}</span>
                        </a>
                      ) : null
                    })}
                  </div>
                </div>
              )}
              {matn.length > 0 && (
                <p className="flex flex-wrap items-center gap-space-sm text-body-md">
                  <Icon name="history_edu" size={20} className="text-secondary" />
                  {matn.map((m) => (
                    <a key={m.k} href={href('mutun', m.k)} className="font-medium text-primary underline-offset-4 hover:underline">{t('R2:')} <bdi lang="ar" className="font-arabic">{m.name} {m.range}</bdi></a>
                  ))}
                </p>
              )}
            </div>
          )}

          {lesson.sources.length > 0 && (
            <details className="group rounded-card border border-outline-variant bg-surface-container-lowest">
              <summary className="flex min-h-12 cursor-pointer list-none items-center gap-space-sm px-space-md text-body-md font-semibold [&::-webkit-details-marker]:hidden">
                <Icon name="menu_book" size={20} className="text-secondary" />
                <span className="flex-1">{t('Sources ({n})', { n: lesson.sources.length })}</span>
                <Icon name="expand_more" size={20} className="transition-transform group-open:rotate-180" />
              </summary>
              <ul className="flex flex-col gap-space-xs px-space-md pb-space-md">
                {lesson.sources.map((src, i) => (
                  <li key={i} className="text-body-md"><T>{src.title}</T>{src.locator && <span className="text-on-surface-variant"><Sep /><Locator text={src.locator} /></span>}</li>
                ))}
              </ul>
            </details>
          )}

          <footer className="flex flex-col gap-space-sm rounded-card bg-primary-fill p-space-md text-on-primary sm:flex-row sm:items-center sm:p-space-lg">
            <Icon name={s.introduced ? 'event_repeat' : 'school'} className="hidden sm:block" />
            {s.introduced ? (
              <p className="flex-1 text-body-lg">{s.dueOn ? t('In your review. Next due {day}.', { day: fmtDay(s.dueOn) }) : t('In your review.')}</p>
            ) : (
              <>
                <p className="flex-1 text-body-md opacity-90"><T>{t("Reading a card doesn't add it to your review. Learning it does. You'll meet it in unit {n} of the course.", { n: unitOf(lesson.id)?.n ?? '–' })}</T></p>
                <Button href={href('learn', lesson.id)} className="bg-secondary-container text-on-secondary-container hover:bg-secondary-container/90">
                  {t('Learn this')}<Icon name="arrow_forward" rtlFlip size={20} />
                </Button>
              </>
            )}
          </footer>
        </article>
      </div>
    </Page>
  )
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-space-xs">
      <dt className="text-label font-semibold tracking-wider text-secondary uppercase rtl:normal-case">{label}</dt>
      <dd className="flex flex-col gap-space-xs">{children}</dd>
    </div>
  )
}

/** Source locators mix Arabic, page numbers and URLs: link the URLs, isolate the rest. */
function Locator({ text }: { text: string }) {
  return (
    <>
      {text.split(/(https?:\/\/\S+)/).map((p, i) =>
        /^https?:\/\//.test(p)
          ? <a key={i} href={p.replace(/[)،,.]+$/, '')} target="_blank" rel="noopener" className="break-all text-primary">{p.replace(/^https?:\/\//, '').replace(/[)،,.]+$/, '')} ↗</a>
          : <T key={i}>{p}</T>,
      )}
    </>
  )
}
