import { describe, test, expect } from 'vitest'
import {
  timeToMinutes,
  minutesToTime,
  generateTimeSlots,
  isValidEmail,
  isValidPhone,
  isValidPostalCode,
  normalizePostalCode,
  getDayOfWeek,
  formatTimeNL,
  formatAddress,
  toDateString,
  getDateRange,
} from './utils'

describe('timeToMinutes', () => {
  test('converts time string to minutes', () => {
    expect(timeToMinutes('00:00')).toBe(0)
    expect(timeToMinutes('01:00')).toBe(60)
    expect(timeToMinutes('09:30')).toBe(570)
    expect(timeToMinutes('14:45')).toBe(885)
    expect(timeToMinutes('23:59')).toBe(1439)
  })
})

describe('minutesToTime', () => {
  test('converts minutes to time string', () => {
    expect(minutesToTime(0)).toBe('00:00')
    expect(minutesToTime(60)).toBe('01:00')
    expect(minutesToTime(570)).toBe('09:30')
    expect(minutesToTime(885)).toBe('14:45')
    expect(minutesToTime(1439)).toBe('23:59')
  })

  test('pads single digits with zero', () => {
    expect(minutesToTime(5)).toBe('00:05')
    expect(minutesToTime(65)).toBe('01:05')
  })
})

describe('generateTimeSlots', () => {
  test('generates 30-minute slots', () => {
    const slots = generateTimeSlots('09:00', '12:00', 30)
    expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'])
  })

  test('generates 60-minute slots', () => {
    const slots = generateTimeSlots('09:00', '12:00', 60)
    expect(slots).toEqual(['09:00', '10:00', '11:00'])
  })

  test('excludes slots that would extend past closing time', () => {
    const slots = generateTimeSlots('09:00', '10:15', 30)
    expect(slots).toEqual(['09:00', '09:30'])
  })

  test('returns empty array if no slots fit', () => {
    const slots = generateTimeSlots('09:00', '09:15', 30)
    expect(slots).toEqual([])
  })
})

describe('isValidEmail', () => {
  test('accepts valid emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user.name@domain.nl')).toBe(true)
    expect(isValidEmail('user+tag@example.co.uk')).toBe(true)
  })

  test('rejects invalid emails', () => {
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('notanemail')).toBe(false)
    expect(isValidEmail('missing@domain')).toBe(false)
    expect(isValidEmail('@nodomain.com')).toBe(false)
    expect(isValidEmail('spaces in@email.com')).toBe(false)
  })
})

describe('isValidPhone', () => {
  test('accepts Dutch phone numbers', () => {
    expect(isValidPhone('0612345678')).toBe(true)
    expect(isValidPhone('06 12345678')).toBe(true)
    expect(isValidPhone('06-12345678')).toBe(true)
    expect(isValidPhone('+31612345678')).toBe(true)
  })

  test('accepts Belgian phone numbers', () => {
    expect(isValidPhone('0412345678')).toBe(true)
    expect(isValidPhone('+32412345678')).toBe(true)
  })

  test('accepts other international formats', () => {
    expect(isValidPhone('+49123456789')).toBe(true)
    expect(isValidPhone('+1 (555) 123-4567')).toBe(true)
  })

  test('rejects invalid phone numbers', () => {
    expect(isValidPhone('')).toBe(false)
    expect(isValidPhone('123')).toBe(false) // too short
    expect(isValidPhone('abcdefghij')).toBe(false)
  })
})

describe('isValidPostalCode', () => {
  test('accepts Dutch postal codes', () => {
    expect(isValidPostalCode('1234 AB')).toBe(true)
    expect(isValidPostalCode('1234AB')).toBe(true)
    expect(isValidPostalCode('1234 ab')).toBe(true)
  })

  test('accepts Belgian postal codes', () => {
    expect(isValidPostalCode('1000')).toBe(true)
    expect(isValidPostalCode('9999')).toBe(true)
  })

  test('rejects invalid postal codes', () => {
    expect(isValidPostalCode('')).toBe(false)
    expect(isValidPostalCode('123')).toBe(false) // too short
    expect(isValidPostalCode('12345')).toBe(false) // 5 digits
    expect(isValidPostalCode('ABCD')).toBe(false) // letters only
    expect(isValidPostalCode('1234 ABC')).toBe(false) // 3 letters
  })
})

describe('normalizePostalCode', () => {
  test('adds space to Dutch postal codes', () => {
    expect(normalizePostalCode('1234AB')).toBe('1234 AB')
    expect(normalizePostalCode('1234ab')).toBe('1234 AB')
  })

  test('preserves already formatted Dutch postal codes', () => {
    expect(normalizePostalCode('1234 AB')).toBe('1234 AB')
  })

  test('preserves Belgian postal codes', () => {
    expect(normalizePostalCode('1000')).toBe('1000')
    expect(normalizePostalCode(' 1000 ')).toBe('1000')
  })
})

describe('getDayOfWeek', () => {
  test('returns Monday as 0', () => {
    expect(getDayOfWeek('2025-01-06')).toBe(0) // Monday
  })

  test('returns Sunday as 6', () => {
    expect(getDayOfWeek('2025-01-05')).toBe(6) // Sunday
  })

  test('returns correct day for various dates', () => {
    expect(getDayOfWeek('2025-01-07')).toBe(1) // Tuesday
    expect(getDayOfWeek('2025-01-08')).toBe(2) // Wednesday
    expect(getDayOfWeek('2025-01-09')).toBe(3) // Thursday
    expect(getDayOfWeek('2025-01-10')).toBe(4) // Friday
    expect(getDayOfWeek('2025-01-11')).toBe(5) // Saturday
  })
})

describe('formatTimeNL', () => {
  test('formats time with "uur" suffix', () => {
    expect(formatTimeNL('14:00')).toBe('14:00 uur')
    expect(formatTimeNL('09:30')).toBe('09:30 uur')
  })

  test('handles time with seconds', () => {
    expect(formatTimeNL('14:00:00')).toBe('14:00 uur')
  })
})

describe('formatAddress', () => {
  test('formats address correctly', () => {
    expect(formatAddress('Hoofdstraat 1', '1234 AB', 'Amsterdam'))
      .toBe('Hoofdstraat 1, 1234 AB Amsterdam')
  })
})

describe('toDateString', () => {
  test('formats date to YYYY-MM-DD', () => {
    expect(toDateString(new Date('2025-01-15T12:00:00Z'))).toBe('2025-01-15')
  })
})

describe('getDateRange', () => {
  test('generates array of date strings', () => {
    const dates = getDateRange(new Date('2025-01-01'), 3)
    expect(dates).toEqual(['2025-01-01', '2025-01-02', '2025-01-03'])
  })

  test('returns empty array for 0 days', () => {
    expect(getDateRange(new Date('2025-01-01'), 0)).toEqual([])
  })
})
