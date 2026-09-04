// Datos de ejemplo (mock) para el dominio de transacciones.
// Se reemplazarán por datos reales del backend en una iteración posterior.
//
// Una transacción sube (`ingreso`) o baja (`salida`) el stock de uno o más
// productos a través de `lines`. El `reason` distingue el motivo:
//   - ingreso -> `entrada` (entrada de mercadería)
//   - salida  -> `venta` | `perdida` | `otros`
// Las ventas (`reason === 'venta'`) además pueden llevar cliente, cupón,
// delivery y dirección de entrega.

import { mockUsers } from './users.js'
import { mockCoupons } from './coupons.js'

export const mockTransactions = [
  {
    id: 1,
    direction: 'ingreso',
    reason: 'entrada',
    date: '2026-09-01',
    lines: [
      { productId: 1, quantity: 10 },
      { productId: 2, quantity: 5 },
    ],
    customerId: null,
    couponId: null,
    delivery: false,
    address: '',
  },
  {
    id: 2,
    direction: 'salida',
    reason: 'venta',
    date: '2026-09-02',
    lines: [{ productId: 1, quantity: 2 }],
    customerId: 1,
    couponId: 2,
    delivery: true,
    address: 'Av. Siempre Viva 742, CABA',
  },
  {
    id: 3,
    direction: 'salida',
    reason: 'perdida',
    date: '2026-09-02',
    lines: [{ productId: 4, quantity: 1 }],
    customerId: null,
    couponId: null,
    delivery: false,
    address: '',
  },
  {
    id: 4,
    direction: 'salida',
    reason: 'venta',
    date: '2026-09-03',
    lines: [
      { productId: 6, quantity: 1 },
      { productId: 7, quantity: 1 },
    ],
    customerId: null,
    couponId: null,
    delivery: false,
    address: '',
  },
  {
    id: 5,
    direction: 'ingreso',
    reason: 'entrada',
    date: '2026-08-28',
    lines: [{ productId: 3, quantity: 6 }],
    customerId: null,
    couponId: null,
    delivery: false,
    address: '',
  },
  {
    id: 6,
    direction: 'salida',
    reason: 'otros',
    date: '2026-08-30',
    lines: [{ productId: 5, quantity: 2 }],
    customerId: null,
    couponId: null,
    delivery: false,
    address: '',
  },
]

export function getCustomerById(id) {
  if (id == null) return null
  return mockUsers.find((user) => user.id === id) ?? null
}

export function getCouponById(id) {
  if (id == null) return null
  return mockCoupons.find((coupon) => coupon.id === id) ?? null
}
