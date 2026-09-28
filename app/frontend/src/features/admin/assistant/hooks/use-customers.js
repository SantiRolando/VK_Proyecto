import { adminCustomersService } from '@api/services/admin-customers-service.js'
import { useQuery } from '@tanstack/react-query'

// Clientes registrados (US12/T100): se usan para vincular una generación
// hecha en modo asistente.
export function useCustomers() {
  return useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: adminCustomersService.list,
  })
}
