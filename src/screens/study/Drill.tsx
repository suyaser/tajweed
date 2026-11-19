// "Say it aloud" letter drill for مخارج / صفات lessons (learning review M3): read, record, play yourself back.
import type { Lesson } from '../../core/types'
import { drillFor } from '../../content'
import { Card } from '../../components'
import type { StudyAudio } from './verse'
import { Recorder } from './Recorder'

/** Recordings are keyed by a pseudo-range `drill:<lessonId>` (the recordings store accepts any from/to). */
export const drillKey = (lessonId: string) => `drill:${lessonId}`

export function Drill({ lesson, audio }: { lesson: Lesson; audio: StudyAudio }) {
  const syllables = drillFor(lesson)
  if (!syllables.length) return null
  return (
    <Card level="e2" className="s-drill">
      <p className="t-lg">Say each one slowly, from its place. Record yourself, then listen back.</p>
      <p className="a-h3 s-center" lang="ar" dir="rtl">{syllables.join('، ')}</p>
      <Recorder from={drillKey(lesson.id)} audio={audio} />
    </Card>
  )
}
