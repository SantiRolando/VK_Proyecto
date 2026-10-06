/*
  Máquina de estados de SALE.

  PendingCoordination ──► Contacted ──► Confirmed   (descuenta stock físico)
          │                   │
          └────────┬──────────┘
                   ▼
               Cancelled   (libera reserva; no válido desde Confirmed)
*/

import { ApiError } from '@api/client/api-error.js'

export const SaleStatus = {
  PendingCoordination: 'PendingCoordination',
  Contacted: 'Contacted',
  Confirmed: 'Confirmed',
  Cancelled: 'Cancelled',
}

// Estados que retienen reserva de stock (derivada, ver domain/stock.js).
export const RESERVING_SALE_STATUSES = [
  SaleStatus.PendingCoordination,
  SaleStatus.Contacted,
]

export const TRANSITIONS = {
  [SaleStatus.PendingCoordination]: [SaleStatus.Contacted, SaleStatus.Cancelled],
  [SaleStatus.Contacted]: [SaleStatus.Confirmed, SaleStatus.Cancelled],
  [SaleStatus.Confirmed]: [],
  [SaleStatus.Cancelled]: [],
}

export function canTransition(from, to) {
  return (TRANSITIONS[from] ?? []).includes(to)
}

/*
  Aplica una transición válida devolviendo la venta actualizada con la marca de
  tiempo que corresponde. Una transición inválida responde 409.
*/
export function applyTransition(sale, to) {
  if (!canTransition(sale.status, to)) {
    throw new ApiError(409, 'INVALID_TRANSITION', { from: sale.status, to })
  }

  const updated = { ...sale, status: to }
  if (to === SaleStatus.Contacted) updated.contactedAt = new Date().toISOString()
  if (to === SaleStatus.Confirmed) updated.confirmedAt = new Date().toISOString()
  if (to === SaleStatus.Cancelled) updated.cancelledAt = new Date().toISOString()
  return updated
}
