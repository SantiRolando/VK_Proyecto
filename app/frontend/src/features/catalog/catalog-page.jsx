import { routes } from '@app/routes.js'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { useCatalog } from '@features/catalog/hooks/use-catalog.js'
import { NoStockState } from '@features/catalog/no-stock-state.jsx'
import { ProductCard } from '@features/catalog/product-card.jsx'
import { useI18n } from '@i18n/context.js'
import { Button, Container, SimpleGrid } from '@mantine/core'
import { IconRuler } from '@tabler/icons-react'
import { useNavigate, useSearchParams } from 'react-router'

// Estado "primero medí tu talle" (FR-012): el catálogo solo muestra lo que
// hay disponible en el talle recomendado, así que sin talle no hay listado.
function NeedSizeState() {
  const { t } = useI18n()
  const navigate = useNavigate()

  return (
    <EmptyState
      icon={IconRuler}
      title={t('catalog.needSize.title')}
      description={t('catalog.needSize.body')}
      action={
        <Button
          mt="sm"
          leftSection={<IconRuler size={16} />}
          onClick={() => navigate(routes.fit())}
        >
          {t('catalog.needSize.cta')}
        </Button>
      }
    />
  )
}

// Catálogo filtrado por talle (US3): solo productos con unidades disponibles
// en el talle recomendado; sin stock → estado explícito con adyacentes.
export function CatalogPage() {
  const { t } = useI18n()
  const [searchParams] = useSearchParams()
  const sizeId = searchParams.get('sizeId')
  const line = searchParams.get('line')
  const generationId = searchParams.get('generationId')
  const query = useCatalog({ line, sizeId })

  const meta = query.data?.meta

  return (
    <Container size="lg" py="xl">
      <PageHeader
        title={t('catalog.title')}
        subtitle={
          meta?.size ? `${t('catalog.size')}: ${meta.size.code}` : t('catalog.subtitle')
        }
      />

      {!sizeId ? (
        <NeedSizeState />
      ) : (
        <QueryBoundary
          isLoading={query.isPending}
          isError={query.isError}
          error={query.error}
          onRetry={query.refetch}
        >
          {query.data &&
            (query.data.meta.hasStock ? (
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
            ) : (
              <NoStockState
                meta={query.data.meta}
                line={line}
                generationId={generationId}
              />
            ))}
        </QueryBoundary>
      )}
    </Container>
  )
}
