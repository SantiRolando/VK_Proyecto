/*
  Composición del mensaje de coordinación. El destino lo toma de SETTING
  (`coordination_email` / `coordination_whatsapp`) y el texto lo arma el backend (acá, el
  mock): el FE solo abre la URL. El idioma viaja en el request porque el perfil aún no lo
  guarda, y las plantillas viven en el mock, no en el FE.
*/

const LOCALES = ['es', 'en']

function settingValue(settings, key) {
  return settings.find((setting) => setting.key === key)?.value ?? null
}

// `wa.me` necesita solo dígitos (sin `+` ni separadores).
function digits(phone) {
  return String(phone ?? '').replace(/\D/g, '')
}

function formatMoney(value, locale) {
  return new Intl.NumberFormat(locale === 'en' ? 'en' : 'es-UY', {
    style: 'currency',
    currency: 'UYU',
    currencyDisplay: 'code',
  }).format(value)
}

function capitalize(value) {
  const text = String(value ?? '')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

const MESSAGES = {
  es: {
    storePickup: 'Retiro en local',
    homeDelivery: 'Envío a domicilio',
    subject: ({ id, model }) => `Coordinación de compra #${id} - ${model}`,
    greeting: 'Hola, quiero coordinar esta compra:',
    order: ({ id }) => `Pedido #${id}`,
    line: ({ model, size, color, quantity, lineTotal }) =>
      `- ${model} · Talle ${size} · ${color} × ${quantity} = ${lineTotal}`,
    subtotal: (value) => `Subtotal: ${value}`,
    discount: ({ code, value }) => `Descuento (${code}): -${value}`,
    total: (value) => `Total: ${value}`,
    delivery: (value) => `Entrega: ${value}`,
    address: (value) => `Dirección: ${value}`,
    customer: 'Datos del cliente:',
    name: (value) => `Nombre: ${value}`,
    email: (value) => `Email: ${value}`,
    phone: (value) => `WhatsApp: ${value}`,
  },
  en: {
    storePickup: 'Store pickup',
    homeDelivery: 'Home delivery',
    subject: ({ id, model }) => `Purchase coordination #${id} - ${model}`,
    greeting: 'Hi, I would like to coordinate this purchase:',
    order: ({ id }) => `Order #${id}`,
    line: ({ model, size, color, quantity, lineTotal }) =>
      `- ${model} · Size ${size} · ${color} × ${quantity} = ${lineTotal}`,
    subtotal: (value) => `Subtotal: ${value}`,
    discount: ({ code, value }) => `Discount (${code}): -${value}`,
    total: (value) => `Total: ${value}`,
    delivery: (value) => `Delivery: ${value}`,
    address: (value) => `Address: ${value}`,
    customer: 'Customer details:',
    name: (value) => `Name: ${value}`,
    email: (value) => `Email: ${value}`,
    phone: (value) => `WhatsApp: ${value}`,
  },
}

function formatAddress(address) {
  return [address?.street, address?.number, address?.city, address?.department]
    .filter(Boolean)
    .join(', ')
}

/*
  Devuelve `{ channel, to, subject, body, url }`. `url` es null si falta el destino
  configurado: la venta ya existe, así que la pantalla debe poder ofrecer un respaldo
  en vez de fallar.
*/
export function buildCoordinationMessage({
  sale,
  lines,
  customer,
  address = null,
  coupon = null,
  totals,
  settings,
  locale = 'es',
}) {
  const language = LOCALES.includes(locale) ? locale : 'es'
  const m = MESSAGES[language]
  const isEmail = sale.channel === 'Email'

  const to = settingValue(
    settings,
    isEmail ? 'coordination_email' : 'coordination_whatsapp',
  )

  const deliveryLabel =
    sale.deliveryMethod === 'HomeDelivery' ? m.homeDelivery : m.storePickup

  // La dirección solo viaja en el mensaje cuando la entrega es a domicilio.
  const deliveryAddress = sale.deliveryMethod === 'HomeDelivery' ? address : null

  const rows = [
    m.greeting,
    '',
    m.order({ id: sale.id }),
    ...lines.map((line) =>
      m.line({
        model: line.product?.model ?? '',
        size: line.size?.code ?? '',
        color: capitalize(line.color),
        quantity: line.quantity,
        lineTotal: formatMoney(line.lineTotal, language),
      }),
    ),
    '',
    m.subtotal(formatMoney(totals.subtotal, language)),
    totals.discount > 0 && coupon
      ? m.discount({
          code: coupon.couponCode,
          value: formatMoney(totals.discount, language),
        })
      : null,
    m.total(formatMoney(totals.total, language)),
    '',
    m.delivery(deliveryLabel),
    deliveryAddress ? m.address(formatAddress(deliveryAddress)) : null,
    '',
    m.customer,
    m.name(customer?.name ?? ''),
    m.email(customer?.email ?? ''),
    m.phone(customer?.whatsappPhone ?? ''),
  ]

  const body = rows.filter((row) => row !== null).join('\n')
  const subject = isEmail
    ? m.subject({ id: sale.id, model: lines[0]?.product?.model ?? '' })
    : null

  if (!to) {
    return { channel: sale.channel, to: null, subject, body, url: null }
  }

  const url = isEmail
    ? `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : `https://wa.me/${digits(to)}?text=${encodeURIComponent(body)}`

  return { channel: sale.channel, to, subject, body, url }
}
