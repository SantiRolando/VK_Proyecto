import { adminCatalogService } from '@api/services/admin-catalog-service.js'
import { sizeService } from '@api/services/size-service.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Catálogo del panel (US9): productos y las variantes de cada uno.

function useCatalogMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'variants'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-product'] })
    },
  })
}

export function useProducts() {
  return useQuery({
    queryKey: ['admin', 'products'],
    queryFn: adminCatalogService.listProducts,
  })
}

export function useCreateProduct() {
  return useCatalogMutation(adminCatalogService.createProduct)
}

export function useUpdateProduct() {
  return useCatalogMutation(({ productId, ...payload }) =>
    adminCatalogService.updateProduct(productId, payload),
  )
}

export function useRemoveProduct() {
  return useCatalogMutation(adminCatalogService.removeProduct)
}

// Talles de una línea, para el alta de variantes.
export function useSizes(line) {
  return useQuery({
    queryKey: ['sizes', line],
    queryFn: () => sizeService.getSizes({ line }),
    enabled: Boolean(line),
  })
}
