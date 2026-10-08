import {
  awardChance,
  expectedPoints,
  generosityLevel,
  potentialPointsPerDay,
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

  it('calcula la chance de premiar al menos una vez en diez intentos', () => {
    // 1 - 0,7^10
    expect(awardChance(SEED, 10)).toBeCloseTo(0.97175, 4)
  })

  it('calcula los puntos esperados con el tope aplicado', () => {
    // El tope recorta la cola de la binomial: da menos que los 30 puntos de 10 aciertos esperados.
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

  it('resume la lectura en los números que muestra la pantalla', () => {
    expect(summarizePointsConfig(SEED)).toEqual({
      feedbacks: 10,
      level: 'balanced',
      potentialPointsPerDay: 15,
      chance: 97.2,
      expectedPoints: 29,
    })
  })
})
