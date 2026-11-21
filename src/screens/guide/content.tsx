// "How it works": the short version for onboarding, the full one for #/guide.
import { Fragment, type ReactNode } from 'react'
import { href } from '../../app/router'
import { Icon } from '@/components/ui/icon'
import { Panel } from '../path/blocks'
import { digits, isAr, t } from '../../i18n'
import { Tx } from '../study/i18n'
import guide from '../../../content/guide.json'

// Texts live in content/guide.json (shared with the mobile app); strings are t() keys. Language is fixed per page load.
export const BASICS: { ar: string; en: string; body: string; icon: string }[] = guide.basics.map((b) => ({ ...b, en: t(b.en), body: t(b.body) }))

const BUL = 'flex list-disc flex-col gap-space-xs ps-5 marker:text-gold'
const NUM = 'flex list-decimal rtl:list-[arabic-indic] flex-col gap-space-xs ps-5 marker:font-semibold marker:text-secondary'

export function Basics() {
  return (
    <ol className="flex flex-col gap-space-sm">
      {BASICS.map((b, i) => (
        <li key={b.en} className="flex items-start gap-space-md rounded-card border border-outline-variant bg-surface-container-lowest p-space-md">
          <span aria-hidden className="relative grid size-11 shrink-0 place-items-center rounded-control bg-surface-container-low text-primary">
            <Icon name={b.icon} size={22} />
            <span className="absolute -end-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-secondary-container text-caption font-bold text-on-secondary-container">{digits(i + 1)}</span>
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="flex flex-wrap items-baseline gap-x-space-sm">
              {isAr ? <b className="text-body-lg font-semibold text-on-surface">{b.en}</b>
                : <><b className="text-body-lg font-semibold text-on-surface">{b.en}</b><span lang="ar" className="text-arabic-label text-secondary">{b.ar}</span></>}
            </p>
            <p className="text-body-md text-on-surface-variant"><Tx>{b.body}</Tx></p>
          </div>
        </li>
      ))}
    </ol>
  )
}

// `en` comes translated: in Arabic it is the heading alone (an Arabic gloss would repeat it).
const Sec = ({ ar, en, icon, children }: { ar: string; en: string; icon: string; children: ReactNode }) => (
  <Panel title={en} ar={ar} icon={icon}>
    <div className="-mt-space-xs flex flex-col gap-space-sm text-body-md text-on-surface">{children}</div>
  </Panel>
)

type Item = { text: string; mixed?: boolean }
type Block = Item & { kind: string; items?: Item[]; to?: string; lead?: string; levels?: string[]; tail?: string }
// `mixed` = English with Arabic islands, rendered through Tx.
const Text = ({ text, mixed }: Item) => (mixed ? <Tx>{t(text)}</Tx> : <>{t(text)}</>)

function GuideBlock({ b }: { b: Block }) {
  switch (b.kind) {
    case 'p': return <p><Text {...b} /></p>
    case 'note': return <p className="text-label text-on-surface-variant"><Text {...b} /></p>
    case 'ul': case 'ol': {
      const List = b.kind
      return <List className={b.kind === 'ul' ? BUL : NUM}>{b.items!.map((it) => <li key={it.text}><Text {...it} /></li>)}</List>
    }
    case 'link': return <p><a className="inline-flex min-h-12 items-center font-semibold text-primary no-underline" href={href(b.to!)}>{t(b.text)}<Icon name="chevron_right" size={20} rtlFlip /></a></p>
    case 'levels': return (
      <p className="text-body-md">{t(b.lead!)} {b.levels!.map((l, i) => <Fragment key={l}>{i > 0 && ', '}<b>{t(l)}</b></Fragment>)}{t(b.tail!)}</p>
    )
  }
  return null
}

export function FullGuide() {
  return (
    <div className="flex flex-col gap-space-lg">
      {(guide.sections as { icon: string; ar: string; en: string; blocks: Block[] }[]).map((s) => (
        <Sec key={s.en} ar={s.ar} en={t(s.en)} icon={s.icon}>
          {s.blocks.map((b, i) => <GuideBlock key={i} b={b} />)}
        </Sec>
      ))}
    </div>
  )
}
