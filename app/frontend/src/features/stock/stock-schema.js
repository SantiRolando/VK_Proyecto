import { z } from 'zod'
import { COLORS, MODEL_IDS, getModelSizes } from './stock-options.js'

const nonNegativeInt = z.preprocess(
  (value) =>
    value === '' || value === null || value === undefined
      ? undefined
      : Number(value),
  z.number().int().nonnegative(),
)

const optionalText = z.preprocess(
  (value) => (value === null || value === undefined ? '' : value),
  z.string().trim(),
)

export const stockSchema = z
  .object({
    barcode: optionalText,
    model: z.enum(MODEL_IDS),
    size: z.string().trim().min(1),
    color: z.enum(COLORS.map((color) => color.id)),
    minStock: nonNegativeInt,
    quantity: nonNegativeInt,
    kid: z.boolean(),
    name: optionalText,
    description: optionalText,
  })
  .superRefine((data, ctx) => {
    const sizes = getModelSizes(data.model)
    if (!sizes.includes(data.size)) {
      ctx.addIssue({ code: 'custom', path: ['size'], message: 'invalid' })
    }
  })
