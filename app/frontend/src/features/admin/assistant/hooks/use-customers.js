import { adminCustomersService } from '@api/services/admin-customers-service.js'
import { useQuery } from '@tanstack/react-query'

/*
  Clientes registrados: se usan para vincular una generación hecha en
  modo asistente. La consulta es de admin, así que se puede desactivar para que
  no dispare en la pantalla de medición de un cliente común.
*/
export function useCustomers({ enabled = true } = {}) {
  return useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: adminCustomersService.list,
    enabled,
  })
}
