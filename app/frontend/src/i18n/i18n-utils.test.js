import {
  detectBrowserLanguage,
  formatCurrencyValue,
  formatDateValue,
  formatNumberValue,
  interpolate,
  selectPluralForm,
  splitTemplate,
  translateKey,
} from '@i18n/i18n-utils.js'
import { describe, expect, it } from 'vitest'

const messages = {
  es: {
    'demo.hello': 'Hola {{name}}',
    'demo.points.one': '{{count}} punto',
    'demo.points.other': '{{count}} puntos',
    'demo.onlyEs': 'Solo español',
  },
  en: {
    'demo.hello': 'Hi {{name}}',
    'demo.points.one': '{{count}} point',
    'demo.points.other': '{{count}} points',
  },
}

describe('i18n utils', () => {
  it('interpola variables {{var}}', () => {
    expect(interpolate('Hola {{name}}', { name: 'Ana' })).toBe('Hola Ana')
    expect(interpolate('Hola {{name}}', {})).toBe('Hola {{name}}')
  })

  it('parte la plantilla en texto y parámetros, en orden', () => {
    expect(splitTemplate('Deja {{feedbacks}} y suma {{points}} puntos.')).toEqual([
      { text: 'Deja ' },
      { name: 'feedbacks' },
      { text: ' y suma ' },
      { name: 'points' },
      { text: ' puntos.' },
    ])

    // Sin parámetros queda un solo tramo de texto; con uno al borde, sin tramos vacíos.
    expect(splitTemplate('Sin parámetros')).toEqual([{ text: 'Sin parámetros' }])
    expect(splitTemplate('{{a}}{{b}}')).toEqual([{ name: 'a' }, { name: 'b' }])
    expect(splitTemplate('')).toEqual([])
  })

  it('selecciona la forma plural con Intl.PluralRules', () => {
    // CLDR moderno para es: `one` solo con n = 1 (21 lleva plural).
    expect(selectPluralForm('es', 1)).toBe('one')
    expect(selectPluralForm('es', 0)).toBe('other')
    expect(selectPluralForm('es', 21)).toBe('other')
    expect(selectPluralForm('en', 1)).toBe('one')
    expect(selectPluralForm('en', 2)).toBe('other')
  })

  it('traduce con plural según count y hace fallback a es', () => {
    expect(translateKey(messages, 'es', 'demo.points', { count: 1 })).toBe('1 punto')
    expect(translateKey(messages, 'es', 'demo.points', { count: 5 })).toBe('5 puntos')
    expect(translateKey(messages, 'en', 'demo.hello', { name: 'Ana' })).toBe('Hi Ana')
    // clave inexistente en el idioma → español; inexistente en ambos → la clave
    expect(translateKey(messages, 'en', 'demo.onlyEs')).toBe('Solo español')
    expect(translateKey(messages, 'en', 'missing.key')).toBe('missing.key')
  })

  it('formatea moneda en UYU según el idioma', () => {
    const es = formatCurrencyValue('es', 1290)
    const en = formatCurrencyValue('en', 1290)
    expect(es).toContain('1.290')
    expect(en).toContain('1,290')
    expect(es).toContain('$')
  })

  it('formatea números y fechas con la locale correcta', () => {
    // es-UY: punto para miles, coma decimal.
    expect(formatNumberValue('es', 1234.5, { maximumFractionDigits: 1 })).toBe('1.234,5')
    const date = new Date('2026-09-23T14:10:00Z')
    const formatted = formatDateValue('es', date, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    expect(formatted).toContain('2026')
  })

  it('detecta el idioma del navegador (es-* → es, resto → en)', () => {
    const original = navigator.language
    try {
      Object.defineProperty(navigator, 'language', { value: 'es-UY', configurable: true })
      expect(detectBrowserLanguage()).toBe('es')
      Object.defineProperty(navigator, 'language', { value: 'en-US', configurable: true })
      expect(detectBrowserLanguage()).toBe('en')
    } finally {
      Object.defineProperty(navigator, 'language', {
        value: original,
        configurable: true,
      })
    }
  })
})
