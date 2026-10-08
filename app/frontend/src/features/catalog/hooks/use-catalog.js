import { catalogService } from '@api/services/catalog-service.js'
import { useQuery } from '@tanstack/react-query'

/*
  Catálogo. `sizeId` es OPCIONAL: sin talle se listan todos los productos
  activos de la línea y la pantalla avisa que la experiencia mejora midiendo el
  talle.

  Ojo con volver a poner `enabled: Boolean(sizeId)` acá: en TanStack Query una
  consulta deshabilitada queda en `isPending` para siempre, así que la pantalla
  se quedaba con los esqueletos y nunca mostraba nada.
*/
export function useCatalog({ line, sizeId } = {}) {
  return useQuery({
    queryKey: ['catalog', line ?? null, sizeId ?? null],
    queryFn: () => catalogService.list({ line, sizeId }),
  })
}
