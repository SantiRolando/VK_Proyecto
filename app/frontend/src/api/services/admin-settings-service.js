// Service de reglas del juego (US11/T097): lectura y edición en bloque de
// SETTING (§6.2).

import { apiClient } from '@api/client/api-client.js'

export const adminSettingsService = {
  get: () => apiClient.get('/admin/settings'),
  update: (payload) => apiClient.patch('/admin/settings', payload),
}
