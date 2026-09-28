// Controller de direcciones (US4/T059 + US5/T075): agenda completa del cliente
// — listado, alta, edición, baja lógica y dirección predeterminada.
//
// La baja es lógica (`active`) para no romper las ventas que la referencian.

import { ApiError } from '@api/client/api-error.js'
import { requireFields } from '@mocks/controllers/controller-utils.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

const EDITABLE_FIELDS = ['street', 'number', 'city', 'department', 'reference']
const REQUIRED_FIELDS = ['street', 'number', 'city', 'department']

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

function mineAddresses(db, userId) {
  return db.addresses.filter(
    (address) => address.userId === userId && address.active !== false,
  )
}

function findMine(db, userId, addressId) {
  return mineAddresses(db, userId).find((address) => address.id === addressId) ?? null
}

// Si no quedó ninguna predeterminada (p. ej. dieron de baja la que lo era), la
// más antigua que queda pasa a serlo.
function ensureDefault(addresses) {
  if (addresses.length === 0) return
  if (addresses.some((address) => address.isDefault)) return

  const oldest = addresses.reduce((best, address) =>
    address.id < best.id ? address : best,
  )
  oldest.isDefault = true
}

function sortDefaultFirst(addresses) {
  return addresses.sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id - b.id,
  )
}

register(
  'GET',
  '/me/addresses',
  (req) => {
    const addresses = sortDefaultFirst(mineAddresses(getDb(), req.auth.user.id))

    return { status: 200, data: addresses.map(serializeAddress) }
  },
  { auth: 'user' },
)

register(
  'POST',
  '/me/addresses',
  (req) => {
    const { reference = '', isDefault = false } = req.body
    requireFields(req.body, REQUIRED_FIELDS)

    return mutate((db) => {
      const userId = req.auth.user.id
      const mine = mineAddresses(db, userId)
      // La primera dirección es la predeterminada; marcar otra mueve la marca.
      const makeDefault = Boolean(isDefault) || mine.length === 0
      if (makeDefault) {
        for (const other of mine) other.isDefault = false
      }

      const address = {
        id: nextId(db.addresses),
        userId,
        street: req.body.street,
        number: req.body.number,
        city: req.body.city,
        department: req.body.department,
        reference: reference ?? '',
        isDefault: makeDefault,
        active: true,
      }
      db.addresses.push(address)

      return { status: 201, data: serializeAddress(address) }
    })
  },
  { auth: 'user' },
)

register(
  'PATCH',
  '/me/addresses/:id',
  (req) => {
    // El PATCH es parcial: solo se tocan los campos que llegan.
    const patch = {}
    const fields = []
    for (const field of EDITABLE_FIELDS) {
      if (req.body[field] === undefined) continue

      const value = String(req.body[field]).trim()
      if (value === '' && REQUIRED_FIELDS.includes(field)) {
        fields.push(field)
        continue
      }
      patch[field] = value
    }

    if (fields.length > 0) {
      throw new ApiError(422, 'VALIDATION_ERROR', { fields })
    }

    return mutate((db) => {
      const address = findMine(db, req.auth.user.id, Number(req.params.id))
      if (!address) throw new ApiError(404, 'NOT_FOUND')

      Object.assign(address, patch)

      return { status: 200, data: serializeAddress(address) }
    })
  },
  { auth: 'user' },
)

register(
  'DELETE',
  '/me/addresses/:id',
  (req) => {
    return mutate((db) => {
      const userId = req.auth.user.id
      const address = findMine(db, userId, Number(req.params.id))
      if (!address) throw new ApiError(404, 'NOT_FOUND')

      address.active = false
      address.isDefault = false
      ensureDefault(mineAddresses(db, userId))

      return { status: 204, data: null }
    })
  },
  { auth: 'user' },
)

register(
  'PUT',
  '/me/addresses/:id/default',
  (req) => {
    return mutate((db) => {
      const userId = req.auth.user.id
      const address = findMine(db, userId, Number(req.params.id))
      if (!address) throw new ApiError(404, 'NOT_FOUND')

      for (const other of mineAddresses(db, userId)) other.isDefault = false
      address.isDefault = true

      return { status: 200, data: serializeAddress(address) }
    })
  },
  { auth: 'user' },
)
