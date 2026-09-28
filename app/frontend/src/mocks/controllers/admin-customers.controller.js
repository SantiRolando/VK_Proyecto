// Clientes registrados (US12/T100): insumo del modo asistente para vincular una
// generación a un cliente. Solo expone lo necesario para identificarlo.

import { getDb } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

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
