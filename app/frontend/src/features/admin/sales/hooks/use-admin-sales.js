import { adminSalesService } from '@api/services/admin-sales-service.js'
import { useQuery } from '@tanstack/react-query'

// Listado de ventas del panel (US7). `filters` llega normalizado para que la
// query key sea estable (null en lugar de undefined).
export function useAdminSales(filters) {
  return useQuery({
    queryKey: ['admin', 'sales', filters],
    queryFn: () => adminSalesService.list(filters),
  })
}
