// End of a review session (design §5.4).
import type { Correction, Day, ReviewItem } from '../../core/types'
import { getLesson } from '../../content'
import { href } from '../../app/router'
import { Chip, SectionCard } from '@/components/kit'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { digits, t } from '../../i18n'
import { Tx } from './i18n'
import { dueLabel, verseRef } from './helpers'

export interface Result { itemId: string; kind: ReviewItem['kind']; refId: string; correct: boolean; selfRated?: boolean }

const SHOW = 3

export function itemName(kind: ReviewItem['kind'], refId: string, corrections: Correction[]) {
  if (kind === 'lesson') return getLesson(refId)?.nameAr ?? refId
  const c = corrections.find(c => c.id === refId)
  return c ? `${verseRef(c.verseKey)} · ${t('correction')}` : t('correction')
}

export function Summary({ results, items, corrections, today, onMore }: {
  results: Result[]; items: ReviewItem[]; corrections: Correction[]; today: Day; onMore?: () => void
}) {
  const quiz = results.filter(r => !r.selfRated)
  const again = [...new Set(results.filter(r => !r.correct && r.kind === 'lesson').map(r => r.refId))]
  const back = [...new Set(results.map(r => r.itemId))]
    .map(id => items.find(i => i.id === id))
    .filter((i): i is ReviewItem => !!i && i.state !== 'closed')
    .sort((a, b) => (a.dueOn < b.dueOn ? -1 : a.dueOn > b.dueOn ? 1 : 0))
  const row = (i: ReviewItem) => (
    <li key={i.id} className="flex min-h-12 items-center justify-between gap-space-sm border-b border-surface-container py-2 last:border-b-0">
      <span className="min-w-0"><Tx>{itemName(i.kind, i.refId, corrections)}</Tx></span>
      <Chip icon="event">{dueLabel(i.dueOn, today)}</Chip>
    </li>
  )
  const right = quiz.filter(r => r.correct).length
  return (
    <section className="mx-auto flex w-full max-w-[640px] flex-col gap-space-lg py-space-lg" aria-labelledby="sum-h">
      <div className="flex flex-col items-center gap-space-sm text-center">
        <span className="grid size-16 place-items-center rounded-full bg-secondary-container text-on-secondary-container"><Icon name="star" size={32} fill /></span>
        <h2 id="sum-h" className="text-headline-lg text-on-surface">{t('Review done.')}</h2>
      </div>
      <div className="grid grid-cols-2 gap-space-sm">
        <div className="rounded-card bg-surface-container-low p-space-md">
          <p className="text-label text-on-surface-variant">{t('Reviewed')}</p>
          <p className="text-headline-lg text-on-surface">{digits(results.length)}</p>
        </div>
        {quiz.length > 0 && (
          <div className="rounded-card bg-surface-container-low p-space-md">
            <p className="text-label text-on-surface-variant">{t('Correct')}</p>
            <p className="text-headline-lg text-on-surface">{t('{n} of {m}', { n: right, m: quiz.length })}</p>
          </div>
        )}
      </div>
      <p className="sr-only">
        {t('{n} reviewed', { n: results.length })}{quiz.length ? t(' · {n} correct', { n: right }) : ''}
      </p>
      {again.length > 0 && (
        <SectionCard en={t('Look again at')}>
          <div className="flex flex-wrap gap-space-sm">
            {again.map(id => {
              const l = getLesson(id)
              return l && (
                <a key={id} href={href('rules', id)} lang="ar"
                  className="inline-flex min-h-12 items-center rounded-control border border-outline-variant px-space-md text-arabic-label text-on-surface no-underline hover:bg-surface-container-low">
                  {l.nameAr}
                </a>
              )
            })}
          </div>
        </SectionCard>
      )}
      {back.length > 0 && (
        <SectionCard en={t('Coming back')}>
          <ul>{back.slice(0, SHOW).map(row)}</ul>
          {back.length > SHOW && (
            <Accordion type="single" collapsible>
              <AccordionItem value="more">
                <AccordionTrigger className="text-body-md">{t('{n} more', { n: back.length - SHOW })}</AccordionTrigger>
                <AccordionContent><ul>{back.slice(SHOW).map(row)}</ul></AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </SectionCard>
      )}
      <div className="flex flex-col gap-space-sm">
        <Button size="lg" asChild><a href={href('today')}>{t('Back to today')}</a></Button>
        {onMore && <Button variant="secondary" onClick={onMore}>{t('10 more')}</Button>}
      </div>
    </section>
  )
}
