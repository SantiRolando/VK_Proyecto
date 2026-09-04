import { useMemo, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Group,
  Paper,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import {
  IconArrowsRightLeft,
  IconEye,
  IconPencil,
  IconSearch,
  IconShoppingCart,
  IconTrash,
} from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'
import {
  getCouponById,
  getCustomerById,
  mockTransactions,
} from '../../mocks/transactions.js'
import {
  getDirectionColor,
  getDirectionForReason,
  getDirectionLabelKey,
  getReasonColor,
  getReasonLabelKey,
} from '../../features/transactions/transactions-options.js'
import { ResponsiveTable } from '../../components/responsive-table.jsx'
import { ActionsMenu } from '../../components/actions-menu.jsx'
import { TransactionFormModal } from './transaction-form.jsx'
import { SaleFormModal } from './sale-form.jsx'
import { DeleteTransactionModal } from './delete-transaction-modal.jsx'
import { TransactionViewModal } from './transaction-view-modal.jsx'
import { getProductById } from './product-helpers.js'

export function TransactionsPage() {
  const { t, language } = useI18n()
  const [transactions, setTransactions] = useState(mockTransactions)
  const [query, setQuery] = useState('')
  const [formMode, setFormMode] = useState(null) // 'transaction' | 'sale' | null
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [viewing, setViewing] = useState(null)

  const dateLocale = language === 'en' ? 'en-US' : 'es-AR'

  const formatDate = (value) => {
    if (!value) return '—'
    return new Date(`${value}T00:00:00`).toLocaleDateString(dateLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return transactions

    return transactions.filter((item) => {
      const customer = getCustomerById(item.customerId)
      const coupon = getCouponById(item.couponId)
      const productNames = item.lines
        .map((line) => getProductById(line.productId)?.name)
        .filter(Boolean)

      return [
        `#${item.id}`,
        item.date,
        t(getDirectionLabelKey(item.direction)),
        t(getReasonLabelKey(item.reason)),
        customer?.name,
        coupon?.code,
        ...productNames,
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized))
    })
  }, [transactions, query, t])

  const nextId = (items) => Math.max(0, ...items.map((item) => item.id)) + 1

  const openCreateTransaction = () => {
    setEditing(null)
    setFormMode('transaction')
  }

  const openCreateSale = () => {
    setEditing(null)
    setFormMode('sale')
  }

  const openEdit = (item) => {
    setEditing(item)
    setFormMode(item.reason === 'venta' ? 'sale' : 'transaction')
  }

  const closeForm = () => {
    setFormMode(null)
    setEditing(null)
  }

  const handleTransactionSubmit = (values) => {
    const base = {
      direction: getDirectionForReason(values.reason),
      reason: values.reason,
      date: values.date,
      lines: values.lines,
      customerId: null,
      couponId: null,
      delivery: false,
      address: '',
    }

    if (editing) {
      setTransactions((current) =>
        current.map((item) =>
          item.id === editing.id ? { ...item, ...base } : item,
        ),
      )
    } else {
      setTransactions((current) => [
        ...current,
        { id: nextId(current), ...base },
      ])
    }
    closeForm()
  }

  const handleSaleSubmit = (values) => {
    const base = {
      direction: 'salida',
      reason: 'venta',
      date: values.date,
      lines: values.lines,
      customerId: values.customerId,
      couponId: values.couponId,
      delivery: values.delivery,
      address: values.address,
    }

    if (editing) {
      setTransactions((current) =>
        current.map((item) =>
          item.id === editing.id ? { ...item, ...base } : item,
        ),
      )
    } else {
      setTransactions((current) => [
        ...current,
        { id: nextId(current), ...base },
      ])
    }
    closeForm()
  }

  const confirmDelete = () => {
    setTransactions((current) =>
      current.filter((item) => item.id !== deleting.id),
    )
    setDeleting(null)
  }

  const totalUnits = (item) =>
    item.lines.reduce((sum, line) => sum + line.quantity, 0)

  const renderDirection = (item) => (
    <Badge variant="light" color={getDirectionColor(item.direction)}>
      {t(getDirectionLabelKey(item.direction))}
    </Badge>
  )

  const renderReason = (item) => (
    <Badge variant="light" color={getReasonColor(item.reason)}>
      {t(getReasonLabelKey(item.reason))}
    </Badge>
  )

  const renderDelivery = (item) =>
    item.reason === 'venta' ? (
      <Badge variant="light" color={item.delivery ? 'green' : 'gray'}>
        {t(
          item.delivery
            ? 'transactions.delivery.yes'
            : 'transactions.delivery.no',
        )}
      </Badge>
    ) : (
      '—'
    )

  const renderActions = (item) => (
    <Group gap="xs" wrap="nowrap">
      <ActionIcon
        variant="subtle"
        color="dark"
        aria-label={t('transactions.view')}
        onClick={() => setViewing(item)}
      >
        <IconEye size={16} />
      </ActionIcon>
      <ActionIcon
        variant="subtle"
        color="dark"
        aria-label={t('transactions.edit')}
        onClick={() => openEdit(item)}
      >
        <IconPencil size={16} />
      </ActionIcon>
      <ActionIcon
        variant="subtle"
        color="red"
        aria-label={t('transactions.delete')}
        onClick={() => setDeleting(item)}
      >
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  )

  const columns = [
    {
      key: 'id',
      header: t('transactions.table.id'),
      render: (item) => `#${item.id}`,
    },
    {
      key: 'date',
      header: t('transactions.table.date'),
      render: (item) => formatDate(item.date),
    },
    {
      key: 'direction',
      header: t('transactions.table.direction'),
      render: renderDirection,
    },
    {
      key: 'reason',
      header: t('transactions.table.reason'),
      render: renderReason,
    },
    {
      key: 'products',
      header: t('transactions.table.products'),
      render: (item) => item.lines.length,
    },
    {
      key: 'units',
      header: t('transactions.table.units'),
      render: (item) => totalUnits(item),
    },
    {
      key: 'customer',
      header: t('transactions.table.customer'),
      render: (item) =>
        item.reason === 'venta'
          ? getCustomerById(item.customerId)?.name ?? '—'
          : '—',
    },
    {
      key: 'coupon',
      header: t('transactions.table.coupon'),
      render: (item) =>
        item.reason === 'venta'
          ? getCouponById(item.couponId)?.code ?? '—'
          : '—',
    },
    {
      key: 'delivery',
      header: t('transactions.table.delivery'),
      render: renderDelivery,
    },
    {
      key: 'actions',
      header: t('transactions.table.actions'),
      render: renderActions,
      hideInCard: true,
    },
  ]

  const renderCardTitle = (item) => (
    <Group justify="space-between" gap="xs" wrap="nowrap" align="flex-start">
      <Text fw={600}>
        #{item.id} · {formatDate(item.date)}
      </Text>
      {renderReason(item)}
    </Group>
  )

  const renderCardActions = (item) => (
    <ActionsMenu
      label={t('transactions.table.actions')}
      actions={[
        {
          label: t('transactions.view'),
          icon: <IconEye size={16} />,
          onClick: () => setViewing(item),
        },
        {
          label: t('transactions.edit'),
          icon: <IconPencil size={16} />,
          onClick: () => openEdit(item),
        },
        {
          label: t('transactions.delete'),
          icon: <IconTrash size={16} />,
          color: 'red',
          onClick: () => setDeleting(item),
        },
      ]}
    />
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Container size="xl" py="xl">
        <Paper withBorder p="lg" radius="md" bg="white">
          <Group justify="space-between" align="flex-end" mb="lg">
            <div>
              <Title order={1} c="black">
                {t('transactions.title')}
              </Title>
              <Text c="gray.7" mt="xs">
                {t('transactions.subtitle')}
              </Text>
            </div>
            <Group gap="xs">
              <Button
                variant="default"
                leftSection={<IconArrowsRightLeft size={18} />}
                onClick={openCreateTransaction}
              >
                {t('transactions.add')}
              </Button>
              <Button
                leftSection={<IconShoppingCart size={18} />}
                onClick={openCreateSale}
              >
                {t('transactions.sale')}
              </Button>
            </Group>
          </Group>

          <TextInput
            placeholder={t('transactions.search')}
            leftSection={<IconSearch size={16} />}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            mb="md"
          />

          {filtered.length === 0 ? (
            <Text c="dimmed">{t('transactions.empty')}</Text>
          ) : (
            <ResponsiveTable
              data={filtered}
              getKey={(item) => item.id}
              columns={columns}
              minWidth={1400}
              cardTitle={renderCardTitle}
              cardActions={renderCardActions}
              onCardClick={(item) => setViewing(item)}
              striped
              highlightOnHover
              withTableBorder
              verticalSpacing="sm"
              horizontalSpacing="sm"
            />
          )}
        </Paper>
      </Container>

      <TransactionFormModal
        opened={formMode === 'transaction'}
        onClose={closeForm}
        initialValues={editing}
        onSubmit={handleTransactionSubmit}
      />

      <SaleFormModal
        opened={formMode === 'sale'}
        onClose={closeForm}
        initialValues={editing}
        onSubmit={handleSaleSubmit}
      />

      <DeleteTransactionModal
        item={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />

      <TransactionViewModal item={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
