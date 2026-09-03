// Datos de ejemplo (mock) para el dominio de cupones y gamificación.
// Se reemplazarán por datos reales del backend en una iteración posterior.

export const defaultGamificationSettings = {
  // Variable 1: límite de feedbacks por usuario por día (anti-farming).
  dailyFeedbackLimit: 5,
  // Variable 2: probabilidad (0-100) de ganar puntos al completar feedback.
  rewardChancePercent: 30,
  // Variable 3: puntos otorgados cuando el "dado" sale.
  rewardPoints: 10,
}

export const mockCoupons = [
  {
    id: 1,
    code: 'BIENVENIDA10',
    type: 'percentage',
    value: 10,
    maxUses: 200,
    used: 47,
    startDate: '2026-09-01',
    endDate: '2026-12-31',
    active: true,
  },
  {
    id: 2,
    code: 'NADADOR20',
    type: 'percentage',
    value: 20,
    maxUses: 100,
    used: 12,
    startDate: '2026-09-01',
    endDate: '2026-10-31',
    active: true,
  },
  {
    id: 3,
    code: 'ENVIOGRATIS',
    type: 'fixed',
    value: 5000,
    maxUses: 300,
    used: 88,
    startDate: '2026-08-01',
    endDate: '2026-12-31',
    active: true,
  },
  {
    id: 4,
    code: 'VERANO15',
    type: 'percentage',
    value: 15,
    maxUses: 150,
    used: 0,
    startDate: '2026-12-01',
    endDate: '2027-02-28',
    active: false,
  },
  {
    id: 5,
    code: 'VIP5000',
    type: 'fixed',
    value: 5000,
    maxUses: 50,
    used: 23,
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    active: true,
  },
]

// --- Histórico de puntos (mock) ---
// Reutiliza los mismos bloques de tiempo que la sección de Reportes.

const BUCKETS = {
  day: 24,
  week: 7,
  month: 30,
  '6months': 6,
  year: 12,
}

function pseudo(seed) {
  const x = Math.sin(seed * 12.9898 + 4.1414) * 43758.5453
  return x - Math.floor(x)
}

function labelFor(period, index) {
  if (period === 'day') return `${String(index).padStart(2, '0')}:00`
  return `${index + 1}`
}

export function getPointsHistory(period, predictions) {
  const buckets = BUCKETS[period] ?? 7
  const actual = defaultGamificationSettings

  return Array.from({ length: buckets }, (_, i) => {
    // Demanda bruta de feedback por bloque (lo que se habría cargado sin límite).
    const demand = Math.floor(pseudo(i + 7) * 8) + 2

    const actualFeedback = Math.min(demand, actual.dailyFeedbackLimit)
    const actualPoints = Math.round(
      actualFeedback * (actual.rewardChancePercent / 100) * actual.rewardPoints,
    )

    return {
      label: labelFor(period, i),
      points: actualPoints,
      predictedChance: Math.round(
        actualFeedback * (predictions.chancePercent / 100) * actual.rewardPoints,
      ),
      predictedLimit: Math.round(
        Math.min(demand, predictions.dailyFeedbackLimit) *
          (actual.rewardChancePercent / 100) *
          actual.rewardPoints,
      ),
      predictedPoints: Math.round(
        actualFeedback * (actual.rewardChancePercent / 100) * predictions.rewardPoints,
      ),
    }
  })
}
