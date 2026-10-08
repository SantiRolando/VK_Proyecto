import { DateTime } from '@components/date-time.jsx'
import { Money } from '@components/money.jsx'
import { ResponsiveList } from '@components/responsive-list.jsx'
import { fixedDiscountAmount } from '@features/admin/coupons/coupon-rules.js'
import { useI18n } from '@i18n/context.js'
import { Badge, Button, Group, Text } from '@mantine/core'
import { IconEdit } from '@tabler/icons-react'

// Código y usos de la plantilla: encabezado de la card y primera columna de la tabla.
function CouponIdentity({ coupon }) {
  const { t } = useI18n()

  return (
    <div>
      <Text fw={600} size="sm">
        {coupon.code}
      </Text>
      <Text size="xs" c="dimmed">
        {coupon.maxUses === null
          ? t('admin.coupons.usage', { count: coupon.usageCount })
          : t('admin.coupons.usageLimited', {
              count: coupon.usageCount,
              limit: coupon.maxUses,
            })}
      </Text>
    </div>
  )
}

function DiscountCell({ coupon }) {
  const { t, formatCurrency } = useI18n()
  // En los de monto fijo la lista muestra el descuento que el cupón concede de verdad: con el
  // tope aplicado, que es lo que recibe el cliente.
  const amount = fixedDiscountAmount(coupon)
  if (amount !== null) {
    return (
      <Text size="sm">
        -<Money value={amount} />
      </Text>
    )
  }

  /*
    En los porcentuales el tope es un límite aparte que el porcentaje no deja ver: va como
    segunda línea.
  */
  return (
    <div>
      <Text size="sm">-{coupon.discountValue}%</Text>
      {coupon.maxDiscount != null && (
        <Text size="xs" c="dimmed">
          {t('admin.coupons.cap', { value: formatCurrency(coupon.maxDiscount) })}
        </Text>
      )}
    </div>
  )
}

// Plantillas de cupón y cupones asignados: tabla en desktop, card por fila en móvil.
export function CouponsList({ coupons, onEdit }) {
  const { t } = useI18n()

  const editButton = (coupon) => (
    <Button
      variant="light"
      size="compact-sm"
      onClick={() => onEdit(coupon)}
      aria-label={t('admin.coupons.editLabel', { code: coupon.code })}
      rightSection={<IconEdit size={14} />}
    >
      {t('admin.coupons.edit')}
    </Button>
  )

  const columns = [
    {
      key: 'code',
      header: t('admin.coupons.column.code'),
      hideInCard: true,
      render: (coupon) => <CouponIdentity coupon={coupon} />,
    },
    {
      key: 'discount',
      header: t('admin.coupons.column.discount'),
      render: (coupon) => <DiscountCell coupon={coupon} />,
    },
    {
      key: 'pointsCost',
      header: t('admin.coupons.column.pointsCost'),
      render: (coupon) =>
        coupon.pointsCost === null ? (
          <Text size="sm" c="dimmed">
            {t('admin.coupons.noPoints')}
          </Text>
        ) : (
          <Text size="sm">{coupon.pointsCost}</Text>
        ),
    },
    {
      key: 'validity',
      header: t('admin.coupons.column.validity'),
      render: (coupon) => (
        <Text size="xs">
          <DateTime value={coupon.validFrom} options={{ dateStyle: 'short' }} />
          {' → '}
          <DateTime value={coupon.validUntil} options={{ dateStyle: 'short' }} />
        </Text>
      ),
    },
    {
      key: 'owner',
      header: t('admin.coupons.column.owner'),
      render: (coupon) => (
        <Text size="sm">{coupon.owner?.name ?? t('admin.coupons.campaign')}</Text>
      ),
    },
    {
      key: 'status',
      header: t('admin.inventory.column.status'),
      render: (coupon) => (
        <Group gap="xs" wrap="wrap">
          {coupon.active ? (
            <Badge variant="light" color="teal">
              {t('admin.coupons.active')}
            </Badge>
          ) : (
            <Badge variant="light" color="gray">
              {t('admin.coupons.inactive')}
            </Badge>
          )}
          {coupon.redeemable && (
            <Badge variant="light" color="green">
              {t('admin.coupons.redeemable')}
            </Badge>
          )}
        </Group>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      hideInCard: true,
      render: (coupon) => editButton(coupon),
    },
  ]

  return (
    <ResponsiveList
      data={coupons}
      getKey={(coupon) => coupon.id}
      columns={columns}
      cardTitle={(coupon) => <CouponIdentity coupon={coupon} />}
      cardActions={(coupon) => editButton(coupon)}
      verticalSpacing="sm"
      highlightOnHover
    />
  )
}
