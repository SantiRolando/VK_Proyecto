/*
  Alertas de stock crítico del panel contra `/admin/stock/alerts`. El listado trae también los
  avisos de reposición del cliente, así que el `service` deja donde están y la pantalla filtra
  por tipo.
*/

import { apiClient } from '@api/client/api-client.js'
import { alertStatusCodec, alertTypeCodec, decodePage } from '@api/wire.js'

const BASE = '/admin/stock/alerts'

/*
  El backend devuelve el tipo con la escritura `alerType`: se lee ese nombre y se expone como
  `alertType`.
*/
function decodeAlert(alert) {
  return {
    ...alert,
    alertType: alertTypeCodec.decode(alert.alerType),
    status: alertStatusCodec.decode(alert.status),
  }
}

export const adminStockAlertsService = {
  list: ({ status = null, page = 1, size = 100 } = {}) =>
    apiClient
      .get(BASE, { status: alertStatusCodec.encode(status), page, size })
      .then((result) => decodePage(result, decodeAlert)),

  notify: (alertId) => apiClient.patch(`${BASE}/${alertId}/notify`).then(decodeAlert),
}
