import { adminSettingsService } from '@api/services/admin-settings-service.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Reglas del juego: lectura en bloque y guardado.

export function useSettings() {
  return useQuery({ queryKey: ['admin', 'settings'], queryFn: adminSettingsService.get })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminSettingsService.update,
    onSuccess: (data) => {
      queryClient.setQueryData(['admin', 'settings'], data)
      // El contacto público y las reglas de puntos alimentan otras pantallas.
      queryClient.invalidateQueries({ queryKey: ['public-contact'] })
    },
  })
}
