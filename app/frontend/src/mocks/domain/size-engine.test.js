import { ApiError } from '@api/client/api-error.js'
import { getDb, resetDatabase } from '@mocks/db/database.js'
import { adjacentSizes, suggestSize } from '@mocks/domain/size-engine.js'
import { beforeEach, describe, expect, it } from 'vitest'

beforeEach(() => {
  resetDatabase()
})

function dbWith(sizes) {
  return { sizes, productVariants: [] }
}

describe('size-engine (placeholder)', () => {
  it('elige por contención: la medida más exigente dicta el talle', () => {
    const db = getDb()
    // bust 85 → índice M; waist 74 → índice L (Endurance) → L
    const { size, dominantMeasure } = suggestSize(db, {
      line: 'Endurance',
      bust: 85,
      waist: 74,
    })
    expect(size.code).toBe('L')
    expect(dominantMeasure).toBe('waist')
  })

  it('en superposición de rangos toma el índice más alto', () => {
    const db = getDb()
    // waist 80 cae en XS [75,80] y S [80,85] → S
    const { size } = suggestSize(db, { line: 'Jammer', waist: 80, hip: 88 })
    expect(size.code).toBe('S')
  })

  it('deriva a OUT_OF_RANGE por encima de la tabla', () => {
    const db = getDb()
    try {
      suggestSize(db, { line: 'Jammer', waist: 110, hip: 115 })
      throw new Error('debería haber lanzado')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect(error.code).toBe('OUT_OF_RANGE')
      expect(error.details).toEqual({ measure: 'waist', direction: 'above' })
    }
  })

  it('deriva a OUT_OF_RANGE por debajo de la tabla', () => {
    const db = getDb()
    try {
      suggestSize(db, { line: 'Soft', bust: 70, waist: 60 })
      throw new Error('debería haber lanzado')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect(error.code).toBe('OUT_OF_RANGE')
      expect(error.details.measure).toBe('bust')
      expect(error.details.direction).toBe('below')
    }
  })

  it('en un hueco entre rangos toma el más cercano', () => {
    const db = getDb()
    // bust 83.0: entre índice 2 (82.55) e índice 3 (83.8) → 3 (M)
    const { size } = suggestSize(db, { line: 'Endurance', bust: 83.0, waist: 67 })
    expect(size.code).toBe('M')
  })

  it('devuelve los talles adyacentes (sortOrder ± 1)', () => {
    const db = getDb()
    const size = db.sizes.find((item) => item.line === 'Endurance' && item.code === 'M')
    const adjacent = adjacentSizes(db, size)
    expect(adjacent.map((item) => item.code)).toEqual(['S', 'L'])
  })

  it('lanza 404 para una línea sin talles', () => {
    expect(() =>
      suggestSize(dbWith([]), { line: 'Inexistente', bust: 85, waist: 67 }),
    ).toThrowError(ApiError)
  })
})
