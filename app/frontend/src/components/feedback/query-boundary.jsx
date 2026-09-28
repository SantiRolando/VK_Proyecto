import { ErrorState } from '@components/feedback/error-state.jsx'
import { ListSkeleton } from '@components/feedback/skeletons.jsx'

// Unifica Skeleton / Error / contenido para cualquier pantalla con datos
// de TanStack Query (FR-029). Ejemplo:
//   <QueryBoundary isLoading={q.isPending} isError={q.isError} error={q.error}
//                  onRetry={q.refetch}>{/* contenido */}</QueryBoundary>
export function QueryBoundary({
  isLoading,
  isError,
  error,
  onRetry,
  skeleton,
  children,
}) {
  if (isLoading) return skeleton ?? <ListSkeleton />
  if (isError) return <ErrorState error={error} onRetry={onRetry} />
  return children
}
