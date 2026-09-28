import { sizeService } from '@api/services/size-service.js'
import { useQuery } from '@tanstack/react-query'

// Historial de generaciones por perfil (US6/FR-020). `profileId` null = todas.
export function useHistory(profileId) {
  return useQuery({
    queryKey: ['size-generations', profileId ?? 'all'],
    queryFn: () => sizeService.listGenerations(profileId ? { profileId } : undefined),
  })
}
