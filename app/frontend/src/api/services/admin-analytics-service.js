// KPIs del dashboard y los reportes de analítica del panel.

import { apiClient } from '@api/client/api-client.js'

export const adminAnalyticsService = {
  conversion: (params) => apiClient.get('/admin/analytics/conversion', params),
  precision: (params) => apiClient.get('/admin/analytics/precision', params),
  criticalStock: () => apiClient.get('/admin/analytics/critical-stock'),
  // El reporte devuelve la grilla de medidas faltantes, no una lista de items.
  missingSizes: (params) =>
    apiClient
      .getList('/admin/analytics/missing-sizes', params)
      .then(({ items, meta }) => ({ cells: items, meta })),
  comments: (params) => apiClient.getList('/admin/analytics/comments', params),
}
