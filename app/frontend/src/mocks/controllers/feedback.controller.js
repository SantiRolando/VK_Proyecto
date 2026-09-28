// Feedback de una generación (US6, FR-017/FR-018): calificación Chico/Correcto/
// Grande con comentario opcional, sin exigir compra. Una sola vez por
// generación (`ALREADY_RATED`).
//
// El invitado puede calificar (Q-15) pero no suma puntos: `POINTS_MOVEMENT`
// exige usuario. El cálculo de puntos vive en `domain/points.js`.

import { ApiError } from '@api/client/api-error.js'
import { serializeGeneration } from '@mocks/controllers/size-generations.controller.js'
import { mutate } from '@mocks/db/database.js'
import { FEEDBACK_RATINGS, grantFeedbackReward } from '@mocks/domain/points.js'
import { register } from '@mocks/router/mock-router.js'

// Dueño de la generación: el cliente dueño o el invitado con su sesión.
function findOwnedGeneration(db, req, id) {
  const user = req.auth?.user ?? null
  const generation = db.sizeGenerations.find((item) => item.id === id)
  const isOwner =
    generation &&
    ((user && generation.customerId === user.id) ||
      (!user && req.guestSessionId && generation.guestSessionId === req.guestSessionId))

  if (!isOwner) throw new ApiError(404, 'NOT_FOUND')
  return generation
}

register('PATCH', '/size-generations/:id/feedback', (req) => {
  const { rating, comment = null } = req.body
  if (!FEEDBACK_RATINGS.includes(rating)) {
    throw new ApiError(422, 'VALIDATION_ERROR', { fields: ['rating'] })
  }
  const text = comment == null ? null : String(comment).trim() || null

  return mutate((db) => {
    const generation = findOwnedGeneration(db, req, Number(req.params.id))
    if (generation.rating) {
      throw new ApiError(409, 'ALREADY_RATED', { generationId: generation.id })
    }

    const now = new Date()
    generation.rating = rating
    generation.comment = text
    generation.ratedAt = now.toISOString()

    const user = req.auth?.user ?? null
    const reward = user
      ? grantFeedbackReward(db, { user, generationId: generation.id, now })
      : { awarded: false, points: 0, balance: 0, dailyLimitReached: false }

    return {
      status: 200,
      data: { generation: serializeGeneration(db, generation), reward },
    }
  })
})
