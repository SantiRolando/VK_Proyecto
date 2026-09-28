import { rewardsService } from '@api/services/rewards-service.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

// Recompensas del cliente (US6/T079): saldo y movimientos, plantillas
// canjeables, canje y cupones propios.

export function usePoints() {
  return useQuery({ queryKey: ['points'], queryFn: rewardsService.getPoints })
}

export function useRewardTemplates() {
  return useQuery({
    queryKey: ['reward-templates'],
    queryFn: rewardsService.listTemplates,
  })
}

export function useMyCoupons() {
  return useQuery({ queryKey: ['my-coupons'], queryFn: rewardsService.listMyCoupons })
}

export function useRedeemCoupon() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: rewardsService.redeem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['points'] })
      queryClient.invalidateQueries({ queryKey: ['my-coupons'] })
    },
  })
}
