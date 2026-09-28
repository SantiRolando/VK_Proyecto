import { useI18n } from '@i18n/context.js'
import { Alert, Button, Text } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

// Estado de error consistente (FR-029): traduce el código del contrato
// (`errors.<CODE>`) y ofrece reintento si se pasa `onRetry`.
export function ErrorState({ error, onRetry }) {
  const { t } = useI18n()
  const code = error?.code
  const message = code ? t(`errors.${code}`) : t('common.error')

  return (
    <Alert
      variant="light"
      color="red"
      title={t('common.error')}
      icon={<IconAlertCircle size={18} />}
    >
      <Text size="sm">{message}</Text>
      {onRetry && (
        <Button variant="light" color="red" size="sm" mt="sm" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      )}
    </Alert>
  )
}
