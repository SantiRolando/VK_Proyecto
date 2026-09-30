import { sizeService } from '@api/services/size-service.js'
import { useQuery } from '@tanstack/react-query'

// Tabla de talles de una línea y público (`GET /public/sizes`). La usan el
// formulario de medición (para saber qué medidas pide la tabla) y el alta de
// variantes del panel.
export function useSizes(line, audience) {
  return useQuery({
    queryKey: ['sizes', line ?? null, audience ?? null],
    queryFn: () => sizeService.getSizes({ line, audience }),
    enabled: Boolean(line),
    staleTime: 5 * 60_000,
  })
}

// Medidas que participan en una tabla: las que tienen rango en alguna fila. Si
// la tabla solo tiene edad (niñas Endurance), la edad es la medida.
export function requiredMeasuresOf(sizes) {
  if (!sizes || sizes.length === 0) return []
  const active = ['bust', 'waist', 'hip'].filter((field) =>
    sizes.some((size) => size[`${field}Min`] != null),
  )
  if (active.length === 0 && sizes.some((size) => size.ageMin != null)) return ['age']
  return active
}
