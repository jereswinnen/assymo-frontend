import { describe, test, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  test('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  test('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'end')).toBe('base end')
    expect(cn('base', true && 'visible', 'end')).toBe('base visible end')
  })

  test('dedupes Tailwind conflicts (last wins)', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  test('handles empty inputs', () => {
    expect(cn()).toBe('')
    expect(cn('')).toBe('')
  })
})
