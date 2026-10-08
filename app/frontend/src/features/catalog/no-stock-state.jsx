import { routes } from '@app/routes.js'
import { lineToSlug } from '@constants/lines.js'
import { RestockSubscribe } from '@features/catalog/restock-subscribe.jsx'
import { useI18n } from '@i18n/context.js'
import { Alert, Group, Stack, Text, UnstyledButton } from '@mantine/core'
import { IconCircleOff } from '@tabler/icons-react'
import { useNavigate } from 'react-router'

/*
  Estado sin stock: mensaje explícito + aviso de reposición + talles
  adyacentes rotulados como NO recomendados.
*/
export function NoStockState({ meta, line, generationId }) {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <Stack gap="md">
      <Alert
        variant="light"
        color="orange"
        title={t('catalog.noStock.title')}
        icon={<IconCircleOff size={18} />}
      >
        <Text size="sm">{t('catalog.noStock.body', { size: meta.size.code })}</Text>
      </Alert>

      <RestockSubscribe line={meta.line ?? line} sizeId={meta.size.id} />

      {meta.adjacentSizes.length > 0 && (
        <Stack gap="xs">
          <Text fw={600}>{t('catalog.noStock.adjacent')}</Text>
          <Group gap="xs">
            {meta.adjacentSizes.map((size) => (
              <UnstyledButton
                key={size.id}
                component="button"
                type="button"
                style={{
                  border: '1px solid var(--mantine-color-gray-4)',
                  borderRadius: 'var(--mantine-radius-xl)',
                  padding: '4px 14px',
                }}
                onClick={() =>
                  navigate(
                    routes.catalog({
                      line: line ?? lineToSlug(meta.line),
                      sizeId: size.id,
                      generationId,
                    }),
                  )
                }
              >
                <Text size="sm" fw={500}>
                  {size.code}
                </Text>
              </UnstyledButton>
            ))}
          </Group>
          <Text size="xs" c="dimmed">
            {t('catalog.noStock.adjacentHint')}
          </Text>
        </Stack>
      )}
    </Stack>
  )
}
