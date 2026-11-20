// #/mutun/:matnId[?from=N&to=M]: the whole matn (content/mutun.json), the asked-for lines marked and scrolled to.
import { useEffect, useState } from 'react'
import type { ScreenProps } from '../app/App'
import type { MatnLine } from '../core/types'
import rawMutun from '../../content/mutun.json'
import { mutun, getLesson } from '../content'
import { href } from '../app/router'
import { digits, t } from '../i18n'
import { Tx } from './study/i18n'
import { EmptyState, Page, PageHeader } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'

const NAME: Record<MatnLine['matn'], { ar: string; en: string }> = {
  tuhfa: { ar: 'تحفة الأطفال', en: 'Tuḥfat al-Aṭfāl' },
  jazariyya: { ar: 'المقدمة الجزرية', en: 'Al-Muqaddimah al-Jazariyyah' },
}

export default function Mutun({ params }: ScreenProps) {
  const id = params.matnId as MatnLine['matn']
  const ed = (rawMutun.editions as Record<string, { author: string; editor: string; source_url: string } | undefined>)[id]
  const lines = mutun.filter(l => l.matn === id)
  const from = Number(params.from) || 0, to = Number(params.to) || from
  const [memorise, setMemorise] = useState(false)
  // after the shell's scroll-to-top on navigation
  useEffect(() => {
    if (!from) return
    const h = setTimeout(() => document.getElementById(`line-${from}`)?.scrollIntoView({ block: 'center' }), 50)
    return () => clearTimeout(h)
  }, [id, from])
  if (!ed || !lines.length)
    return <Page><EmptyState icon="history_edu" title={t("This text isn't in the app.")} action={<Button asChild className="no-underline"><a href={href('rules')}>{t('Rules')}</a></Button>} /></Page>

  return (
    <Page>
      <PageHeader en={NAME[id].en} ar={NAME[id].ar} detail={[<bdi key="a" lang="ar">{ed.author}</bdi>, t('{n} lines', { n: lines.length })]}
        actions={<Button variant="secondary" size="sm" aria-pressed={memorise} onClick={() => setMemorise(!memorise)}>
          <Icon name={memorise ? 'visibility' : 'psychology'} size={18} />{memorise ? t('Show whole lines') : t('Memorise')}
        </Button>} />
      <div className="hidden justify-end lg:flex">
        <Button variant="secondary" size="sm" aria-pressed={memorise} onClick={() => setMemorise(!memorise)}>
          <Icon name={memorise ? 'visibility' : 'psychology'} size={18} />{memorise ? t('Show whole lines') : t('Memorise')}
        </Button>
      </div>
      {memorise && <p className="text-body-md text-on-surface-variant">{t('Say the second half from memory, then tap the line to check.')}</p>}
      <ol className="flex flex-col gap-space-sm">
        {lines.map(l => <Line key={l.id} l={l} memorise={memorise} marked={!!from && l.n >= from && l.n <= to} />)}
      </ol>
      <p className="text-label text-on-surface-variant">
        <bdi lang="ar">{ed.editor}</bdi>{' '}
        <a href={ed.source_url} target="_blank" rel="noopener" className="text-primary underline underline-offset-4">{t('Source')}</a>
      </p>
    </Page>
  )
}

function Line({ l, memorise, marked }: { l: MatnLine; memorise: boolean; marked: boolean }) {
  const verse = 'font-naskh text-[20px] leading-[1.9] text-on-surface'
  const rules = l.lessonIds.map(getLesson).filter(Boolean)
  return (
    <li id={`line-${l.n}`} className={cn('flex gap-space-md rounded-card border px-space-md py-space-sm',
      marked ? 'border-primary bg-primary-container/40' : 'border-outline-variant bg-surface-container-lowest')}>
      <span className="w-8 shrink-0 pt-2 text-center text-label font-semibold text-secondary">{digits(l.n)}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {memorise ? (
          <details className="group">
            <summary lang="ar" dir="rtl" className={`${verse} flex min-h-12 cursor-pointer list-none items-center gap-space-sm [&::-webkit-details-marker]:hidden`}>
              <span className="flex-1">{l.sadr}</span>
              <Icon name="expand_more" size={20} className="text-outline transition-transform group-open:rotate-180" />
            </summary>
            <p lang="ar" dir="rtl" className={`${verse} text-primary`}>{l.ajz}</p>
          </details>
        ) : (
          <p lang="ar" dir="rtl" className={verse}>{l.sadr} <span aria-hidden className="text-gold">۞</span> {l.ajz}</p>
        )}
        {!memorise && l.gloss && <p className="text-label text-on-surface-variant"><Tx>{l.gloss}</Tx></p>}
        {!memorise && rules.length > 0 && (
          <p className="flex flex-wrap gap-space-xs">
            {rules.map(r => <a key={r!.id} href={href('rules', r!.id)} lang="ar" className="rounded-full bg-surface-container px-2.5 py-0.5 text-arabic-label text-primary no-underline hover:bg-surface-container-high">{r!.nameAr}</a>)}
          </p>
        )}
      </div>
    </li>
  )
}
