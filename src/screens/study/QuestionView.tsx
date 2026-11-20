// One question per screen (design §5.3–5.5): prompt, options, feedback in place, Next.
import { useEffect, useState, type ReactNode } from 'react'
import type { Question, Option } from '../../core/questions'
import { getLesson, pairs } from '../../content'
import { href } from '../../app/router'
import { Button, Card, CountBeats, LetterTiles, OptionButton, type OptionState } from '../../components'
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
    return <><CountBeats min={min} max={max} /><small>{countsText(pick(o.labelEn, o.labelAr))}</small></>
  }
  if (q.kind === 'fact') return isLetters(o.labelAr) ? <LetterTiles letters={o.labelAr} size="option" /> : <span className="s-opt-text"><Tx>{o.labelAr}</Tx></span>
  return null
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
    <div className="s-study">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      {note}
      <Card level="e2" className="s-q-card">
        <p className="t-lg"><Tx>{q.prompt}</Tx></p>
        {q.example && (
          <ExampleVerse
            ex={q.example} vs={vs} size="focus"
            actions={<PlayButton audio={audio} label={t('the ayah')} onClick={vs.verse && (() => audio.ayah(vs.verse!))} />}
          />
        )}
      </Card>
      {q.example && <p className="t-sm muted s-center">{t('Read it aloud, then choose.')}</p>}
      <div className="opts" role="group" aria-label={t('Answers')}>
        {q.options.map((o, i) => (
          <OptionButton
            key={o.id} state={stateOf(o.id)} disabled={chosen != null} onClick={() => choose(o.id)}
            ar={q.kind === 'identify' ? o.labelAr : undefined} en={q.kind === 'identify' && !isAr ? o.labelEn : undefined}
            aria-keyshortcuts={String(i + 1)}
          >
            <OptionBody q={q} o={o} />
          </OptionButton>
        ))}
      </div>
      <div aria-live="polite">
        {chosen != null && (
          <>
            <Feedback q={q} chosen={chosen} mode={mode} audio={audio} vs={vs} />
            <Button block autoFocus onClick={onNext} className="s-study-next">{nextLabel}</Button>
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
    return (
      <Card className="s-feedback">
        <p className="t-lg"><Tx>{its}</Tx> {t("You'll see why in a minute.")}</p>
      </Card>
    )

  // length explanations already open with "It's N counts".
  const verdict = correct ? t('Correct.') : q.kind === 'length' ? t('Not quite.') : `${t('Not quite.')} ${its}`
  return (
    <Card className="s-feedback" eyebrow={lesson && (isAr ? lesson.nameAr : <><span lang="ar">{lesson.nameAr}</span> · {lesson.nameEn}</>)}>
      <p className="t-lg">{correct && <span aria-hidden="true">✓ </span>}<Tx>{verdict}</Tx></p>
      <p><Tx>{q.explanation}</Tx></p>
      {hint && <p className="s-fb-hint"><span className="muted">{t('Easy to mix up: ')}</span><Tx>{hint}</Tx></p>}
      {ex && <ExampleVerse ex={ex} vs={vs} coloured spanOnly />}
      <p className="s-fb-links">
        {ex && <PlayButton audio={audio} label={t('the example')} onClick={hear}>{t('▶ hear it')}</PlayButton>}
        <a href={href('rules', q.lessonId)}>{t('Open card ›')}</a>
      </p>
      {!correct && mode === 'review' && <p className="t-sm muted">{t('This comes back at the end.')}</p>}
    </Card>
  )
}
