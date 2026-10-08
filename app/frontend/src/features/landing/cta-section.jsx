import { routes } from '@app/routes.js'
import { useI18n } from '@i18n/context.js'
import { Button, Text, Title } from '@mantine/core'
import { IconLogin, IconPlayerPlay } from '@tabler/icons-react'
import { useNavigate } from 'react-router'

export function CtaSection() {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center gap-6 bg-black px-4 py-24 text-center">
      <Title order={2} c="white">
        {t('cta.title')}
      </Title>
      <Text c="gray.4" maw={520}>
        {t('cta.subtitle')}
      </Text>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row">
        <Button
          variant="white"
          size="lg"
          className="transition-colors hover:bg-gray-200!"
          rightSection={<IconPlayerPlay size={18} />}
          onClick={() => navigate(routes.fit({ src: 'landing' }))}
        >
          {t('cta.guest')}
        </Button>
        <Button
          size="lg"
          rightSection={<IconLogin size={18} />}
          onClick={() => navigate(routes.login)}
        >
          {t('cta.login')}
        </Button>
      </div>
    </section>
  )
}
