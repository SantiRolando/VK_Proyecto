// Analítica del panel (US8/T084, FR-021). Los KPIs son reglas de negocio, así
// que viven acá: conversión, precisión del talle (compró vs. solo consultó) y
// stock crítico.

import { serializeInventoryVariant } from '@mocks/controllers/admin-variants.controller.js'
import { getDb } from '@mocks/db/database.js'
import { inRange, rangeFromQuery } from '@mocks/domain/date-range.js'
import { listCriticalVariants } from '@mocks/domain/stock.js'
import { register } from '@mocks/router/mock-router.js'

// Una generación "compró" si tiene una venta no cancelada asociada (las
// pendientes de coordinación ya cuentan como compra coordinada).
function purchasedGenerationIds(db) {
  return new Set(
    db.sales
      .filter((sale) => sale.status !== 'Cancelled' && sale.generationId != null)
      .map((sale) => sale.generationId),
  )
}

// El serializador de inventario vive en `admin-variants` (US9): el bloque de
// stock crítico del dashboard reusa el mismo DTO.
export function serializeCriticalVariant(db, variant) {
  return serializeInventoryVariant(db, variant)
}

register(
  'GET',
  '/admin/analytics/conversion',
  (req) => {
    const db = getDb()
    const range = rangeFromQuery(req.query)
    const generations = db.sizeGenerations.filter((item) =>
      inRange(item.createdAt, range),
    ).length
    const sales = db.sales.filter((sale) => inRange(sale.createdAt, range)).length

    return {
      status: 200,
      data: {
        generations,
        sales,
        // Conversión = compras coordinadas / generaciones (0 si no hubo).
        ratio: generations > 0 ? sales / generations : 0,
      },
    }
  },
  { auth: 'admin' },
)

register(
  'GET',
  '/admin/analytics/precision',
  (req) => {
    const db = getDb()
    const range = rangeFromQuery(req.query)
    const purchased = purchasedGenerationIds(db)

    const groups = {
      purchased: { correct: 0, total: 0 },
      consultedOnly: { correct: 0, total: 0 },
    }

    for (const generation of db.sizeGenerations) {
      // Solo cuentan las mediciones calificadas y dentro del rango.
      if (!generation.rating || !inRange(generation.createdAt, range)) continue

      const group = purchased.has(generation.id) ? groups.purchased : groups.consultedOnly
      group.total += 1
      if (generation.rating === 'Correct') group.correct += 1
    }

    return { status: 200, data: groups }
  },
  { auth: 'admin' },
)

register(
  'GET',
  '/admin/analytics/critical-stock',
  () => {
    const db = getDb()
    const data = listCriticalVariants(db)
      .map((variant) => serializeCriticalVariant(db, variant))
      .sort((a, b) => b.deficit - a.deficit || a.id - b.id)

    return { status: 200, data }
  },
  { auth: 'admin' },
)
