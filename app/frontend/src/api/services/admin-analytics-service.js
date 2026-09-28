// Service de analítica del panel (US8/T085): KPIs del dashboard (§6.2).

import { apiClient } from '@api/client/api-client.js'

export const adminAnalyticsService = {
  conversion: (params) => apiClient.get('/admin/analytics/conversion', params),
  precision: (params) => apiClient.get('/admin/analytics/precision', params),
  criticalStock: () => apiClient.get('/admin/analytics/critical-stock'),
}
