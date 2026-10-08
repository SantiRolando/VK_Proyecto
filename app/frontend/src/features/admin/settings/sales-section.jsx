import { SurfaceCard } from '@components/surface-card.jsx'
import { clampToField, FIELD_BY_NAME } from '@features/admin/settings/settings-fields.js'
import { useI18n } from '@i18n/context.js'
import { NumberInput } from '@mantine/core'
import { IconReceipt } from '@tabler/icons-react'

const FIELD = FIELD_BY_NAME.staleSaleDays

// El control chico de Mantine alcanza acá: es un solo número y no se toca seguido.
export function SalesSection({ values, onChange }) {
  const { t } = useI18n()

  return (
    <SurfaceCard
      titleSectionVariant="top"
      icon={IconReceipt}
      title={t('admin.settings.sales')}
      description={t('admin.settings.salesDescription')}
    >
      <NumberInput
        label={t('admin.settings.form.staleSaleDays')}
        description={t('admin.settings.form.staleSaleDaysHint')}
        value={values.staleSaleDays}
        onChange={(value) => onChange({ staleSaleDays: clampToField(FIELD, value) })}
        min={FIELD.min}
        max={FIELD.max}
        step={FIELD.step}
        allowDecimal={false}
        maw={280}
      />
    </SurfaceCard>
  )
}
