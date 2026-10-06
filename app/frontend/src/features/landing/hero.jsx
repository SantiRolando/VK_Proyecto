import heroImage from '@assets/indoor-swimming-pool.jpg'
import { useI18n } from '@i18n/context.js'
import { Text, Title } from '@mantine/core'

export function Hero() {
  const { t } = useI18n()

  return (
    <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center gap-8 overflow-hidden bg-black px-4 text-center">
      <img
        src={heroImage}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-50"
      />
      <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/40 to-black" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <Title order={1} c="white" fw={900} className="text-5xl md:text-7xl">
          {t('hero.title')}
        </Title>
        <Text c="gray.3" size="lg" maw={560}>
          {t('hero.subtitle')}
        </Text>
      </div>
    </section>
  )
}
