import { adminInventoryService } from '@api/services/admin-inventory-service.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Inventario y movimientos del panel (US9).

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

function useVariantMutation(mutationFn) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'variants'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-product'] })
    },
  })
}

export function useCreateVariant() {
  return useVariantMutation(adminInventoryService.createVariant)
}

export function useUpdateVariant() {
  return useVariantMutation(({ variantId, ...payload }) =>
    adminInventoryService.updateVariant(variantId, payload),
  )
}
