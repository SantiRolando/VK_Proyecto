// Reglas del juego: lectura y edición en bloque.

import { apiClient } from '@api/client/api-client.js'

export const adminSettingsService = {
  get: () => apiClient.get('/admin/settings'),
  update: (payload) => apiClient.patch('/admin/settings', payload),
}
