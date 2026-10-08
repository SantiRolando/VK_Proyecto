import { settingsValidation } from '@features/admin/settings/settings-validation.js'
import { describe, expect, it } from 'vitest'

describe('reglas de la configuración', () => {
  it('pide los dos canales de contacto', () => {
    expect(settingsValidation.coordinationEmail('')).toBe('required')
    expect(settingsValidation.coordinationEmail('   ')).toBe('required')
    expect(settingsValidation.coordinationWhatsapp('')).toBe('required')
  })

  it('valida el formato del email', () => {
    expect(settingsValidation.coordinationEmail('ventas@vikinga.com.uy')).toBeNull()
    expect(settingsValidation.coordinationEmail('  ventas@vikinga.com.uy  ')).toBeNull()
    expect(settingsValidation.coordinationEmail('ventas@vikinga')).toBe('email')
  })

  it('acepta el WhatsApp sin formato especial', () => {
    expect(settingsValidation.coordinationWhatsapp('+59899000000')).toBeNull()
  })
})
