import { Money } from '@components/money.jsx'
import { colorLabel } from '@constants/colors.js'
import { useI18n } from '@i18n/context.js'
import { Divider, Group, Stack, Table, Text } from '@mantine/core'

/*
  Resumen del pedido: una `Table` con el detalle de líneas. Lo comparten el checkout
  (selección local), la confirmación y el detalle de venta del admin: todas
  usan la misma forma de línea.
*/

function lineSubtitle(line, t) {
  const size = line.size?.code
  return [size && `${t('catalog.size')} ${size}`, colorLabel(line.color)]
    .filter(Boolean)
    .join(' · ')
}

export function OrderSummary({ lines, subtotal, discount, total }) {
  const { t } = useI18n()

  return (
    <Stack gap="sm">
      <Table.ScrollContainer minWidth={320}>
        <Table withRowBorders={false} verticalSpacing="xs">
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('checkout.summary.product')}</Table.Th>
              <Table.Th ta="center">{t('checkout.summary.quantity')}</Table.Th>
              <Table.Th ta="right">{t('checkout.summary.lineTotal')}</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {lines.map((line) => (
              <Table.Tr key={line.variantId}>
                <Table.Td>
                  <Text size="sm" fw={600}>
                    {line.product?.model}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {lineSubtitle(line, t)}
                  </Text>
                </Table.Td>
                <Table.Td ta="center">
                  <Text size="sm">{line.quantity}</Text>
                </Table.Td>
                <Table.Td ta="right">
                  <Text size="sm">
                    <Money value={line.lineTotal} />
                  </Text>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>

      <Divider />

      <Stack gap={4}>
        <Group justify="space-between" gap="sm">
          <Text size="sm" c="dimmed">
            {t('checkout.summary.subtotal')}
          </Text>
          <Text size="sm">
            <Money value={subtotal} />
          </Text>
        </Group>

        {discount > 0 && (
          <Group justify="space-between" gap="sm">
            <Text size="sm" c="dimmed">
              {t('checkout.summary.discount')}
            </Text>
            <Text size="sm" c="teal">
              -<Money value={discount} />
            </Text>
          </Group>
        )}

        <Group justify="space-between" gap="sm">
          <Text fw={600}>{t('checkout.summary.total')}</Text>
          <Text fw={600}>
            <Money value={total} />
          </Text>
        </Group>
      </Stack>
    </Stack>
  )
}
