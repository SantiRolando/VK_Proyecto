import { ErrorState } from '@components/feedback/error-state.jsx'
import { Money } from '@components/money.jsx'
import { OrderSummary } from '@components/order-summary.jsx'
import { colorHex, colorLabel } from '@constants/colors.js'
import { CouponInput } from '@features/checkout/coupon-input.jsx'
import { useI18n } from '@i18n/context.js'
import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  NumberInput,
  Stack,
  Text,
} from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'

/*
  Paso 3 del checkout: línea elegida, cupón opcional y totales. El
  conflicto de stock se muestra acá sin perder la selección.
*/
export function SummaryStep({
  line,
  totals,
  onQuantityChange,
  coupon,
  conflict,
  submitError,
  onRetry,
  onBackToProduct,
}) {
  const { t } = useI18n()

  return (
    <Stack gap="md">
      <Card withBorder radius="md" padding="md">
        <Stack gap="sm">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <div>
              <Text fw={600}>{line.product?.model}</Text>
              <Group gap="xs" mt={4}>
                <Badge variant="light" color="green">
                  {t(`enums.line.${line.product?.line}`)}
                </Badge>
                {line.size?.code && (
                  <Badge variant="outline" color="gray">
                    {t('catalog.size')} {line.size.code}
                  </Badge>
                )}
                <Badge
                  variant="dot"
                  color="gray"
                  leftSection={
                    <span
                      style={{
                        backgroundColor: colorHex(line.color),
                        borderRadius: 999,
                        display: 'inline-block',
                        height: 10,
                        width: 10,
                      }}
                    />
                  }
                >
                  {colorLabel(line.color)}
                </Badge>
              </Group>
            </div>
            <Text fw={600}>
              <Money value={line.unitPrice} />
            </Text>
          </Group>

          <NumberInput
            label={t('checkout.summary.quantity')}
            description={t('checkout.summary.available', { count: line.available })}
            value={line.quantity}
            onChange={(value) => onQuantityChange(Number(value) || 1)}
            min={1}
            max={Math.max(line.available, 1)}
          />
        </Stack>
      </Card>

      {conflict && (
        <Alert
          variant="light"
          color="orange"
          icon={<IconAlertTriangle size={18} />}
          title={t('errors.STOCK_INSUFFICIENT')}
        >
          <Stack gap="xs">
            <Text size="sm">{t('checkout.stock.body')}</Text>
            <Text size="sm" fw={600}>
              {t('checkout.stock.available', {
                count: conflict.details?.available ?? line.available,
              })}
            </Text>
            <Group gap="xs">
              <Button size="sm" variant="light" onClick={onRetry}>
                {t('common.retry')}
              </Button>
              <Button size="sm" variant="subtle" onClick={onBackToProduct}>
                {t('checkout.stock.chooseOther')}
              </Button>
            </Group>
          </Stack>
        </Alert>
      )}

      <OrderSummary
        lines={[line]}
        subtotal={totals.subtotal}
        discount={totals.discount}
        total={totals.total}
      />

      <CouponInput {...coupon} />

      {submitError && <ErrorState error={submitError} />}
    </Stack>
  )
}
