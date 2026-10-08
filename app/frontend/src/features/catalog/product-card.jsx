import { routes } from '@app/routes.js'
import { Money } from '@components/money.jsx'
import { colorHex, colorLabel } from '@constants/colors.js'
import { useI18n } from '@i18n/context.js'
import { Button, Card, ColorSwatch, Group, Stack, Text } from '@mantine/core'
import { useNavigate } from 'react-router'

/*
  Tarjeta de producto del catálogo.

  Con `sizeId`, solo se listan los colores con unidades disponibles en el talle
  consultado. Sin `sizeId` (catálogo exploratorio) el producto no trae variantes,
  así que **no** se muestra "0 unidades disponibles": la disponibilidad es
  desconocida, no cero, y decir cero sería mentir sobre el stock.
*/
export function ProductCard({ product, sizeId, generationId }) {
  const { t } = useI18n()
  const navigate = useNavigate()

  const totalAvailable = product.variants.reduce(
    (sum, variant) => sum + variant.available,
    0,
  )

  return (
    <Card withBorder radius="md" padding="md">
      <Stack gap="xs" h="100%">
        <Text fw={700}>{product.model}</Text>
        {product.description && (
          <Text size="sm" c="dimmed">
            {product.description}
          </Text>
        )}

        <Text fw={600}>
          <Money value={product.price} />
        </Text>

        {sizeId && product.variants.length > 0 && (
          <Group gap="xs">
            {product.variants.map((variant) => (
              <ColorSwatch
                key={variant.id}
                color={colorHex(variant.color)}
                size={20}
                role="img"
                aria-label={colorLabel(variant.color)}
                title={colorLabel(variant.color)}
              />
            ))}
          </Group>
        )}

        <Text size="xs" c="dimmed">
          {sizeId
            ? t('catalog.available', { count: totalAvailable })
            : t('catalog.pickSizeHint')}
        </Text>

        <Button
          variant="light"
          mt="auto"
          onClick={() => navigate(routes.product(product.id, { sizeId, generationId }))}
        >
          {t('catalog.view')}
        </Button>
      </Stack>
    </Card>
  )
}
