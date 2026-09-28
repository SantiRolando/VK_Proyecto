import { salesService } from '@api/services/sales-service.js'
import { useMutation } from '@tanstack/react-query'

// Valida el cupón del checkout contra las líneas elegidas (422 COUPON_INVALID
// si no sirve; ver domain/coupons.js).
export function useValidateCoupon() {
  return useMutation({ mutationFn: salesService.validateCoupon })
}
