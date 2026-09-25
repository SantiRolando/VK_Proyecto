import { describe, expect, it } from 'vitest'
import { buildCoordinationMessage } from './coordination-message.js'

const settings = [
  { key: 'coordination_email', value: 'ventas@vikinga.com.uy' },
  { key: 'coordination_whatsapp', value: '+59899000000' },
]

const customer = {
  name: 'Ana Rodríguez',
  email: 'ana@example.test',
  whatsappPhone: '+59899000002',
}

const address = {
  street: 'Av. Italia',
  number: '1234',
  city: 'Montevideo',
  department: 'Montevideo',
}

const lines = [
  {
    quantity: 1,
    lineTotal: 1290,
    color: 'navy',
    product: { model: 'endurance-classic' },
    size: { code: 'L' },
  },
]

function build({ sale = {}, totals = {}, ...rest } = {}) {
  return buildCoordinationMessage({
    sale: {
      id: 55,
      channel: 'Email',
      deliveryMethod: 'StorePickup',
      ...sale,
    },
    lines,
    customer,
    totals: { subtotal: 1290, discount: 0, total: 1290, ...totals },
    settings,
    ...rest,
  })
}

describe('coordination-message', () => {
  it('arma el cuerpo con producto, talle, color y totales', () => {
    const contact = build()

    expect(contact.channel).toBe('Email')
    expect(contact.to).toBe('ventas@vikinga.com.uy')
    expect(contact.subject).toContain('Coordinación de compra #55')
    expect(contact.body).toContain('endurance-classic')
    expect(contact.body).toContain('Talle L')
    expect(contact.body).toContain('Navy')
    expect(contact.body).toContain('Retiro en local')
    expect(contact.body).toContain('Ana Rodríguez')
    expect(contact.body).toContain('ana@example.test')
  })

  it('compone la URL de email con asunto y cuerpo codificados', () => {
    const contact = build()

    expect(contact.url.startsWith('mailto:ventas@vikinga.com.uy?')).toBe(true)
    expect(contact.url).toContain(`subject=${encodeURIComponent(contact.subject)}`)
    expect(contact.url).toContain(`body=${encodeURIComponent(contact.body)}`)
  })

  it('compone la URL de WhatsApp sin el signo + y con el texto del cuerpo', () => {
    const contact = build({ sale: { channel: 'Whatsapp' } })

    expect(contact.to).toBe('+59899000000')
    expect(contact.subject).toBeNull()
    expect(contact.url.startsWith('https://wa.me/59899000000?text=')).toBe(true)
    expect(decodeURIComponent(contact.url.split('text=')[1])).toBe(contact.body)
  })

  it('incluye la dirección solo cuando el envío es a domicilio', () => {
    const pickup = build({ address })
    expect(pickup.body).not.toContain('Av. Italia')

    const delivery = build({
      sale: { deliveryMethod: 'HomeDelivery' },
      address,
    })
    expect(delivery.body).toContain('Envío a domicilio')
    expect(delivery.body).toContain('Av. Italia, 1234, Montevideo, Montevideo')
  })

  it('agrega la línea de descuento solo si hay descuento y cupón', () => {
    const withoutCoupon = build({ totals: { discount: 129, total: 1161 } })
    expect(withoutCoupon.body).not.toContain('Descuento')

    const withCoupon = build({
      coupon: { couponCode: 'VIKI10' },
      totals: { discount: 129, total: 1161 },
    })
    expect(withCoupon.body).toContain('Descuento (VIKI10): -')
    expect(withCoupon.body).toContain('Total:')
  })

  it('usa las plantillas en inglés cuando el locale es en', () => {
    const contact = build({ locale: 'en' })

    expect(contact.subject).toContain('Purchase coordination #55')
    expect(contact.body).toContain('Store pickup')
    expect(contact.body).toContain('Customer details:')
  })

  it('cae a español con un locale desconocido', () => {
    const contact = build({ locale: 'fr' })
    expect(contact.body).toContain('Retiro en local')
  })

  it('devuelve url null si falta el destino configurado', () => {
    const contact = build({ settings: [] })

    expect(contact.to).toBeNull()
    expect(contact.url).toBeNull()
    // El cuerpo se sigue armando: la venta ya existe y la pantalla puede
    // ofrecer un respaldo.
    expect(contact.body).toContain('endurance-classic')
  })
})
