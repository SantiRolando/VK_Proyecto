import { alertsService } from '@api/services/alerts-service.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

// Cancela una suscripción completa (todas las alertas del grupo línea × talle).
export function useCancelRestock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (alertIds) =>
      Promise.all(alertIds.map((alertId) => alertsService.cancel(alertId))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restock-alerts'] })
    },
  })
}
