import { catalogService } from '@api/services/catalog-service.js'
import { useQuery } from '@tanstack/react-query'

// Catálogo filtrado por talle (US3). Sin `sizeId` no consulta: la pantalla
// muestra el estado "primero medí tu talle".
export function useCatalog({ line, sizeId }) {
  return useQuery({
    queryKey: ['catalog', line ?? null, sizeId ?? null],
    queryFn: () => catalogService.list({ line, sizeId }),
    enabled: Boolean(sizeId),
  })
}
