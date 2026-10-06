// Plantillas de cupón y cupones del panel.

import { apiClient } from '@api/client/api-client.js'

export const adminCouponsService = {
  list: () => apiClient.getList('/admin/coupons'),
  create: (payload) => apiClient.post('/admin/coupons', payload),
  update: (couponId, payload) => apiClient.patch(`/admin/coupons/${couponId}`, payload),
}
