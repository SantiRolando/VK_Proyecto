// Redondeo monetario del dominio (UYU, dos decimales). Compartido por las
// reglas de venta, cupones y el mensaje de coordinación.

export function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}
