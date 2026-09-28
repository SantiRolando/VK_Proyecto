import { DateTime } from '@components/date-time.jsx'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { Money } from '@components/money.jsx'
import { PageHeader } from '@components/page-header.jsx'
import {
  useAdminCoupons,
  useCreateCoupon,
  useUpdateCoupon,
} from '@features/admin/coupons/hooks/use-coupons.js'
import { useI18n } from '@i18n/context.js'
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Modal,
  NumberInput,
  Radio,
  Stack,
  Switch,
  Table,
  Text,
  TextInput,
} from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useState } from 'react'

const EMPTY_COUPON = {
  couponCode: '',
  discountType: 'Percentage',
  discountValue: 10,
  maxDiscount: null,
  pointsCost: null,
  validFrom: '',
  validUntil: '',
  active: true,
}

function toDateInput(iso) {
  return iso ? new Date(iso).toISOString().slice(0, 10) : ''
}

function CouponFormModal({ coupon, opened, onClose }) {
  const { t } = useI18n()
  const create = useCreateCoupon()
  const update = useUpdateCoupon()

  const [values, setValues] = useState(() =>
    coupon
      ? {
          ...coupon,
          validFrom: toDateInput(coupon.validFrom),
          validUntil: toDateInput(coupon.validUntil),
        }
      : EMPTY_COUPON,
  )
  const [error, setError] = useState(null)

  const setField = (field) => (value) =>
    setValues((current) => ({ ...current, [field]: value }))

  const saving = create.isPending || update.isPending

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    const payload = {
      couponCode: values.couponCode,
      discountType: values.discountType,
      discountValue: Number(values.discountValue),
      maxDiscount:
        values.maxDiscount === null || values.maxDiscount === ''
          ? null
          : Number(values.maxDiscount),
      pointsCost:
        values.pointsCost === null || values.pointsCost === ''
          ? null
          : Number(values.pointsCost),
      validFrom: values.validFrom,
      validUntil: values.validUntil,
      active: values.active,
    }

    try {
      if (coupon) {
        await update.mutateAsync({ couponId: coupon.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      onClose()
    } catch (saveError) {
      setError(saveError)
    }
  }

  return (
    <Modal
      closeButtonProps={{ 'aria-label': t('common.close') }}
      opened={opened}
      onClose={onClose}
      title={coupon ? t('admin.coupons.edit') : t('admin.coupons.new')}
      centered
    >
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="sm">
          <TextInput
            label={t('admin.coupons.form.code')}
            value={values.couponCode}
            onChange={(event) => setField('couponCode')(event.currentTarget.value)}
            required
          />

          <Radio.Group
            label={t('admin.coupons.form.discountType')}
            value={values.discountType}
            onChange={setField('discountType')}
          >
            <Group gap="lg" mt="xs">
              {['Percentage', 'Fixed'].map((value) => (
                <Radio
                  key={value}
                  value={value}
                  label={t(`enums.discountType.${value}`)}
                />
              ))}
            </Group>
          </Radio.Group>

          <NumberInput
            label={t('admin.coupons.form.discountValue')}
            value={values.discountValue}
            onChange={setField('discountValue')}
            min={0}
            required
          />
          <NumberInput
            label={t('admin.coupons.form.maxDiscount')}
            description={t('admin.coupons.form.maxDiscountHint')}
            value={values.maxDiscount}
            onChange={setField('maxDiscount')}
            min={0}
          />
          <NumberInput
            label={t('admin.coupons.form.pointsCost')}
            description={t('admin.coupons.form.pointsCostHint')}
            value={values.pointsCost}
            onChange={setField('pointsCost')}
            min={0}
            allowDecimal={false}
          />

          <Group grow align="flex-start">
            <TextInput
              label={t('admin.coupons.form.validFrom')}
              type="date"
              value={values.validFrom}
              onChange={(event) => setField('validFrom')(event.currentTarget.value)}
              required
            />
            <TextInput
              label={t('admin.coupons.form.validUntil')}
              type="date"
              value={values.validUntil}
              onChange={(event) => setField('validUntil')(event.currentTarget.value)}
              required
            />
          </Group>

          {coupon && (
            <Switch
              label={t('admin.coupons.form.active')}
              checked={values.active}
              onChange={(event) => setField('active')(event.currentTarget.checked)}
            />
          )}

          {error && <ErrorState error={error} onRetry={() => setError(null)} />}

          <Group justify="flex-end">
            <Button variant="default" type="button" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" loading={saving}>
              {t('common.save')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

function DiscountCell({ coupon }) {
  if (coupon.discountType === 'Fixed') {
    return (
      <Text size="sm">
        -<Money value={coupon.discountValue} />
      </Text>
    )
  }
  return <Text size="sm">-{coupon.discountValue}%</Text>
}

// Cupones del panel (US11/T098, FR-026): plantillas canjeables y cupones
// asignados. Editar el costo de canje se refleja al instante en el cliente.
export function CouponsPage() {
  const { t } = useI18n()
  const query = useAdminCoupons()

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)

  const coupons = query.data?.items ?? []

  return (
    <Container size="xl" py="xl">
      <PageHeader
        title={t('admin.coupons.title')}
        subtitle={t('admin.coupons.subtitle')}
        actions={
          <Button leftSection={<IconPlus size={16} />} onClick={() => setCreating(true)}>
            {t('admin.coupons.new')}
          </Button>
        }
      />

      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {query.data && (
          <Card withBorder radius="md" padding={0}>
            <Table.ScrollContainer minWidth={900}>
              <Table verticalSpacing="sm" highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('admin.coupons.column.code')}</Table.Th>
                    <Table.Th>{t('admin.coupons.column.discount')}</Table.Th>
                    <Table.Th ta="right">{t('admin.coupons.column.pointsCost')}</Table.Th>
                    <Table.Th>{t('admin.coupons.column.validity')}</Table.Th>
                    <Table.Th>{t('admin.coupons.column.owner')}</Table.Th>
                    <Table.Th>{t('admin.inventory.column.status')}</Table.Th>
                    <Table.Th>{t('common.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {coupons.map((coupon) => (
                    <Table.Tr key={coupon.id}>
                      <Table.Td>
                        <Text fw={600} size="sm">
                          {coupon.code}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {t('admin.coupons.usage', { count: coupon.usageCount })}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <DiscountCell coupon={coupon} />
                      </Table.Td>
                      <Table.Td ta="right">
                        {coupon.pointsCost === null ? (
                          <Text size="sm" c="dimmed">
                            —
                          </Text>
                        ) : (
                          <Text size="sm">{coupon.pointsCost}</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="xs">
                          <DateTime
                            value={coupon.validFrom}
                            options={{ dateStyle: 'short' }}
                          />
                          {' → '}
                          <DateTime
                            value={coupon.validUntil}
                            options={{ dateStyle: 'short' }}
                          />
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {coupon.owner?.name ?? t('admin.coupons.campaign')}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
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
                            <Badge variant="light" color="vikinga">
                              {t('admin.coupons.redeemable')}
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Button
                          variant="light"
                          size="compact-sm"
                          onClick={() => setEditing(coupon)}
                        >
                          {t('admin.coupons.edit')}
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Card>
        )}
      </QueryBoundary>

      {creating && (
        <CouponFormModal coupon={null} opened onClose={() => setCreating(false)} />
      )}
      {editing && (
        <CouponFormModal
          key={editing.id}
          coupon={editing}
          opened
          onClose={() => setEditing(null)}
        />
      )}
    </Container>
  )
}
