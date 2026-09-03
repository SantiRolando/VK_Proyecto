// Datos de ejemplo (mock) para la sección de reportes.

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

export function getReportData(period) {
  const buckets = BUCKETS[period] ?? 7

  return Array.from({ length: buckets }, (_, i) => {
    const generations = Math.floor(pseudo(i + 1) * 40) + 10
    const feedback = Math.floor(generations * (0.5 + pseudo(i + 100) * 0.4))
    const points = Math.floor(feedback * (0.3 + pseudo(i + 200) * 0.5))

    return {
      label: labelFor(period, i),
      generaciones: generations,
      feedback,
      puntos: points,
    }
  })
}

export function getSizeDistribution() {
  return [
    { size: 'XS', count: 12 },
    { size: 'S', count: 34 },
    { size: 'M', count: 58 },
    { size: 'L', count: 41 },
    { size: 'XL', count: 22 },
    { size: '2XL', count: 9 },
  ]
}
