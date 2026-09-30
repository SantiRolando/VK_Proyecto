// Motor de talle del mock: réplica simplificada del motor del backend para que
// el modo mock responda con la misma forma (`outcome`, `warnings`,
// `referralReason`). El motor real vive en el backend; este solo sostiene la
// demo sin servidor.
//
//   - Las medidas activas se derivan de la tabla: participa toda medida con
//     algún `*Min` no nulo. Si la tabla solo tiene edad, la edad es la medida.
//   - Por medida: la fila que la contiene (en superposición, la mayor); fuera de
//     la tabla → derivación (`MeasureBelowTable` / `MeasureAboveTable`); en un
//     hueco, la primera fila por encima.
//   - Diferencia entre índices: 0–1 talle directo (el mayor), 2 talle con aviso
//     `AdjacentSizeMayFit`, 3 o más derivación `ProportionMismatch`.
//   - En niños con medidas, la edad es orientativa: fuera del talle elegido
//     agrega `AgeOutsideSizeRange`.

const MEASURES = ['bust', 'waist', 'hip']

export function tableFor(db, line, audience) {
  return db.sizes
    .filter((size) => size.line === line && size.audience === audience)
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function activeMeasures(table) {
  const active = MEASURES.filter((measure) =>
    table.some((row) => row[`${measure}Min`] != null),
  )
  if (active.length === 0 && table.some((row) => row.ageMin != null)) return ['age']
  return active
}

function locate(table, measure, value) {
  const min = `${measure}Min`
  const max = `${measure}Max`
  const rows = table.filter((row) => row[min] != null)
  const containing = rows.filter((row) => value >= row[min] && value <= row[max])
  if (containing.length > 0) {
    return { row: containing[containing.length - 1] }
  }
  if (value < rows[0][min]) {
    return { referral: measure === 'age' ? 'AgeOutsideTable' : 'MeasureBelowTable' }
  }
  if (value > rows[rows.length - 1][max]) {
    return { referral: measure === 'age' ? 'AgeOutsideTable' : 'MeasureAboveTable' }
  }
  return { row: rows.find((row) => row[min] > value) }
}

// Devuelve `{ outcome, size, warnings, referralReason }` o lanza si falta una
// medida activa (el controller lo traduce a 400).
export function recommend(table, measures) {
  const active = activeMeasures(table)
  const missing = active.filter((measure) => measures[measure] == null)
  if (missing.length > 0) {
    const error = new Error(`${missing[0]} is required`)
    error.missing = missing
    throw error
  }

  const located = active.map((measure) => locate(table, measure, measures[measure]))
  const referred = located.find((item) => item.referral)
  if (referred) {
    return referredResult(referred.referral, table)
  }

  const rows = located.map((item) => item.row)
  const orders = rows.map((row) => row.sortOrder)
  const spread = Math.max(...orders) - Math.min(...orders)
  if (spread >= 3) return referredResult('ProportionMismatch', table)

  const size = rows.reduce((best, row) => (row.sortOrder > best.sortOrder ? row : best))
  const warnings = []
  if (spread === 2) warnings.push('AdjacentSizeMayFit')
  if (
    !active.includes('age') &&
    measures.age != null &&
    size.ageMin != null &&
    (measures.age < size.ageMin || measures.age > size.ageMax)
  ) {
    warnings.push('AgeOutsideSizeRange')
  }

  return {
    outcome: warnings.length > 0 ? 'WithWarning' : 'Direct',
    size,
    warnings,
    referralReason: null,
  }
}

function referredResult(reason, table) {
  const referralReason =
    reason === 'MeasureAboveTable' && table[0]?.audience === 'Kids'
      ? 'KidsAdultCrossover'
      : reason
  return { outcome: 'Referred', size: null, warnings: [], referralReason }
}

// Talles adyacentes: sortOrder ± 1 dentro de la misma tabla.
export function adjacentSizes(db, size) {
  return tableFor(db, size.line, size.audience).filter(
    (candidate) => Math.abs(candidate.sortOrder - size.sortOrder) === 1,
  )
}
