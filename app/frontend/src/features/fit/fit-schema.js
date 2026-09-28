import { measuresShape } from '@utils/measures.js'
import { z } from 'zod'

export const fitSchema = z.object({
  line: z.enum(['Endurance', 'Soft', 'Jammer', 'Sunga', 'Kids']),
  ...measuresShape,
})
