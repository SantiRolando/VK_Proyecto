import { adminUsersService } from '@api/services/admin-users-service.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Padrón de usuarios del panel. `params` acepta `{ role, active }`.
export function useUsers(params = {}) {
  return useQuery({
    queryKey: ['admin', 'users', params.role ?? 'all', params.active ?? 'all'],
    queryFn: () => adminUsersService.list(params),
  })
}

export function useUsersAnalytics() {
  return useQuery({
    queryKey: ['admin', 'users', 'analytics'],
    queryFn: adminUsersService.analytics,
  })
}

// Otorgar o revocar admin. Invalida el padrón y sus indicadores: los conteos de
// admin y la actividad cambian con el rol.
export function useSetUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, type }) => adminUsersService.setRole(userId, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] })
    },
  })
}
