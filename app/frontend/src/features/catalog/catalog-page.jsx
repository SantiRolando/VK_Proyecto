import { routes } from '@app/routes.js'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { useCatalog } from '@features/catalog/hooks/use-catalog.js'
import { NoStockState } from '@features/catalog/no-stock-state.jsx'
import { ProductCard } from '@features/catalog/product-card.jsx'
import { useI18n } from '@i18n/context.js'
import { Alert, Button, Container, SimpleGrid, Stack } from '@mantine/core'
import { IconInfoCircle, IconRuler } from '@tabler/icons-react'
import { useNavigate, useSearchParams } from 'react-router'

// Catálogo (US3). Sin talle recomendado se puede explorar igual: se listan los
// productos de la línea y se avisa que la experiencia mejora eligiendo un talle,
// porque el catálogo filtrado solo muestra lo disponible en ese talle
// (bug squash sesión #1: antes esta pantalla quedaba bloqueada).
export function CatalogPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const sizeId = searchParams.get('sizeId')
  const line = searchParams.get('line')
  const generationId = searchParams.get('generationId')
  const query = useCatalog({ line, sizeId })

  const meta = query.data?.meta
  // `hasStock` es `null` cuando no se filtró por talle.
  const filteredBySize = Boolean(sizeId)

  return (
    <Container size="lg" py="xl">
      <PageHeader
        title={t('catalog.title')}
        subtitle={
          meta?.size ? `${t('catalog.size')}: ${meta.size.code}` : t('catalog.subtitle')
        }
      />

      <Stack gap="md">
        {!filteredBySize && (
          <Alert variant="light" color="blue" icon={<IconInfoCircle size={18} />}>
            <Stack gap="xs" align="flex-start">
              <div>
                <strong>{t('catalog.noSize.title')}</strong>
                <br />
                {t('catalog.noSize.body')}
              </div>
              <Button
                size="xs"
                variant="light"
                leftSection={<IconRuler size={14} />}
                onClick={() => navigate(routes.fit())}
              >
                {t('catalog.noSize.cta')}
              </Button>
            </Stack>
          </Alert>
        )}

        <QueryBoundary
          isLoading={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={query.refetch}
        >
          {query.data &&
            (query.data.meta.hasStock === false && filteredBySize ? (
              <NoStockState
                meta={query.data.meta}
                line={line}
                generationId={generationId}
              />
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {query.data.items.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    sizeId={sizeId}
                    generationId={generationId}
                  />
                ))}
              </SimpleGrid>
            ))}
        </QueryBoundary>
      </Stack>
    </Container>
  )
}
