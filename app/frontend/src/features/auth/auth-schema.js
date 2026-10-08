import { z } from 'zod'

/*
  Schemas de formato de las pantallas de autenticación.
  La validación de negocio (email tomado, credenciales, OTP) la hace la API;
  acá solo se valida formato con las mismas reglas que el backend: clave de 8 a
  64 caracteres, teléfono de 8 a 15 dígitos, código OTP de 6 dígitos.
*/
const email = z.string().trim().email({ message: 'invalid' })
const required = z.string().trim().min(1, { message: 'required' })
const password = z
  .string()
  .min(8, { message: 'password' })
  .max(64, { message: 'password' })
const otpCode = required.refine((value) => /^[0-9]{6}$/.test(value), { message: 'code' })

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
  whatsappPhone: required.refine(
    (value) => /^\+?[0-9]{8,15}$/.test(value.replace(/[\s-]/g, '')),
    { message: 'phone' },
  ),
})

export const otpRequestSchema = z.object({ email })

export const otpVerifySchema = z.object({
  email,
  code: otpCode,
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z.object({
  email,
  code: otpCode,
  newPassword: password,
})
