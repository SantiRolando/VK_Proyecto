import { ActionIcon, Button, Group, NumberInput, Select, Stack, Text } from '@mantine/core'
import { IconPlus, IconTrash } from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'

// Editor de líneas (de factura) reutilizable.
// `lines` es un array de { productId, quantity }; `productOptions` es el
// listado de productos disponibles y `error` un mensaje opcional a mostrar.

export function TransactionLinesEditor({ lines, onChange, productOptions, error }) {
  const { t } = useI18n()

  const updateLine = (index, field, value) => {
    onChange(lines.map((line, i) => (i === index ? { ...line, [field]: value } : line)))
  }

  const removeLine = (index) => {
    onChange(lines.filter((_, i) => i !== index))
  }

  const addLine = () => {
    onChange([...lines, { productId: null, quantity: '' }])
  }

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>
        {t('transactions.form.lines')}
      </Text>

      {lines.map((line, index) => (
        <Group key={index} gap="xs" wrap="nowrap" align="flex-start">
          <Select
            style={{ flex: 1 }}
            placeholder={t('transactions.form.product')}
            data={productOptions}
            value={line.productId == null ? null : String(line.productId)}
            onChange={(value) =>
              updateLine(index, 'productId', value == null ? null : Number(value))
            }
            searchable
          />
          <NumberInput
            style={{ width: 96 }}
            placeholder={t('transactions.form.quantity')}
            value={line.quantity}
            onChange={(value) => updateLine(index, 'quantity', value)}
            min={1}
          />
          <ActionIcon
            variant="subtle"
            color="red"
            aria-label={t('transactions.form.removeLine')}
            onClick={() => removeLine(index)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}

      <Button
        variant="default"
        size="xs"
        leftSection={<IconPlus size={14} />}
        onClick={addLine}
        w="fit-content"
      >
        {t('transactions.form.addLine')}
      </Button>

      {error && (
        <Text size="xs" c="red">
          {error}
        </Text>
      )}
    </Stack>
  )
}
