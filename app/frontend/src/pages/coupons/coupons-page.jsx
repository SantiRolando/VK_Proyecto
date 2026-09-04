import { useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconEye, IconPencil, IconPlus, IconTrash } from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'
import { mockCoupons } from '../../mocks/coupons.js'
import { ResponsiveTable } from '../../components/responsive-table.jsx'
import { ActionsMenu } from '../../components/actions-menu.jsx'
import { GamificationSettings } from './gamification-settings.jsx'
import { PointsHistory } from './points-history.jsx'
import { CouponFormModal } from './coupon-form.jsx'
import { DeleteCouponModal } from './delete-coupon-modal.jsx'
import { CouponViewModal } from './coupon-view-modal.jsx'

function formatCouponValue(coupon) {
  return coupon.type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`
}

export function CouponsPage() {
  const { t, language } = useI18n()
  const [coupons, setCoupons] = useState(mockCoupons)
  const [formOpened, setFormOpened] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [viewing, setViewing] = useState(null)

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

  const openView = (coupon) => {
    setViewing(coupon)
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

  const renderType = (coupon) => (
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
  )

  const renderActive = (coupon) => (
    <Badge variant="light" color={coupon.active ? 'green' : 'gray'}>
      {t(coupon.active ? 'coupons.status.active' : 'coupons.status.inactive')}
    </Badge>
  )

  const renderActions = (coupon) => (
    <Group gap="xs" wrap="nowrap">
      <ActionIcon
        variant="subtle"
        color="dark"
        aria-label={t('coupons.view')}
        onClick={() => openView(coupon)}
      >
        <IconEye size={16} />
      </ActionIcon>
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
  )

  const columns = [
    {
      key: 'code',
      header: t('coupons.table.code'),
      render: (coupon) => coupon.code,
      hideInCard: true,
    },
    {
      key: 'type',
      header: t('coupons.table.type'),
      render: renderType,
    },
    {
      key: 'value',
      header: t('coupons.table.value'),
      render: (coupon) => formatCouponValue(coupon),
    },
    {
      key: 'uses',
      header: t('coupons.table.uses'),
      render: (coupon) => `${coupon.used}/${coupon.maxUses}`,
    },
    {
      key: 'validity',
      header: t('coupons.table.validity'),
      render: (coupon) =>
        `${formatDate(coupon.startDate)} – ${formatDate(coupon.endDate)}`,
    },
    {
      key: 'active',
      header: t('coupons.table.active'),
      render: renderActive,
      hideInCard: true,
    },
    {
      key: 'actions',
      header: t('coupons.table.actions'),
      render: renderActions,
      hideInCard: true,
    },
  ]

  const renderCardTitle = (coupon) => (
    <Group justify="space-between" gap="xs" wrap="nowrap" align="flex-start">
      <Text fw={600}>{coupon.code}</Text>
      {renderActive(coupon)}
    </Group>
  )

  const renderCardActions = (coupon) => (
    <ActionsMenu
      label={t('coupons.table.actions')}
      actions={[
        {
          label: t('coupons.view'),
          icon: <IconEye size={16} />,
          onClick: () => openView(coupon),
        },
        {
          label: t('coupons.edit'),
          icon: <IconPencil size={16} />,
          onClick: () => openEdit(coupon),
        },
        {
          label: t('coupons.delete'),
          icon: <IconTrash size={16} />,
          color: 'red',
          onClick: () => setDeleting(coupon),
        },
      ]}
    />
  )

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
          <ResponsiveTable
            data={coupons}
            getKey={(coupon) => coupon.id}
            columns={columns}
            minWidth={900}
            cardTitle={renderCardTitle}
            cardActions={renderCardActions}
            onCardClick={openView}
            striped
            highlightOnHover
            verticalSpacing="sm"
            horizontalSpacing="sm"
          />
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

      <CouponViewModal coupon={viewing} onClose={() => setViewing(null)} />
    </Stack>
  )
}
