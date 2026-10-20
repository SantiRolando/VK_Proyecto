import { adminInventoryService } from '@api/services/admin-inventory-service.js'
import { adminStockAlertsService } from '@api/services/admin-stock-alerts-service.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/*
  Inventario, movimientos y alertas del panel. Las variantes se administran en
  `catalog-admin/hooks/use-products.js`.
*/

const INDEX_PAGE_SIZE = 100
const MAX_INDEX_PAGES = 5

export function useInventory({ onlyBelowMin, page, pageSize }) {
  return useQuery({
    queryKey: ['admin', 'inventory', { onlyBelowMin, page, pageSize }],
    queryFn: () => adminInventoryService.listInventory({ onlyBelowMin, page, pageSize }),
  })
}

// Las líneas de un movimiento y las alertas llegan con el `variantId` solo: este índice las
// traduce a SKU, modelo y talle.
export function useVariantIndex() {
  return useQuery({
    queryKey: ['admin', 'variant-index'],
    queryFn: async () => {
      const first = await adminInventoryService.listInventory({
        page: 1,
        pageSize: INDEX_PAGE_SIZE,
      })
      const pages = [first]
      const lastPage = Math.min(first.meta.totalPages, MAX_INDEX_PAGES)
      for (let page = 2; page <= lastPage; page += 1) {
        pages.push(
          await adminInventoryService.listInventory({ page, pageSize: INDEX_PAGE_SIZE }),
        )
      }

      return new Map(pages.flatMap((item) => item.items).map((row) => [row.id, row]))
    },
    staleTime: 60_000,
  })
}

export function useMovements({ reason, page, pageSize }) {
  return useQuery({
    queryKey: ['admin', 'movements', { reason, page, pageSize }],
    queryFn: () => adminInventoryService.listTransactions({ reason, page, pageSize }),
  })
}

export function useTransaction(transactionId) {
  return useQuery({
    queryKey: ['admin', 'movement', transactionId],
    queryFn: () => adminInventoryService.getTransaction(transactionId),
    enabled: Boolean(transactionId),
  })
}

export function useStockAlerts(status) {
  return useQuery({
    queryKey: ['admin', 'alerts', status],
    queryFn: () => adminStockAlertsService.list({ status }),
  })
}

export function useNotifyAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminStockAlertsService.notify,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts'] })
    },
  })
}

// Un movimiento cambia el físico (y puede abrir o cerrar alertas): se refrescan inventario,
// catálogo del cliente, stock crítico, el listado de movimientos y el índice de variantes.
export function useAdjustStock() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminInventoryService.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'inventory'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'variant-index'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'movements'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'analytics'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-product'] })
    },
  })
}
