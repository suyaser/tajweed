// One question per screen (design §5.3–5.5): prompt, options, feedback in place, Next.
import { useEffect, useState, type ReactNode } from 'react'
import type { Question, Option } from '../../core/questions'
import { getLesson, pairs } from '../../content'
import { href } from '../../app/router'
import { Button, Card, CountBeats, LetterTiles, OptionButton, T, type OptionState } from '../../components'
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
    return <><CountBeats min={min} max={max} /><small>{o.labelEn} counts</small></>
  }
  if (q.kind === 'fact') return isLetters(o.labelAr) ? <LetterTiles letters={o.labelAr} size="option" /> : <span className="s-opt-text"><T>{o.labelAr}</T></span>
  return null
}

export function QuestionView({ q, mode, eyebrow, note, audio, onAnswer, onNext, nextLabel = 'Next' }: {
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
        <p className="t-lg"><T>{q.prompt}</T></p>
        {q.example && (
          <ExampleVerse
            ex={q.example} vs={vs} size="focus"
            actions={<PlayButton audio={audio} label="the ayah" onClick={vs.verse && (() => audio.ayah(vs.verse!))} />}
          />
        )}
      </Card>
      {q.example && <p className="t-sm muted s-center">Read it aloud, then choose.</p>}
      <div className="opts" role="group" aria-label="Answers">
        {q.options.map((o, i) => (
          <OptionButton
            key={o.id} state={stateOf(o.id)} disabled={chosen != null} onClick={() => choose(o.id)}
            ar={q.kind === 'identify' ? o.labelAr : undefined} en={q.kind === 'identify' ? o.labelEn : undefined}
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
  const name = q.kind === 'length' ? `${answer.labelEn} counts` : answer.labelAr
  const its = q.kind === 'fact' ? `The answer is “${name}”.` : `It's ${name}.`
  const hint = !correct && q.kind === 'identify' ? confusableHint(pairs, q.answerId, chosen) : undefined
  const ex = q.example
  const hear = ex && vs.verse ? () => audio.example(vs.verse!, ex) : undefined

  if (mode === 'pretest')
    return (
      <Card className="s-feedback">
        <p className="t-lg"><T>{its}</T> You'll see why in a minute.</p>
      </Card>
    )

  // length explanations already open with "It's N counts".
  const verdict = correct ? 'Correct.' : q.kind === 'length' ? 'Not quite.' : `Not quite. ${its}`
  return (
    <Card className="s-feedback" eyebrow={lesson && <><span lang="ar">{lesson.nameAr}</span> · {lesson.nameEn}</>}>
      <p className="t-lg">{correct && <span aria-hidden="true">✓ </span>}<T>{verdict}</T></p>
      <p><T>{q.explanation}</T></p>
      {hint && <p className="s-fb-hint"><span className="muted">Easy to mix up: </span><T>{hint}</T></p>}
      {ex && <ExampleVerse ex={ex} vs={vs} coloured spanOnly />}
      <p className="s-fb-links">
        {ex && <PlayButton audio={audio} label="the example" onClick={hear}>▶ hear it</PlayButton>}
        <a href={href('rules', q.lessonId)}>Open card ›</a>
      </p>
      {!correct && mode === 'review' && <p className="t-sm muted">This comes back at the end.</p>}
    </Card>
  )
}
