import { z } from 'zod'

// Schemas de formato de las pantallas de autenticación (FR-009/FR-010).
// La validación de negocio (email tomado, credenciales, OTP) vive en el
// controller mock; acá solo se valida formato.
const email = z.string().trim().email({ message: 'invalid' })
const required = z.string().trim().min(1, { message: 'required' })
const password = z
  .string()
  .min(6, { message: 'password' })

export const loginSchema = z.object({
  email: required.refine((value) => z.string().email().safeParse(value).success, {
    message: 'invalid',
  }),
  password: required,
})

export const registerSchema = z.object({
  name: required,
  email,
  password,
  whatsappPhone: required.refine((value) => /^\+?[\d\s-]{6,20}$/.test(value), {
    message: 'phone',
  }),
})

export const otpRequestSchema = z.object({ email })

export const otpVerifySchema = z.object({
  email,
  code: required,
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z.object({
  email,
  token: required,
  password,
})
