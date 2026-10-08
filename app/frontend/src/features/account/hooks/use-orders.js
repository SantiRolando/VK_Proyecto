import { salesService } from '@api/services/sales-service.js'
import { useQuery } from '@tanstack/react-query'

// Mis compras: ventas coordinadas del cliente.
export function useMySales() {
  return useQuery({ queryKey: ['sales'], queryFn: salesService.listMine })
}
