import { describe, expect, it } from 'vitest'
import { capRange, normalize, parseRange, rangeLabel, rangeParam } from './range'

describe('parseRange', () => {
  it.each([
    ['1:1-1:7', { from: '1:1', to: '1:7' }],
    ['112:1-114:6', { from: '112:1', to: '114:6' }],
    ['93:5', { from: '93:5', to: '93:5' }],
    ['93:1-5', { from: '93:1', to: '93:5' }],
    ['93', { from: '93:1', to: '93:11' }],
    [' 2:255 ', { from: '2:255', to: '2:255' }],
  ])('%s', (raw, want) => expect(parseRange(raw)).toEqual(want))

  it.each(['', 'abc', '0:1', '115:1', '1:8', '1:0', '1:7-1:1', '114:1-112:1', '93-5', '1:1-', '1:1-2:999', undefined])(
    'rejects %s', (raw) => expect(parseRange(raw)).toBeNull(),
  )

  it('round-trips through rangeParam', () => {
    for (const raw of ['1:1-1:7', '93:5', '112:1-114:6']) expect(rangeParam(parseRange(raw)!)).toBe(raw)
  })

  it('labels with Arabic-Indic digits', () => {
    expect(rangeLabel({ from: '93:1', to: '93:11' })).toBe('الضحى · ١–١١')
    expect(rangeLabel({ from: '93:5', to: '93:5' })).toBe('الضحى · ٥')
    expect(rangeLabel({ from: '112:1', to: '114:6' })).toBe('الإخلاص ١ – الناس ٦')
  })
})

describe('capRange', () => {
  it('keeps short ranges and cuts long ones at 300 ayat', () => {
    expect(capRange({ from: '2:1', to: '2:286' })).toEqual({ from: '2:1', to: '2:286' })
    expect(capRange({ from: '93:5', to: '93:5' })).toEqual({ from: '93:5', to: '93:5' })
    expect(capRange(parseRange('1:1-114:6')!)).toEqual({ from: '1:1', to: '3:7' }) // 7 + 286 + 7
  })
})

describe('normalize', () => {
  it('matches with or without diacritics and alef forms', () => {
    expect(normalize('الإِخْفَاء')).toBe(normalize('الاخفاء'))
    expect(normalize('ٱلْحَمْدُ')).toBe('الحمد')
    expect(normalize('Ghunnah')).toBe('ghunnah')
  })
})
