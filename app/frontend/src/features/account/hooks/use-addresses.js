import { addressesService } from '@api/services/addresses-service.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/*
  Agenda de direcciones del cliente: la usa el checkout para elegir
  el destino y la pantalla de cuenta para administrarla.
*/
export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: addressesService.listMine,
  })
}

function useAddressMutation(mutationFn) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
  })
}

export function useCreateAddress() {
  return useAddressMutation(addressesService.create)
}

export function useUpdateAddress() {
  return useAddressMutation(({ addressId, ...payload }) =>
    addressesService.update(addressId, payload),
  )
}

export function useDeleteAddress() {
  return useAddressMutation((addressId) => addressesService.remove(addressId))
}

export function useSetDefaultAddress() {
  return useAddressMutation((addressId) => addressesService.setDefault(addressId))
}
