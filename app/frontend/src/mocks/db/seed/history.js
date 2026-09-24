// Seed histórico: SIZE_GENERATION, SALE, SALE_LINE, DISCOUNT_COUPON,
// POINTS_MOVEMENT, TRANSACTION, TRANSACTION_LINE, ALERT — §4.8 del plan.
//
// Fechas relativas a "hoy". Casos sembrados a propósito:
//   - ventas en cada estado, ambos canales y ambos métodos de entrega,
//     una con antigüedad > 3 días;
//   - ~40 generaciones en 60 días con calificaciones/comentarios, algunas
//     vinculadas a venta y varias con `stock_available_at_query = false`
//     (Endurance M) para el mapa de talles faltantes;
//   - cupones de porcentaje, monto fijo, vencido y plantillas canjeables;
//   - una venta pendiente que reserva la variante de 1 unidad (conflicto);
//   - alertas de stock crítico derivadas de la reserva/stock sembrado.

import { availableQuantity } from '../../domain/stock.js'
import {
  between,
  createRandom,
  daysAgo,
  daysFromNow,
  midpoint,
  pick,
} from './helpers.js'
import { findVariant } from './catalog.js'

const LINES = ['Endurance', 'Soft', 'Jammer', 'Sunga', 'Kids']

const COMMENT_POOL = [
  'Me quedó perfecto, ya lo usé en pileta.',
  'Me quedó un poco suelto en la espalda.',
  'La cintura me apretaba; pediría un talle más.',
  'Muy cómodo, excelente el tejido.',
  'El tiro me quedó corto, pero el contorno bien.',
]

function sizeByCode(sizes, line, code) {
  return sizes.find((size) => size.line === line && size.code === code)
}

function jitter(random, value, spread = 1.5) {
  const offset = (random() * 2 - 1) * spread
  return Math.round((value + offset) * 10) / 10
}

function measuresFor(random, line, size) {
  const height =
    line === 'Kids'
      ? between(random, 115, 160)
      : line === 'Jammer' || line === 'Sunga'
        ? between(random, 165, 190)
        : between(random, 155, 178)

  const torso =
    line === 'Kids' ? between(random, 100, 130) : between(random, 135, 152)

  if (line === 'Endurance' || line === 'Soft') {
    const bust = jitter(random, midpoint(size.bust))
    return {
      height,
      bust,
      waist: jitter(random, midpoint(size.waist)),
      hip: Math.round((bust + between(random, 6, 10)) * 10) / 10,
      torso,
    }
  }

  return {
    height,
    bust: null,
    waist: size.waist ? jitter(random, midpoint(size.waist)) : null,
    hip: size.hip ? jitter(random, midpoint(size.hip)) : null,
    torso,
  }
}

function buildGenerations(sizes, random) {
  const generations = []
  let id = 100
  const anchor = (fields) => generations.push({ id: id++, ...fields })

  const enduranceM = sizeByCode(sizes, 'Endurance', 'M')
  const enduranceL = sizeByCode(sizes, 'Endurance', 'L')
  const enduranceXL = sizeByCode(sizes, 'Endurance', 'XL')
  const softS = sizeByCode(sizes, 'Soft', 'S')
  const softM = sizeByCode(sizes, 'Soft', 'M')
  const jammerM = sizeByCode(sizes, 'Jammer', 'M')
  const sungaS = sizeByCode(sizes, 'Sunga', 'S')

  // Anclas vinculadas a las ventas sembradas más abajo.
  anchor({
    customerId: 2, guestSessionId: null, profileId: 1, adminId: null,
    line: 'Endurance', createdAt: daysAgo(1),
    height: 168, bust: 90, waist: 72, hip: 98, torso: 142,
    suggestedSizeId: enduranceL.id, stockAvailableAtQuery: true,
    rating: null, comment: null, ratedAt: null,
    fitType: 'Training', source: 'QR',
  })
  anchor({
    customerId: 2, guestSessionId: null, profileId: 1, adminId: null,
    line: 'Soft', createdAt: daysAgo(4),
    height: 165, bust: 85, waist: 67, hip: 92, torso: 140,
    suggestedSizeId: softS.id, stockAvailableAtQuery: true,
    rating: 'Correct', comment: 'Perfecto en la cadera', ratedAt: daysAgo(3),
    fitType: 'Training', source: 'Direct',
  })
  anchor({
    customerId: 2, guestSessionId: null, profileId: 2, adminId: null,
    line: 'Jammer', createdAt: daysAgo(6),
    height: 178, bust: null, waist: 86, hip: 93, torso: 148,
    suggestedSizeId: jammerM.id, stockAvailableAtQuery: true,
    rating: 'Correct', comment: null, ratedAt: daysAgo(5),
    fitType: 'Training', source: 'Direct',
  })
  anchor({
    customerId: 2, guestSessionId: null, profileId: 1, adminId: null,
    line: 'Endurance', createdAt: daysAgo(9),
    height: 168, bust: 96, waist: 78, hip: 104, torso: 142,
    suggestedSizeId: enduranceXL.id, stockAvailableAtQuery: true,
    rating: 'Large', comment: 'Me quedó grande, pediría un talle menos',
    ratedAt: daysAgo(7),
    fitType: 'Competition', source: 'Landing',
  })
  anchor({
    customerId: 3, guestSessionId: null, profileId: null, adminId: null,
    line: 'Sunga', createdAt: daysAgo(0, 10),
    height: 172, bust: null, waist: 80, hip: 88, torso: 145,
    suggestedSizeId: sungaS.id, stockAvailableAtQuery: true,
    rating: null, comment: null, ratedAt: null,
    fitType: 'Training', source: 'Direct',
  })
  // Generaciones de invitado (se migran al registrarse con este guest id).
  anchor({
    customerId: null, guestSessionId: 'guest-demo-1', profileId: null, adminId: null,
    line: 'Endurance', createdAt: daysAgo(2),
    height: 167, bust: 85, waist: 68, hip: 94, torso: 141,
    suggestedSizeId: enduranceM.id, stockAvailableAtQuery: false,
    rating: null, comment: null, ratedAt: null,
    fitType: 'Training', source: 'Landing',
  })
  anchor({
    customerId: null, guestSessionId: 'guest-demo-1', profileId: null, adminId: null,
    line: 'Soft', createdAt: daysAgo(1),
    height: 167, bust: 90, waist: 72, hip: 96, torso: 141,
    suggestedSizeId: softM.id, stockAvailableAtQuery: true,
    rating: null, comment: null, ratedAt: null,
    fitType: 'Training', source: 'Direct',
  })

  // Relleno determinista hasta ~40 generaciones.
  const fillCount = 33
  for (let i = 0; i < fillCount; i++) {
    const line = pick(random, LINES)
    const lineSizes = sizes.filter((size) => size.line === line)
    const size = pick(random, lineSizes)

    const isGuest = random() < 0.12
    const customerId = isGuest ? null : random() < 0.12 ? 3 : 2
    const createdAt = daysAgo(between(random, 1, 60), between(random, 9, 19))
    const noStock = (line === 'Endurance' && size.code === 'M') || random() < 0.08

    const rated = !isGuest && random() < 0.55
    const ratingRoll = random()
    const rating = rated
      ? ratingRoll < 0.7
        ? 'Correct'
        : ratingRoll < 0.85
          ? 'Small'
          : 'Large'
      : null

    anchor({
      customerId,
      guestSessionId: isGuest ? `guest-seed-${i}` : null,
      profileId: customerId === 2 ? (random() < 0.2 ? 2 : 1) : null,
      adminId: null,
      line,
      createdAt,
      ...measuresFor(random, line, size),
      suggestedSizeId: size.id,
      stockAvailableAtQuery: !noStock,
      rating,
      comment: rated && random() < 0.25 ? pick(random, COMMENT_POOL) : null,
      ratedAt: rated ? daysAgo(between(random, 1, 58), 18) : null,
      fitType: random() < 0.8 ? 'Training' : 'Competition',
      source: random() < 0.6 ? 'Direct' : random() < 0.5 ? 'QR' : 'Landing',
    })
  }

  return generations
}

function buildSalesAndCoupons(sizes, products, productVariants) {
  const discountCoupons = [
    {
      id: 1, productId: null, userId: null, couponCode: 'VIKI10',
      usageCount: 12, discountType: 'Percentage', discountValue: 10,
      maxDiscount: 500, pointsCost: 100,
      validFrom: daysAgo(10), validUntil: daysFromNow(50), active: true,
    },
    {
      id: 2, productId: null, userId: null, couponCode: 'ENVIO5',
      usageCount: 4, discountType: 'Fixed', discountValue: 500,
      maxDiscount: 500, pointsCost: 60,
      validFrom: daysAgo(10), validUntil: daysFromNow(50), active: true,
    },
    {
      id: 3, productId: null, userId: 2, couponCode: 'ANA15',
      usageCount: 1, discountType: 'Percentage', discountValue: 15,
      maxDiscount: 600, pointsCost: null,
      validFrom: daysAgo(30), validUntil: daysFromNow(40), active: true,
    },
    {
      id: 4, productId: null, userId: null, couponCode: 'VERANO15',
      usageCount: 20, discountType: 'Percentage', discountValue: 15,
      maxDiscount: 500, pointsCost: null,
      validFrom: daysAgo(90), validUntil: daysAgo(5), active: true,
    },
    {
      id: 5, productId: null, userId: null, couponCode: 'VIP5000',
      usageCount: 0, discountType: 'Fixed', discountValue: 5000,
      maxDiscount: 5000, pointsCost: null,
      validFrom: daysAgo(5), validUntil: daysFromNow(40), active: false,
    },
  ]

  const sales = []
  const saleLines = []
  let lineId = 1
  const addSale = (sale) => {
    sales.push(sale)
    for (const item of sale._lines) {
      saleLines.push({ id: lineId++, saleId: sale.id, ...item })
    }
    delete sale._lines
  }

  const enduranceLNavy = findVariant(
    sizes, products, productVariants, 'endurance-classic', 'L', 'navy',
  )
  const softSBlue = findVariant(
    sizes, products, productVariants, 'soft-classic', 'S', 'blue',
  )
  const jammerMBlack = findVariant(
    sizes, products, productVariants, 'jammer-classic', 'M', 'black',
  )
  const enduranceXLBlack = findVariant(
    sizes, products, productVariants, 'endurance-classic', 'XL', 'black',
  )
  const sungaSRed = findVariant(
    sizes, products, productVariants, 'sunga-classic', 'S', 'red',
  )

  addSale({
    id: 1, userId: 2, couponId: null, addressId: null, generationId: 100,
    createdAt: daysAgo(1), status: 'PendingCoordination', channel: 'Email',
    deliveryMethod: 'StorePickup', contactedAt: null, confirmedAt: null, cancelledAt: null,
    _lines: [{ variantId: enduranceLNavy.id, quantity: 1, unitPrice: 1290 }],
  })
  addSale({
    id: 2, userId: 2, couponId: 3, addressId: 1, generationId: 101,
    createdAt: daysAgo(4), status: 'Contacted', channel: 'Whatsapp',
    deliveryMethod: 'HomeDelivery', contactedAt: daysAgo(3),
    confirmedAt: null, cancelledAt: null,
    _lines: [{ variantId: softSBlue.id, quantity: 1, unitPrice: 1390 }],
  })
  addSale({
    id: 3, userId: 2, couponId: null, addressId: null, generationId: 102,
    createdAt: daysAgo(6), status: 'Confirmed', channel: 'Email',
    deliveryMethod: 'StorePickup', contactedAt: daysAgo(5), confirmedAt: daysAgo(5),
    cancelledAt: null,
    _lines: [{ variantId: jammerMBlack.id, quantity: 1, unitPrice: 1790 }],
  })
  addSale({
    id: 4, userId: 2, couponId: null, addressId: 2, generationId: 103,
    createdAt: daysAgo(9), status: 'Cancelled', channel: 'Whatsapp',
    deliveryMethod: 'HomeDelivery', contactedAt: daysAgo(8),
    confirmedAt: null, cancelledAt: daysAgo(7),
    _lines: [{ variantId: enduranceXLBlack.id, quantity: 1, unitPrice: 1290 }],
  })
  addSale({
    id: 5, userId: 3, couponId: null, addressId: null, generationId: 104,
    createdAt: daysAgo(0, 10), status: 'PendingCoordination', channel: 'Whatsapp',
    deliveryMethod: 'StorePickup', contactedAt: null, confirmedAt: null, cancelledAt: null,
    _lines: [{ variantId: sungaSRed.id, quantity: 1, unitPrice: 990 }],
  })

  return { sales, saleLines, discountCoupons }
}

function buildTransactions(sizes, products, productVariants) {
  const enduranceLNavy = findVariant(
    sizes, products, productVariants, 'endurance-classic', 'L', 'navy',
  )
  const softSBlue = findVariant(
    sizes, products, productVariants, 'soft-classic', 'S', 'blue',
  )
  const jammerMBlack = findVariant(
    sizes, products, productVariants, 'jammer-classic', 'M', 'black',
  )
  const enduranceCompXLBlack = findVariant(
    sizes, products, productVariants, 'endurance-comp', 'XL', 'black',
  )
  const softXXSBlue = findVariant(
    sizes, products, productVariants, 'soft-classic', 'XXS', 'blue',
  )

  const transactions = [
    {
      id: 1, userId: 1, saleId: null, direction: 'Inbound',
      reason: 'GoodsReceipt', createdAt: daysAgo(20),
      _lines: [
        { variantId: enduranceLNavy.id, quantity: 10 },
        { variantId: softSBlue.id, quantity: 8 },
      ],
    },
    {
      id: 2, userId: 1, saleId: 3, direction: 'Outbound',
      reason: 'SaleConfirmed', createdAt: daysAgo(5),
      _lines: [{ variantId: jammerMBlack.id, quantity: 1 }],
    },
    {
      id: 3, userId: 1, saleId: null, direction: 'Inbound',
      reason: 'ManualAdjustment', createdAt: daysAgo(10),
      _lines: [{ variantId: enduranceCompXLBlack.id, quantity: 5 }],
    },
    {
      id: 4, userId: 1, saleId: null, direction: 'Outbound',
      reason: 'LossDefective', createdAt: daysAgo(3),
      _lines: [{ variantId: softXXSBlue.id, quantity: 1 }],
    },
  ]

  const transactionLines = []
  for (const transaction of transactions) {
    for (const item of transaction._lines) {
      transactionLines.push({
        id: transactionLines.length + 1,
        transactionId: transaction.id,
        ...item,
      })
    }
    delete transaction._lines
  }

  return { transactions, transactionLines }
}

function buildAlerts(db) {
  const alerts = []

  // Stock crítico: derivado (disponible < mínimo) — dominio real, no hardcodeado.
  for (const variant of db.productVariants) {
    if (!variant.active) continue
    if (availableQuantity(db, variant.id) < variant.minStock) {
      alerts.push({
        id: alerts.length + 1,
        variantId: variant.id,
        userId: null,
        alertType: 'CriticalStock',
        notificationMode: 'AdminPanel',
        status: 'Active',
        createdAt: daysAgo(1),
      })
    }
  }

  // Aviso de reposición: Ana suscripta al talle M de Endurance (sin stock).
  const enduranceMNavy = findVariant(
    db.sizes, db.products, db.productVariants, 'endurance-classic', 'M', 'navy',
  )
  alerts.push({
    id: alerts.length + 1,
    variantId: enduranceMNavy.id,
    userId: 2,
    alertType: 'RestockNotice',
    notificationMode: 'InApp',
    status: 'Active',
    createdAt: daysAgo(2),
  })

  return alerts
}

export function buildHistory({ sizes, products, productVariants }) {
  const random = createRandom(20260924)

  const sizeGenerations = buildGenerations(sizes, random)
  const { sales, saleLines, discountCoupons } = buildSalesAndCoupons(
    sizes, products, productVariants,
  )
  const { transactions, transactionLines } = buildTransactions(
    sizes, products, productVariants,
  )

  const db = {
    sizes, products, productVariants,
    sales, saleLines,
  }
  const alerts = buildAlerts(db)

  const pointsMovements = [
    { id: 1, userId: 2, generationId: 101, couponId: null, points: 10, type: 'Feedback', createdAt: daysAgo(3) },
    { id: 2, userId: 2, generationId: 102, couponId: null, points: 10, type: 'Feedback', createdAt: daysAgo(5) },
    { id: 3, userId: 2, generationId: null, couponId: null, points: 10, type: 'Feedback', createdAt: daysAgo(12) },
    { id: 4, userId: 2, generationId: null, couponId: null, points: 10, type: 'Feedback', createdAt: daysAgo(18) },
  ]

  return {
    sizeGenerations,
    sales,
    saleLines,
    discountCoupons,
    pointsMovements,
    transactions,
    transactionLines,
    alerts,
  }
}
