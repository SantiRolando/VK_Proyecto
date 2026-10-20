/*
  Motivos del ajuste manual y la dirección que impone cada uno. `SaleConfirmed` no está en la
  lista: lo escribe la confirmación de venta.
*/

import { StockDirection, StockReason } from '@constants/enums.js'

export const MANUAL_REASONS = [
  StockReason.GoodsReceipt,
  StockReason.SizeExchange,
  StockReason.LossDefective,
  StockReason.ManualAdjustment,
]

// Dirección fija del motivo; `null` deja que el admin la elija.
const FIXED_DIRECTIONS = {
  [StockReason.GoodsReceipt]: StockDirection.Inbound,
  [StockReason.LossDefective]: StockDirection.Outbound,
}

export function fixedDirection(reason) {
  return FIXED_DIRECTIONS[reason] ?? null
}
