// Service de recompensas (US6/T079): saldo y movimientos de puntos, plantillas
// canjeables, canje y "mis cupones". Solo conoce paths y DTOs (§6.2).

import { apiClient } from '@api/client/api-client.js'

export const rewardsService = {
  getPoints: () => apiClient.get('/me/points'),
  listTemplates: () => apiClient.get('/rewards'),
  redeem: (couponId) => apiClient.post(`/rewards/${couponId}/redeem`),
  listMyCoupons: () => apiClient.get('/me/coupons'),
}
