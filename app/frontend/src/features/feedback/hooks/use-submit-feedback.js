import { sizeService } from '@api/services/size-service.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

// Califica una generación (US6/T080). La respuesta trae la recompensa, así que
// además del historial se refrescan puntos y cupones.
export function useSubmitFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ generationId, ...payload }) =>
      sizeService.submitFeedback(generationId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['size-generations'] })
      queryClient.invalidateQueries({ queryKey: ['points'] })
      queryClient.invalidateQueries({ queryKey: ['my-coupons'] })
    },
  })
}
