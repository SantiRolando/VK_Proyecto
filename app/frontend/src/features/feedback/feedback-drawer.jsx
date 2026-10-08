import { ErrorState } from '@components/feedback/error-state.jsx'
import { useAuth } from '@features/auth/auth-context.js'
import { useSubmitFeedback } from '@features/feedback/hooks/use-submit-feedback.js'
import { PointsToast } from '@features/feedback/points-toast.jsx'
import { useI18n } from '@i18n/context.js'
import {
  Alert,
  Button,
  Drawer,
  Modal,
  SegmentedControl,
  Stack,
  Text,
  Textarea,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { useState } from 'react'

const RATINGS = ['Small', 'Correct', 'Large']

// Mensaje del resultado según el tipo de recompensa.
function outcomeKey(reward, isAuthenticated) {
  if (!isAuthenticated) return 'feedback.reward.guest'
  if (reward.dailyLimitReached) return 'feedback.reward.dailyLimit'
  if (reward.awarded) return 'feedback.reward.awarded'
  return 'feedback.reward.noPoints'
}

/*
  Feedback de una medición: Chico/Correcto/Grande + comentario
  opcional. Lo abren el resultado y el historial; el cálculo de puntos vive en
  el mock y vuelve como `reward`.
*/
export function FeedbackDrawer({ opened, onClose, generation, onRated }) {
  const { t } = useI18n()
  const { isAuthenticated } = useAuth()
  const submit = useSubmitFeedback()
  /*
    En móvil el drawer desde abajo es cómodo (zona del pulgar); en desktop un
    modal centrado se lee mejor que una hoja pegada al borde inferior
  */
  const isDesktop = useMediaQuery('(min-width: 48em)', false)

  const [rating, setRating] = useState(null)
  const [comment, setComment] = useState('')
  const [fieldError, setFieldError] = useState(null)
  const [serverError, setServerError] = useState(null)
  const [reward, setReward] = useState(null)
  const [showToast, setShowToast] = useState(false)
  const [wasOpen, setWasOpen] = useState(false)

  // Al reabrir se limpia el formulario (patrón de React para resetear estado
  // cuando cambia una prop).
  if (opened && !wasOpen) {
    setWasOpen(true)
    setRating(null)
    setComment('')
    setFieldError(null)
    setServerError(null)
    setReward(null)
    setShowToast(false)
  } else if (!opened && wasOpen) {
    setWasOpen(false)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!rating) {
      setFieldError(t('validation.required'))
      return
    }

    setFieldError(null)
    setServerError(null)
    try {
      const result = await submit.mutateAsync({
        generationId: generation.id,
        rating,
        comment: comment.trim() || undefined,
      })
      setReward(result.reward)
      setShowToast(result.reward.awarded)
      onRated?.(result)
    } catch (error) {
      setServerError(error)
    }
  }

  // El cuerpo es el mismo; solo cambia el contenedor según el ancho.
  const body = (
    <>
      {reward ? (
        <Stack gap="md">
          <Alert
            variant="light"
            color={reward.awarded ? 'teal' : 'gray'}
            title={t('feedback.reward.title')}
          >
            <Text size="sm">
              {t(outcomeKey(reward, isAuthenticated), { points: reward.points })}
            </Text>
          </Alert>
          {reward.awarded && (
            <Text size="sm" c="dimmed">
              {t('feedback.reward.balance', { balance: reward.balance })}
            </Text>
          )}
          <Button onClick={onClose}>{t('common.close')}</Button>
        </Stack>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              {t(`enums.line.${generation.line}`)}
              {generation.suggestedSize ? ` · ${generation.suggestedSize.code}` : ''}
            </Text>

            <SegmentedControl
              fullWidth
              aria-label={t('feedback.rate')}
              value={rating ?? ''}
              onChange={setRating}
              data={RATINGS.map((value) => ({
                value,
                label: t(`enums.rating.${value}`),
              }))}
            />

            <Textarea
              label={t('feedback.comment')}
              placeholder={t('feedback.commentPlaceholder')}
              value={comment}
              onChange={(event) => setComment(event.currentTarget.value)}
              minRows={3}
              maxLength={280}
            />

            {fieldError && (
              <Text c="red" size="sm" role="alert">
                {fieldError}
              </Text>
            )}
            {serverError && (
              <ErrorState error={serverError} onRetry={() => setServerError(null)} />
            )}

            <Button type="submit" loading={submit.isPending}>
              {t('feedback.submit')}
            </Button>
          </Stack>
        </form>
      )}

      {showToast && reward?.awarded && (
        <PointsToast points={reward.points} onClose={() => setShowToast(false)} />
      )}
    </>
  )

  const wrapperProps = {
    opened,
    onClose,
    title: t('feedback.title'),
    closeButtonProps: { 'aria-label': t('common.close') },
  }

  return isDesktop ? (
    <Modal {...wrapperProps} centered size="lg">
      {body}
    </Modal>
  ) : (
    <Drawer {...wrapperProps} position="bottom" size="md">
      {body}
    </Drawer>
  )
}
