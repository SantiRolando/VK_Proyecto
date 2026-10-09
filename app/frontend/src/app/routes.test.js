import { ADMIN_INVENTORY_TABS, routes } from '@app/routes.js'
import { describe, expect, it } from 'vitest'

const SAMPLE_ARGS = {
  fit: [{ line: 'endurance' }],
  fitResult: [12],
  catalog: [{ sizeId: 3 }],
  product: [5],
  checkoutConfirmation: [9],
  adminSale: [4],
  adminInventoryTab: [ADMIN_INVENTORY_TABS.products],
}

function collectPaths() {
  const paths = []
  for (const [name, value] of Object.entries(routes)) {
    if (typeof value === 'function') {
      paths.push(value(...(SAMPLE_ARGS[name] ?? [])))
    } else {
      paths.push(value)
    }
  }
  return paths
}

describe('routes', () => {
  it('todas las rutas son únicas', () => {
    const paths = collectPaths()
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('todas las rutas están en inglés (ASCII imprimible, sin acentos)', () => {
    for (const path of collectPaths()) {
      expect(path).toMatch(/^\/[\x21-\x7E]*$/)
      expect(path).not.toMatch(/[áéíóúñÁÉÍÓÚÑ]/)
    }
  })

  it('las rutas con helpers construyen paths con query o id', () => {
    expect(routes.fit({ line: 'endurance' })).toBe('/fit?line=endurance')
    expect(routes.fitResult(12)).toBe('/fit/result/12')
    expect(routes.adminSale(4)).toBe('/admin/sales/4')
    expect(routes.adminInventoryTab(ADMIN_INVENTORY_TABS.products)).toBe(
      '/admin/inventory?tab=products',
    )
    expect(routes.catalog()).toBe('/catalog')
  })
})
