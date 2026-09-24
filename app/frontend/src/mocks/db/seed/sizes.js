// Seed: tabla SIZE (talles y rangos por línea) del ER nuevo.
// Los rangos provienen de `agents/context/recommendation-engine.txt` (tablas
// oficiales, estado "Cerrado"):
//   - Endurance/Soft (mujer): busto + cintura.
//   - Jammer/Sunga (hombre): cintura + cadera.
//   - Kids (varones): cintura + cadera aproximadas (±2 cm sobre los valores
//     puntuales de la tabla oficial) — ver nota abajo.
//   - Kids (niñas): solo edad (S/M/L/XL), sin medidas — pendiente de
//     confirmación con Vikinga.
// height/torso quedan en null: los umbrales de torso por talle están
// pendientes de definición (engine, "Puntos pendientes de especificación").

let nextId = 1
function size(line, code, sortOrder, { bust, waist, hip }) {
  return {
    id: nextId++,
    line,
    code,
    sortOrder,
    heightMin: null,
    heightMax: null,
    bustMin: bust?.[0] ?? null,
    bustMax: bust?.[1] ?? null,
    waistMin: waist?.[0] ?? null,
    waistMax: waist?.[1] ?? null,
    hipMin: hip?.[0] ?? null,
    hipMax: hip?.[1] ?? null,
    torsoMin: null,
    torsoMax: null,
  }
}

// Índice → rangos (busto, cintura) de la tabla femenina oficial.
const WOMEN_ROWS = [
  { bust: [74.9, 78.7], waist: [63.5, 64.77] },
  { bust: [78.8, 82.55], waist: [64.7, 66.0] },
  { bust: [83.8, 87.6], waist: [66.0, 69.8] },
  { bust: [88.9, 92.71], waist: [71.12, 74.93] },
  { bust: [93.98, 99.06], waist: [76.2, 80.01] },
  { bust: [99.06, 104.14], waist: [81.28, 85.09] },
  { bust: [104.14, 107.95], waist: [83.8, 88.9] },
]

// Índice → rangos (cintura, cadera) de la tabla masculina adulta oficial.
const MEN_ROWS = [
  { waist: [75, 80], hip: [80, 85] },
  { waist: [80, 85], hip: [85, 90] },
  { waist: [85, 90], hip: [90, 95] },
  { waist: [90, 95], hip: [95, 100] },
  { waist: [95, 100], hip: [100, 105] },
  { waist: [100, 105], hip: [105, 110] },
]

export function buildSizes() {
  const sizes = []

  WOMEN_ROWS.forEach((row, index) => {
    sizes.push(size('Endurance', ENDURANCE_CODES[index], index + 1, row))
    sizes.push(size('Soft', SOFT_CODES[index], index + 1, row))
  })

  MEN_ROWS.forEach((row, index) => {
    sizes.push(size('Jammer', MEN_CODES[index], index + 1, row))
    sizes.push(size('Sunga', MEN_CODES[index], index + 1, row))
  })

  // Kids varones: valores puntuales oficiales (cintura/cadera) con rangos
  // aproximados de ±2 cm. Talle 8: 59/70 · Talle 10: 63/75 · Talle 12: 67/80.
  const KIDS_BOYS = [
    { code: '8', waist: [57, 61], hip: [68, 72] },
    { code: '10', waist: [61, 65], hip: [73, 77] },
    { code: '12', waist: [65, 69], hip: [78, 82] },
  ]
  KIDS_BOYS.forEach((row, index) => {
    sizes.push(size('Kids', row.code, index + 1, row))
  })

  // Kids niñas: solo edad, sin medidas corporales (pendiente de aclaración).
  GIRLS_KIDS_CODES.forEach((code, index) => {
    sizes.push(
      size('Kids', code, KIDS_BOYS.length + index + 1, {
        bust: null,
        waist: null,
        hip: null,
      }),
    )
  })

  return sizes
}

const ENDURANCE_CODES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
const SOFT_CODES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']
const MEN_CODES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const GIRLS_KIDS_CODES = ['S', 'M', 'L', 'XL']
