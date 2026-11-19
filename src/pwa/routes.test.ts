import { describe, expect, it } from 'vitest'
import { isAudio, isFont, isQuranData } from './routes'

const m = (href: string) => ({ url: new URL(href), sameOrigin: new URL(href).origin === 'https://app.test' })

describe('sw routes', () => {
  it('sends everyayah audio to the audio route, never the data route', () => {
    const a = m('https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3')
    expect(isAudio(a)).toBe(true)
    expect(isQuranData(a)).toBe(false)
  })
  it('sends same-origin /data/ JSON to the data route', () => {
    for (const u of ['https://app.test/data/surah/001.json', 'https://app.test/tajweed/data/meta.json']) {
      expect(isQuranData(m(u))).toBe(true)
      expect(isAudio(m(u))).toBe(false)
    }
  })
  it('matches Google Fonts hosts only', () => {
    expect(isFont(m('https://fonts.gstatic.com/s/amiri/v1/x.woff2'))).toBe(true)
    expect(isFont(m('https://fonts.googleapis.com/css2?family=Amiri'))).toBe(true)
    expect(isFont(m('https://evilfonts.gstatic.com.example/x'))).toBe(false)
  })
})
