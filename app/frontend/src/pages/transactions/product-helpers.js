// Helpers compartidos por las vistas del dominio de transacciones para
// resolver productos del stock (mock) y construir sus etiquetas/opciones.

import { mockStock } from '../../mocks/stock.js'
import {
  getColorLabelKey,
  getModelLabelKey,
} from '../../features/stock/stock-options.js'

export function getProductById(productId) {
  return mockStock.find((product) => product.id === productId)
}

export function getProductLabel(product, t) {
  if (!product) return null
  return [
    product.name || t(getModelLabelKey(product.model)),
    product.size,
    t(getColorLabelKey(product.color)),
  ]
    .filter(Boolean)
    .join(' · ')
}

export function getProductOptions(t) {
  return mockStock.map((product) => ({
    value: String(product.id),
    label: getProductLabel(product, t),
  }))
}
