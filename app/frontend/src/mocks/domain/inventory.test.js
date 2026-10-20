import { applyStockTransaction, MANUAL_REASONS } from '@mocks/domain/inventory.js'
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

function restockNotice(variantId = 1) {
  return {
    id: 1,
    variantId,
    userId: 2,
    alertType: 'RestockNotice',
    notificationMode: 'InApp',
    status: 'Active',
    createdAt: '2026-09-20T00:00:00Z',
  }
}

describe('motivos del ajuste', () => {
  it('los motivos manuales no incluyen el automático de venta', () => {
    expect(MANUAL_REASONS).not.toContain('SaleConfirmed')
  })

  it('rechaza un motivo que no es del ajuste manual', () => {
    const state = db()

    expect(() =>
      applyStockTransaction(state, {
        reason: 'SaleConfirmed',
        direction: 'Inbound',
        lines: [{ variantId: 1, quantity: 1 }],
      }),
    ).toThrowError(expect.objectContaining({ status: 400, code: 'BAD_REQUEST' }))
  })

  it('exige una dirección válida', () => {
    const state = db()

    expect(() =>
      applyStockTransaction(state, {
        reason: 'ManualAdjustment',
        direction: 'sideways',
        lines: [{ variantId: 1, quantity: 1 }],
      }),
    ).toThrowError(expect.objectContaining({ status: 400, code: 'VALIDATION_ERROR' }))
  })
})

describe('applyStockTransaction', () => {
  it('un ingreso sube el físico y notifica el aviso de reposición (0 → disponible)', () => {
    const state = db({ alerts: [restockNotice()] })

    const result = applyStockTransaction(state, {
      reason: 'GoodsReceipt',
      direction: 'Inbound',
      lines: [{ variantId: 1, quantity: 5 }],
    })

    expect(result.direction).toBe('Inbound')
    expect(state.productVariants[0].quantity).toBe(5)
    expect(state.alerts.find((alert) => alert.alertType === 'RestockNotice').status).toBe(
      'Notified',
    )
  })

  it('no avisa si la variante ya tenía disponible', () => {
    const state = db({
      productVariants: [variant({ quantity: 4 })],
      alerts: [restockNotice()],
    })

    applyStockTransaction(state, {
      reason: 'GoodsReceipt',
      direction: 'Inbound',
      lines: [{ variantId: 1, quantity: 5 }],
    })

    expect(state.alerts[0].status).toBe('Active')
  })

  it('abre la alerta de crítico cuando el disponible queda bajo el mínimo', () => {
    const state = db({ productVariants: [variant({ quantity: 4 })] })

    applyStockTransaction(state, {
      reason: 'LossDefective',
      direction: 'Outbound',
      lines: [{ variantId: 1, quantity: 2 }],
    })

    expect(state.alerts).toHaveLength(1)
    expect(state.alerts[0]).toMatchObject({
      variantId: 1,
      alertType: 'CriticalStock',
      status: 'Active',
    })
  })

  it('no duplica la alerta de crítico si ya hay una activa', () => {
    const state = db({
      productVariants: [variant({ quantity: 4 })],
      alerts: [
        {
          id: 7,
          variantId: 1,
          userId: null,
          alertType: 'CriticalStock',
          notificationMode: 'InApp',
          status: 'Active',
          createdAt: '2026-09-20T00:00:00Z',
        },
      ],
    })

    applyStockTransaction(state, {
      reason: 'LossDefective',
      direction: 'Outbound',
      lines: [{ variantId: 1, quantity: 2 }],
    })

    expect(state.alerts).toHaveLength(1)
  })

  it('una salida descuenta el físico y no puede pasar del disponible', () => {
    const state = db({ productVariants: [variant({ quantity: 3 })] })

    applyStockTransaction(state, {
      reason: 'LossDefective',
      direction: 'Outbound',
      lines: [{ variantId: 1, quantity: 2 }],
    })
    expect(state.productVariants[0].quantity).toBe(1)

    expect(() =>
      applyStockTransaction(state, {
        reason: 'LossDefective',
        direction: 'Outbound',
        lines: [{ variantId: 1, quantity: 5 }],
      }),
    ).toThrowError(expect.objectContaining({ status: 409, code: 'CONFLICT' }))
    expect(state.productVariants[0].quantity).toBe(1)
  })

  it('la salida se mide contra el disponible, no contra el físico', () => {
    const state = db({
      productVariants: [variant({ quantity: 5 })],
      sales: [{ id: 1, status: 'PendingCoordination' }],
      saleLines: [{ saleId: 1, variantId: 1, quantity: 4 }],
    })

    expect(() =>
      applyStockTransaction(state, {
        reason: 'LossDefective',
        direction: 'Outbound',
        lines: [{ variantId: 1, quantity: 2 }],
      }),
    ).toThrowError(expect.objectContaining({ status: 409 }))
  })

  it('rechaza la variante repetida en dos líneas', () => {
    const state = db({ productVariants: [variant({ quantity: 10 })] })

    expect(() =>
      applyStockTransaction(state, {
        reason: 'ManualAdjustment',
        direction: 'Inbound',
        lines: [
          { variantId: 1, quantity: 1 },
          { variantId: 1, quantity: 2 },
        ],
      }),
    ).toThrowError(expect.objectContaining({ status: 400, code: 'BAD_REQUEST' }))
  })

  it('valida variante inexistente y líneas vacías', () => {
    const state = db()

    expect(() =>
      applyStockTransaction(state, {
        reason: 'GoodsReceipt',
        direction: 'Inbound',
        lines: [{ variantId: 99, quantity: 1 }],
      }),
    ).toThrowError(expect.objectContaining({ status: 404 }))

    expect(() =>
      applyStockTransaction(state, {
        reason: 'GoodsReceipt',
        direction: 'Inbound',
        lines: [],
      }),
    ).toThrowError(expect.objectContaining({ status: 400 }))
  })
})
