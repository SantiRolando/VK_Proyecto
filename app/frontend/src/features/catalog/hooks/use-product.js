import { useQuery } from '@tanstack/react-query'
import { catalogService } from '../../../api/services/catalog-service.js'

// Detalle de producto con los colores y su disponibilidad en el talle
// seleccionado (US3).
export function useProduct(productId, sizeId) {
  return useQuery({
    queryKey: ['catalog-product', productId, sizeId ?? null],
    queryFn: () => catalogService.get(productId, { sizeId }),
    enabled: Boolean(productId),
  })
}
