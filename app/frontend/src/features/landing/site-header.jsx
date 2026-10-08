import { LanguageSwitch } from '@components/language-switch.jsx'
import { ThemePicker } from '@components/theme-picker.jsx'
import { SECTION_IDS } from '@features/landing/section-ids.js'
import { useI18n } from '@i18n/context.js'
import { Text } from '@mantine/core'
import { IconBuildingStore, IconInfoCircle, IconSparkles } from '@tabler/icons-react'
import { useLenis } from 'lenis/react'

const NAV_LINKS = [
  { key: 'nav.how', target: SECTION_IDS.how, icon: IconInfoCircle },
  { key: 'nav.benefits', target: SECTION_IDS.benefits, icon: IconSparkles },
  { key: 'nav.store', target: SECTION_IDS.store, icon: IconBuildingStore },
]

export function SiteHeader() {
  const lenis = useLenis()
  const { t } = useI18n()

  // `Lenis` resuelve el destino por selector, así que necesita el `#`; el id pelado es el que
  // comparten el header y las secciones.
  const handleNavClick = (event, target) => {
    event.preventDefault()
    lenis?.scrollTo(`#${target}`, { offset: -64, duration: 1.4 })
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-800 bg-black px-4 sm:px-6">
      <Text c="white" fw={700}>
        {t('app.name')}
      </Text>

      <nav className="flex gap-4 sm:gap-6">
        {NAV_LINKS.map((link) => {
          const Icon = link.icon
          return (
            <a
              key={link.target}
              href={`#${link.target}`}
              aria-label={t(link.key)}
              onClick={(event) => handleNavClick(event, link.target)}
              className="flex items-center gap-2 p-2 -m-2 text-gray-400 transition-colors hover:text-white"
            >
              <Icon size={20} stroke={1.5} />
              <span className="hidden md:inline">{t(link.key)}</span>
            </a>
          )
        })}
      </nav>

      <div className="flex items-center gap-2">
        {/*
          En un teléfono no entran los dos controles: a 320 px quedan 78 px libres y el
          selector de tema pide unos 95, así que se muestra desde `sm` y hasta entonces el
          esquema lo decide el sistema.
        */}
        <div className="hidden sm:block">
          <ThemePicker />
        </div>
        <LanguageSwitch />
      </div>
    </header>
  )
}
