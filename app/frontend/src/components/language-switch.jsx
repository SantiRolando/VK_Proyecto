import { useI18n } from '@i18n/context.js'
import { SegmentedControl } from '@mantine/core'

const LANGUAGES = [
  { value: 'es', label: 'ES' },
  { value: 'en', label: 'EN' },
]

/*
  Los idiomas van en un `SegmentedControl`: se lee igual sobre el header negro de la landing y
  sobre los claros de la app, y aporta el rol de radiogroup a los lectores de pantalla.
*/
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
