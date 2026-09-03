import { Text } from '@mantine/core'
import { useLenis } from 'lenis/react'
import {
  IconBuildingStore,
  IconInfoCircle,
  IconSparkles,
} from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'
import { LanguageSwitch } from '../../components/language-switch.jsx'

const NAV_LINKS = [
  { key: 'nav.how', target: '#how', icon: IconInfoCircle },
  { key: 'nav.benefits', target: '#benefits', icon: IconSparkles },
  { key: 'nav.store', target: '#store', icon: IconBuildingStore },
]

export function SiteHeader() {
  const lenis = useLenis()
  const { t } = useI18n()

  const handleNavClick = (event, target) => {
    event.preventDefault()
    lenis?.scrollTo(target, { offset: -64, duration: 1.4 })
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
              href={link.target}
              aria-label={t(link.key)}
              onClick={(event) => handleNavClick(event, link.target)}
              className="flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
            >
              <Icon size={20} stroke={1.5} />
              <span className="hidden md:inline">{t(link.key)}</span>
            </a>
          )
        })}
      </nav>

      <LanguageSwitch />
    </header>
  )
}
