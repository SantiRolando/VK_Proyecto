// Service de compras (US4): crear la venta, ver las propias y validar el
// cupón del checkout. Solo conoce paths y DTOs (§6.2).

import { apiClient } from '../client/api-client.js'

export const salesService = {
  create: (payload) => apiClient.post('/sales', payload),
  listMine: () => apiClient.get('/me/sales'),
  getMine: (saleId) => apiClient.get(`/me/sales/${saleId}`),
  validateCoupon: (payload) => apiClient.post('/coupons/validate', payload),
}
