import { adminInventoryService } from '@api/services/admin-inventory-service.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/*
  Inventario y movimientos del panel. Las variantes se administran en
  `catalog-admin/hooks/use-products.js`.
*/

export function useInventory(filters) {
  return useQuery({
    queryKey: ['admin', 'variants', filters],
    queryFn: () => adminInventoryService.listVariants(filters),
  })
}

export function useMovements(filters) {
  return useQuery({
    queryKey: ['admin', 'movements', filters],
    queryFn: () => adminInventoryService.listTransactions(filters),
  })
}

// Motivos del formulario de ajuste, con la dirección que impone cada uno.
export function useStockReasons() {
  return useQuery({
    queryKey: ['admin', 'stock-reasons'],
    queryFn: adminInventoryService.listReasons,
  })
}

// Un movimiento cambia el físico (y puede notificar alertas): se refrescan
// inventario, catálogo del cliente, stock crítico y el listado de movimientos.
export function useAdjustStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminInventoryService.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'variants'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'movements'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-product'] })
    },
  })
}
