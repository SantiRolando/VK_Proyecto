/*
  Recompensas: saldo y movimientos de puntos, plantillas canjeables, canje y "mis cupones".
*/

import { apiClient } from '@api/client/api-client.js'

export const rewardsService = {
  getPoints: () => apiClient.get('/me/points'),
  listTemplates: () => apiClient.get('/rewards'),
  redeem: (couponId) => apiClient.post(`/rewards/${couponId}/redeem`),
  listMyCoupons: () => apiClient.get('/me/coupons'),
}
