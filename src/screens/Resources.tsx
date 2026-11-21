import { Fragment, type ReactNode } from 'react'
import type { ScreenProps } from '../app/App'
import { RECITERS } from '../quran'
import videos from '../../content/videos.json'
import resources from '../../content/resources.json'
import { Bdi, Group, T } from '../components'
import { isAr, t } from '../i18n'
import { Page, PageHeader, Sep } from '@/components/kit'
import { Icon } from '@/components/ui/icon'

// Carried over from docs/reference/artifact-v3.html (Resources), plus Credits (licence requirement, spec §8.2).
// Texts live in content/resources.json (shared with the mobile app): English strings are t() keys; credit bodies are
// per-language arrays of parts {text, link?, ltr?} (ltr: a Latin run in the Arabic text, isolated in a <bdi dir="ltr">).
// `app: false` marks what the phone app hides until it has the teacher log (docs/19 phase 2).
const EPISODES = videos.episodes
type Part = { text: string; link?: string; ltr?: boolean }
type Entry = { note?: string; icon?: string; name?: string; link?: string; body?: string; episodes?: boolean }
type CreditData = { title: string; en?: Part[]; ar?: Part[]; reciters?: boolean; editions?: { text: string; link: string; label: string }[]; after?: string }
const AR_LETTER = /[\u0600-\u06FF]/

/** Every outside link looks the same: teal, underlined, with the "opens elsewhere" icon. */
const Ext = ({ to, children }: { to: string; children: ReactNode }) => (
  <a href={to} target="_blank" rel="noopener" className="inline-flex items-center gap-1 font-semibold text-primary underline underline-offset-4">
    {children}<Icon name="open_in_new" size={16} />
  </a>
)

function Panel({ ar, en, children }: { ar: string; en: string; children: ReactNode }) {
  return (
    <Group en={en} ar={ar}>
      <ul className="flex flex-col divide-y divide-outline-variant">{children}</ul>
    </Group>
  )
}

function Item({ icon, title, children, extra }: { icon: string; title: ReactNode; children: ReactNode; extra?: ReactNode }) {
  return (
    <li className="flex items-start gap-space-md p-space-md">
      <span className="grid size-10 shrink-0 place-items-center rounded-control bg-surface-container text-on-surface-variant"><Icon name={icon} size={22} /></span>
      <div className="flex min-w-0 flex-col gap-1">
        <b className="text-body-lg font-semibold">{title}</b>
        <span className="text-body-md text-on-surface-variant"><T>{children}</T></span>
        {extra}
      </div>
    </li>
  )
}

export default function Resources(_: ScreenProps) {
  return (
    <Page>
      <PageHeader en="Resources" ar="المصادر" detail={[
        t('{n} video episodes', { n: EPISODES.length }),
        t('{n} reciters', { n: RECITERS.length }),
      ]} />
      {resources.panels.map((p) => (
        <Panel key={p.en} ar={p.ar} en={p.en}>
          {(p.items as Entry[]).map((e) => (e.note
            ? <li key={e.note} className="p-space-md text-body-md text-on-surface-variant">{t(e.note)}</li>
            : <Item key={e.name} icon={e.icon!} title={<Title e={e} />} extra={e.episodes ? <Episodes /> : undefined}>{t(e.body!)}</Item>))}
        </Panel>
      ))}

      <section aria-labelledby="credits" className="flex flex-col gap-space-sm">
        <h2 id="credits" className="flex items-baseline justify-between gap-space-sm px-space-xs">
          <span className="text-label font-semibold tracking-wider text-on-surface-variant uppercase rtl:normal-case">{isAr ? resources.credits.ar : resources.credits.en}</span>
          {!isAr && <span lang="ar" dir="rtl" className="text-arabic-label text-secondary">{resources.credits.ar}</span>}
        </h2>
        <dl className="flex flex-col divide-y divide-outline-variant rounded-card border border-outline-variant bg-surface-container-lowest text-body-md">
          {(resources.credits.items as CreditData[]).map((c) => (
            <Credit key={c.title} title={t(c.title)}>
              {c.en && <Parts parts={(isAr ? c.ar : c.en)!} />}
              {c.reciters && (
                <ul className="mt-1 list-disc ps-5">
                  {RECITERS.map((r) => <li key={r.id}><bdi lang="ar" className="font-arabic">{r.nameAr}</bdi>{!isAr && <><Sep />{r.nameEn}</>}</li>)}
                </ul>
              )}
              {c.editions && (
                <ul className="list-disc ps-5">
                  {c.editions.map((m) => <li key={m.link}><T>{t(m.text)}</T> <Ext to={m.link}>{t(m.label)}</Ext></li>)}
                </ul>
              )}
              {c.after && <p className="mt-1">{t(c.after)}</p>}
            </Credit>
          ))}
        </dl>
      </section>
    </Page>
  )
}

function Credit({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 p-space-md">
      <dt className="font-semibold text-on-surface">{title}</dt>
      <dd className="text-on-surface-variant">{children}</dd>
    </div>
  )
}

/** An item's name: Arabic in a <Bdi>, Latin as is; a linked name opens elsewhere, an unlinked Latin one is isolated LTR. */
function Title({ e }: { e: Entry }) {
  const name = e.name!
  const ar = AR_LETTER.test(name)
  if (e.link) return <Ext to={e.link}>{ar ? <Bdi>{name}</Bdi> : name}</Ext>
  return ar ? <Bdi>{name}</Bdi> : <bdi dir="ltr">{name}</bdi>
}

function Episodes() {
  return (
    <span className="flex flex-wrap gap-space-xs pt-1">
      {EPISODES.map((id, i) => (
        <a key={id} href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener" aria-label={t('Episode {n}', { n: i + 1 })} lang="ar"
          className="grid size-11 place-items-center rounded-full bg-surface-container text-arabic-body font-semibold text-primary no-underline hover:bg-primary-container">
          {'١٢٣٤٥٦'[i]}
        </a>
      ))}
    </span>
  )
}

function Parts({ parts }: { parts: Part[] }) {
  return <>{parts.map((p, i) => {
    const text = p.ltr ? <bdi dir="ltr">{p.text}</bdi> : p.text
    return p.link ? <Ext key={i} to={p.link}>{text}</Ext> : <Fragment key={i}>{text}</Fragment>
  })}</>
}
