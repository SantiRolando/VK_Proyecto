import { sizeService } from '@api/services/size-service.js'
import { useQuery } from '@tanstack/react-query'

// Detalle de una generación de talle (solo el dueño puede verla).
export function useGeneration(generationId) {
  return useQuery({
    queryKey: ['size-generation', generationId],
    queryFn: () => sizeService.getGeneration(generationId),
    enabled: Boolean(generationId),
  })
}
