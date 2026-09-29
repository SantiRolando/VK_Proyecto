// Usuarios de la plataforma (panel): padrón con rol, alta/revocación de admin y
// los indicadores de uso. Antes este controller solo listaba clientes para el
// modo asistente (US12).

import { ApiError } from '@api/client/api-error.js'
import { getDb } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

const DAY = 24 * 60 * 60 * 1000

function within(dateish, days) {
  if (!dateish) return false
  return Date.now() - new Date(dateish).getTime() <= days * DAY
}

/** Actividad por usuario, derivada de datos reales (no hay tabla de sesiones). */
function activityByUser(db) {
  const map = new Map()
  const mark = (userId, date) => {
    if (!userId || !date) return
    const current = map.get(userId)
    if (!current || new Date(date) > new Date(current)) map.set(userId, date)
  }

  for (const generation of db.sizeGenerations)
    mark(generation.customerId, generation.createdAt)
  for (const sale of db.sales) mark(sale.customerId, sale.createdAt)
  return map
}

function serializeUser(user, lastActivity) {
  return {
    id: user.id,
    type: user.type,
    name: user.name,
    email: user.email,
    whatsappPhone: user.whatsappPhone,
    pointsBalance: user.pointsBalance,
    createdAt: user.createdAt,
    lastActivity: lastActivity ?? null,
  }
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

// Clientes registrados (US12): insumo del modo asistente para vincular una
// generación. Se mantiene con la forma mínima que espera ese flujo.
register(
  'GET',
  '/admin/customers',
  () => {
    const data = getDb()
      .users.filter((user) => user.type === 'Customer')
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((user) => ({ id: user.id, name: user.name, email: user.email }))

    return { status: 200, data, meta: { total: data.length } }
  },
  { auth: 'admin' },
)

// GET /admin/users — padrón completo, con filtro por rol y por actividad.
register(
  'GET',
  '/admin/users',
  (req) => {
    const db = getDb()
    const { role, active } = req.query
    const activity = activityByUser(db)

    let items = db.users
    if (role === 'Admin' || role === 'Customer') {
      items = items.filter((user) => user.type === role)
    }
    if (active === 'true') {
      items = items.filter((user) => within(activity.get(user.id), 30))
    }

    const data = items
      .map((user) => serializeUser(user, activity.get(user.id)))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    return {
      status: 200,
      data,
      meta: {
        total: data.length,
        admins: db.users.filter((user) => user.type === 'Admin').length,
        customers: db.users.filter((user) => user.type === 'Customer').length,
      },
    }
  },
  { auth: 'admin' },
)

// GET /admin/users/analytics — indicadores del padrón y tendencia de altas.
//
// Alcance: "usuarios activos" se deriva de la última medición o compra, porque el
// mock no registra inicios de sesión. Mide uso del producto, no logins.
register(
  'GET',
  '/admin/users/analytics',
  () => {
    const db = getDb()
    const activity = activityByUser(db)

    const totalUsers = db.users.length
    const admins = db.users.filter((user) => user.type === 'Admin').length
    const activeNow = db.users.filter((user) => within(activity.get(user.id), 30)).length
    const newLastMonth = db.users.filter((user) => within(user.createdAt, 30)).length
    const newPrevMonth = db.users.filter(
      (user) => !within(user.createdAt, 30) && within(user.createdAt, 60),
    ).length

    // Tendencia de altas: últimos 12 meses, incluidos los meses sin altas.
    const now = new Date()
    const buckets = new Map()
    for (let i = 11; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      buckets.set(monthKey(d), { month: monthKey(d), signups: 0 })
    }
    for (const user of db.users) {
      const key = monthKey(new Date(user.createdAt))
      if (buckets.has(key)) buckets.get(key).signups += 1
    }

    return {
      status: 200,
      data: {
        totalUsers,
        admins,
        customers: totalUsers - admins,
        activeNow,
        newLastMonth,
        newPrevMonth,
        newGrowth:
          newPrevMonth === 0
            ? null
            : Math.round(((newLastMonth - newPrevMonth) / newPrevMonth) * 100),
        activeRate: totalUsers === 0 ? 0 : Math.round((activeNow / totalUsers) * 100),
        signupsByMonth: [...buckets.values()],
      },
    }
  },
  { auth: 'admin' },
)

// PATCH /admin/users/:id/role — otorga o revoca el rol de administrador.
register(
  'PATCH',
  '/admin/users/:id/role',
  (req) => {
    const db = getDb()
    const { type } = req.body ?? {}
    if (type !== 'Admin' && type !== 'Customer') {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['type'] })
    }

    const user = db.users.find((item) => item.id === Number(req.params.id))
    if (!user) throw new ApiError(404, 'NOT_FOUND')

    // Salvaguardas: no quedarse sin administradores ni auto-revocarse, que es la
    // forma más fácil de perder el acceso al panel.
    if (type === 'Customer' && user.type === 'Admin') {
      const adminCount = db.users.filter((item) => item.type === 'Admin').length
      if (adminCount <= 1) throw new ApiError(409, 'LAST_ADMIN')
      if (req.auth?.user?.id === user.id) throw new ApiError(409, 'CANNOT_DEMOTE_SELF')
    }

    user.type = type
    return { status: 200, data: serializeUser(user) }
  },
  { auth: 'admin' },
)
