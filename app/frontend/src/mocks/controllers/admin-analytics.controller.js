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

const LINES = ['Endurance', 'Soft', 'Jammer', 'Sunga']

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

// Demanda no satisfecha (US10, FR-025): se deriva de las generaciones que
// consultaron stock inexistente (§4.7), agregadas por línea × talle (Q-12).
register(
  'GET',
  '/admin/analytics/missing-sizes',
  (req) => {
    const db = getDb()
    const range = rangeFromQuery(req.query)
    const { line } = req.query

    const cells = new Map()
    for (const generation of db.sizeGenerations) {
      if (generation.stockAvailableAtQuery !== false) continue
      if (line && generation.line !== line) continue
      if (!inRange(generation.createdAt, range)) continue

      const size = db.sizes.find((item) => item.id === generation.suggestedSizeId)
      if (!size) continue

      const key = `${generation.line}:${size.id}`
      const cell = cells.get(key) ?? {
        line: generation.line,
        size: { id: size.id, code: size.code, sortOrder: size.sortOrder },
        count: 0,
      }
      cell.count += 1
      cells.set(key, cell)
    }

    return {
      status: 200,
      data: [...cells.values()],
      // El mapa necesita la grilla completa para dibujar los ceros.
      meta: {
        lines: LINES,
        sizes: db.sizes.map((size) => ({
          id: size.id,
          line: size.line,
          code: size.code,
          sortOrder: size.sortOrder,
        })),
        total: [...cells.values()].reduce((sum, cell) => sum + cell.count, 0),
      },
    }
  },
  { auth: 'admin' },
)

// Comentarios del feedback (US10, FR-025) con filtros por calificación, línea y
// rango de fechas.
register(
  'GET',
  '/admin/analytics/comments',
  (req) => {
    const db = getDb()
    const range = rangeFromQuery(req.query)
    const { rating, line } = req.query

    const data = db.sizeGenerations
      .filter((generation) => generation.comment)
      .filter((generation) => !rating || generation.rating === rating)
      .filter((generation) => !line || generation.line === line)
      .filter((generation) => inRange(generation.createdAt, range))
      .sort(
        (a, b) => new Date(b.ratedAt ?? b.createdAt) - new Date(a.ratedAt ?? a.createdAt),
      )
      .map((generation) => {
        const size = db.sizes.find((item) => item.id === generation.suggestedSizeId)
        return {
          id: generation.id,
          line: generation.line,
          size: size ? { id: size.id, code: size.code } : null,
          rating: generation.rating ?? null,
          comment: generation.comment,
          ratedAt: generation.ratedAt ?? null,
          createdAt: generation.createdAt,
        }
      })

    return { status: 200, data, meta: { total: data.length } }
  },
  { auth: 'admin' },
)
