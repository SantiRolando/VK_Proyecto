import { useMemo, useState } from 'react'
import { I18nContext } from './context.js'
import en from './locales/en.js'
import es from './locales/es.js'

const messages = { en, es }

export function I18nProvider({ children, defaultLanguage = 'es' }) {
  const [language, setLanguage] = useState(defaultLanguage)

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key) => messages[language]?.[key] ?? key,
    }),
    [language],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
