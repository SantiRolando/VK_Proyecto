import { useI18n } from '../i18n/context.js'

const LANGUAGES = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
]

export function LanguageSwitch() {
  const { language, setLanguage } = useI18n()

  return (
    <div className="flex gap-2">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLanguage(code)}
          className={`rounded px-2 py-1 text-sm transition-colors ${
            language === code
              ? 'text-white'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
