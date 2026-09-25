// Controller de direcciones (T059): lo mínimo que necesita el checkout —
// listar la agenda y dar de alta una dirección. La edición, la baja lógica y
// el cambio de predeterminada llegan con la agenda completa en US5.

import { getDb, mutate, nextId } from '../db/database.js'
import { register } from '../router/mock-router.js'
import { requireFields } from './controller-utils.js'

export function serializeAddress(address) {
  return {
    id: address.id,
    street: address.street,
    number: address.number,
    city: address.city,
    department: address.department,
    reference: address.reference ?? '',
    isDefault: Boolean(address.isDefault),
  }
}

register('GET', '/me/addresses', (req) => {
  const addresses = getDb()
    .addresses.filter(
      (address) => address.userId === req.auth.user.id && address.active !== false,
    )
    .sort(
      (a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id - b.id,
    )

  return { status: 200, data: addresses.map(serializeAddress) }
}, { auth: 'user' })

register('POST', '/me/addresses', (req) => {
  const {
    street,
    number,
    city,
    department,
    reference = '',
    isDefault = false,
  } = req.body
  requireFields(req.body, ['street', 'number', 'city', 'department'])

  return mutate((db) => {
    const userId = req.auth.user.id
    const mine = db.addresses.filter(
      (address) => address.userId === userId && address.active !== false,
    )
    // La primera dirección es la predeterminada; marcar otra mueve la marca.
    const makeDefault = Boolean(isDefault) || mine.length === 0
    if (makeDefault) {
      for (const other of mine) other.isDefault = false
    }

    const address = {
      id: nextId(db.addresses),
      userId,
      street,
      number,
      city,
      department,
      reference: reference ?? '',
      isDefault: makeDefault,
      active: true,
    }
    db.addresses.push(address)

    return { status: 201, data: serializeAddress(address) }
  })
}, { auth: 'user' })
