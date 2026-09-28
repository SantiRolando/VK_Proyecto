import { AddressForm } from '@components/address-form.jsx'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { ErrorState } from '@components/feedback/error-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useSetDefaultAddress,
  useUpdateAddress,
} from '@features/account/hooks/use-addresses.js'
import { useI18n } from '@i18n/context.js'
import { Badge, Button, Card, Container, Group, Modal, Stack, Text } from '@mantine/core'
import { IconMapPin, IconPlus, IconTrash } from '@tabler/icons-react'
import { addressFullLine } from '@utils/address.js'
import { useState } from 'react'

const NEW_ADDRESS = 'new'

// Agenda de direcciones (US5/T075): alta, edición, baja y predeterminada. El
// checkout reutiliza el mismo formulario para dar de alta una dirección.
export function AddressesPage() {
  const { t } = useI18n()
  const query = useAddresses()
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()
  const setDefaultAddress = useSetDefaultAddress()

  const [editing, setEditing] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [removeError, setRemoveError] = useState(null)

  const addresses = query.data ?? []
  const saving = createAddress.isPending || updateAddress.isPending

  const handleSubmit = (values) =>
    editing === NEW_ADDRESS
      ? createAddress.mutateAsync(values)
      : updateAddress.mutateAsync({ addressId: editing.id, ...values })

  const handleRemove = async () => {
    setRemoveError(null)
    try {
      await deleteAddress.mutateAsync(removing.id)
      setRemoving(null)
    } catch (error) {
      setRemoveError(error)
    }
  }

  return (
    <Container size="md" py="xl">
      <PageHeader
        title={t('account.addresses.title')}
        subtitle={t('account.addresses.subtitle')}
        actions={
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setEditing(NEW_ADDRESS)}
          >
            {t('account.addresses.new')}
          </Button>
        }
      />

      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {addresses.length === 0 ? (
          <EmptyState
            icon={IconMapPin}
            title={t('account.addresses.empty')}
            description={t('account.addresses.emptyBody')}
          />
        ) : (
          <Stack gap="sm">
            {addresses.map((address) => (
              <Card key={address.id} withBorder radius="md" padding="md">
                <Group justify="space-between" gap="sm" wrap="wrap">
                  <div>
                    <Text fw={600}>{addressFullLine(address)}</Text>
                    {address.isDefault && (
                      <Badge variant="light" color="vikinga" mt={4}>
                        {t('account.addresses.default')}
                      </Badge>
                    )}
                  </div>

                  <Group gap="xs" wrap="wrap">
                    {!address.isDefault && (
                      <Button
                        variant="subtle"
                        size="compact-sm"
                        loading={setDefaultAddress.isPending}
                        onClick={() => setDefaultAddress.mutate(address.id)}
                      >
                        {t('account.addresses.setDefault')}
                      </Button>
                    )}
                    <Button
                      variant="light"
                      size="compact-sm"
                      onClick={() => setEditing(address)}
                    >
                      {t('account.addresses.edit')}
                    </Button>
                    <Button
                      variant="subtle"
                      color="red"
                      size="compact-sm"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => {
                        setRemoveError(null)
                        setRemoving(address)
                      }}
                    >
                      {t('common.delete')}
                    </Button>
                  </Group>
                </Group>
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
          editing === NEW_ADDRESS
            ? t('account.addresses.new')
            : t('account.addresses.edit')
        }
        centered
      >
        {editing !== null && (
          <AddressForm
            initialValues={editing === NEW_ADDRESS ? undefined : editing}
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
        title={t('account.addresses.removeTitle')}
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            {t('account.addresses.removeBody', {
              address: addressFullLine(removing),
            })}
          </Text>

          {removeError && <ErrorState error={removeError} />}

          <Group justify="flex-end" gap="xs">
            <Button variant="default" onClick={() => setRemoving(null)}>
              {t('common.cancel')}
            </Button>
            <Button color="red" loading={deleteAddress.isPending} onClick={handleRemove}>
              {t('common.delete')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  )
}
