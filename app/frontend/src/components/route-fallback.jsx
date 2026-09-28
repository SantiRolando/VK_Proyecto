import { useI18n } from '@i18n/context.js'
import { Center, Loader } from '@mantine/core'

export function RouteFallback() {
  const { t } = useI18n()

  return (
    <Center h="100vh" role="status" aria-busy="true" aria-label={t('common.loading')}>
      <Loader />
    </Center>
  )
}
