// Metadatos del dominio de stock.
// `id` es el identificador estable (independiente de la traducción),
// `labelKey` apunta a la clave de traducción y `sizes` lista los talles
// válidos para ese modelo.

export const MODEL_IDS = [
  'women-endurance',
  'girls-endurance',
  'women-soft',
  'men-jammer',
  'men-sunga',
]

export const MODELS = [
  {
    id: 'women-endurance',
    labelKey: 'stock.model.women-endurance',
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
  },
  {
    id: 'girls-endurance',
    labelKey: 'stock.model.girls-endurance',
    sizes: ['S', 'M', 'L', 'XL'],
  },
  {
    id: 'women-soft',
    labelKey: 'stock.model.women-soft',
    sizes: ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'men-jammer',
    labelKey: 'stock.model.men-jammer',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'men-sunga',
    labelKey: 'stock.model.men-sunga',
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  },
]

export const COLORS = [
  { id: 'black', labelKey: 'stock.color.black' },
  { id: 'white', labelKey: 'stock.color.white' },
  { id: 'navy', labelKey: 'stock.color.navy' },
  { id: 'blue', labelKey: 'stock.color.blue' },
  { id: 'red', labelKey: 'stock.color.red' },
  { id: 'pink', labelKey: 'stock.color.pink' },
  { id: 'green', labelKey: 'stock.color.green' },
  { id: 'purple', labelKey: 'stock.color.purple' },
]

export function getModelLabelKey(modelId) {
  return MODELS.find((model) => model.id === modelId)?.labelKey ?? modelId
}

export function getModelSizes(modelId) {
  return MODELS.find((model) => model.id === modelId)?.sizes ?? []
}

export function getColorLabelKey(colorId) {
  return COLORS.find((color) => color.id === colorId)?.labelKey ?? colorId
}
