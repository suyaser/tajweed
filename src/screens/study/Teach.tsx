// The Learn step's teaching (docs/16-teaching-strategy.md): plain words, new words, where it fits, what happens and
// why, how to spot it in the muṣḥaf, common mistakes. Background words and words from other lessons
// that the lesson uses are listed with their meaning, so a beginner never has to look elsewhere.
import { useEffect, useState } from 'react'
import type { Example, Lesson } from '../../core/types'
import { getLesson } from '../../content'
import { courseOrder } from '../../content/course'
import { loadTeach, teachText, termsIn, type GlossaryEntry, type Teach as TeachT, type Term } from '../../content/teach'
import { href } from '../../app/router'
import { digits, isAr, t } from '../../i18n'
import { SectionCard } from '@/components/kit'
import { Icon } from '@/components/ui/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { Tx } from './i18n'
import { ExampleCard, type StudyAudio } from './verse'

export function useTeach(lessonId: string) {
  const [s, set] = useState<{ id: string; teach?: TeachT } | null>(null)
  useEffect(() => {
    let live = true
    loadTeach(lessonId).then(teach => live && set({ id: lessonId, teach }), () => live && set({ id: lessonId }))
    return () => { live = false }
  }, [lessonId])
  return s?.id === lessonId ? { loading: false, teach: s.teach } : { loading: true, teach: undefined }
}

const bi = (en: string, ar: string) => ({ en: t(en), ar })

/** One term: the word, how to say it, what it means (and its everyday sense). */
function TermRow({ term, from }: { term: Term; from?: string }) {
  const lesson = from ? getLesson(from) : undefined
  return (
    <li className="flex flex-col gap-0.5 rounded-control bg-surface-container-low p-space-md">
      <span className="flex flex-wrap items-baseline gap-x-space-sm">
        <span lang="ar" className="font-naskh text-[22px] leading-[1.5] font-bold text-primary">{term.term}</span>
        {!isAr && <span className="text-body-md text-on-surface-variant italic">{term.say}</span>}
      </span>
      <span className="text-body-md text-on-surface"><Tx>{isAr ? term.ar : term.en}</Tx></span>
      {(isAr ? term.arLiteral : term.literal) && (
        <span className="text-label text-on-surface-variant"><Tx>{t('Literally: {x}', { x: (isAr ? term.arLiteral : term.literal)! })}</Tx></span>
      )}
      {lesson && (
        <a href={href('rules', lesson.id)} className="mt-0.5 self-start text-label text-primary underline-offset-4 hover:underline">
          <Tx>{courseOrder.indexOf(lesson.id) >= 0 ? t('Lesson {n}: {x}', { n: courseOrder.indexOf(lesson.id) + 1, x: lesson.nameAr }) : lesson.nameAr}</Tx>
        </a>
      )}
    </li>
  )
}

/**
 * The glossary, folded away until wanted: this lesson's background words (`aside`) and the terms from other lessons
 * that its text and card use.
 */
function Glossary({ lesson, teach }: { lesson: Lesson; teach?: TeachT }) {
  const own = new Set((teach?.terms ?? []).map(x => x.term))
  const aside = (teach?.terms ?? []).filter(x => x.aside)
  const text = [
    lesson.summary, ...(lesson.conditions ?? []), lesson.tip ?? '', ...(lesson.list ?? []).flat(), lesson.counts?.note ?? '',
    ...(teach ? [teach.ar.plain, teach.ar.fits, ...teach.ar.how, teach.ar.why, teach.ar.spot ?? '', ...teach.ar.mistakes.flatMap(m => [m.wrong, m.right])] : []),
  ].join(' ')
  const used = (termsIn(text) as GlossaryEntry[]).filter(e => !own.has(e.term) && e.lesson !== lesson.id)
  if (!used.length && !aside.length) return null
  return (
    <details className="group rounded-card border border-outline-variant bg-surface-container-lowest p-space-md">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-space-sm text-body-md font-semibold text-on-surface [&::-webkit-details-marker]:hidden">
        <Icon name="menu_book" size={20} className="text-secondary" />
        <span className="flex-1">{t('Glossary ({n})', { n: aside.length + used.length })}</span>
        <Icon name="expand_more" size={20} className="text-outline transition-transform group-open:rotate-180" />
      </summary>
      <ul className="mt-space-sm flex flex-col gap-space-sm">
        {aside.map(e => <TermRow key={e.term} term={e} />)}
        {used.map(e => <TermRow key={e.term} term={e} from={e.lesson} />)}
      </ul>
    </details>
  )
}

/**
 * The teaching sections, before the rule card. `anchor` is shown under "Spot it in the muṣḥaf" so the sign is seen on
 * the lesson's own word. Without a teaching text (not written yet) only the other-lesson words show.
 */
export function Teach({ lesson, anchor, audio }: { lesson: Lesson; anchor?: Example; audio: StudyAudio }) {
  const { loading, teach } = useTeach(lesson.id)
  const [played, setPlayed] = useState(false)
  if (loading) return <Skeleton className="h-40 w-full rounded-card" />
  if (!teach) return <Glossary lesson={lesson} />
  const x = teachText(teach)
  const main = teach.terms.filter(term => !term.aside)
  let n = 0
  return (
    <div className="flex min-w-0 flex-col gap-space-md">
      <SectionCard n={++n} {...bi('In plain words', 'بكلمات بسيطة')}>
        <p className="text-body-lg leading-relaxed"><Tx>{x.plain}</Tx></p>
      </SectionCard>
      {main.length > 0 && (
        <SectionCard n={++n} {...bi('New words', 'كلمات جديدة')}>
          <ul className="flex flex-col gap-space-sm">{main.map(term => <TermRow key={term.term} term={term} />)}</ul>
        </SectionCard>
      )}
      <SectionCard n={++n} {...bi('Where it fits', 'أين يقع')}>
        <p className="leading-relaxed"><Tx>{x.fits}</Tx></p>
      </SectionCard>
      <SectionCard n={++n} {...bi('What happens', 'ماذا يحدث')}>
        <ol className="flex flex-col gap-space-sm">
          {x.how.map((s, i) => (
            <li key={i} className="flex gap-space-sm">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-surface-container text-label font-semibold text-primary">{digits(i + 1)}</span>
              <span className="min-w-0 leading-relaxed"><Tx>{s}</Tx></span>
            </li>
          ))}
        </ol>
        <p className="mt-space-md rounded-control bg-surface-container-low p-space-md leading-relaxed">
          <span className="font-semibold text-on-surface">{t('Why: ')}</span><Tx>{x.why}</Tx>
        </p>
      </SectionCard>
      {x.spot && (
        <SectionCard n={++n} {...bi('Spot it in the muṣḥaf', 'كيف تعرفه في المصحف')}>
          <p className="leading-relaxed"><Tx>{x.spot}</Tx></p>
          {anchor && <ExampleCard ex={anchor} eyebrow={false} className="mt-space-sm rounded-control border-0 bg-surface-container-low" audio={audio} played={played} onPlayed={() => setPlayed(true)} />}
        </SectionCard>
      )}
      {x.mistakes.length > 0 && (
        <SectionCard n={++n} {...bi('Common mistakes', 'أخطاء شائعة')}>
          <ul className="flex flex-col gap-space-sm">
            {x.mistakes.map((m, i) => (
              <li key={i} className="flex flex-col gap-1 rounded-control bg-surface-container-low p-space-md">
                <span className="flex gap-space-xs text-on-surface-variant"><Icon name="close" size={18} className="mt-0.5 shrink-0 text-error" /><Tx>{m.wrong}</Tx></span>
                <span className="flex gap-space-xs text-on-surface"><Icon name="check" size={18} className="mt-0.5 shrink-0 text-success" /><Tx>{m.right}</Tx></span>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}
      <Glossary lesson={lesson} teach={teach} />
    </div>
  )
}

