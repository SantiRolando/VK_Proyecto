// Clientes registrados: el insumo del modo asistente.

import { apiClient } from '@api/client/api-client.js'

export const adminCustomersService = {
  list: () => apiClient.getList('/admin/customers'),
}
