/*
  Controller de direcciones con el contrato del backend (`/addresses`): listado, alta,
  edición completa (PUT), baja lógica y default. Borrar la default deja al usuario sin
  default, igual que el backend.
*/

import { ApiError } from '@api/client/api-error.js'
import { getDb, mutate, nextId } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

const LIMITS = { street: 160, number: 20, city: 80, department: 80, reference: 200 }
const REQUIRED = ['street', 'city', 'department']

export function serializeAddress(address) {
  return {
    id: address.id,
    street: address.street,
    number: address.number || null,
    city: address.city,
    department: address.department,
    reference: address.reference || null,
    isDefault: Boolean(address.isDefault),
    createdAt: address.createdAt ?? null,
    updatedAt: address.updatedAt ?? null,
  }
}

// `AddressRequestDTO` del backend.
function readAddress(body) {
  const fields = {}
  const values = {}
  for (const [field, max] of Object.entries(LIMITS)) {
    const value = body[field] == null ? '' : String(body[field]).trim()
    if (REQUIRED.includes(field) && !value) fields[field] = 'must not be blank'
    if (value.length > max) fields[field] = `size must be between 0 and ${max}`
    values[field] = value || null
  }
  if (Object.keys(fields).length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', { fields, message: 'Validation failed' })
  }
  return values
}

function mineAddresses(db, userId) {
  return db.addresses.filter(
    (address) => address.userId === userId && address.active !== false,
  )
}

function requireMine(db, userId, addressId) {
  const address = mineAddresses(db, userId).find((item) => item.id === addressId)
  if (!address) throw new ApiError(404, 'NOT_FOUND')
  return address
}

register(
  'GET',
  '/addresses',
  (req) => {
    const addresses = mineAddresses(getDb(), req.auth.user.id).sort(
      (a, b) => Number(b.isDefault) - Number(a.isDefault) || a.id - b.id,
    )
    return { status: 200, data: addresses.map(serializeAddress) }
  },
  { auth: 'user' },
)

register(
  'GET',
  '/addresses/:id',
  (req) => {
    const address = requireMine(getDb(), req.auth.user.id, Number(req.params.id))
    return { status: 200, data: serializeAddress(address) }
  },
  { auth: 'user' },
)

register(
  'POST',
  '/addresses',
  (req) => {
    const values = readAddress(req.body)
    return mutate((db) => {
      const userId = req.auth.user.id
      const now = new Date().toISOString()
      const address = {
        id: nextId(db.addresses),
        userId,
        ...values,
        // La primera dirección del usuario queda como default.
        isDefault: mineAddresses(db, userId).length === 0,
        active: true,
        createdAt: now,
        updatedAt: now,
      }
      db.addresses.push(address)
      return { status: 201, data: serializeAddress(address) }
    })
  },
  { auth: 'user' },
)

register(
  'PUT',
  '/addresses/:id',
  (req) => {
    const values = readAddress(req.body)
    return mutate((db) => {
      const address = requireMine(db, req.auth.user.id, Number(req.params.id))
      Object.assign(address, values, { updatedAt: new Date().toISOString() })
      return { status: 200, data: serializeAddress(address) }
    })
  },
  { auth: 'user' },
)

register(
  'DELETE',
  '/addresses/:id',
  (req) => {
    return mutate((db) => {
      const address = requireMine(db, req.auth.user.id, Number(req.params.id))
      address.active = false
      address.isDefault = false
      return { status: 204, data: null }
    })
  },
  { auth: 'user' },
)

register(
  'PUT',
  '/addresses/:id/default',
  (req) => {
    return mutate((db) => {
      const userId = req.auth.user.id
      const address = requireMine(db, userId, Number(req.params.id))
      for (const other of mineAddresses(db, userId)) other.isDefault = false
      address.isDefault = true
      return { status: 200, data: serializeAddress(address) }
    })
  },
  { auth: 'user' },
)
