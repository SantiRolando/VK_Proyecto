import { z } from 'zod'

// Formato de la dirección nueva que se da de alta desde el checkout (T059).
// La validación de negocio vive en el controller mock.

const required = z.string().trim().min(1, { message: 'required' })

export const addressSchema = z.object({
  street: required,
  number: required,
  city: required,
  department: required,
  reference: z.string().trim().optional(),
})
