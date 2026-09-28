import { adminSalesService } from '@api/services/admin-sales-service.js'
import { useQuery } from '@tanstack/react-query'

// Detalle de una venta para el panel (US7/T069).
export function useAdminSale(saleId) {
  return useQuery({
    queryKey: ['admin', 'sale', saleId],
    queryFn: () => adminSalesService.get(saleId),
    enabled: Boolean(saleId),
  })
}
