// Seed: tabla SIZE (talles y rangos por línea y público), copia de la tabla de
// referencia del backend (`V2__seed_reference_data.sql`) con los mismos ids y
// el mismo orden, así un `sizeId` vale igual en modo mock e híbrido.
//   - Endurance/Soft adulto: busto + cintura (mismos rangos, etiquetas Soft
//     corridas un paso).
//   - Jammer/Sunga adulto: cintura + cadera.
//   - Jammer/Sunga niños: cintura + cadera puntuales (min = max), edad orientativa.
//   - Endurance niñas: solo edad.

let nextId = 1

function size(line, audience, code, sortOrder, ranges = {}) {
  const { bust, waist, hip, age } = ranges
  return {
    id: nextId++,
    line,
    audience,
    code,
    sortOrder,
    bustMin: bust?.[0] ?? null,
    bustMax: bust?.[1] ?? null,
    waistMin: waist?.[0] ?? null,
    waistMax: waist?.[1] ?? null,
    hipMin: hip?.[0] ?? null,
    hipMax: hip?.[1] ?? null,
    heightMin: null,
    heightMax: null,
    torsoMin: null,
    torsoMax: null,
    ageMin: age?.[0] ?? null,
    ageMax: age?.[1] ?? null,
  }
}

const WOMEN_ROWS = [
  { bust: [74.9, 78.7], waist: [63.5, 64.77] },
  { bust: [78.8, 82.55], waist: [64.7, 66.0] },
  { bust: [83.8, 87.6], waist: [66.0, 69.8] },
  { bust: [88.9, 92.71], waist: [71.12, 74.93] },
  { bust: [93.98, 99.06], waist: [76.2, 80.01] },
  { bust: [99.06, 104.14], waist: [81.28, 85.09] },
  { bust: [104.14, 107.95], waist: [83.8, 88.9] },
]

const MEN_ROWS = [
  { waist: [75, 80], hip: [80, 85] },
  { waist: [80, 85], hip: [85, 90] },
  { waist: [85, 90], hip: [90, 95] },
  { waist: [90, 95], hip: [95, 100] },
  { waist: [95, 100], hip: [100, 105] },
  { waist: [100, 105], hip: [105, 110] },
]

const BOYS_ROWS = [
  { code: '8', waist: [59, 59], hip: [70, 70], age: [8, 9] },
  { code: '10', waist: [63, 63], hip: [75, 75], age: [10, 11] },
  { code: '12', waist: [67, 67], hip: [80, 80], age: [12, 13] },
]

const GIRLS_ROWS = [
  { code: 'S', age: [5, 6] },
  { code: 'M', age: [7, 8] },
  { code: 'L', age: [9, 10] },
  { code: 'XL', age: [11, 12] },
]

const ENDURANCE_CODES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
const SOFT_CODES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL']
const MEN_CODES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export function buildSizes() {
  nextId = 1
  const sizes = []

  WOMEN_ROWS.forEach((row, index) => {
    sizes.push(size('Endurance', 'Adult', ENDURANCE_CODES[index], index + 1, row))
  })
  WOMEN_ROWS.forEach((row, index) => {
    sizes.push(size('Soft', 'Adult', SOFT_CODES[index], index + 1, row))
  })
  for (const line of ['Jammer', 'Sunga']) {
    MEN_ROWS.forEach((row, index) => {
      sizes.push(size(line, 'Adult', MEN_CODES[index], index + 1, row))
    })
  }
  for (const line of ['Jammer', 'Sunga']) {
    BOYS_ROWS.forEach((row, index) => {
      sizes.push(size(line, 'Kids', row.code, index + 1, row))
    })
  }
  GIRLS_ROWS.forEach((row, index) => {
    sizes.push(size('Endurance', 'Kids', row.code, index + 1, row))
  })

  return sizes
}
