// "Say it aloud" letter drill for مخارج / صفات lessons (learning review M3): read, record, play yourself back.
import type { Lesson } from '../../core/types'
import { drillFor } from '../../content'
import { t } from '../../i18n'
import type { StudyAudio } from './verse'
import { Recorder } from './Recorder'

/** Recordings are keyed by a pseudo-range `drill:<lessonId>` (the recordings store accepts any from/to). */
export const drillKey = (lessonId: string) => `drill:${lessonId}`

export function Drill({ lesson, audio }: { lesson: Lesson; audio: StudyAudio }) {
  const syllables = drillFor(lesson)
  if (!syllables.length) return null
  return (
    <section className="flex flex-col gap-space-md rounded-card border border-outline-variant bg-surface-container-lowest p-space-md sm:p-space-lg">
      <p className="text-body-lg text-on-surface">{t('Say each one slowly, from its place. Record yourself, then listen back.')}</p>
      <p className="text-center font-quran text-[32px] leading-[2] text-on-surface" lang="ar" dir="rtl">{syllables.join('، ')}</p>
      <Recorder from={drillKey(lesson.id)} audio={audio} />
    </section>
  )
}
