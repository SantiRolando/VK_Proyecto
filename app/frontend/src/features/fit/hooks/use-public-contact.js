import { sizeService } from '@api/services/size-service.js'
import { useQuery } from '@tanstack/react-query'

// Destino de contacto de VK (SETTING) para la derivación a atención
// personalizada desde el estado "fuera de rango".
export function usePublicContact() {
  return useQuery({
    queryKey: ['public-contact'],
    queryFn: sizeService.getPublicContact,
    staleTime: 5 * 60_000,
  })
}
