import { useMemo, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Progress,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import {
  IconEye,
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'
import { mockUsers } from '../../mocks/users.js'
import { getRoleColor, getRoleLabelKey } from '../../features/users/roles.js'
import { ResponsiveTable } from '../../components/responsive-table.jsx'
import { ActionsMenu } from '../../components/actions-menu.jsx'
import { UserFormModal } from './user-form.jsx'
import { DeleteUserModal } from './delete-user-modal.jsx'
import { UserViewModal } from './user-view-modal.jsx'

function getEffectivenessColor(ratio) {
  if (ratio >= 0.8) return 'green'
  if (ratio >= 0.6) return 'yellow'
  return 'red'
}

export function UsersPage() {
  const { t, language } = useI18n()
  const [users, setUsers] = useState(mockUsers)
  const [query, setQuery] = useState('')
  const [formOpened, setFormOpened] = useState(false)
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
    if (!normalized) return users

    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(normalized) ||
        user.email.toLowerCase().includes(normalized) ||
        t(getRoleLabelKey(user.role)).toLowerCase().includes(normalized),
    )
  }, [users, query, t])

  const openCreate = () => {
    setEditing(null)
    setFormOpened(true)
  }

  const openEdit = (user) => {
    setEditing(user)
    setFormOpened(true)
  }

  const openView = (user) => {
    setViewing(user)
  }

  const closeForm = () => {
    setFormOpened(false)
    setEditing(null)
  }

  const handleSubmit = (values) => {
    if (editing) {
      setUsers((current) =>
        current.map((user) =>
          user.id === editing.id ? { ...user, ...values } : user,
        ),
      )
    } else {
      setUsers((current) => [
        ...current,
        {
          id: Math.max(0, ...current.map((user) => user.id)) + 1,
          ...values,
          generations: 0,
          points: 0,
          lastGeneration: null,
          effectiveness: null,
        },
      ])
    }
    closeForm()
  }

  const confirmDelete = () => {
    setUsers((current) => current.filter((user) => user.id !== deleting.id))
    setDeleting(null)
  }

  const renderRole = (user) => (
    <Badge variant="light" color={getRoleColor(user.role)}>
      {t(getRoleLabelKey(user.role))}
    </Badge>
  )

  const renderEffectiveness = (user) =>
    user.effectiveness == null ? (
      <Text c="dimmed" size="sm">
        —
      </Text>
    ) : (
      <Group gap="xs" wrap="nowrap" align="center">
        <Progress
          value={user.effectiveness * 100}
          color={getEffectivenessColor(user.effectiveness)}
          size="sm"
          w={64}
          radius="xl"
        />
        <Text size="sm">{Math.round(user.effectiveness * 100)}%</Text>
      </Group>
    )

  const renderActions = (user) => (
    <Group gap="xs" wrap="nowrap">
      <ActionIcon
        variant="subtle"
        color="dark"
        aria-label={t('users.view')}
        onClick={() => openView(user)}
      >
        <IconEye size={16} />
      </ActionIcon>
      <ActionIcon
        variant="subtle"
        color="dark"
        aria-label={t('users.edit')}
        onClick={() => openEdit(user)}
      >
        <IconPencil size={16} />
      </ActionIcon>
      <ActionIcon
        variant="subtle"
        color="red"
        aria-label={t('users.delete')}
        onClick={() => setDeleting(user)}
      >
        <IconTrash size={16} />
      </ActionIcon>
    </Group>
  )

  const columns = [
    {
      key: 'name',
      header: t('users.table.name'),
      render: (user) => user.name,
      hideInCard: true,
    },
    {
      key: 'email',
      header: t('users.table.email'),
      render: (user) => user.email,
      hideInCard: true,
    },
    {
      key: 'role',
      header: t('users.table.role'),
      render: renderRole,
      hideInCard: true,
    },
    {
      key: 'generations',
      header: t('users.table.generations'),
      render: (user) => user.generations,
    },
    {
      key: 'points',
      header: t('users.table.points'),
      render: (user) => user.points,
    },
    {
      key: 'lastGeneration',
      header: t('users.table.lastGeneration'),
      render: (user) => formatDate(user.lastGeneration),
    },
    {
      key: 'effectiveness',
      header: t('users.table.effectiveness'),
      render: renderEffectiveness,
    },
    {
      key: 'actions',
      header: t('users.table.actions'),
      render: renderActions,
      hideInCard: true,
    },
  ]

  const renderCardTitle = (user) => (
    <Group justify="space-between" gap="xs" wrap="nowrap" align="flex-start">
      <div>
        <Text fw={600}>{user.name}</Text>
        <Text size="xs" c="dimmed">
          {user.email}
        </Text>
      </div>
      {renderRole(user)}
    </Group>
  )

  const renderCardActions = (user) => (
    <ActionsMenu
      label={t('users.table.actions')}
      actions={[
        {
          label: t('users.view'),
          icon: <IconEye size={16} />,
          onClick: () => openView(user),
        },
        {
          label: t('users.edit'),
          icon: <IconPencil size={16} />,
          onClick: () => openEdit(user),
        },
        {
          label: t('users.delete'),
          icon: <IconTrash size={16} />,
          color: 'red',
          onClick: () => setDeleting(user),
        },
      ]}
    />
  )

  return (
    <div>
      <Group justify="space-between" align="flex-end" mb="lg">
        <div>
          <Title order={1}>{t('users.title')}</Title>
          <Text c="dimmed" mt="xs">
            {t('users.subtitle')}
          </Text>
        </div>
        <Button leftSection={<IconPlus size={18} />} onClick={openCreate}>
          {t('users.add')}
        </Button>
      </Group>

      <TextInput
        placeholder={t('users.search')}
        leftSection={<IconSearch size={16} />}
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
        mb="md"
      />

      {filtered.length === 0 ? (
        <Text c="dimmed">{t('users.empty')}</Text>
      ) : (
        <ResponsiveTable
          data={filtered}
          getKey={(user) => user.id}
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

      <UserFormModal
        opened={formOpened}
        onClose={closeForm}
        initialValues={editing}
        onSubmit={handleSubmit}
      />

      <DeleteUserModal
        user={deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />

      <UserViewModal user={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
