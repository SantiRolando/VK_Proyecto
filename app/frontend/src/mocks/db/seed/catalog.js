// Seed: catálogo (PRODUCT, PRODUCT_VARIANT) — §4.8 del plan.
// ~12 productos (2–3 por línea) con variantes producto × talle × color y
// casos sembrados a propósito:
//   - Endurance talle M sin stock en ningún color (flujo "sin stock").
//   - Una variante con disponible = 1 (prueba de carrera/conflicto).
//   - Variantes por debajo del mínimo (alertas de stock crítico).

import { createRandom, between } from './helpers.js'

export const COLORS = ['navy', 'black', 'blue', 'red', 'pink', 'green', 'purple']

// model es único por producto: la base del SKU.
const PRODUCTS = [
  {
    id: 1,
    line: 'Endurance',
    model: 'endurance-classic',
    description: 'Malla de entrenamiento, tejido Endurance.',
    price: 1290,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    colors: ['navy', 'black'],
    noStockSizes: ['M'], // sin stock en ningún color
  },
  {
    id: 2,
    line: 'Endurance',
    model: 'endurance-comp',
    description: 'Malla de competición con tratamiento hidrodinámico.',
    price: 1590,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    colors: ['black', 'red'],
    noStockSizes: ['M'],
  },
  {
    id: 3,
    line: 'Endurance',
    model: 'endurance-print',
    description: 'Malla Endurance estampada.',
    price: 1390,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['pink', 'purple'],
    noStockSizes: ['M'],
  },
  {
    id: 4,
    line: 'Soft',
    model: 'soft-classic',
    description: 'Corte suave para mayor confort.',
    price: 1390,
    sizes: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['blue', 'green'],
    critical: ['XXS:blue'],
  },
  {
    id: 5,
    line: 'Soft',
    model: 'soft-comp',
    description: 'Malla Soft para competición.',
    price: 1490,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['navy', 'black'],
  },
  {
    id: 6,
    line: 'Jammer',
    model: 'jammer-classic',
    description: 'Jammer de entrenamiento.',
    price: 1790,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['black', 'navy', 'green'],
    critical: ['XL:navy'],
  },
  {
    id: 7,
    line: 'Jammer',
    model: 'jammer-comp',
    description: 'Jammer de competición.',
    price: 1990,
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: ['black', 'blue'],
  },
  {
    id: 8,
    line: 'Sunga',
    model: 'sunga-classic',
    description: 'Sunga clásica.',
    price: 990,
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    colors: ['black', 'red', 'blue'],
    singleUnit: ['S:red'], // disponible = 1 (carrera/conflicto)
  },
  {
    id: 9,
    line: 'Sunga',
    model: 'sunga-comp',
    description: 'Sunga de competición.',
    price: 1090,
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    colors: ['black', 'green'],
  },
  {
    id: 10,
    line: 'Kids',
    model: 'kids-jammer',
    description: 'Jammer infantil.',
    price: 1190,
    sizes: ['8', '10', '12'],
    colors: ['navy', 'green'],
  },
  {
    id: 11,
    line: 'Kids',
    model: 'kids-sunga',
    description: 'Sunga infantil.',
    price: 890,
    sizes: ['8', '10', '12'],
    colors: ['blue', 'red'],
  },
  {
    id: 12,
    line: 'Kids',
    model: 'kids-girls-endurance',
    description: 'Malla Endurance niña.',
    price: 1090,
    sizes: ['S', 'M', 'L', 'XL'],
    colors: ['pink', 'purple'],
  },
]

function skuFor(model, color, sizeCode) {
  return `${model}-${color}-${sizeCode}`.toUpperCase()
}

export function buildCatalog(sizes) {
  const random = createRandom(20260101)
  const products = PRODUCTS.map((spec) => ({
    id: spec.id,
    line: spec.line,
    model: spec.model,
    description: spec.description,
    price: spec.price,
    active: true,
  }))

  const productVariants = []
  let variantId = 1

  for (const spec of PRODUCTS) {
    const lineSizes = sizes.filter((size) => size.line === spec.line)
    for (const sizeCode of spec.sizes) {
      const size = lineSizes.find((item) => item.code === sizeCode)
      if (!size) continue

      for (const color of spec.colors) {
        const noStock = spec.noStockSizes?.includes(sizeCode)
        const singleUnit = spec.singleUnit?.includes(`${sizeCode}:${color}`)
        const critical = spec.critical?.includes(`${sizeCode}:${color}`)

        let quantity = between(random, 3, 18)
        if (noStock) quantity = 0
        if (singleUnit) quantity = 1
        if (critical) quantity = 2

        productVariants.push({
          id: variantId++,
          productId: spec.id,
          sizeId: size.id,
          color,
          sku: skuFor(spec.model, color, sizeCode),
          quantity,
          minStock: critical ? 5 : noStock ? 3 : between(random, 2, 4),
          active: true,
        })
      }
    }
  }

  return { products, productVariants }
}

// Busca una variante por modelo de producto + código de talle + color
// (usado por el seed histórico para enlazar ventas/movimientos).
export function findVariant(sizes, products, productVariants, model, sizeCode, color) {
  const product = products.find((item) => item.model === model)
  if (!product) throw new Error(`Producto de seed no encontrado: ${model}`)
  const size = sizes.find(
    (item) => item.line === product.line && item.code === sizeCode,
  )
  if (!size) throw new Error(`Talle de seed no encontrado: ${product.line} ${sizeCode}`)
  return productVariants.find(
    (variant) =>
      variant.productId === product.id &&
      variant.sizeId === size.id &&
      variant.color === color,
  )
}
