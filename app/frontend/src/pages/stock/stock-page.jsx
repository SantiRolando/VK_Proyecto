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
import { Sparkline } from '@mantine/charts'
import {
  IconEye,
  IconFlame,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'
import { createStockStats, mockStock } from '../../mocks/stock.js'
import {
  getColorLabelKey,
  getModelLabelKey,
} from '../../features/stock/stock-options.js'
import { ResponsiveTable } from '../../components/responsive-table.jsx'
import { ActionsMenu } from '../../components/actions-menu.jsx'
import { StockFormModal } from './stock-form.jsx'
import { DeleteStockModal } from './delete-stock-modal.jsx'
import { StockViewModal } from './stock-view-modal.jsx'

const SPARKLINE_PROPS = {
  w: 96,
  h: 32,
  fillOpacity: 0.3,
  strokeWidth: 1.5,
  curveType: 'linear',
}

export function StockPage() {
  const { t } = useI18n()
  const [stock, setStock] = useState(mockStock)
  const [query, setQuery] = useState('')
  const [formOpened, setFormOpened] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [viewing, setViewing] = useState(null)

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return stock

    return stock.filter((item) =>
      [
        item.barcode,
        item.name,
        item.size,
        t(getModelLabelKey(item.model)),
        t(getColorLabelKey(item.color)),
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalized)),
    )
  }, [stock, query, t])

  const openCreate = () => {
    setEditing(null)
    setFormOpened(true)
  }

  const openEdit = (item) => {
    setEditing(item)
    setFormOpened(true)
  }

  const openView = (item) => {
    setViewing(item)
  }

  const closeForm = () => {
    setFormOpened(false)
    setEditing(null)
  }

  const handleSubmit = (values) => {
    if (editing) {
      setStock((current) =>
        current.map((item) =>
          item.id === editing.id ? { ...item, ...values } : item,
        ),
      )
    } else {
      setStock((current) => {
        const id = Math.max(0, ...current.map((item) => item.id)) + 1
        return [
          ...current,
          { id, ...values, ...createStockStats({ id, quantity: values.quantity }) },
        ]
      })
    }
    closeForm()
  }

  const confirmDelete = () => {
    setStock((current) => current.filter((item) => item.id !== deleting.id))
    setDeleting(null)
  }

  const renderKid = (item) =>
    item.kid ? (
      <Badge variant="light" color="blue">
        {t('stock.kid.true')}
      </Badge>
    ) : (
      <Badge variant="light" color="gray">
        {t('stock.adult')}
      </Badge>
    )

  const renderQuantity = (item) => (
    <Group gap="xs" wrap="nowrap">
      <Text>{item.quantity}</Text>
      {item.quantity <= item.minStock && (
        <Badge variant="light" color="red">
          {t('stock.low')}
        </Badge>
      )}
    </Group>
  )

  const renderSales = (item) => (
    <Sparkline
      {...SPARKLINE_PROPS}
      data={item.salesSeries}
      color="blue.6"
    />
  )

  const renderStockTrend = (item) => (
    <Sparkline
      {...SPARKLINE_PROPS}
      data={item.stockSeries}
      color="teal.6"
    />
  )

  const renderName = (item) => (
    <Group gap="xs" wrap="nowrap">
      <Text size="sm">{item.name || '—'}</Text>
      {item.trending && (
        <Badge
          variant="light"
          color="orange"
          leftSection={<IconFlame size={12} />}
        >
          {t('stock.trending')}
        </Badge>
      )}
    </Group>
  )

  const renderActions = (item) => (
    <Group gap="xs" wrap="nowrap">
      <ActionIcon
        variant="subtle"
        color="dark"
        aria-label={t('stock.view')}
        onClick={() => openView(item)}
      >
        <IconEye size={16} />
      </ActionIcon>
      <ActionIcon
        variant="subtle"
        color="dark"
        aria-label={t('stock.edit')}
        onClick={() => openEdit(item)}
      >
        <IconPencil size={16} />
      </ActionIcon>
      <ActionIcon
        variant="subtle"
        color="red"
        aria-label={t('stock.delete')}
        onClick={() => setDeleting(item)}
      >
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  )

  const columns = [
    {
      key: 'barcode',
      header: t('stock.table.barcode'),
      render: (item) => item.barcode || '—',
    },
    {
      key: 'model',
      header: t('stock.table.model'),
      render: (item) => t(getModelLabelKey(item.model)),
    },
    {
      key: 'size',
      header: t('stock.table.size'),
      render: (item) => item.size,
    },
    {
      key: 'color',
      header: t('stock.table.color'),
      render: (item) => t(getColorLabelKey(item.color)),
    },
    { key: 'kid', header: t('stock.table.kid'), render: renderKid },
    {
      key: 'minStock',
      header: t('stock.table.minStock'),
      render: (item) => item.minStock,
    },
    {
      key: 'quantity',
      header: t('stock.table.quantity'),
      render: renderQuantity,
    },
    { key: 'sales', header: t('stock.table.sales'), render: renderSales },
    {
      key: 'stockTrend',
      header: t('stock.table.stockTrend'),
      render: renderStockTrend,
    },
    {
      key: 'name',
      header: t('stock.table.name'),
      render: renderName,
      hideInCard: true,
    },
    {
      key: 'actions',
      header: t('stock.table.actions'),
      render: renderActions,
      hideInCard: true,
    },
  ]

  const renderCardTitle = (item) => (
    <Group justify="space-between" gap="xs" wrap="nowrap" align="flex-start">
      <Text fw={600}>{item.name || t(getModelLabelKey(item.model))}</Text>
      {item.trending && (
        <Badge
          variant="light"
          color="orange"
          leftSection={<IconFlame size={12} />}
        >
          {t('stock.trending')}
        </Badge>
      )}
    </Group>
  )

  const renderCardActions = (item) => (
    <ActionsMenu
      label={t('stock.table.actions')}
      actions={[
        {
          label: t('stock.view'),
          icon: <IconEye size={16} />,
          onClick: () => openView(item),
        },
        {
          label: t('stock.edit'),
          icon: <IconPencil size={16} />,
          onClick: () => openEdit(item),
        },
        {
          label: t('stock.delete'),
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
                {t('stock.title')}
              </Title>
              <Text c="gray.7" mt="xs">
                {t('stock.subtitle')}
              </Text>
            </div>
            <Button leftSection={<IconPlus size={18} />} onClick={openCreate}>
              {t('stock.add')}
            </Button>
          </Group>

          <TextInput
            placeholder={t('stock.search')}
            leftSection={<IconSearch size={16} />}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            mb="md"
          />

          {filtered.length === 0 ? (
            <Text c="dimmed">{t('stock.empty')}</Text>
          ) : (
            <ResponsiveTable
              data={filtered}
              getKey={(item) => item.id}
              columns={columns}
              minWidth={1500}
              cardTitle={renderCardTitle}
              cardActions={renderCardActions}
              onCardClick={openView}
              striped
              highlightOnHover
              withTableBorder
              verticalSpacing="sm"
              horizontalSpacing="sm"
            />
          )}
        </Paper>
      </Container>

      <StockFormModal
        opened={formOpened}
        onClose={closeForm}
        initialValues={editing}
        onSubmit={handleSubmit}
      />

      <DeleteStockModal
        item={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />

      <StockViewModal item={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
