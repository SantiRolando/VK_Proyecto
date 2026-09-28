// Service de analítica del panel (US8/T085): KPIs del dashboard (§6.2).

import { apiClient } from '@api/client/api-client.js'

export const adminAnalyticsService = {
  conversion: (params) => apiClient.get('/admin/analytics/conversion', params),
  precision: (params) => apiClient.get('/admin/analytics/precision', params),
  criticalStock: () => apiClient.get('/admin/analytics/critical-stock'),
  // Los dos reportes de US10 traen `meta` (la grilla del mapa, el total).
  missingSizes: (params) =>
    apiClient
      .request({ method: 'GET', url: '/admin/analytics/missing-sizes', params })
      .then((response) => ({ cells: response.data, meta: response.meta })),
  comments: (params) =>
    apiClient
      .request({ method: 'GET', url: '/admin/analytics/comments', params })
      .then((response) => ({ items: response.data, meta: response.meta })),
}
