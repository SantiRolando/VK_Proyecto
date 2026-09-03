import { z } from 'zod'

export const userSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  role: z.enum(['admin', 'editor', 'viewer']),
})
