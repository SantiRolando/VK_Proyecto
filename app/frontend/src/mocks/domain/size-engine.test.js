import { getDb, resetDatabase } from '@mocks/db/database.js'
import {
  activeMeasures,
  adjacentSizes,
  recommend,
  tableFor,
} from '@mocks/domain/size-engine.js'
import { beforeEach, describe, expect, it } from 'vitest'

beforeEach(() => {
  resetDatabase()
})

const table = (line, audience = 'Adult') => tableFor(getDb(), line, audience)

describe('size-engine (mock)', () => {
  it('deriva las medidas activas de la tabla', () => {
    expect(activeMeasures(table('Endurance'))).toEqual(['bust', 'waist'])
    expect(activeMeasures(table('Jammer'))).toEqual(['waist', 'hip'])
    expect(activeMeasures(table('Endurance', 'Kids'))).toEqual(['age'])
  })

  it('con índices iguales o contiguos devuelve el talle mayor', () => {
    // bust 85 → M; waist 74 → L → L directo
    const result = recommend(table('Endurance'), { bust: 85, waist: 74 })
    expect(result).toMatchObject({ outcome: 'Direct', warnings: [] })
    expect(result.size.code).toBe('L')
  })

  it('en superposición de rangos toma el índice más alto', () => {
    // waist 80 cae en XS [75,80] y S [80,85] → S
    const result = recommend(table('Jammer'), { waist: 80, hip: 88 })
    expect(result.size.code).toBe('S')
  })

  it('con dos índices de diferencia avisa que el talle vecino puede calzar', () => {
    // bust 76 → XS (1); waist 68 → M (3)
    const result = recommend(table('Endurance'), { bust: 76, waist: 68 })
    expect(result.outcome).toBe('WithWarning')
    expect(result.size.code).toBe('M')
    expect(result.warnings).toEqual(['AdjacentSizeMayFit'])
  })

  it('con tres o más índices de diferencia deriva por proporciones', () => {
    // bust 76 → XS (1); waist 73 → L (4)
    const result = recommend(table('Endurance'), { bust: 76, waist: 73 })
    expect(result).toMatchObject({
      outcome: 'Referred',
      size: null,
      referralReason: 'ProportionMismatch',
    })
  })

  it('deriva por encima y por debajo de la tabla', () => {
    expect(recommend(table('Jammer'), { waist: 110, hip: 115 })).toMatchObject({
      outcome: 'Referred',
      referralReason: 'MeasureAboveTable',
    })
    expect(recommend(table('Soft'), { bust: 70, waist: 60 })).toMatchObject({
      outcome: 'Referred',
      referralReason: 'MeasureBelowTable',
    })
  })

  it('en un hueco entre rangos toma la primera fila por encima', () => {
    // waist 70 está entre M [66, 69.8] y L [71.12, 74.93] → L
    const result = recommend(table('Endurance'), { bust: 90, waist: 70 })
    expect(result.size.code).toBe('L')
  })

  it('niñas: solo edad; fuera de tabla deriva', () => {
    expect(recommend(table('Endurance', 'Kids'), { age: 7 }).size.code).toBe('M')
    expect(recommend(table('Endurance', 'Kids'), { age: 4 })).toMatchObject({
      outcome: 'Referred',
      referralReason: 'AgeOutsideTable',
    })
  })

  it('varones: la edad es orientativa y fuera del talle solo avisa', () => {
    const result = recommend(table('Jammer', 'Kids'), { waist: 67, hip: 80, age: 10 })
    expect(result.size.code).toBe('12')
    expect(result.outcome).toBe('WithWarning')
    expect(result.warnings).toEqual(['AgeOutsideSizeRange'])
  })

  it('exige las medidas activas', () => {
    expect(() => recommend(table('Endurance'), { bust: 85 })).toThrow('waist is required')
  })

  it('talles adyacentes por sortOrder ± 1 dentro de la misma tabla', () => {
    const db = getDb()
    const m = table('Endurance').find((size) => size.code === 'M')
    expect(adjacentSizes(db, m).map((size) => size.code)).toEqual(['S', 'L'])
    const xs = table('Jammer').find((size) => size.code === 'XS')
    expect(adjacentSizes(db, xs).map((size) => size.code)).toEqual(['S'])
  })
})
