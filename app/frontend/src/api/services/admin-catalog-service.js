/*
  Catálogo del panel contra `/admin/catalog/products`: productos, sus variantes y el alta y
  baja lógica de ambos.

  `quantity` de una variante no se edita acá: nace en 0 y solo cambia por movimientos de
  stock (`admin-inventory-service`).
*/

import { apiClient } from '@api/client/api-client.js'
import { audienceCodec, decodePage, lineCodec } from '@api/wire.js'

const BASE = '/admin/catalog/products'

function decodeProduct(product) {
  return {
    ...product,
    line: lineCodec.decode(product.line),
    audience: audienceCodec.decode(product.audience),
    description: product.description ?? '',
  }
}

function decodeVariant(variant) {
  return {
    ...variant,
    size: { id: variant.sizeId, code: variant.sizeCode },
  }
}

function encodeProduct(payload) {
  return {
    line: lineCodec.encode(payload.line),
    audience: audienceCodec.encode(payload.audience),
    model: payload.model,
    description: payload.description || null,
    price: Number(payload.price),
  }
}

function encodeVariant(payload) {
  return {
    sizeId: Number(payload.sizeId),
    color: payload.color,
    sku: payload.sku,
    minStock: Number(payload.minStock ?? 0),
  }
}

export const adminCatalogService = {
  listProducts: (params) =>
    apiClient
      .get(BASE, {
        page: params?.page ?? 1,
        size: params?.size ?? 100,
        line: lineCodec.encode(params?.line ?? null),
        audience: audienceCodec.encode(params?.audience ?? null),
        active: params?.active ?? null,
      })
      .then((page) => decodePage(page, decodeProduct)),
  getProduct: (productId) =>
    apiClient.get(`${BASE}/${productId}`).then((detail) => ({
      ...decodeProduct(detail.product),
      variants: (detail.variants ?? []).map(decodeVariant),
    })),
  createProduct: (payload) =>
    apiClient.post(BASE, encodeProduct(payload)).then(decodeProduct),
  updateProduct: (productId, payload) =>
    apiClient.put(`${BASE}/${productId}`, encodeProduct(payload)).then(decodeProduct),
  setProductActive: (productId, active) =>
    apiClient.patch(`${BASE}/${productId}/active`, { active }).then(decodeProduct),
  createVariant: (productId, payload) =>
    apiClient
      .post(`${BASE}/${productId}/variants`, encodeVariant(payload))
      .then(decodeVariant),
  updateVariant: (productId, variantId, payload) =>
    apiClient
      .put(`${BASE}/${productId}/variants/${variantId}`, encodeVariant(payload))
      .then(decodeVariant),
  setVariantActive: (productId, variantId, active) =>
    apiClient
      .patch(`${BASE}/${productId}/variants/${variantId}/active`, { active })
      .then(decodeVariant),
}
