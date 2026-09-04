// Datos de ejemplo (mock) para el dominio de gestión de stock.
// Se reemplazarán por datos reales del backend en una iteración posterior.
//
// `quantity` es el stock disponible actual; `minStock` es el umbral a partir
// del cual se disparará una alerta de reposición en una iteración posterior.
// `salesSeries` y `stockSeries` representan, respectivamente, las ventas y el
// stock diarios de los últimos 30 días (datos simulados para las sparklines).
// `salesLastMonth` es la suma de ventas del último mes y `trending` marca los
// productos con tendencia de ventas.

function pseudo(seed) {
  const x = Math.sin(seed * 12.9898 + 4.1414) * 43758.5453
  return x - Math.floor(x)
}

function buildSeries(seed, length, min, max) {
  return Array.from({ length }, (_, index) =>
    Math.floor(min + pseudo(seed + index * 1.7) * (max - min + 1)),
  )
}

export function createStockStats({ id, quantity }) {
  const salesSeries = buildSeries(id * 31 + 1, 30, 0, 12)
  const salesLastMonth = salesSeries.reduce((sum, value) => sum + value, 0)
  const stockSeries = buildSeries(
    id * 31 + 2,
    30,
    Math.max(0, quantity - 8),
    quantity + 8,
  )
  const trending = pseudo(id * 17 + 3) > 0.5

  return { trending, salesLastMonth, salesSeries, stockSeries }
}

const BASE_STOCK = [
  {
    id: 1,
    barcode: '7798123456789',
    model: 'women-endurance',
    size: 'M',
    color: 'navy',
    minStock: 5,
    quantity: 24,
    kid: false,
    name: 'Malla Endurance Mujer',
    description: 'Malla de entrenamiento para pileta.',
  },
  {
    id: 2,
    barcode: '7798123456796',
    model: 'women-endurance',
    size: 'L',
    color: 'black',
    minStock: 5,
    quantity: 4,
    kid: false,
    name: 'Malla Endurance Mujer',
    description: '',
  },
  {
    id: 3,
    barcode: '',
    model: 'girls-endurance',
    size: 'M',
    color: 'pink',
    minStock: 3,
    quantity: 12,
    kid: true,
    name: 'Malla Endurance Niña',
    description: 'Talle de niña.',
  },
  {
    id: 4,
    barcode: '7798123456802',
    model: 'women-soft',
    size: 'XS',
    color: 'blue',
    minStock: 4,
    quantity: 18,
    kid: false,
    name: 'Malla Soft Mujer',
    description: 'Corte suave para confort.',
  },
  {
    id: 5,
    barcode: '',
    model: 'men-jammer',
    size: 'XL',
    color: 'green',
    minStock: 6,
    quantity: 6,
    kid: false,
    name: 'Jammer Hombre',
    description: '',
  },
  {
    id: 6,
    barcode: '7798123456819',
    model: 'men-sunga',
    size: 'S',
    color: 'red',
    minStock: 2,
    quantity: 1,
    kid: false,
    name: 'Sunga Hombre',
    description: 'Sunga de competición.',
  },
  {
    id: 7,
    barcode: '7798123456826',
    model: 'women-soft',
    size: 'XXL',
    color: 'purple',
    minStock: 3,
    quantity: 9,
    kid: false,
    name: 'Malla Soft Mujer',
    description: '',
  },
  {
    id: 8,
    barcode: '',
    model: 'men-jammer',
    size: 'M',
    color: 'white',
    minStock: 5,
    quantity: 15,
    kid: false,
    name: 'Jammer Hombre',
    description: 'Jammer de entrenamiento.',
  },
]

export const mockStock = BASE_STOCK.map((item) => ({
  ...item,
  ...createStockStats(item),
}))
