import { InsetCard } from '@components/surface-card.jsx'
import { clampToField } from '@features/admin/settings/settings-fields.js'
import { useI18n } from '@i18n/context.js'
import { ActionIcon, Group, NumberInput, Stack, Text } from '@mantine/core'
import { IconMinus, IconPlus } from '@tabler/icons-react'

/*
  Un ajuste numérico con su propio control: botones grandes para mover la aguja de a poco y
  campo editable para cuando se sabe el número exacto.
*/
export function SettingStepper({ field, value, error, onChange }) {
  const { t } = useI18n()
  const label = t(`admin.settings.form.${field.name}`)
  const set = (next) => onChange(clampToField(field, next))

  return (
    <InsetCard>
      <Stack gap="sm">
        <div>
          <Text fw={600}>{label}</Text>
          <Text c="dimmed" size="sm" mt={4}>
            {t(`admin.settings.form.${field.name}Hint`)}
          </Text>
        </div>

        <Group gap="xs" align="center" wrap="nowrap">
          <ActionIcon
            size={44}
            radius="md"
            variant="default"
            disabled={value <= field.min}
            aria-label={`${t('admin.settings.form.decrease')}: ${label}`}
            onClick={() => set(value - field.step)}
          >
            <IconMinus size={20} stroke={1.8} />
          </ActionIcon>

          <NumberInput
            value={value}
            onChange={set}
            error={error}
            min={field.min}
            max={field.max}
            step={field.step}
            allowDecimal={false}
            hideControls
            suffix={field.unit ? ` ${field.unit}` : undefined}
            aria-label={label}
            style={{ flex: 1 }}
            styles={{ input: { textAlign: 'center', fontWeight: 700, height: 48 } }}
          />

          <ActionIcon
            size={44}
            radius="md"
            variant="default"
            disabled={value >= field.max}
            aria-label={`${t('admin.settings.form.increase')}: ${label}`}
            onClick={() => set(value + field.step)}
          >
            <IconPlus size={20} stroke={1.8} />
          </ActionIcon>
        </Group>
      </Stack>
    </InsetCard>
  )
}
