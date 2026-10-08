import { useI18n } from '@i18n/context.js'
import { SegmentedControl } from '@mantine/core'

const LANGUAGES = [
  { value: 'es', label: 'ES' },
  { value: 'en', label: 'EN' },
]

/*
  Los idiomas van en un `SegmentedControl` y no en un `Select`: el control se lee igual sobre
  el header negro de la landing y sobre los headers claros de la app, y aporta el rol de
  radiogroup y el idioma seleccionado para los lectores de pantalla. Las etiquetas no se
  traducen: el nombre de un idioma se escribe en ese idioma.
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
