import { cn } from './utils'

test('cn keeps our type scale and colour side by side, and merges within a group', () => {
  expect(cn('text-body-md text-on-surface', 'text-primary')).toBe('text-body-md text-primary')
  expect(cn('text-body-md', 'text-label')).toBe('text-label')
  expect(cn('p-space-md', 'p-space-lg')).toBe('p-space-lg')
  expect(cn('rounded-control', 'rounded-card')).toBe('rounded-card')
  expect(cn('shadow-card bg-surface')).toBe('shadow-card bg-surface')
})
