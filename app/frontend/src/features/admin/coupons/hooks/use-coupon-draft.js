import { isApiError } from '@api/client/api-error.js'
import {
  couponDraftErrors,
  normalizeCouponCode,
  optionalNumber,
} from '@features/admin/coupons/coupon-rules.js'
import {
  useCreateCoupon,
  useUpdateCoupon,
} from '@features/admin/coupons/hooks/use-coupons.js'
import { useI18n } from '@i18n/context.js'
import { useState } from 'react'

const EMPTY_COUPON = {
  couponCode: '',
  discountType: 'Percentage',
  discountValue: 10,
  maxDiscount: null,
  maxUses: null,
  pointsCost: null,
  validFrom: null,
  validUntil: null,
  active: true,
}

// El `DateInput` de Mantine trabaja con `YYYY-MM-DD`, que es lo que espera el endpoint.
function toDateValue(iso) {
  return iso ? new Date(iso).toISOString().slice(0, 10) : null
}

/*
  Borrador de una plantilla: valores, validación con las mismas reglas que aplica el endpoint
  y guardado. Los códigos de error se traducen acá, así el modal solo los muestra.
*/
export function useCouponDraft({ coupon, takenCodes = [], onSaved }) {
  const { t } = useI18n()
  const create = useCreateCoupon()
  const update = useUpdateCoupon()

  /*
    El armado es campo por campo: la lista serializa `code` y no `couponCode`, y trae datos
    que no son del formulario (`owner`, `usageCount`, `redeemable`).
  */
  const [values, setValues] = useState(() =>
    coupon
      ? {
          couponCode: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          maxDiscount: coupon.maxDiscount ?? null,
          maxUses: coupon.maxUses ?? null,
          pointsCost: coupon.pointsCost ?? null,
          validFrom: toDateValue(coupon.validFrom),
          validUntil: toDateValue(coupon.validUntil),
          active: coupon.active,
        }
      : EMPTY_COUPON,
  )
  const [errors, setErrors] = useState({})
  const [error, setError] = useState(null)

  const saving = create.isPending || update.isPending

  // Tocar un campo se lleva su error; los demás quedan hasta que se corrijan.
  const setField = (field) => (value) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }

  const messagesOf = (codes) =>
    Object.fromEntries(
      Object.entries(codes).map(([field, code]) => [field, t(`validation.${code}`)]),
    )

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    const problems = couponDraftErrors(values, { takenCodes })
    if (Object.keys(problems).length > 0) {
      setErrors(messagesOf(problems))
      return
    }
    setErrors({})

    const payload = {
      couponCode: normalizeCouponCode(values.couponCode),
      discountType: values.discountType,
      discountValue: Number(values.discountValue),
      maxDiscount: optionalNumber(values.maxDiscount),
      maxUses: optionalNumber(values.maxUses),
      pointsCost: optionalNumber(values.pointsCost),
      validFrom: values.validFrom,
      validUntil: values.validUntil,
      active: values.active,
    }

    try {
      if (coupon) {
        await update.mutateAsync({ couponId: coupon.id, ...payload })
      } else {
        await create.mutateAsync(payload)
      }
      onSaved()
    } catch (saveError) {
      // El 422 del endpoint nombra los campos que rechazó: se muestran bajo su input.
      const fields = isApiError(saveError) ? saveError.details?.fields : null
      if (fields?.length) {
        setErrors(
          Object.fromEntries(fields.map((name) => [name, t('validation.invalid')])),
        )
      } else {
        setError(saveError)
      }
    }
  }

  return {
    values,
    setField,
    errors,
    error,
    saving,
    handleSubmit,
    clearError: () => setError(null),
  }
}
