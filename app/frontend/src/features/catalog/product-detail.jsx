import { routes } from '@app/routes.js'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { Money } from '@components/money.jsx'
import { colorHex, colorLabel } from '@constants/colors.js'
import { lineToSlug } from '@constants/lines.js'
import { useProduct } from '@features/catalog/hooks/use-product.js'
import { useI18n } from '@i18n/context.js'
import {
  Badge,
  Button,
  Card,
  ColorSwatch,
  Container,
  Group,
  Stack,
  Text,
  Title,
  UnstyledButton,
} from '@mantine/core'
import { IconArrowLeft, IconShoppingCart } from '@tabler/icons-react'
import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'

// Detalle de producto (US3): colores del talle seleccionado con su
// disponibilidad; los agotados no son seleccionables.
export function ProductDetailPage() {
  const { t } = useI18n()
  const { productId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sizeId = searchParams.get('sizeId')
  const generationId = searchParams.get('generationId')
  const query = useProduct(productId, sizeId)

  const [selectedVariantId, setSelectedVariantId] = useState(null)

  const product = query.data
  const availableColors = product?.colors ?? []
  const selected =
    availableColors.find((color) => color.id === selectedVariantId) ??
    availableColors.find((color) => color.available > 0) ??
    null

  return (
    <Container size="md" py="xl">
      <QueryBoundary
        isLoading={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={query.refetch}
      >
        {product && (
          <Stack gap="lg">
            <Button
              variant="subtle"
              size="compact-sm"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() =>
                navigate(
                  routes.catalog({
                    line: lineToSlug(product.line),
                    sizeId: product.selectedSize?.id,
                    generationId,
                  }),
                )
              }
            >
              {t('catalog.detail.back')}
            </Button>

            <div>
              <Title order={1}>{product.model}</Title>
              <Group gap="xs" mt="xs">
                <Badge variant="light" color="vikinga">
                  {t(`enums.line.${product.line}`)}
                </Badge>
                {product.selectedSize && (
                  <Badge variant="outline" color="gray">
                    {t('catalog.size')}: {product.selectedSize.code}
                  </Badge>
                )}
              </Group>
              {product.description && (
                <Text c="dimmed" mt="sm">
                  {product.description}
                </Text>
              )}
              <Text fw={700} size="xl" mt="sm">
                <Money value={product.price} />
              </Text>
            </div>

            <Card withBorder radius="md" padding="md">
              <Stack gap="md">
                <div>
                  <Text fw={600} mb="xs">
                    {t('catalog.detail.colors')}
                  </Text>
                  <Group gap="md">
                    {availableColors.map((color) => {
                      const soldOut = color.available <= 0
                      const isSelected = selected?.id === color.id
                      return (
                        <UnstyledButton
                          key={color.id}
                          disabled={soldOut}
                          onClick={() => setSelectedVariantId(color.id)}
                          style={{
                            opacity: soldOut ? 0.4 : 1,
                            cursor: soldOut ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Stack gap={4} align="center">
                            <ColorSwatch
                              color={colorHex(color.color)}
                              size={28}
                              style={{
                                outline: isSelected
                                  ? '2px solid var(--mantine-color-vikinga-6)'
                                  : 'none',
                                outlineOffset: 2,
                              }}
                            />
                            <Text size="xs">{colorLabel(color.color)}</Text>
                            <Text size="xs" c={soldOut ? 'red' : 'dimmed'}>
                              {soldOut
                                ? t('catalog.detail.soldOut')
                                : t('catalog.available', { count: color.available })}
                            </Text>
                          </Stack>
                        </UnstyledButton>
                      )
                    })}
                  </Group>
                </div>

                {product.sizes.length > 1 && (
                  <div>
                    <Text fw={600} mb="xs">
                      {t('catalog.detail.sizes')}
                    </Text>
                    <Group gap="xs">
                      {product.sizes.map((size) => (
                        <Button
                          key={size.id}
                          variant={
                            size.id === product.selectedSize?.id ? 'filled' : 'outline'
                          }
                          color={
                            size.id === product.selectedSize?.id ? 'vikinga' : 'gray'
                          }
                          size="compact-md"
                          onClick={() =>
                            navigate(
                              routes.product(product.id, {
                                sizeId: size.id,
                                generationId,
                              }),
                            )
                          }
                        >
                          {size.code}
                        </Button>
                      ))}
                    </Group>
                  </div>
                )}
              </Stack>
            </Card>

            <Button
              size="lg"
              disabled={!selected}
              leftSection={<IconShoppingCart size={18} />}
              onClick={() =>
                navigate(
                  routes.checkout({
                    variantId: selected.id,
                    productId: product.id,
                    sizeId: product.selectedSize?.id,
                    generationId,
                  }),
                )
              }
            >
              {t('catalog.detail.buy')}
            </Button>
          </Stack>
        )}
      </QueryBoundary>
    </Container>
  )
}
