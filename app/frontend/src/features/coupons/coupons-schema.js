import { z } from 'zod'

const positiveNumber = z.preprocess(
  (value) =>
    value === '' || value === null || value === undefined
      ? undefined
      : Number(value),
  z.number().positive(),
)

export const couponSchema = z.object({
  code: z.string().trim().min(1),
  type: z.enum(['fixed', 'percentage']),
  value: positiveNumber,
  maxUses: z.preprocess(
    (value) =>
      value === '' || value === null || value === undefined
        ? undefined
        : Number(value),
    z.number().int().positive(),
  ),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  active: z.boolean(),
})
