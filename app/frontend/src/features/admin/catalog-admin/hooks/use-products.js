import { adminCatalogService } from '@api/services/admin-catalog-service.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/*
  Catálogo del panel: productos y las variantes de cada uno, contra
  `/admin/catalog/products` de la API.
*/

function useCatalogMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'product'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'variants'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      queryClient.invalidateQueries({ queryKey: ['catalog-product'] })
    },
  })
}

export function useProducts(params) {
  return useQuery({
    queryKey: ['admin', 'products', params ?? null],
    queryFn: () => adminCatalogService.listProducts(params),
  })
}

// Detalle con variantes (el listado no las trae).
export function useProductDetail(productId) {
  return useQuery({
    queryKey: ['admin', 'product', productId],
    queryFn: () => adminCatalogService.getProduct(productId),
    enabled: Boolean(productId),
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

export function useSetProductActive() {
  return useCatalogMutation(({ productId, active }) =>
    adminCatalogService.setProductActive(productId, active),
  )
}

export function useCreateVariant() {
  return useCatalogMutation(({ productId, ...payload }) =>
    adminCatalogService.createVariant(productId, payload),
  )
}

export function useUpdateVariant() {
  return useCatalogMutation(({ productId, variantId, ...payload }) =>
    adminCatalogService.updateVariant(productId, variantId, payload),
  )
}

export function useSetVariantActive() {
  return useCatalogMutation(({ productId, variantId, active }) =>
    adminCatalogService.setVariantActive(productId, variantId, active),
  )
}
