// Motor de recomendación de talles (vestimenta de natación).
// Fuente: agents/context/logica_talles_natacion.md

const womenEndurance = [
  { size: 'XS', bust: [74.9, 78.7], waist: [63.5, 64.77], usa: 28, eu: 34 },
  { size: 'S', bust: [78.8, 82.55], waist: [64.7, 66.0], usa: 30, eu: 36 },
  { size: 'M', bust: [83.8, 87.6], waist: [66.0, 69.8], usa: 32, eu: 38 },
  { size: 'L', bust: [88.9, 92.71], waist: [71.12, 74.93], usa: 34, eu: 40 },
  { size: 'XL', bust: [93.98, 99.06], waist: [76.2, 80.01], usa: 36, eu: 42 },
  { size: '2XL', bust: [99.06, 104.14], waist: [81.28, 85.09], usa: 38, eu: 44 },
  { size: '3XL', bust: [104.14, 107.95], waist: [83.8, 88.9], usa: 40, eu: 46 },
]

const womenSoft = [
  { size: 'XXS', bust: [74.9, 78.7], waist: [63.5, 64.77], usa: 28, eu: 34 },
  { size: 'XS', bust: [78.8, 82.55], waist: [64.7, 66.0], usa: 30, eu: 36 },
  { size: 'S', bust: [83.8, 87.6], waist: [66.0, 69.8], usa: 32, eu: 38 },
  { size: 'M', bust: [88.9, 92.71], waist: [71.12, 74.93], usa: 34, eu: 40 },
  { size: 'L', bust: [93.98, 99.06], waist: [76.2, 80.01], usa: 36, eu: 42 },
  { size: 'XL', bust: [99.06, 104.14], waist: [81.28, 85.09], usa: 38, eu: 44 },
  { size: 'XXL', bust: [104.14, 107.95], waist: [83.8, 88.9], usa: 40, eu: 46 },
]

const menJammer = [
  { size: 'XS', waist: [75, 80], hip: [80, 85], usa: 30, eu: 44 },
  { size: 'S', waist: [80, 85], hip: [85, 90], usa: 32, eu: 46 },
  { size: 'M', waist: [85, 90], hip: [90, 95], usa: 34, eu: 48 },
  { size: 'L', waist: [90, 95], hip: [95, 100], usa: 36, eu: 50 },
  { size: 'XL', waist: [95, 100], hip: [100, 105], usa: 38, eu: 52 },
  { size: '2XL', waist: [100, 105], hip: [105, 110], usa: 40, eu: 54 },
]

const menSungas = menJammer

const TABLES = {
  'women-endurance': womenEndurance,
  'women-soft': womenSoft,
  'men-jammer': menJammer,
  'men-sungas': menSungas,
}

const WOMEN_MEASUREMENTS = ['bust', 'waist']
const MEN_MEASUREMENTS = ['waist', 'hip']

function isWithinRange(value, range) {
  return value >= range[0] && value <= range[1]
}

function distanceToRange(value, range) {
  if (value < range[0]) return range[0] - value
  if (value > range[1]) return value - range[1]
  return 0
}

function buildResult(item, confidence, measurementsUsed, distances) {
  return {
    size: item.size,
    usa: item.usa,
    eu: item.eu,
    confidence,
    measurementsUsed,
    distances,
  }
}

function recommendWomen(table, bust, waist) {
  const exact = table.filter(
    (item) => isWithinRange(bust, item.bust) && isWithinRange(waist, item.waist),
  )

  if (exact.length === 1) {
    return buildResult(exact[0], 'exact', WOMEN_MEASUREMENTS, { bust: 0, waist: 0 })
  }

  if (exact.length > 1) {
    // Política de empate no definida en el documento; elegimos el menor desvío.
    const best = exact
      .map((item) => ({
        item,
        distance:
          distanceToRange(bust, item.bust) + distanceToRange(waist, item.waist),
      }))
      .sort((a, b) => a.distance - b.distance)[0].item

    return buildResult(best, 'exact', WOMEN_MEASUREMENTS, { bust: 0, waist: 0 })
  }

  const closest = table
    .map((item) => ({
      item,
      distance:
        distanceToRange(bust, item.bust) + distanceToRange(waist, item.waist),
    }))
    .sort((a, b) => a.distance - b.distance)[0]

  return buildResult(closest.item, 'closest', WOMEN_MEASUREMENTS, {
    bust: distanceToRange(bust, closest.item.bust),
    waist: distanceToRange(waist, closest.item.waist),
  })
}

function recommendMen(table, waist, hip) {
  const exact = table.filter(
    (item) => isWithinRange(waist, item.waist) && isWithinRange(hip, item.hip),
  )

  if (exact.length === 1) {
    return buildResult(exact[0], 'exact', MEN_MEASUREMENTS, { waist: 0, hip: 0 })
  }

  if (exact.length > 1) {
    // Límite compartido: elegir el talle mayor para un ajuste más cómodo.
    const chosen = exact[exact.length - 1]
    return buildResult(chosen, 'exact', MEN_MEASUREMENTS, { waist: 0, hip: 0 })
  }

  const closest = table
    .map((item) => ({
      item,
      waistDistance: distanceToRange(waist, item.waist),
      hipDistance: distanceToRange(hip, item.hip),
    }))
    .sort((a, b) => {
      if (a.waistDistance !== b.waistDistance) {
        return a.waistDistance - b.waistDistance
      }
      return a.hipDistance - b.hipDistance
    })[0]

  return buildResult(closest.item, 'closest', MEN_MEASUREMENTS, {
    waist: closest.waistDistance,
    hip: closest.hipDistance,
  })
}

// height y torso se reciben pero no se usan en el cálculo (ver doc, sección 1).
export function recommendSize({ sex, product, waist, hip, bust }) {
  const table = TABLES[product]
  if (!table) {
    throw new Error(`Tabla no encontrada para el producto: ${product}`)
  }

  return sex === 'woman'
    ? recommendWomen(table, bust, waist)
    : recommendMen(table, waist, hip)
}
