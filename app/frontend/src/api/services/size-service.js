// Service de talles y generaciones (US1): solo conoce paths y DTOs (§6.2).

import { apiClient } from '../client/api-client.js'

export const sizeService = {
  createGeneration: (payload) => apiClient.post('/size-generations', payload),
  getGeneration: (generationId) => apiClient.get(`/size-generations/${generationId}`),
  listGenerations: (params) => apiClient.get('/size-generations', params),
  getSizes: (params) => apiClient.get('/sizes', params),
  getPublicContact: () => apiClient.get('/public/contact'),
}
