// PLACEHOLDER — motor de talle provisorio.
//
// El motor definitivo (índices por contorno, huecos/superposiciones,
// diferencia de índices, cruce niño/adulto, advertencia de torso) se
// implementa AL FINAL del prototipo, según
// `agents/context/recommendation-engine.txt`. Este placeholder existe solo
// para que el recorrido US1 sea demostrable:
//
//   - detecta medidas fuera de rango (debajo del mínimo o encima del máximo
//     de la línea) y deriva a atención personalizada → OUT_OF_RANGE;
//   - elige el talle por contención de rangos de las medidas activas de la
//     línea (la medida más exigente dicta); en un hueco, el rango más
//     cercano; sin dato, el talle del medio.
//
// Se reemplaza íntegro (junto con sus tests) cuando llegue el motor real.

import { ApiError } from '../../api/client/api-error.js'

export const LINE_MEASURES = {
  Endurance: ['bust', 'waist'],
  Soft: ['bust', 'waist'],
  Jammer: ['waist', 'hip'],
  Sunga: ['waist', 'hip'],
  Kids: ['waist', 'hip'],
}

const MIN_KEY = { height: 'heightMin', bust: 'bustMin', waist: 'waistMin', hip: 'hipMin' }
const MAX_KEY = { height: 'heightMax', bust: 'bustMax', waist: 'waistMax', hip: 'hipMax' }

function rangedSizes(lineSizes, minKey) {
  return lineSizes.filter((size) => size[minKey] != null)
}

export function suggestSize(db, measures) {
  const lineSizes = db.sizes
    .filter((size) => size.line === measures.line)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  if (lineSizes.length === 0) {
    throw new ApiError(404, 'NOT_FOUND', { line: measures.line })
  }

  const active = (LINE_MEASURES[measures.line] ?? []).map((measure) => ({
    measure,
    value: measures[measure],
    minKey: MIN_KEY[measure],
    maxKey: MAX_KEY[measure],
  }))

  // Fuera de rango: medida por debajo/encima de toda la línea.
  for (const { measure, value, minKey, maxKey } of active) {
    const ranged = rangedSizes(lineSizes, minKey)
    if (ranged.length === 0) continue
    const floor = Math.min(...ranged.map((size) => size[minKey]))
    const ceil = Math.max(...ranged.map((size) => size[maxKey]))
    if (value < floor) {
      throw new ApiError(422, 'OUT_OF_RANGE', { measure, direction: 'below' })
    }
    if (value > ceil) {
      throw new ApiError(422, 'OUT_OF_RANGE', { measure, direction: 'above' })
    }
  }

  // Talle objetivo por medida: mayor sortOrder que la contenga; si cae en
  // un hueco, el rango más cercano por punto medio.
  const targets = []
  for (const { measure, value, minKey, maxKey } of active) {
    const ranged = rangedSizes(lineSizes, minKey)
    if (ranged.length === 0) continue

    const containing = ranged.filter(
      (size) => value >= size[minKey] && value <= size[maxKey],
    )
    if (containing.length > 0) {
      const size = containing.reduce((best, candidate) =>
        candidate.sortOrder > best.sortOrder ? candidate : best,
      )
      targets.push({ measure, size })
      continue
    }

    const size = ranged.reduce((best, candidate) => {
      const mid = (candidate[minKey] + candidate[maxKey]) / 2
      const bestMid = (best[minKey] + best[maxKey]) / 2
      return Math.abs(value - mid) < Math.abs(value - bestMid) ? candidate : best
    })
    targets.push({ measure, size })
  }

  // Sin medidas con rangos para esta línea: talle del medio.
  if (targets.length === 0) {
    const middle = lineSizes[Math.floor(lineSizes.length / 2)]
    return { size: middle, dominantMeasure: null }
  }

  // La medida más exigente dicta el talle (índice más alto).
  const chosen = targets.reduce((best, target) =>
    target.size.sortOrder > best.size.sortOrder ? target : best,
  )
  const dominantMeasure = targets.find(
    (target) => target.size.sortOrder === chosen.size.sortOrder,
  ).measure

  return { size: chosen.size, dominantMeasure }
}

// Talles adyacentes: sortOrder ± 1 dentro de la misma línea.
export function adjacentSizes(db, size) {
  return db.sizes
    .filter(
      (candidate) =>
        candidate.line === size.line &&
        Math.abs(candidate.sortOrder - size.sortOrder) === 1,
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
}
