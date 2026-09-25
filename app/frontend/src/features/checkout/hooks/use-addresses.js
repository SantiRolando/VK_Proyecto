import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addressesService } from '../../../api/services/addresses-service.js'

// Agenda de direcciones del cliente (T059/T060). El checkout la usa para
// elegir destino; US5 agrega la edición y la baja.
export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: addressesService.listMine,
  })
}

export function useCreateAddress() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: addressesService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })
}
