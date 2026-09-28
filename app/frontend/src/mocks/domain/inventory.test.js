import {
  applyStockTransaction,
  MANUAL_REASONS,
  resolveDirection,
} from '@mocks/domain/inventory.js'
import { describe, expect, it } from 'vitest'

function variant(overrides = {}) {
  return {
    id: 1,
    productId: 1,
    sizeId: 1,
    color: 'navy',
    sku: 'MODEL-NAVY-M',
    quantity: 0,
    minStock: 3,
    active: true,
    ...overrides,
  }
}

function db(overrides = {}) {
  return {
    productVariants: [variant()],
    sales: [],
    saleLines: [],
    alerts: [],
    ...overrides,
  }
}

describe('resolveDirection', () => {
  it('fija la dirección de los motivos que la determinan', () => {
    expect(resolveDirection('GoodsReceipt', null)).toBe('Inbound')
    expect(resolveDirection('LossDefective', 'Inbound')).toBe('Outbound')
  })

  it('exige una dirección válida para los motivos libres', () => {
    expect(resolveDirection('ManualAdjustment', 'Outbound')).toBe('Outbound')
    expect(() => resolveDirection('SizeExchange', 'sideways')).toThrowError(
      expect.objectContaining({ status: 422 }),
    )
  })

  it('los motivos manuales no incluyen el automático de venta', () => {
    expect(MANUAL_REASONS).not.toContain('SaleConfirmed')
  })
})

describe('applyStockTransaction', () => {
  it('un ingreso sube el físico y dispara el aviso de reposición (0 → disponible)', () => {
    const state = db({
      alerts: [
        {
          id: 1,
          variantId: 1,
          userId: 2,
          alertType: 'RestockNotice',
          notificationMode: 'InApp',
          status: 'Active',
          createdAt: '2026-09-20T00:00:00Z',
        },
      ],
    })

    const result = applyStockTransaction(state, {
      reason: 'GoodsReceipt',
      lines: [{ variantId: 1, quantity: 5 }],
    })

    expect(result.direction).toBe('Inbound')
    expect(result.alertsNotified).toBe(1)
    expect(state.productVariants[0].quantity).toBe(5)
    expect(state.alerts[0].status).toBe('Notified')
  })

  it('no avisa si la variante ya tenía disponible', () => {
    const state = db({
      productVariants: [variant({ quantity: 4 })],
      alerts: [
        {
          id: 1,
          variantId: 1,
          userId: 2,
          alertType: 'RestockNotice',
          status: 'Active',
          notificationMode: 'InApp',
          createdAt: '2026-09-20T00:00:00Z',
        },
      ],
    })

    const result = applyStockTransaction(state, {
      reason: 'GoodsReceipt',
      lines: [{ variantId: 1, quantity: 5 }],
    })

    expect(result.alertsNotified).toBe(0)
    expect(state.alerts[0].status).toBe('Active')
  })

  it('una salida descuenta el físico y no permite pasar de 0', () => {
    const state = db({ productVariants: [variant({ quantity: 3 })] })

    applyStockTransaction(state, {
      reason: 'LossDefective',
      lines: [{ variantId: 1, quantity: 2 }],
    })
    expect(state.productVariants[0].quantity).toBe(1)

    expect(() =>
      applyStockTransaction(state, {
        reason: 'LossDefective',
        lines: [{ variantId: 1, quantity: 5 }],
      }),
    ).toThrowError(expect.objectContaining({ status: 422 }))
    expect(state.productVariants[0].quantity).toBe(1)
  })

  it('valida variante inexistente y líneas vacías', () => {
    const state = db()

    expect(() =>
      applyStockTransaction(state, {
        reason: 'GoodsReceipt',
        lines: [{ variantId: 99, quantity: 1 }],
      }),
    ).toThrowError(expect.objectContaining({ status: 404 }))

    expect(() =>
      applyStockTransaction(state, { reason: 'GoodsReceipt', lines: [] }),
    ).toThrowError(expect.objectContaining({ status: 422 }))
  })
})
