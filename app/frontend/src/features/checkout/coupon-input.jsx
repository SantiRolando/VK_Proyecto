import { useMyCoupons } from '@features/account/hooks/use-rewards.js'
import { useI18n } from '@i18n/context.js'
import { Badge, Button, Group, Stack, Text, TextInput } from '@mantine/core'
import { useState } from 'react'

// Cupón opcional del checkout (Q-07). El descuento lo calcula el mock
// (`/coupons/validate`): acá solo se pide el código y se muestra el
// resultado, que viene formateado por el idioma activo. Los cupones propios
// (canjeados en US6) se ofrecen como atajo.
export function CouponInput({ applied, invalid, isLoading, onApply, onRemove }) {
  const { t, formatCurrency } = useI18n()
  const [code, setCode] = useState('')
  const mine = useMyCoupons()

  if (applied) {
    return (
      <Group justify="space-between" gap="sm">
        <Badge variant="light" color="teal">
          {t('checkout.coupon.applied', {
            code: applied.code,
            discount: formatCurrency(applied.discount),
          })}
        </Badge>
        <Button variant="subtle" size="xs" color="gray" onClick={onRemove}>
          {t('checkout.coupon.remove')}
        </Button>
      </Group>
    )
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    onApply(trimmed)
  }

  const suggestions = mine.data ?? []

  return (
    <Stack gap="xs">
      <form onSubmit={handleSubmit} noValidate>
        <Group align="flex-end" gap="xs" wrap="nowrap">
          <TextInput
            style={{ flex: 1 }}
            label={t('checkout.coupon.label')}
            placeholder={t('checkout.coupon.placeholder')}
            value={code}
            onChange={(event) => setCode(event.currentTarget.value)}
            error={invalid ? t('errors.COUPON_INVALID') : null}
          />
          <Button type="submit" variant="light" loading={isLoading}>
            {t('checkout.coupon.apply')}
          </Button>
        </Group>
      </form>

      {suggestions.length > 0 && (
        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            {t('checkout.coupon.mine')}
          </Text>
          <Group gap="xs">
            {suggestions.map((coupon) => (
              <Button
                key={coupon.id}
                variant="light"
                size="compact-xs"
                onClick={() => onApply(coupon.code)}
              >
                {coupon.code}
              </Button>
            ))}
          </Group>
        </Stack>
      )}
    </Stack>
  )
}
