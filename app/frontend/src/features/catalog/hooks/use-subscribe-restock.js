import { alertsService } from '@api/services/alerts-service.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

// Suscribe al aviso de reposición de una línea × talle (crea una alerta por
// variante en el controller). Requiere sesión.
export function useSubscribeRestock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: alertsService.subscribe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restock-alerts'] })
    },
  })
}
