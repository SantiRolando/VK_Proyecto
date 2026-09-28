import { alertsService } from '@api/services/alerts-service.js'
import { useQuery } from '@tanstack/react-query'

// Suscripciones de reposición del cliente, agrupadas por línea × talle.
export function useRestockAlerts() {
  return useQuery({
    queryKey: ['restock-alerts'],
    queryFn: alertsService.listMine,
  })
}
