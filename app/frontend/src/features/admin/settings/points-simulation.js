/*
  Lectura de la configuración de puntos: cuánto premia de verdad lo que el admin acaba de
  cargar. Es pura para poder testearla sin montar la pantalla.

  Las reglas que replica están en `src/mocks/domain/points.js`: el sorteo se hace por feedback
  y el tope diario cuenta **premios**, no calificaciones (un feedback que no acierta no consume
  cupo). Por eso los premios de un día son una binomial truncada en el tope, y no el mínimo
  entre feedbacks y tope.
*/

// Feedbacks de la simulación: diez es un día cargado para un cliente, y hace visible el efecto
// del tope sin que el número quede en el aire.
export const SAMPLE_FEEDBACKS = 10

/*
  Anclas de la escala, en puntos por cliente y por día como techo: los cupones del seed cuestan
  60 y 100 puntos, así que "equilibrada" es un cupón cada varios días y "muy generosa" es más de
  un cupón por día. El último tramo no tiene ancla porque no hay nada por encima.
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

// Todo lo que la pantalla muestra de una sola pasada, para no recalcular por campo.
export function summarizePointsConfig(config, feedbacks = SAMPLE_FEEDBACKS) {
  return {
    feedbacks,
    level: generosityLevel(config),
    potentialPointsPerDay: Math.round(potentialPointsPerDay(config)),
    chance: Math.round(awardChance(config, feedbacks) * 1000) / 10,
    expectedPoints: Math.round(expectedPoints(config, feedbacks)),
  }
}
