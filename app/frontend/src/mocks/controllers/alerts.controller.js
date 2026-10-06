/*
  Avisos de reposición. `POST /restock-alerts {line,sizeId}` crea una alerta por variante
  (el ER exige `variantId` obligatorio en ALERT) y es idempotente: no duplica las
  suscripciones activas del mismo usuario. La lista agrupa por línea × talle para que el
  cliente vea una sola suscripción.
*/

import { ApiError } from '@api/client/api-error.js'
import { requireFields } from '@mocks/controllers/controller-utils.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

register(
  'POST',
  '/restock-alerts',
  (req) => {
    const { line, sizeId } = req.body
    requireFields(req.body, ['line', 'sizeId'])

    return mutate((db) => {
      const size = db.sizes.find((item) => item.id === Number(sizeId))
      if (!size) throw new ApiError(404, 'NOT_FOUND')

      const productIds = db.products
        .filter((product) => product.active && product.line === line)
        .map((product) => product.id)

      const variants = db.productVariants.filter(
        (variant) =>
          variant.active &&
          variant.sizeId === size.id &&
          productIds.includes(variant.productId),
      )

      const userId = req.auth.user.id
      let created = 0
      for (const variant of variants) {
        const already = db.alerts.some(
          (alert) =>
            alert.variantId === variant.id &&
            alert.userId === userId &&
            alert.alertType === 'RestockNotice' &&
            alert.status === 'Active',
        )
        if (already) continue

        db.alerts.push({
          id: nextId(db.alerts),
          variantId: variant.id,
          userId,
          alertType: 'RestockNotice',
          notificationMode: 'InApp',
          status: 'Active',
          createdAt: new Date().toISOString(),
        })
        created += 1
      }

      return {
        status: 201,
        data: { created, line, size: { id: size.id, code: size.code } },
      }
    })
  },
  { auth: 'customer' },
)

register(
  'GET',
  '/me/restock-alerts',
  (req) => {
    const db = getDb()
    const mine = db.alerts.filter(
      (alert) => alert.userId === req.auth.user.id && alert.alertType === 'RestockNotice',
    )

    const groups = new Map()
    for (const alert of mine) {
      const variant = db.productVariants.find((item) => item.id === alert.variantId)
      if (!variant) continue
      const size = db.sizes.find((item) => item.id === variant.sizeId)
      const product = db.products.find((item) => item.id === variant.productId)
      if (!size || !product) continue

      const key = `${product.line}:${size.id}`
      const group = groups.get(key) ?? {
        key,
        line: product.line,
        size: { id: size.id, code: size.code },
        ids: [],
        variantCount: 0,
        status: 'Active',
      }
      group.ids.push(alert.id)
      group.variantCount += 1
      if (alert.status === 'Active') group.status = 'Active'
      groups.set(key, group)
    }

    return { status: 200, data: [...groups.values()] }
  },
  { auth: 'customer' },
)

register(
  'DELETE',
  '/me/restock-alerts/:id',
  (req) => {
    const id = Number(req.params.id)
    return mutate((db) => {
      const index = db.alerts.findIndex(
        (alert) =>
          alert.id === id &&
          alert.userId === req.auth.user.id &&
          alert.alertType === 'RestockNotice',
      )
      if (index === -1) throw new ApiError(404, 'NOT_FOUND')

      db.alerts.splice(index, 1)
      return { status: 204, data: null }
    })
  },
  { auth: 'customer' },
)
