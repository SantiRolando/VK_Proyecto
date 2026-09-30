import { EmptyState } from '@components/feedback/empty-state.jsx'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import {
  useCreateProfile,
  useDeleteProfile,
  useProfiles,
  useSetDefaultProfile,
  useUpdateProfile,
} from '@features/account/hooks/use-profiles.js'
import { ProfileForm } from '@features/account/profile-form.jsx'
import { useI18n } from '@i18n/context.js'
import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Modal,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core'
import { IconPlus, IconTrash, IconUserCheck } from '@tabler/icons-react'
import { MEASURE_FIELDS, measuresFormValues } from '@utils/measures.js'
import { useState } from 'react'

const NEW_PROFILE = 'new'

function toFormValues(profile) {
  return { name: profile.name, ...measuresFormValues(profile) }
}

// `ProfilesPage` es el envoltorio de ruta (Container + PageHeader). El cuerpo se
// exporta aparte para poder embeberlo en una pestaña de la información de cuenta
// sin anidar contenedores ni repetir el encabezado (bug squash sesión #1).
export function ProfilesPage() {
  const { t } = useI18n()

  return (
    <Container size="md" py="xl">
      <PageHeader
        title={t('account.profiles.title')}
        subtitle={t('account.profiles.subtitle')}
      />
      <ProfilesBody />
    </Container>
  )
}

export function ProfilesBody() {
  const { t } = useI18n()
  const query = useProfiles()
  const createProfile = useCreateProfile()
  const updateProfile = useUpdateProfile()
  const deleteProfile = useDeleteProfile()
  const setDefaultProfile = useSetDefaultProfile()

  const [editing, setEditing] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [removeError, setRemoveError] = useState(null)

  const profiles = query.data ?? []
  const saving = createProfile.isPending || updateProfile.isPending

  const handleSubmit = (values) =>
    editing === NEW_PROFILE
      ? createProfile.mutateAsync(values)
      : updateProfile.mutateAsync({ profileId: editing.id, ...values })

  const handleRemove = async () => {
    setRemoveError(null)
    try {
      await deleteProfile.mutateAsync(removing.id)
      setRemoving(null)
    } catch (error) {
      setRemoveError(error)
    }
  }

  return (
    <>
      <Group justify="flex-end" mb="md">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setEditing(NEW_PROFILE)}
        >
          {t('account.profiles.new')}
        </Button>
      </Group>

      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {profiles.length === 0 ? (
          <EmptyState
            icon={IconUserCheck}
            title={t('account.profiles.empty')}
            description={t('account.profiles.emptyBody')}
          />
        ) : (
          <Stack gap="sm">
            {profiles.map((profile) => (
              <Card key={profile.id} withBorder radius="md" padding="md">
                <Stack gap="sm">
                  <Group justify="space-between" gap="sm" wrap="wrap">
                    <Group gap="xs" wrap="nowrap">
                      <Text fw={600}>{profile.name}</Text>
                      {profile.isDefault && (
                        <Badge variant="light" color="blue">
                          {t('account.profiles.default')}
                        </Badge>
                      )}
                    </Group>

                    <Group gap="xs" wrap="wrap">
                      {!profile.isDefault && (
                        <Button
                          variant="subtle"
                          size="compact-sm"
                          leftSection={<IconUserCheck size={14} />}
                          loading={setDefaultProfile.isPending}
                          onClick={() => setDefaultProfile.mutate(profile.id)}
                        >
                          {t('account.profiles.setDefault')}
                        </Button>
                      )}
                      <Button
                        variant="light"
                        size="compact-sm"
                        onClick={() => setEditing(profile)}
                      >
                        {t('account.profiles.edit')}
                      </Button>
                      <Button
                        variant="subtle"
                        color="red"
                        size="compact-sm"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => {
                          setRemoveError(null)
                          setRemoving(profile)
                        }}
                      >
                        {t('common.delete')}
                      </Button>
                    </Group>
                  </Group>

                  <SimpleGrid cols={{ base: 3, sm: 6 }} spacing="xs">
                    {MEASURE_FIELDS.map((field) => (
                      <div key={field}>
                        <Text size="xs" c="dimmed">
                          {t(`fit.measure.${field}`)}
                        </Text>
                        <Text size="sm">
                          {profile[field] == null
                            ? t('common.notSet')
                            : t('common.cm', { value: profile[field] })}
                        </Text>
                      </div>
                    ))}
                    <div>
                      <Text size="xs" c="dimmed">
                        {t('fit.measure.age')}
                      </Text>
                      <Text size="sm">{profile.age ?? t('common.notSet')}</Text>
                    </div>
                  </SimpleGrid>
                </Stack>
              </Card>
            ))}
          </Stack>
        )}
      </QueryBoundary>

      <Modal
        closeButtonProps={{ 'aria-label': t('common.close') }}
        opened={editing !== null}
        onClose={() => setEditing(null)}
        title={
          editing === NEW_PROFILE ? t('account.profiles.new') : t('account.profiles.edit')
        }
        centered
      >
        {editing !== null && (
          <ProfileForm
            initialValues={editing === NEW_PROFILE ? undefined : toFormValues(editing)}
            isPending={saving}
            onSubmit={handleSubmit}
            onSaved={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Modal>

      <Modal
        closeButtonProps={{ 'aria-label': t('common.close') }}
        opened={removing !== null}
        onClose={() => setRemoving(null)}
        title={t('account.profiles.removeTitle')}
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            {t('account.profiles.removeBody', { name: removing?.name })}
          </Text>

          {removeError && <ErrorState error={removeError} />}

          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setRemoving(null)}>
              {t('common.cancel')}
            </Button>
            <Button color="red" loading={deleteProfile.isPending} onClick={handleRemove}>
              {t('common.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
