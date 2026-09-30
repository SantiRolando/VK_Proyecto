import { sizeService } from '@api/services/size-service.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

// Califica una generación (US6/T080). La respuesta trae la recompensa, así que
// además del historial se refrescan puntos y cupones. El resultado público no
// trae la calificación: se copia a la caché desde la respuesta.
export function useSubmitFeedback() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ generationId, ...payload }) =>
      sizeService.submitFeedback(generationId, payload),
    onSuccess: (result, { generationId }) => {
      const rated = result?.generation
      if (rated) {
        queryClient.setQueryData(['size-generation', generationId], (current) =>
          current
            ? {
                ...current,
                rating: rated.rating,
                comment: rated.comment,
                ratedAt: rated.ratedAt,
              }
            : current,
        )
      }
      queryClient.invalidateQueries({ queryKey: ['size-generations'] })
      queryClient.invalidateQueries({ queryKey: ['points'] })
      queryClient.invalidateQueries({ queryKey: ['my-coupons'] })
    },
  })
}
