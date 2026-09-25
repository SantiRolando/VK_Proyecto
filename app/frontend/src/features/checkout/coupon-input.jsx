import { useState } from 'react'
import { Badge, Button, Group, TextInput } from '@mantine/core'
import { useI18n } from '../../i18n/context.js'

// Cupón opcional del checkout (Q-07). El descuento lo calcula el mock
// (`/coupons/validate`): acá solo se pide el código y se muestra el
// resultado, que viene formateado por el idioma activo.
export function CouponInput({ applied, invalid, isLoading, onApply, onRemove }) {
  const { t, formatCurrency } = useI18n()
  const [code, setCode] = useState('')

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

  return (
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
  )
}
