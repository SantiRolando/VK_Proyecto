// Puntos del cliente (US6, FR-018): saldo y movimientos. El saldo vive en el
// usuario; cada premio o canje deja un POINTS_MOVEMENT.

import { getDb } from '@mocks/db/database.js'
import { register } from '@mocks/router/mock-router.js'

export function serializeMovement(movement) {
  return {
    id: movement.id,
    points: movement.points,
    type: movement.type,
    generationId: movement.generationId ?? null,
    couponId: movement.couponId ?? null,
    createdAt: movement.createdAt,
  }
}

register(
  'GET',
  '/me/points',
  (req) => {
    const db = getDb()
    const movements = db.pointsMovements
      .filter((movement) => movement.userId === req.auth.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(serializeMovement)

    return { status: 200, data: { balance: req.auth.user.pointsBalance, movements } }
  },
  { auth: 'user' },
)
