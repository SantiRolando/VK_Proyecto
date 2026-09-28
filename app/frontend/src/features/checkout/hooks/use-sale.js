import { salesService } from '@api/services/sales-service.js'
import { useQuery } from '@tanstack/react-query'

// Detalle de una compra propia (T063): la confirmación lo usa tal cual, así
// que al recargar la página el mensaje de coordinación se vuelve a armar.
export function useSale(saleId) {
  return useQuery({
    queryKey: ['sale', saleId],
    queryFn: () => salesService.getMine(saleId),
    enabled: Boolean(saleId),
  })
}
