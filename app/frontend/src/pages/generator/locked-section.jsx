import { Button, Text } from '@mantine/core'
import { IconLock } from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'

export function LockedSection({ title, children }) {
  const { t } = useI18n()

  return (
    <section className="relative mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="text-lg font-semibold text-black">{title}</h2>

      <div
        className="pointer-events-none mt-4 select-none blur-sm"
        aria-hidden="true"
      >
        {children}
      </div>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 text-center">
        <IconLock size={32} stroke={1.5} className="text-white" />
        <Text c="white" fw={500}>
          {t('locked.title')}
        </Text>
        <Button variant="white" size="sm">
          {t('locked.cta')}
        </Button>
      </div>
    </section>
  )
}
