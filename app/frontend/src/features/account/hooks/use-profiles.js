import { profilesService } from '@api/services/profiles-service.js'
import { useActiveProfile } from '@features/account/active-profile-context.js'
import { useAuth } from '@features/auth/auth-context.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Perfiles de medidas del cliente (US5/T072). Solo consulta con sesión, así el
// selector global y el formulario de medición pueden usarlo sin preguntar.
export function useProfiles() {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: ['profiles'],
    queryFn: profilesService.listMine,
    enabled: isAuthenticated,
  })
}

// Perfil activo resuelto: el elegido en el selector o, si no hay, el
// predeterminado. Evita repetir la resolución en cada pantalla.
export function useResolvedProfile() {
  const { profileId } = useActiveProfile()
  const query = useProfiles()
  const profiles = query.data ?? []

  const profile =
    profiles.find((candidate) => candidate.id === profileId) ??
    profiles.find((candidate) => candidate.isDefault) ??
    null

  return { profile, profiles, isPending: query.isPending }
}

function useProfileMutation(mutationFn) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
      // El historial se separa por perfil: cambiarlo afecta a esas pantallas.
      queryClient.invalidateQueries({ queryKey: ['size-generations'] })
    },
  })
}

export function useCreateProfile() {
  return useProfileMutation(profilesService.create)
}

export function useUpdateProfile() {
  return useProfileMutation(({ profileId, ...payload }) =>
    profilesService.update(profileId, payload),
  )
}

export function useDeleteProfile() {
  return useProfileMutation((profileId) => profilesService.remove(profileId))
}

export function useSetDefaultProfile() {
  return useProfileMutation((profileId) => profilesService.setDefault(profileId))
}
