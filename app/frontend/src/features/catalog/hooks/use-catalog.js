import { catalogService } from '@api/services/catalog-service.js'
import { useQuery } from '@tanstack/react-query'

/*
  Catálogo. `sizeId` es OPCIONAL: sin talle se listan todos los productos activos de la línea.

  Ojo con volver a poner `enabled: Boolean(sizeId)`: una consulta deshabilitada queda en
  `isPending` para siempre y la pantalla se queda con los esqueletos.
*/
export function useCatalog({ line, sizeId } = {}) {
  return useQuery({
    queryKey: ['catalog', line ?? null, sizeId ?? null],
    queryFn: () => catalogService.list({ line, sizeId }),
  })
}
