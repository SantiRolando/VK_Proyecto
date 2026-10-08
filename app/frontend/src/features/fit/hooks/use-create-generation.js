import { sizeService } from '@api/services/size-service.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

/*
  Crea una generación de talle (el cálculo vive en el controller mock).
  Al crear, invalida el historial para que las pantallas que lo leen se
  refresquen.
*/
export function useCreateGeneration() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: sizeService.createGeneration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['size-generations'] })
    },
  })
}
