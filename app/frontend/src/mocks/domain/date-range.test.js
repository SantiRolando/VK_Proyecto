import { inRange, rangeFromQuery, timeOrNull } from '@mocks/domain/date-range.js'
import { describe, expect, it } from 'vitest'

describe('timeOrNull', () => {
  it('interpreta ISO y fecha sin hora', () => {
    expect(timeOrNull('2026-09-24')).toBe(new Date('2026-09-24').getTime())
    expect(timeOrNull('2026-09-24T12:00:00Z')).toBe(
      new Date('2026-09-24T12:00:00Z').getTime(),
    )
  })

  it('con `endOfDay` cubre el día completo', () => {
    expect(timeOrNull('2026-09-24', { endOfDay: true })).toBe(
      new Date('2026-09-24T23:59:59.999Z').getTime(),
    )
  })

  it('devuelve null para vacíos o inválidos', () => {
    expect(timeOrNull(undefined)).toBeNull()
    expect(timeOrNull('')).toBeNull()
    expect(timeOrNull('no-es-fecha')).toBeNull()
  })
})

describe('rangeFromQuery / inRange', () => {
  const range = rangeFromQuery({ from: '2026-09-01', to: '2026-09-10' })

  it('incluye las fechas dentro del rango (borde superior inclusive)', () => {
    expect(inRange('2026-09-01T00:00:00Z', range)).toBe(true)
    expect(inRange('2026-09-10T23:00:00Z', range)).toBe(true)
  })

  it('excluye las fechas fuera del rango', () => {
    expect(inRange('2026-08-31T23:59:59Z', range)).toBe(false)
    expect(inRange('2026-09-11T00:00:01Z', range)).toBe(false)
  })

  it('sin límites todo entra', () => {
    expect(inRange('2020-01-01T00:00:00Z', rangeFromQuery({}))).toBe(true)
  })
})
