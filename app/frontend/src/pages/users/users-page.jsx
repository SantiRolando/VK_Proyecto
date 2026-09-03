import { useMemo, useState } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Progress,
  Table,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import {
  IconPencil,
  IconPlus,
  IconSearch,
  IconTrash,
} from '@tabler/icons-react'
import { useI18n } from '../../i18n/context.js'
import { mockUsers } from '../../mocks/users.js'
import { getRoleColor, getRoleLabelKey } from '../../features/users/roles.js'
import { UserFormModal } from './user-form.jsx'
import { DeleteUserModal } from './delete-user-modal.jsx'

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

  const rows = filtered.map((user) => (
    <Table.Tr key={user.id}>
      <Table.Td>{user.name}</Table.Td>
      <Table.Td>{user.email}</Table.Td>
      <Table.Td>
        <Badge variant="light" color={getRoleColor(user.role)}>
          {t(getRoleLabelKey(user.role))}
        </Badge>
      </Table.Td>
      <Table.Td>{user.generations}</Table.Td>
      <Table.Td>{user.points}</Table.Td>
      <Table.Td>{formatDate(user.lastGeneration)}</Table.Td>
      <Table.Td>
        {user.effectiveness == null ? (
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
        )}
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
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
      </Table.Td>
    </Table.Tr>
  ))

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
        <Table.ScrollContainer minWidth={900}>
          <Table
            striped
            highlightOnHover
            verticalSpacing="sm"
            horizontalSpacing="sm"
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('users.table.name')}</Table.Th>
                <Table.Th>{t('users.table.email')}</Table.Th>
                <Table.Th>{t('users.table.role')}</Table.Th>
                <Table.Th>{t('users.table.generations')}</Table.Th>
                <Table.Th>{t('users.table.points')}</Table.Th>
                <Table.Th>{t('users.table.lastGeneration')}</Table.Th>
                <Table.Th>{t('users.table.effectiveness')}</Table.Th>
                <Table.Th>{t('users.table.actions')}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
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
    </div>
  )
}
