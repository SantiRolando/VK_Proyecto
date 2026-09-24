// Provider de i18n (T009): idioma por defecto `es` (Uruguay), detección
// inicial por navegador y persistencia en localStorage. Expone `t` con
// interpolación `{{var}}` y plurales (`key.one` / `key.other` según
// `Intl.PluralRules`) más los formateadores `formatNumber/Date/Currency`.

import { useMemo, useState } from 'react'
import { I18nContext } from './context.js'
import en from './locales/en.js'
import es from './locales/es.js'
import {
  detectBrowserLanguage,
  formatCurrencyValue,
  formatDateValue,
  formatNumberValue,
  translateKey,
} from './i18n-utils.js'

const messages = { en, es }
const STORAGE_KEY = 'vkfit.language'

function readStoredLanguage() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === 'es' || stored === 'en') return stored
  } catch {
    // ignorar
  }
  return null
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(
    () => readStoredLanguage() ?? detectBrowserLanguage(),
  )

  const value = useMemo(() => {
    const setLanguage = (next) => {
      setLanguageState(next)
      try {
        window.localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // ignorar
      }
    }

    return {
      language,
      setLanguage,
      t: (key, params) => translateKey(messages, language, key, params),
      formatNumber: (value, options) => formatNumberValue(language, value, options),
      formatDate: (value, options) => formatDateValue(language, value, options),
      formatCurrency: (value) => formatCurrencyValue(language, value),
    }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
