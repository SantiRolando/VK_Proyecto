// Datos de ejemplo (mock) para el dominio de generación de talles.
// Separados por dominio de negocio; se reemplazarán por datos reales del backend.

export const mockProducts = [
  { id: 1, name: 'Malla de entrenamiento', brand: 'Aqua', size: 'XS', stock: 8 },
  { id: 2, name: 'Traje de competición', brand: 'Stream', size: 'S', stock: 5 },
  { id: 3, name: 'Gorro de silicona', brand: 'Aqua', size: 'M', stock: 20 },
  { id: 4, name: 'Antiparras', brand: 'Stream', size: 'M', stock: 15 },
  { id: 5, name: 'Malla de competición', brand: 'Stream', size: 'L', stock: 3 },
  { id: 6, name: 'Parka de pileta', brand: 'Aqua', size: 'XL', stock: 2 },
]

export const mockHistory = [
  { id: 1, date: '2026-08-28', size: 'M', fit: 'correct' },
  { id: 2, date: '2026-08-22', size: 'L', fit: 'large' },
  { id: 3, date: '2026-08-15', size: 'S', fit: 'small' },
]

export function getRecommendedProducts(size) {
  return mockProducts.filter((product) => product.size === size)
}
