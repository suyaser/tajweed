// One question per screen (design §5.3–5.5): prompt, options, feedback in place, Next.
import type * as React from 'react'
import { useEffect, useState, type ReactNode } from 'react'
import type { Question, Option } from '../../core/questions'
import { getLesson, pairs } from '../../content'
import { href } from '../../app/router'
import type { OptionState } from '../../components'
import { Callout, CountBeats, LetterTile, Panel } from '@/components/kit'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/utils'
import { countsText } from '../../core/questions'
import { isAr, pick, t } from '../../i18n'
import { Tx } from './i18n'
import { confusableHint } from './helpers'
import { ExampleVerse, PlayButton, useVerse, type StudyAudio } from './verse'

export type Mode = 'pretest' | 'check' | 'review' | 'relearn'

const BEATS: Record<string, [number, number]> = { '2': [2, 2], '246': [2, 6], '6': [6, 6] }
const beatsOf = (o: Option): [number, number] =>
  BEATS[o.id] ?? (o.labelEn === '4' ? [4, 4] : o.labelEn === '5' ? [5, 5] : [4, 5])
// Short Arabic options (a letter or two) read best as tiles.
const isLetters = (s: string) => /^[؀-ۿ](\s[؀-ۿ])*$/.test(s.trim())

function OptionBody({ q, o }: { q: Question; o: Option }) {
  if (q.kind === 'length') {
    const [min, max] = beatsOf(o)
    return <><CountBeats min={min} max={max} className="flex-wrap justify-center" /><span className="text-label">{countsText(pick(o.labelEn, o.labelAr))}</span></>
  }
  if (q.kind === 'fact')
    return isLetters(o.labelAr)
      ? <span className="flex flex-wrap justify-center gap-1.5" dir="rtl">{o.labelAr.trim().split(/\s/).map((l, i) => <LetterTile key={i} letter={l} className="min-h-12 bg-transparent" />)}</span>
      : <span className="text-body-lg"><Tx>{o.labelAr}</Tx></span>
  return null
}

const OPT: Record<OptionState, string> = {
  idle: 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low',
  picked: 'border-primary bg-primary-container text-on-primary-container',
  correct: 'border-success bg-success-container text-on-success-container',
  revealed: 'border-success border-dashed bg-surface-container-lowest',
  wrong: 'border-error bg-error-container text-on-error-container',
}

/** One answer: a big tile; after the answer it shows ✓ (right / revealed) or ↺ (not quite), never colour alone. */
function OptionTile({ ar, en, state, children, ...rest }: { ar?: string; en?: string; state: OptionState } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const glyph = state === 'wrong' ? 'undo' : state === 'correct' || state === 'revealed' ? 'check_circle' : null
  return (
    <button type="button" {...rest}
      className={cn('relative flex min-h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-card border-2 p-space-sm text-center text-on-surface transition-colors disabled:cursor-default', OPT[state])}>
      {glyph && <Icon name={glyph} size={20} fill={state === 'correct'} className="absolute top-2 end-2" />}
      {ar && <b lang="ar" className="text-arabic-headline font-semibold">{ar}</b>}
      {children}
      {en && <span className="text-label text-on-surface-variant">{en}</span>}
      {state === 'picked' && <span className="text-label">{t('Your guess')}</span>}
      {state !== 'idle' && state !== 'picked' && <span className="sr-only">{state === 'wrong' ? t(', not quite') : t(', correct')}</span>}
    </button>
  )
}

export function QuestionView({ q, mode, eyebrow, note, audio, onAnswer, onNext, nextLabel = t('Next') }: {
  q: Question
  mode: Mode
  eyebrow?: ReactNode
  note?: ReactNode
  audio: StudyAudio
  /** Called once, on the tap: write the attempt here (before Next). */
  onAnswer: (chosenId: string, correct: boolean) => void
  onNext: () => void
  nextLabel?: string
}) {
  const [chosen, setChosen] = useState<string | null>(null)
  const vs = useVerse(q.example?.verseKey)
  const choose = (id: string) => {
    if (chosen != null) return
    setChosen(id)
    onAnswer(id, id === q.answerId)
  }

  // Keyboard (design §5.4): 1–4 choose, Space plays the ayah. Enter is the focused Next button.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('input, textarea, select, button, a, [role="button"]')) return
      const i = Number(e.key) - 1
      if (q.options[i] && chosen == null) { e.preventDefault(); choose(q.options[i].id) }
      if (e.key === ' ' && vs.verse) { e.preventDefault(); audio.ayah(vs.verse) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const stateOf = (id: string): OptionState => {
    if (chosen == null) return 'idle'
    if (id === q.answerId) return mode === 'pretest' ? 'revealed' : chosen === id ? 'correct' : 'revealed'
    if (id !== chosen) return 'idle'
    return mode === 'pretest' ? 'picked' : 'wrong'
  }

  return (
    <div className="flex min-w-0 flex-col gap-space-md">
      {eyebrow && <p className="text-label font-semibold tracking-wider text-secondary uppercase rtl:normal-case">{eyebrow}</p>}
      {note}
      <Panel className="gap-space-sm">
        <p className="text-body-lg font-medium text-on-surface"><Tx>{q.prompt}</Tx></p>
        {q.example && (
          <ExampleVerse
            ex={q.example} vs={vs} size="focus"
            actions={<PlayButton audio={audio} label={t('the ayah')} onClick={vs.verse && (() => audio.ayah(vs.verse!))} />}
          />
        )}
      </Panel>
      {q.example && <p className="text-center text-body-md text-on-surface-variant">{t('Read it aloud, then choose.')}</p>}
      <div className="grid grid-cols-2 gap-space-sm" role="group" aria-label={t('Answers')}>
        {q.options.map((o, i) => (
          <OptionTile
            key={o.id} state={stateOf(o.id)} disabled={chosen != null} onClick={() => choose(o.id)}
            ar={q.kind === 'identify' ? o.labelAr : undefined} en={q.kind === 'identify' && !isAr ? o.labelEn : undefined}
            aria-keyshortcuts={String(i + 1)}
          >
            <OptionBody q={q} o={o} />
          </OptionTile>
        ))}
      </div>
      <div aria-live="polite" className="flex flex-col gap-space-md">
        {chosen != null && (
          <>
            <Feedback q={q} chosen={chosen} mode={mode} audio={audio} vs={vs} />
            <Button size="lg" autoFocus onClick={onNext} className="w-full">{nextLabel}<Icon name="arrow_forward" size={20} rtlFlip /></Button>
          </>
        )}
      </div>
    </div>
  )
}

/** Design §5.5 anatomy: verdict → rule name → deciding reason → confusable hint → ▶ hear it, Open card. */
function Feedback({ q, chosen, mode, audio, vs }: { q: Question; chosen: string; mode: Mode; audio: StudyAudio; vs: ReturnType<typeof useVerse> }) {
  const correct = chosen === q.answerId
  const lesson = getLesson(q.lessonId)
  const answer = q.options.find(o => o.id === q.answerId)!
  const name = q.kind === 'length' ? countsText(pick(answer.labelEn, answer.labelAr)) : answer.labelAr
  const its = q.kind === 'fact' ? t('The answer is “{x}”.', { x: name }) : t("It's {x}.", { x: name })
  const hint = !correct && q.kind === 'identify' ? confusableHint(pairs, q.answerId, chosen) : undefined
  const ex = q.example
  const hear = ex && vs.verse ? () => audio.example(vs.verse!, ex) : undefined

  if (mode === 'pretest')
    return <Callout variant="note"><Tx>{its}</Tx> {t("You'll see why in a minute.")}</Callout>

  // length explanations already open with "It's N counts".
  const verdict = correct ? t('Correct.') : q.kind === 'length' ? t('Not quite.') : `${t('Not quite.')} ${its}`
  return (
    <section className={cn('flex flex-col gap-space-sm rounded-card border p-space-md sm:p-space-lg',
      correct ? 'border-success/40 bg-success-container/40' : 'border-outline-variant bg-surface-container-lowest')}>
      {lesson && (
        <p className="text-label font-semibold tracking-wider text-secondary">
          {isAr ? lesson.nameAr : <><span lang="ar" className="text-arabic-label">{lesson.nameAr}</span> · {lesson.nameEn}</>}
        </p>
      )}
      <p className="flex items-start gap-space-xs text-body-lg font-semibold text-on-surface">
        <Icon name={correct ? 'check_circle' : 'undo'} fill={correct} className={cn('shrink-0', correct ? 'text-success' : 'text-on-surface-variant')} />
        <span className="min-w-0"><Tx>{verdict}</Tx></span>
      </p>
      <p className="text-body-md text-on-surface"><Tx>{q.explanation}</Tx></p>
      {hint && <Callout variant="note" title={t('Easy to mix up')}><Tx>{hint}</Tx></Callout>}
      {ex && <ExampleVerse ex={ex} vs={vs} spanOnly />}
      <div className="flex flex-wrap items-center gap-space-sm">
        {ex && <PlayButton audio={audio} label={t('the example')} onClick={hear} text={t('Hear it')} />}
        <Button variant="tertiary" asChild><a href={href('rules', q.lessonId)}>{t('Open card')}<Icon name="chevron_right" size={20} rtlFlip /></a></Button>
      </div>
      {!correct && mode === 'review' && <p className="text-body-md text-on-surface-variant">{t('This comes back at the end.')}</p>}
    </section>
  )
}
