import { Button, Card, ColorSwatch, Group, Stack, Text } from '@mantine/core'
import { useNavigate } from 'react-router'
import { useI18n } from '../../i18n/context.js'
import { Money } from '../../components/money.jsx'
import { colorHex, colorLabel } from '../../constants/colors.js'
import { routes } from '../../app/routes.js'

// Tarjeta de producto del catálogo filtrado (US3): solo colores con unidades
// disponibles en el talle consultado.
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

        <Group gap="xs">
          {product.variants.map((variant) => (
            <ColorSwatch
              key={variant.id}
              color={colorHex(variant.color)}
              size={20}
              title={colorLabel(variant.color)}
            />
          ))}
        </Group>

        <Text size="xs" c="dimmed">
          {t('catalog.available', { count: totalAvailable })}
        </Text>

        <Button
          variant="light"
          mt="auto"
          onClick={() =>
            navigate(routes.product(product.id, { sizeId, generationId }))
          }
        >
          {t('catalog.view')}
        </Button>
      </Stack>
    </Card>
  )
}
