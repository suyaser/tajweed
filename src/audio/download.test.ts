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
