import { sizeService } from '@api/services/size-service.js'
import { ListSkeleton } from '@components/feedback/skeletons.jsx'
import { useCreateProfile } from '@features/account/hooks/use-profiles.js'
import { ProfileForm } from '@features/account/profile-form.jsx'
import { useI18n } from '@i18n/context.js'
import { Alert, Button, Modal, Stack } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { measuresFormValues } from '@utils/measures.js'
import { useState } from 'react'

// Guardar un resultado como perfil (US5/T074). El resultado público no trae
// las medidas: se leen del detalle de la generación (propio, con sesión) y el
// cliente solo elige el nombre (puede ajustarlas).
export function SaveProfileModal({ opened, onClose, generation }) {
  const { t } = useI18n()
  const createProfile = useCreateProfile()
  const [done, setDone] = useState(false)
  const detail = useQuery({
    queryKey: ['size-generation-detail', generation.id],
    queryFn: () => sizeService.getGenerationDetail(generation.id),
    enabled: opened,
  })

  const initialValues = { name: '', ...measuresFormValues(detail.data ?? generation) }

  const handleClose = () => {
    setDone(false)
    onClose()
  }

  return (
    <Modal
      closeButtonProps={{ 'aria-label': t('common.close') }}
      opened={opened}
      onClose={handleClose}
      title={t('fit.result.saveProfile')}
      centered
    >
      {done ? (
        <Stack gap="md">
          <Alert variant="light" color="teal">
            {t('fit.result.saveProfileDone')}
          </Alert>
          <Button onClick={handleClose}>{t('common.close')}</Button>
        </Stack>
      ) : detail.isPending ? (
        <ListSkeleton rows={3} />
      ) : (
        <ProfileForm
          key={detail.data?.id ?? 'none'}
          initialValues={initialValues}
          isPending={createProfile.isPending}
          onSubmit={(values) => createProfile.mutateAsync(values)}
          onSaved={() => setDone(true)}
          onCancel={handleClose}
        />
      )}
    </Modal>
  )
}
