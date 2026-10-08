/*
  Clientes registrados: insumo del modo asistente para vincular una generación. Se mantiene
  con la forma mínima que espera ese flujo.
*/

import { UserType } from '@constants/enums.js'
import { getDb } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

register(
  'GET',
  '/admin/customers',
  () => {
    const data = getDb()
      .users.filter((user) => user.type === UserType.Customer)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((user) => ({ id: user.id, name: user.name, email: user.email }))

    return { status: 200, data, meta: { total: data.length } }
  },
  { auth: 'admin' },
)
