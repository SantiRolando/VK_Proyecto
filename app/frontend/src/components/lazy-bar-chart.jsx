import { Skeleton } from '@mantine/core'
import { lazy, Suspense } from 'react'

/*
  `recharts` (~395 kB) entra en su propio chunk: se carga recién cuando una pantalla lo usa. El
  `Suspense` vive acá para que cada pantalla no repita el límite ni su esqueleto.
*/
const BarChart = lazy(() =>
  import('@mantine/charts').then((module) => ({ default: module.BarChart })),
)

export function LazyBarChart({ h = 200, ...chartProps }) {
  return (
    <Suspense fallback={<Skeleton height={h} />}>
      <BarChart h={h} {...chartProps} />
    </Suspense>
  )
}
