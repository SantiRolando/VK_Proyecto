import { useI18n } from '@i18n/context.js'
import { Affix, Notification } from '@mantine/core'
import { IconSparkles } from '@tabler/icons-react'
import { useEffect } from 'react'

// Aviso flotante del premio por feedback (US6/T080). Se cierra solo a los
// pocos segundos; el detalle del resultado queda en el drawer.
export function PointsToast({ points, onClose, autoHideMs = 5000 }) {
  const { t } = useI18n()

  useEffect(() => {
    if (!autoHideMs) return undefined
    const timer = setTimeout(onClose, autoHideMs)
    return () => clearTimeout(timer)
  }, [autoHideMs, onClose])

  return (
    <Affix position={{ bottom: 76, right: 16 }} zIndex={400}>
      <Notification
        role="status"
        color="teal"
        icon={<IconSparkles size={18} />}
        title={t('feedback.toast.title')}
        onClose={onClose}
        closeButtonProps={{ 'aria-label': t('common.close') }}
        w={{ base: 280, xs: 320 }}
      >
        {t('feedback.toast.body', { points })}
      </Notification>
    </Affix>
  )
}
