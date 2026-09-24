// Paridad de claves i18n entre español e inglés (T011).
// Uso: npm run i18n:check — sale con código 1 si hay claves huérfanas.

import en from '../src/i18n/locales/en.js'
import es from '../src/i18n/locales/es.js'

const esKeys = Object.keys(es).sort()
const enKeys = Object.keys(en).sort()

const missingInEn = esKeys.filter((key) => !enKeys.includes(key))
const missingInEs = enKeys.filter((key) => !esKeys.includes(key))

const problems = [
  ...missingInEn.map((key) => `en: falta la clave ${key}`),
  ...missingInEs.map((key) => `es: falta la clave ${key}`),
]

if (problems.length > 0) {
  console.error('i18n: claves sin paridad es/en:')
  for (const problem of problems) console.error(`  - ${problem}`)
  process.exit(1)
}

console.log(`i18n OK: ${esKeys.length} claves con paridad en es y en`)
