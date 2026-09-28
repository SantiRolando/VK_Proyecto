// Service de cupones del panel (US11/T097): plantillas y cupones (§6.2).

import { apiClient } from '@api/client/api-client.js'

export const adminCouponsService = {
  list: () =>
    apiClient
      .request({ method: 'GET', url: '/admin/coupons' })
      .then((response) => ({ items: response.data, meta: response.meta })),
  create: (payload) => apiClient.post('/admin/coupons', payload),
  update: (couponId, payload) => apiClient.patch(`/admin/coupons/${couponId}`, payload),
}
