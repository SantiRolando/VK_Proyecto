/*
  Etiquetas de dirección y su validación de formato. Los datos de la dirección
  son *dato*, no UI: no se traducen.
*/

import { z } from 'zod'

// Una línea corta para selects y listados: "Av. Italia 1234, Montevideo".
export function addressLine(address) {
  if (!address) return ''
  const street = [address.street, address.number].filter(Boolean).join(' ')
  return [street, address.city].filter(Boolean).join(', ')
}

// Dirección completa, con referencia, para el resumen y la confirmación.
export function addressFullLine(address) {
  if (!address) return ''
  return [
    [address.street, address.number].filter(Boolean).join(' '),
    address.city,
    address.department,
    address.reference,
  ]
    .filter(Boolean)
    .join(', ')
}

const required = z.string().trim().min(1, { message: 'required' })

export const addressSchema = z.object({
  street: required,
  number: required,
  city: required,
  department: required,
  reference: z.string().trim().optional(),
})
