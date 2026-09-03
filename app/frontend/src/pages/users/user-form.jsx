import { useState } from 'react'
import { Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core'
import { useI18n } from '../../i18n/context.js'
import { userSchema } from '../../features/users/users-schema.js'

const EMPTY_VALUES = { name: '', email: '', role: 'viewer' }

function UserForm({ initialValues, onCancel, onSubmit }) {
  const { t } = useI18n()
  const [values, setValues] = useState(() =>
    initialValues ? { ...initialValues } : EMPTY_VALUES,
  )
  const [errors, setErrors] = useState({})

  const roleOptions = [
    { value: 'admin', label: t('users.role.admin') },
    { value: 'editor', label: t('users.role.editor') },
    { value: 'viewer', label: t('users.role.viewer') },
  ]

  const setField = (field) => (value) => {
    setValues((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const parsed = userSchema.safeParse(values)

    if (!parsed.success) {
      const next = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path[0]
        if (field && next[field] === undefined) next[field] = true
      }
      setErrors(next)
      return
    }

    onSubmit(parsed.data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="md">
        <TextInput
          label={t('users.form.name')}
          value={values.name}
          onChange={(event) => setField('name')(event.currentTarget.value)}
          error={errors.name ? t('users.form.required') : null}
          required
          data-autofocus
        />
        <TextInput
          label={t('users.form.email')}
          value={values.email}
          onChange={(event) => setField('email')(event.currentTarget.value)}
          error={errors.email ? t('users.form.email.invalid') : null}
          required
        />
        <Select
          label={t('users.form.role')}
          value={values.role}
          onChange={setField('role')}
          data={roleOptions}
          error={errors.role ? t('users.form.required') : null}
        />

        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={onCancel}>
            {t('users.cancel')}
          </Button>
          <Button type="submit">{t('users.form.save')}</Button>
        </Group>
      </Stack>
    </form>
  )
}

export function UserFormModal({ opened, onClose, initialValues, onSubmit }) {
  const { t } = useI18n()

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initialValues ? t('users.edit') : t('users.add')}
      centered
    >
      <UserForm
        initialValues={initialValues}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  )
}
