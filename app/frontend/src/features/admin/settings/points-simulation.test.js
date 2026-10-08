import {
  awardChance,
  expectedPoints,
  generosityLevel,
  POINTS_PRESETS,
  potentialPointsPerDay,
  presetIndex,
  summarizePointsConfig,
} from '@features/admin/settings/points-simulation.js'
import { describe, expect, it } from 'vitest'

// Configuración del seed: 30 % de acierto, 10 puntos por premio y tope de 5 premios.
const SEED = {
  successProbability: 30,
  pointsPerFeedback: 10,
  maxDailyFeedback: 5,
}

describe('lectura de la configuración de puntos', () => {
  it('calcula el techo diario como tope por chance por puntos', () => {
    expect(potentialPointsPerDay(SEED)).toBeCloseTo(15)
  })

  it('calcula la chance de premiar al menos una vez', () => {
    // 1 - 0,7^10 y 1 - 0,7^3
    expect(awardChance(SEED, 10)).toBeCloseTo(0.97175, 4)
    expect(awardChance(SEED, 3)).toBeCloseTo(0.657)
  })

  it('calcula los puntos esperados con el tope aplicado', () => {
    // Con tres intentos el tope no recorta: 0,9 premios esperados por 10 puntos cada uno.
    expect(expectedPoints(SEED, 3)).toBeCloseTo(9)
    expect(expectedPoints(SEED, 10)).toBeCloseTo(29.4, 1)
    expect(expectedPoints(SEED, 10)).toBeLessThan(10 * 0.3 * 10)
  })

  it('no promete nada cuando el sorteo o los puntos están en cero', () => {
    const sinSorteo = { ...SEED, successProbability: 0 }
    expect(awardChance(sinSorteo)).toBe(0)
    expect(expectedPoints(sinSorteo)).toBe(0)

    expect(generosityLevel(sinSorteo)).toBe('none')
    expect(generosityLevel({ ...SEED, pointsPerFeedback: 0 })).toBe('none')
    expect(generosityLevel({ ...SEED, maxDailyFeedback: 0 })).toBe('none')
  })

  it('ordena la generosidad por el techo diario', () => {
    const ajustada = {
      successProbability: 1,
      pointsPerFeedback: 1,
      maxDailyFeedback: 1,
    }
    const desmedida = {
      successProbability: 50,
      pointsPerFeedback: 50,
      maxDailyFeedback: 5,
    }

    expect(generosityLevel(ajustada)).toBe('low')
    expect(generosityLevel(SEED)).toBe('balanced')
    expect(generosityLevel(desmedida)).toBe('extreme')
  })

  it('cada preset cae en la banda que declara', () => {
    for (const preset of POINTS_PRESETS) {
      expect(generosityLevel(preset.values)).toBe(preset.level)
    }
  })

  it('la barra marca la banda de la configuración actual', () => {
    const sinRecompensa = {
      successProbability: 0,
      pointsPerFeedback: 0,
      maxDailyFeedback: 0,
    }

    expect(presetIndex(sinRecompensa)).toBe(0)
    expect(presetIndex(POINTS_PRESETS[0].values)).toBe(0)
    expect(presetIndex(SEED)).toBe(1)
    expect(presetIndex(POINTS_PRESETS[2].values)).toBe(2)
    // Sin ancla por encima: "muy generosa" comparte la última banda.
    expect(
      presetIndex({
        successProbability: 100,
        pointsPerFeedback: 1000,
        maxDailyFeedback: 100,
      }),
    ).toBe(2)
  })

  it('resume la lectura en los números que muestra la pantalla', () => {
    expect(summarizePointsConfig(SEED)).toEqual({
      feedbacks: 3,
      level: 'balanced',
      presetIndex: 1,
      potentialPointsPerDay: 15,
      chance: 65.7,
      expectedPoints: 9,
    })
  })
})
