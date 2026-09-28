import { adminAnalyticsService } from '@api/services/admin-analytics-service.js'
import { useQuery } from '@tanstack/react-query'

// Reportes de US10: demanda no satisfecha y comentarios del feedback.

export function useMissingSizes(filters) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'missing-sizes', filters],
    queryFn: () => adminAnalyticsService.missingSizes(filters),
  })
}

export function useComments(filters) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'comments', filters],
    queryFn: () => adminAnalyticsService.comments(filters),
  })
}
