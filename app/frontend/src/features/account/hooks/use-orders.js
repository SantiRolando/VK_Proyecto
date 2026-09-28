import { salesService } from '@api/services/sales-service.js'
import { useQuery } from '@tanstack/react-query'

// Mis compras (US6/T081): ventas coordinadas del cliente.
export function useMySales() {
  return useQuery({ queryKey: ['sales'], queryFn: salesService.listMine })
}
