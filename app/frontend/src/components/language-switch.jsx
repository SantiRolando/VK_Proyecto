import { useI18n } from '@i18n/context.js'
import { SegmentedControl } from '@mantine/core'

// Mismo ancho y contraste en cualquier superficie (header oscuro de la landing
// y headers claros de la app); `SegmentedControl` aporta el rol de radiogroup y
// el estado seleccionado para lectores de pantalla (T103).
const LANGUAGES = [
  { value: 'es', label: 'ES' },
  { value: 'en', label: 'EN' },
]

export function LanguageSwitch() {
  const { language, setLanguage, t } = useI18n()

  return (
    <SegmentedControl
      size="xs"
      value={language}
      onChange={setLanguage}
      data={LANGUAGES}
      aria-label={t('nav.language')}
    />
  )
}
