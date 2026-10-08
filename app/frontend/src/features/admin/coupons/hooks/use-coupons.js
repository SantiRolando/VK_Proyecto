import { adminCouponsService } from '@api/services/admin-coupons-service.js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

/*
  Cupones del panel. Editar una plantilla cambia lo que ofrece el
  cliente, así que se invalida su lista de canje.
*/

function useCouponMutation(mutationFn) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] })
      queryClient.invalidateQueries({ queryKey: ['reward-templates'] })
      queryClient.invalidateQueries({ queryKey: ['my-coupons'] })
    },
  })
}

export function useAdminCoupons() {
  return useQuery({ queryKey: ['admin', 'coupons'], queryFn: adminCouponsService.list })
}

export function useCreateCoupon() {
  return useCouponMutation(adminCouponsService.create)
}

export function useUpdateCoupon() {
  return useCouponMutation(({ couponId, ...payload }) =>
    adminCouponsService.update(couponId, payload),
  )
}
