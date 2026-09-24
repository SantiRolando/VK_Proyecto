import { describe, expect, it } from 'vitest'
import { ApiError } from '../../api/client/api-error.js'
import { applyTransition, canTransition, SaleStatus } from './sale-state-machine.js'

describe('sale-state-machine', () => {
  it('define las transiciones válidas', () => {
    expect(canTransition('PendingCoordination', 'Contacted')).toBe(true)
    expect(canTransition('PendingCoordination', 'Cancelled')).toBe(true)
    expect(canTransition('Contacted', 'Confirmed')).toBe(true)
    expect(canTransition('Contacted', 'Cancelled')).toBe(true)
  })

  it('rechaza las transiciones inválidas', () => {
    expect(canTransition('PendingCoordination', 'Confirmed')).toBe(false)
    expect(canTransition('Confirmed', 'Cancelled')).toBe(false)
    expect(canTransition('Confirmed', 'Contacted')).toBe(false)
    expect(canTransition('Cancelled', 'Confirmed')).toBe(false)
  })

  it('aplica una transición válida y setea la marca de tiempo', () => {
    const sale = { id: 1, status: 'PendingCoordination' }
    const updated = applyTransition(sale, SaleStatus.Contacted)

    expect(updated.status).toBe(SaleStatus.Contacted)
    expect(updated.contactedAt).toBeTruthy()
    expect(updated.confirmedAt).toBeUndefined()
    expect(sale.status).toBe('PendingCoordination') // inmutable
  })

  it('lanza INVALID_TRANSITION al aplicar una transición inválida', () => {
    try {
      applyTransition({ id: 1, status: 'Confirmed' }, 'Cancelled')
      throw new Error('debería haber lanzado')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect(error.status).toBe(409)
      expect(error.code).toBe('INVALID_TRANSITION')
    }
  })
})
