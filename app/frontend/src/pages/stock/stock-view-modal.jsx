import {
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { Sparkline } from '@mantine/charts'
import { IconFlame, IconX } from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'
import {
  getColorLabelKey,
  getModelLabelKey,
} from '../../features/stock/stock-options.js'

function Field({ label, children }) {
  return (
    <Stack gap={2}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm">{children}</Text>
    </Stack>
  )
}

export function StockViewModal({ item, onClose }) {
  const { t } = useI18n()

  return (
    <Modal
      opened={Boolean(item)}
      onClose={onClose}
      title={t('stock.view')}
      centered
      size="lg"
    >
      {item && (
        <Stack gap="lg">
          <Group gap="xs">
            {item.trending && (
              <Badge
                variant="light"
                color="orange"
                leftSection={<IconFlame size={12} />}
              >
                {t('stock.trending')}
              </Badge>
            )}
            {item.kid ? (
              <Badge variant="light" color="blue">
                {t('stock.kid.true')}
              </Badge>
            ) : (
              <Badge variant="light" color="gray">
                {t('stock.adult')}
              </Badge>
            )}
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2 }}>
            <Field label={t('stock.form.barcode')}>{item.barcode || '—'}</Field>
            <Field label={t('stock.form.model')}>
              {t(getModelLabelKey(item.model))}
            </Field>
            <Field label={t('stock.form.size')}>{item.size}</Field>
            <Field label={t('stock.form.color')}>
              {t(getColorLabelKey(item.color))}
            </Field>
            <Field label={t('stock.form.minStock')}>{item.minStock}</Field>
            <Field label={t('stock.form.quantity')}>{item.quantity}</Field>
            <Field label={t('stock.form.name')}>{item.name || '—'}</Field>
          </SimpleGrid>

          <Field label={t('stock.form.description')}>
            {item.description || '—'}
          </Field>

          <Divider />

          <Stack gap="sm">
            <Text fw={600}>{t('stock.stats.title')}</Text>
            <Field label={t('stock.stats.salesLastMonth')}>
              {item.salesLastMonth}
            </Field>
            <Stack gap={4}>
              <Text size="xs" c="dimmed">
                {t('stock.stats.salesSeries')}
              </Text>
              <Sparkline
                w={240}
                h={56}
                data={item.salesSeries}
                color="blue.6"
                fillOpacity={0.3}
                strokeWidth={1.5}
                curveType="linear"
              />
            </Stack>
            <Stack gap={4}>
              <Text size="xs" c="dimmed">
                {t('stock.stats.stockSeries')}
              </Text>
              <Sparkline
                w={240}
                h={56}
                data={item.stockSeries}
                color="teal.6"
                fillOpacity={0.3}
                strokeWidth={1.5}
                curveType="linear"
              />
            </Stack>
          </Stack>

          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={onClose}
              leftSection={<IconX size={16} />}
            >
              {t('stock.close')}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  )
}
