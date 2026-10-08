import { settingsSchema } from '@features/admin/settings/settings-schema.js'
import { collectFieldErrors } from '@utils/zod-errors.js'
import { describe, expect, it } from 'vitest'

// Lo mismo que hace el formulario: parsear y quedarse con los códigos por campo.
function errorsFor(values) {
  const parsed = settingsSchema.safeParse(values)
  return parsed.success ? {} : collectFieldErrors(parsed.error)
}

const VALID = {
  coordinationEmail: 'ventas@vikinga.com.uy',
  coordinationWhatsapp: '+59899000000',
}

describe('formato de la configuración', () => {
  it('pide los dos canales de contacto', () => {
    expect(errorsFor({ coordinationEmail: '', coordinationWhatsapp: '' })).toEqual({
      coordinationEmail: 'required',
      coordinationWhatsapp: 'required',
    })
    expect(errorsFor({ coordinationEmail: '   ', coordinationWhatsapp: '   ' })).toEqual({
      coordinationEmail: 'required',
      coordinationWhatsapp: 'required',
    })
  })

  it('valida el formato del email', () => {
    expect(errorsFor({ ...VALID, coordinationEmail: 'ventas@vikinga' })).toEqual({
      coordinationEmail: 'email',
    })
    expect(settingsSchema.safeParse(VALID).success).toBe(true)
    // Los espacios de más no cuentan como error.
    expect(
      settingsSchema.safeParse({ ...VALID, coordinationEmail: ' ventas@vikinga.com.uy ' })
        .success,
    ).toBe(true)
  })

  it('acepta el WhatsApp sin formato especial', () => {
    expect(
      settingsSchema.safeParse({ ...VALID, coordinationWhatsapp: '+598 99 000 000' })
        .success,
    ).toBe(true)
  })
})
