import { apiClient } from '@api/client/api-client.js'

export const adminUsersService = {
  list: (params) => apiClient.get('/admin/users', params),
  analytics: () => apiClient.get('/admin/users/analytics'),
  setRole: (userId, type) => apiClient.patch(`/admin/users/${userId}/role`, { type }),
}
