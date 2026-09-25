import { z } from 'zod'

// Formato de las cinco medidas (FR-005): números positivos dentro de un
// rango razonable. La validación de negocio (qué medida usa cada línea y
// el rango contra la tabla SIZE) vive en el controller mock.
const toNumber = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : Number(value)),
  z.number({ message: 'required' }),
)

const measure = toNumber.refine((value) => Number.isFinite(value) && value > 0, {
  message: 'invalid',
})

export const fitSchema = z.object({
  line: z.enum(['Endurance', 'Soft', 'Jammer', 'Sunga', 'Kids']),
  height: measure.refine((value) => value >= 80 && value <= 250, { message: 'invalid' }),
  bust: measure.refine((value) => value >= 20 && value <= 300, { message: 'invalid' }),
  waist: measure.refine((value) => value >= 20 && value <= 300, { message: 'invalid' }),
  hip: measure.refine((value) => value >= 20 && value <= 300, { message: 'invalid' }),
  torso: measure.refine((value) => value >= 50 && value <= 300, { message: 'invalid' }),
})
