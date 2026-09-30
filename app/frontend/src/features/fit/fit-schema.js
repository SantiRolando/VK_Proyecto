import { Audience, Line } from '@constants/enums.js'
import { measuresShape, requiredMeasures } from '@utils/measures.js'
import { z } from 'zod'

const baseSchema = z.object({
  line: z.enum(Object.values(Line), { message: 'required' }),
  audience: z.enum(Object.values(Audience), { message: 'required' }),
  ...measuresShape,
})

// Las medidas obligatorias dependen de la tabla elegida (línea + público).
export function fitSchema(required) {
  return requiredMeasures(baseSchema, required)
}
