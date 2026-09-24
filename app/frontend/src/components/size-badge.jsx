import { Badge } from '@mantine/core'

// Código de talle (dato, no UI): se muestra tal cual.
export function SizeBadge({ code }) {
  return (
    <Badge variant="outline" color="gray">
      {code}
    </Badge>
  )
}
