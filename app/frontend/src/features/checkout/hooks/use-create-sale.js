import { salesService } from '@api/services/sales-service.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

// Crea la venta y reserva el stock (T060). La reserva cambia el disponible
// que muestra el catálogo, así que además de invalidar las otras compras se
// refresca el catálogo y el detalle de producto.
export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: salesService.create,
    onSuccess: (sale) => {
      // La confirmación ya tiene la venta con el mensaje de coordinación.
      queryClient.setQueryData(['sale', sale.id], sale)
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-product'] })
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}
