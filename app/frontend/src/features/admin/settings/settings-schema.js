import { z } from 'zod'

/*
  Formato del formulario de configuración. Solo se valida lo que se puede dejar mal: los
  canales de contacto. Los campos numéricos no llevan regla porque el stepper los clampea
  contra el contrato, y la validación de negocio la hace la API.
*/
const required = z.string().trim().min(1, { message: 'required' })

export const settingsSchema = z.object({
  coordinationEmail: required.refine(
    (value) => z.string().email().safeParse(value).success,
    { message: 'email' },
  ),
  coordinationWhatsapp: required,
})
