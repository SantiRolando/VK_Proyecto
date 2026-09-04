// Metadatos del dominio de transacciones.
// `id` es el identificador estable (independiente de la traducción),
// `labelKey` apunta a la clave de traducción, `direction` indica si el
// movimiento sube (`ingreso`) o baja (`salida`) el stock y `color` es el
// color Mantine asociado para renderizarlo de forma consistente.

export const DIRECTIONS = [
  { id: 'ingreso', labelKey: 'transactions.direction.ingreso', color: 'teal' },
  { id: 'salida', labelKey: 'transactions.direction.salida', color: 'red' },
]

// `venta` se gestiona a través de su propio formulario (tiene datos extra
// como cliente, cupón, delivery y dirección), por eso se excluye del
// formulario genérico de transacción.
export const REASONS = [
  {
    id: 'entrada',
    labelKey: 'transactions.reason.entrada',
    direction: 'ingreso',
    color: 'teal',
  },
  {
    id: 'venta',
    labelKey: 'transactions.reason.venta',
    direction: 'salida',
    color: 'blue',
  },
  {
    id: 'perdida',
    labelKey: 'transactions.reason.perdida',
    direction: 'salida',
    color: 'orange',
  },
  {
    id: 'otros',
    labelKey: 'transactions.reason.otros',
    direction: 'salida',
    color: 'gray',
  },
]

export const NON_SALE_REASONS = REASONS.filter((reason) => reason.id !== 'venta')

export function getDirection(directionId) {
  return DIRECTIONS.find((direction) => direction.id === directionId)
}

export function getDirectionLabelKey(directionId) {
  return getDirection(directionId)?.labelKey ?? directionId
}

export function getDirectionColor(directionId) {
  return getDirection(directionId)?.color ?? 'gray'
}

export function getReason(reasonId) {
  return REASONS.find((reason) => reason.id === reasonId)
}

export function getReasonLabelKey(reasonId) {
  return getReason(reasonId)?.labelKey ?? reasonId
}

export function getReasonColor(reasonId) {
  return getReason(reasonId)?.color ?? 'gray'
}

export function getDirectionForReason(reasonId) {
  return getReason(reasonId)?.direction ?? 'salida'
}
