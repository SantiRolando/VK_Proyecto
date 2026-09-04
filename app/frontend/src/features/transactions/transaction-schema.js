import { z } from 'zod'

const positiveInt = z.preprocess(
  (value) =>
    value === '' || value === null || value === undefined
      ? undefined
      : Number(value),
  z.number().int().positive(),
)

const nullablePositiveInt = z.preprocess(
  (value) =>
    value === '' || value === null || value === undefined
      ? null
      : Number(value),
  z.number().int().positive().nullable(),
)

const optionalText = z.preprocess(
  (value) => (value === null || value === undefined ? '' : value),
  z.string().trim(),
)

const lineSchema = z.object({
  productId: positiveInt,
  quantity: positiveInt,
})

// Transacción genérica (entrada de mercadería, pérdida u otros).
// La dirección se deriva del motivo al momento de persistir.
export const transactionSchema = z.object({
  reason: z.enum(['entrada', 'perdida', 'otros']),
  date: z.string().trim().min(1),
  lines: z.array(lineSchema).min(1),
})

// Venta: es una transacción de salida que además lleva datos opcionales
// de cliente, cupón, delivery y dirección de entrega.
export const saleSchema = z.object({
  date: z.string().trim().min(1),
  customerId: nullablePositiveInt,
  couponId: nullablePositiveInt,
  delivery: z.boolean(),
  address: optionalText,
  lines: z.array(lineSchema).min(1),
})
