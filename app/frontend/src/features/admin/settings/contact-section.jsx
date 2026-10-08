import { SurfaceCard } from '@components/surface-card.jsx'
import { useI18n } from '@i18n/context.js'
import { SimpleGrid, TextInput } from '@mantine/core'
import { IconAddressBook } from '@tabler/icons-react'

export function ContactSection({ values, errors, onChange }) {
  const { t } = useI18n()

  return (
    <SurfaceCard
      titleSectionVariant="top"
      icon={IconAddressBook}
      title={t('admin.settings.contact')}
      description={t('admin.settings.contactDescription')}
    >
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput
          label={t('admin.settings.form.coordinationEmail')}
          type="email"
          value={values.coordinationEmail}
          error={errors.coordinationEmail}
          onChange={(event) => onChange({ coordinationEmail: event.currentTarget.value })}
        />
        <TextInput
          label={t('admin.settings.form.coordinationWhatsapp')}
          value={values.coordinationWhatsapp}
          error={errors.coordinationWhatsapp}
          onChange={(event) =>
            onChange({ coordinationWhatsapp: event.currentTarget.value })
          }
        />
      </SimpleGrid>
    </SurfaceCard>
  )
}
