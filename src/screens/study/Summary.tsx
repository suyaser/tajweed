// End of a review session (design §5.4).
import type { Correction, Day, ReviewItem } from '../../core/types'
import { getLesson } from '../../content'
import { href } from '../../app/router'
import { Button, Ornament, RuleChip, T } from '../../components'
import { dueLabel, verseRef } from './helpers'

export interface Result { itemId: string; kind: ReviewItem['kind']; refId: string; correct: boolean; selfRated?: boolean }

const SHOW = 3

export function itemName(kind: ReviewItem['kind'], refId: string, corrections: Correction[]) {
  if (kind === 'lesson') return getLesson(refId)?.nameAr ?? refId
  const c = corrections.find(c => c.id === refId)
  return c ? `${verseRef(c.verseKey)} · correction` : 'correction'
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
    <li key={i.id}><T>{itemName(i.kind, i.refId, corrections)}</T> · {dueLabel(i.dueOn, today)}</li>
  )
  return (
    <section className="s-study s-summary" aria-labelledby="sum-h">
      <Ornament />
      <h2 id="sum-h" className="t-h2">Review done.</h2>
      <p className="num">
        {results.length} reviewed{quiz.length ? ` · ${quiz.filter(r => r.correct).length} correct` : ''}
      </p>
      {again.length > 0 && (
        <div>
          <p className="eyebrow">Look again at</p>
          <div className="s-chips">
            {again.map(id => {
              const l = getLesson(id)
              return l && <RuleChip key={id} nameAr={l.nameAr} colour={l.colour} href={href('rules', id)} />
            })}
          </div>
        </div>
      )}
      {back.length > 0 && (
        <div>
          <p className="eyebrow">Coming back</p>
          <ul className="s-due-list">{back.slice(0, SHOW).map(row)}</ul>
          {back.length > SHOW && (
            <details>
              <summary>{back.length - SHOW} more</summary>
              <ul className="s-due-list">{back.slice(SHOW).map(row)}</ul>
            </details>
          )}
        </div>
      )}
      <Button block href={href('today')}>Back to today</Button>
      {onMore && <Button variant="ghost" block onClick={onMore}>10 more</Button>}
    </section>
  )
}
