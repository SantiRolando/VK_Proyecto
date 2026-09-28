import { useCreateProfile } from '@features/account/hooks/use-profiles.js'
import { ProfileForm } from '@features/account/profile-form.jsx'
import { useI18n } from '@i18n/context.js'
import { Alert, Button, Modal, Stack } from '@mantine/core'
import { measuresFormValues } from '@utils/measures.js'
import { useState } from 'react'

// Guardar un resultado como perfil (US5/T074). Las medidas llegan precargadas
// de la generación y el cliente solo elige el nombre (puede ajustarlas).
export function SaveProfileModal({ opened, onClose, generation }) {
  const { t } = useI18n()
  const createProfile = useCreateProfile()
  const [done, setDone] = useState(false)

  const initialValues = { name: '', ...measuresFormValues(generation) }

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
      ) : (
        <ProfileForm
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
