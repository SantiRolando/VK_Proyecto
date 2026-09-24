import { describe, expect, it } from 'vitest'
import {
  availableQuantity,
  isCriticalStock,
  listCriticalVariants,
  reservedQuantity,
} from './stock.js'

function makeDb({ sales = [], saleLines = [], productVariants = [] } = {}) {
  return { sales, saleLines, productVariants }
}

describe('stock (reglas derivadas)', () => {
  it('reserva solo las ventas abiertas (PendingCoordination | Contacted)', () => {
    const db = makeDb({
      sales: [
        { id: 1, status: 'PendingCoordination' },
        { id: 2, status: 'Contacted' },
        { id: 3, status: 'Confirmed' },
        { id: 4, status: 'Cancelled' },
      ],
      saleLines: [
        { id: 1, saleId: 1, variantId: 10, quantity: 2 },
        { id: 2, saleId: 2, variantId: 10, quantity: 3 },
        { id: 3, saleId: 3, variantId: 10, quantity: 5 },
        { id: 4, saleId: 4, variantId: 10, quantity: 1 },
      ],
    })

    expect(reservedQuantity(db, 10)).toBe(5)
  })

  it('disponible = físico − reservado, nunca negativo', () => {
    const db = makeDb({
      sales: [{ id: 1, status: 'PendingCoordination' }],
      saleLines: [{ id: 1, saleId: 1, variantId: 10, quantity: 4 }],
      productVariants: [{ id: 10, quantity: 3, minStock: 2, active: true }],
    })

    expect(availableQuantity(db, 10)).toBe(0)
  })

  it('variante inexistente → disponible 0', () => {
    expect(availableQuantity(makeDb(), 999)).toBe(0)
  })

  it('crítico cuando disponible < mínimo y la variante está activa', () => {
    const db = makeDb({
      sales: [{ id: 1, status: 'Contacted' }],
      saleLines: [{ id: 1, saleId: 1, variantId: 10, quantity: 1 }],
      productVariants: [
        { id: 10, quantity: 3, minStock: 3, active: true }, // disponible 2 < 3
        { id: 11, quantity: 5, minStock: 3, active: true }, // ok
        { id: 12, quantity: 0, minStock: 3, active: false }, // inactiva
      ],
    })

    expect(isCriticalStock(db, db.productVariants[0])).toBe(true)
    expect(isCriticalStock(db, db.productVariants[1])).toBe(false)
    expect(isCriticalStock(db, db.productVariants[2])).toBe(false)
    expect(listCriticalVariants(db).map((variant) => variant.id)).toEqual([10])
  })
})
