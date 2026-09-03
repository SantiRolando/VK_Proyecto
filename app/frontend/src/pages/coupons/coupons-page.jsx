import { useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Stack,
  Table,
  Text,
  Title,
} from '@mantine/core'
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'
import { mockCoupons } from '../../mocks/coupons.js'
import { GamificationSettings } from './gamification-settings.jsx'
import { PointsHistory } from './points-history.jsx'
import { CouponFormModal } from './coupon-form.jsx'
import { DeleteCouponModal } from './delete-coupon-modal.jsx'

function formatCouponValue(coupon) {
  return coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`
}

export function CouponsPage() {
  const { t, language } = useI18n()
  const [coupons, setCoupons] = useState(mockCoupons)
  const [formOpened, setFormOpened] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const dateLocale = language === 'en' ? 'en-US' : 'es-AR'

  const formatDate = (value) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(dateLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  const openCreate = () => {
    setEditing(null)
    setFormOpened(true)
  }

  const openEdit = (coupon) => {
    setEditing(coupon)
    setFormOpened(true)
  }

  const closeForm = () => {
    setFormOpened(false)
    setEditing(null)
  }

  const handleSubmit = (values) => {
    if (editing) {
      setCoupons((current) =>
        current.map((coupon) =>
          coupon.id === editing.id ? { ...coupon, ...values } : coupon,
        ),
      )
    } else {
      setCoupons((current) => [
        ...current,
        {
          id: Math.max(0, ...current.map((coupon) => coupon.id)) + 1,
          ...values,
          used: 0,
        },
      ])
    }
    closeForm()
  }

  const confirmDelete = () => {
    setCoupons((current) => current.filter((coupon) => coupon.id !== deleting.id))
    setDeleting(null)
  }

  const rows = coupons.map((coupon) => (
    <Table.Tr key={coupon.id}>
      <Table.Td>{coupon.code}</Table.Td>
      <Table.Td>
        <Badge
          variant="light"
          color={coupon.type === 'percentage' ? 'blue' : 'teal'}
        >
          {t(
            coupon.type === 'percentage'
              ? 'coupons.type.percentage'
              : 'coupons.type.fixed',
          )}
        </Badge>
      </Table.Td>
      <Table.Td>{formatCouponValue(coupon)}</Table.Td>
      <Table.Td>
        {coupon.used}/{coupon.maxUses}
      </Table.Td>
      <Table.Td>
        {formatDate(coupon.startDate)} – {formatDate(coupon.endDate)}
      </Table.Td>
      <Table.Td>
        <Badge variant="light" color={coupon.active ? 'green' : 'gray'}>
          {t(
            coupon.active ? 'coupons.status.active' : 'coupons.status.inactive',
          )}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="dark"
            aria-label={t('coupons.edit')}
            onClick={() => openEdit(coupon)}
          >
            <IconPencil size={16} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            aria-label={t('coupons.delete')}
            onClick={() => setDeleting(coupon)}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>{t('coupons.title')}</Title>
        <Text c="dimmed" mt="xs">
          {t('coupons.subtitle')}
        </Text>
      </div>

      <GamificationSettings />

      <PointsHistory />

      <div>
        <Group justify="space-between" align="flex-end" mb="lg">
          <div>
            <Title order={3}>{t('coupons.list.title')}</Title>
            <Text c="dimmed" size="sm" mt="xs">
              {t('coupons.list.subtitle')}
            </Text>
          </div>
          <Button leftSection={<IconPlus size={18} />} onClick={openCreate}>
            {t('coupons.add')}
          </Button>
        </Group>

        {coupons.length === 0 ? (
          <Text c="dimmed">{t('coupons.empty')}</Text>
        ) : (
          <Table.ScrollContainer minWidth={900}>
            <Table
              striped
              highlightOnHover
              verticalSpacing="sm"
              horizontalSpacing="sm"
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('coupons.table.code')}</Table.Th>
                  <Table.Th>{t('coupons.table.type')}</Table.Th>
                  <Table.Th>{t('coupons.table.value')}</Table.Th>
                  <Table.Th>{t('coupons.table.uses')}</Table.Th>
                  <Table.Th>{t('coupons.table.validity')}</Table.Th>
                  <Table.Th>{t('coupons.table.active')}</Table.Th>
                  <Table.Th>{t('coupons.table.actions')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{rows}</Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </div>

      <CouponFormModal
        opened={formOpened}
        onClose={closeForm}
        initialValues={editing}
        onSubmit={handleSubmit}
      />

      <DeleteCouponModal
        coupon={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </Stack>
  )
}
