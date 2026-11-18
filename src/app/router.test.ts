import { parseHash, href } from './router'

test('parses literal routes before params, decodes params and query', () => {
  expect(parseHash('#/teacher/new').name).toBe('teacherNew')
  expect(parseHash('#/teacher/abc?sheet=1')).toEqual({ name: 'session', params: { id: 'abc', sheet: '1' }, path: 'teacher/abc' })
  expect(parseHash('#/listen/93%3A1-93%3A11').params.range).toBe('93:1-93:11')
  expect(parseHash('#/rules/ikhfa').name).toBe('rule')
  expect(parseHash('#/dev/components').name).toBe('devComponents')
})

test('empty hash is today; unknown is notFound; href encodes', () => {
  expect(parseHash('').name).toBe('today')
  expect(parseHash('#/').name).toBe('today')
  expect(parseHash('#/nope/x/y').name).toBe('notFound')
  expect(href('listen', '93:1-93:11')).toBe('#/listen/93%3A1-93%3A11')
})
