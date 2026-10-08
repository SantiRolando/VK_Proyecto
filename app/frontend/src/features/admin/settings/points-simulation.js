/*
  Feedbacks de la simulación. Con un número "alto" ej: diez, es más difícil de evaluar el
  resultado porque cualquier configuración parece premiar casi siempre.
*/
export const SAMPLE_FEEDBACKS = 3

/*
  Presets de la barra. Cada uno cae en una banda distinta de la escala, así que mover la barra
  cambia las tres reglas y la badge lo confirma.
*/
export const POINTS_PRESETS = [
  {
    level: 'low',
    values: { successProbability: 10, pointsPerFeedback: 5, maxDailyFeedback: 3 },
  },
  {
    level: 'balanced',
    values: { successProbability: 30, pointsPerFeedback: 10, maxDailyFeedback: 5 },
  },
  {
    level: 'high',
    values: { successProbability: 50, pointsPerFeedback: 20, maxDailyFeedback: 8 },
  },
]

/*
  Steps de la escala, en puntos por cliente y por día como techo
*/
const GENEROSITY_STEPS = [
  { upTo: 0, level: 'none' },
  { upTo: 10, level: 'low' },
  { upTo: 40, level: 'balanced' },
  { upTo: 100, level: 'high' },
]

const TOP_GENEROSITY_LEVEL = 'extreme'

function binomialProbability(trials, successes, probability) {
  let combinations = 1
  for (let index = 1; index <= successes; index += 1) {
    combinations = (combinations * (trials - successes + index)) / index
  }
  return (
    combinations * probability ** successes * (1 - probability) ** (trials - successes)
  )
}

// Convierte a número y descarta lo que no sirve: el formulario puede dejar el campo vacío.
function sanitize(value) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : 0
}

function readConfig(config) {
  return {
    probability: sanitize(config.successProbability) / 100,
    pointsPerFeedback: sanitize(config.pointsPerFeedback),
    dailyCap: sanitize(config.maxDailyFeedback),
  }
}

/*
  Techo de puntos por cliente y por día: todos los feedbacks premiados que permite el tope.
  Es lo que mide qué tan regaladora es la configuración.
*/
export function potentialPointsPerDay(config) {
  const { probability, pointsPerFeedback, dailyCap } = readConfig(config)
  return dailyCap * probability * pointsPerFeedback
}

/*
  Chance de que un cliente se lleve puntos al menos una vez en `feedbacks` intentos del mismo
  día. Con el tope en cero, o sin puntos por premio, no hay nada que ganar.
*/
export function awardChance(config, feedbacks = SAMPLE_FEEDBACKS) {
  const { probability, pointsPerFeedback, dailyCap } = readConfig(config)
  if (probability <= 0 || pointsPerFeedback <= 0 || dailyCap <= 0) return 0
  return 1 - (1 - probability) ** feedbacks
}

// Puntos esperados en `feedbacks` intentos del mismo día, con el tope aplicado.
export function expectedPoints(config, feedbacks = SAMPLE_FEEDBACKS) {
  const { probability, pointsPerFeedback, dailyCap } = readConfig(config)
  if (probability <= 0 || pointsPerFeedback <= 0 || dailyCap <= 0) return 0

  let awards = 0
  for (let successes = 1; successes <= feedbacks; successes += 1) {
    awards +=
      Math.min(successes, dailyCap) *
      binomialProbability(feedbacks, successes, probability)
  }
  return awards * pointsPerFeedback
}

export function generosityLevel(config) {
  const potential = potentialPointsPerDay(config)
  const step = GENEROSITY_STEPS.find((candidate) => potential <= candidate.upTo)
  return step ? step.level : TOP_GENEROSITY_LEVEL
}

/*
  Posición de la barra: la banda de la escala en la que cae la configuración.
*/
export function presetIndex(config) {
  const level = generosityLevel(config)
  if (level === 'balanced') return 1
  if (level === 'high' || level === 'extreme') return 2
  return 0
}

// Todo lo que la pantalla muestra de una sola pasada, para no recalcular por campo.
export function summarizePointsConfig(config, feedbacks = SAMPLE_FEEDBACKS) {
  return {
    feedbacks,
    level: generosityLevel(config),
    presetIndex: presetIndex(config),
    potentialPointsPerDay: Math.round(potentialPointsPerDay(config)),
    chance: Math.round(awardChance(config, feedbacks) * 1000) / 10,
    expectedPoints: Math.round(expectedPoints(config, feedbacks)),
  }
}
