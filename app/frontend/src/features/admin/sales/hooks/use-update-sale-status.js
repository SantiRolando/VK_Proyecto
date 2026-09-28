import { adminSalesService } from '@api/services/admin-sales-service.js'
import { useMutation, useQueryClient } from '@tanstack/react-query'

// Mueve la venta de estado (US7/T067). Confirmar descuenta stock y cancelar
// libera la reserva, así que además del panel se refresca el catálogo y el
// inventario (US9).
export function useUpdateSaleStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ saleId, status }) => adminSalesService.updateStatus(saleId, status),
    onSuccess: (sale) => {
      queryClient.setQueryData(['admin', 'sale', sale.id], sale)
      queryClient.invalidateQueries({ queryKey: ['admin', 'sales'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-product'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] })
    },
  })
}
