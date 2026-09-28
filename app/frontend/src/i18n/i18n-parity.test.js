import en from '@i18n/locales/en.js'
import es from '@i18n/locales/es.js'
import { describe, expect, it } from 'vitest'

describe('i18n', () => {
  it('tiene paridad de claves entre es y en', () => {
    const esKeys = Object.keys(es).sort()
    const enKeys = Object.keys(en).sort()
    expect(esKeys).toEqual(enKeys)
  })

  it('no tiene claves vacías', () => {
    for (const [locale, messages] of [
      ['es', es],
      ['en', en],
    ]) {
      for (const [key, value] of Object.entries(messages)) {
        expect(value, `${locale}.${key}`).toBeTruthy()
      }
    }
  })
})
