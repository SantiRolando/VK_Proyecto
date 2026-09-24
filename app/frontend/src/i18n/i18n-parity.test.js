import { describe, expect, it } from 'vitest'
import en from './locales/en.js'
import es from './locales/es.js'

describe('i18n', () => {
  it('tiene paridad de claves entre es y en', () => {
    const esKeys = Object.keys(es).sort()
    const enKeys = Object.keys(en).sort()
    expect(esKeys).toEqual(enKeys)
  })

  it('no tiene claves vacías', () => {
    for (const [locale, messages] of [['es', es], ['en', en]]) {
      for (const [key, value] of Object.entries(messages)) {
        expect(value, `${locale}.${key}`).toBeTruthy()
      }
    }
  })
})
