import { z } from 'zod'

// Una medida puede venir vacía (opcional) o ser un número positivo.
// Los campos que realmente se usan para el cálculo se validan como
// obligatorios en el `superRefine` según el sexo seleccionado.
const measurement = z.preprocess(
  (value) =>
    value === '' || value === null || value === undefined
      ? undefined
      : Number(value),
  z.number().positive().optional(),
)

export const sizingSchema = z
  .object({
    sex: z.enum(['woman', 'man']),
    product: z.enum([
      'women-endurance',
      'women-soft',
      'men-jammer',
      'men-sungas',
    ]),
    height: measurement,
    waist: measurement,
    hip: measurement,
    bust: measurement,
    torso: measurement,
  })
  .superRefine((data, ctx) => {
    const required = data.sex === 'woman' ? ['waist', 'bust'] : ['waist', 'hip']

    for (const field of required) {
      if (data[field] === undefined) {
        ctx.addIssue({ code: 'custom', path: [field], message: 'required' })
      }
    }
  })
