import { units } from '../content/course'
import { unitAyahs } from './download'

test('every unit with lessons downloads its finale and in-surah ranges', () => {
  for (const u of units.filter(u => u.lessonIds.length)) {
    const keys = unitAyahs(u)
    expect(keys).toContain('1:1')
    if (u.finale) expect(keys).toContain(u.finale.to)
    expect(new Set(keys).size).toBe(keys.length)
  }
})

test('every video link names a real lesson and episode', async () => {
  const videos = (await import('../../content/videos.json')).default
  const { getLesson } = await import('../content')
  for (const [id, v] of Object.entries(videos.lessons)) {
    expect(getLesson(id), id).toBeTruthy()
    expect(videos.episodes[v.ep - 1], id).toBeTruthy()
  }
})
