// Service de clientes registrados (US12/T100): insumo del modo asistente.

import { apiClient } from '@api/client/api-client.js'

export const adminCustomersService = {
  list: () =>
    apiClient
      .request({ method: 'GET', url: '/admin/customers' })
      .then((response) => ({ items: response.data, meta: response.meta })),
}
