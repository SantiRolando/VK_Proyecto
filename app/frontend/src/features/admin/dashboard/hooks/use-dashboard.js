import { adminAnalyticsService } from '@api/services/admin-analytics-service.js'
import { useQuery } from '@tanstack/react-query'

// KPIs del dashboard (US8). El rango de fechas entra en la query key, así que
// cambiar el filtro vuelve a pedir los datos.

export function useConversion(range) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'conversion', range],
    queryFn: () => adminAnalyticsService.conversion(range),
  })
}

export function usePrecision(range) {
  return useQuery({
    queryKey: ['admin', 'analytics', 'precision', range],
    queryFn: () => adminAnalyticsService.precision(range),
  })
}

export function useCriticalStock() {
  return useQuery({
    queryKey: ['admin', 'analytics', 'critical-stock'],
    queryFn: adminAnalyticsService.criticalStock,
  })
}
