import { routes } from '@app/routes.js'
import { EmptyState } from '@components/feedback/empty-state.jsx'
import { QueryBoundary } from '@components/feedback/query-boundary.jsx'
import { PageHeader } from '@components/page-header.jsx'
import { useAddresses } from '@features/account/hooks/use-addresses.js'
import { useProduct } from '@features/catalog/hooks/use-product.js'
import { ChannelStep } from '@features/checkout/channel-step.jsx'
import { DeliveryStep } from '@features/checkout/delivery-step.jsx'
import { useCreateSale } from '@features/checkout/hooks/use-create-sale.js'
import { useValidateCoupon } from '@features/checkout/hooks/use-validate-coupon.js'
import { SummaryStep } from '@features/checkout/summary-step.jsx'
import { useI18n } from '@i18n/context.js'
import { Button, Container, Group, Stack, Stepper } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { IconShoppingBag } from '@tabler/icons-react'
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'

const LAST_STEP = 2

/*
  Coordinar la compra: entrega, canal y resumen con cupón opcional. La selección (variante,
  talle, generación) llega por query desde el detalle de producto.
*/
export function CheckoutPage() {
  const { t, language } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isSmall = useMediaQuery('(max-width: 48em)')

  const productId = searchParams.get('productId')
  const sizeId = searchParams.get('sizeId')
  const variantId = Number(searchParams.get('variantId')) || null
  const generationId = Number(searchParams.get('generationId')) || null

  const productQuery = useProduct(productId, sizeId)
  const addressesQuery = useAddresses()
  const createSale = useCreateSale()
  const { mutateAsync: validateCoupon, isPending: isValidatingCoupon } =
    useValidateCoupon()

  const [active, setActive] = useState(0)
  const [method, setMethod] = useState('StorePickup')
  const [addressChoice, setAddressChoice] = useState(null)
  const [channel, setChannel] = useState('Email') // Email por defecto
  const [quantity, setQuantity] = useState(1)
  const [couponCode, setCouponCode] = useState(null)
  const [coupon, setCoupon] = useState(null)
  const [couponInvalid, setCouponInvalid] = useState(false)
  const [invalidDelivery, setInvalidDelivery] = useState(false)
  const [conflict, setConflict] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  const product = productQuery.data
  const variant = product?.colors?.find((color) => color.id === variantId) ?? null
  const available = variant?.available ?? 0

  // La dirección sale de la agenda salvo que el cliente elija otra: es un
  // valor derivado del render, no un estado a sincronizar.
  const addresses = addressesQuery.data ?? []
  const addressId =
    addressChoice ??
    addresses.find((address) => address.isDefault)?.id ??
    addresses[0]?.id ??
    null

  // El descuento depende de las líneas: al cambiar la cantidad se revalida el
  // cupón contra el nuevo subtotal (el cálculo vive en el mock).
  useEffect(() => {
    if (!couponCode || !variantId) return undefined

    let cancelled = false
    validateCoupon({ code: couponCode, items: [{ variantId, quantity }] })
      .then((data) => {
        if (cancelled) return
        setCoupon(data)
        setCouponInvalid(false)
      })
      .catch(() => {
        if (cancelled) return
        setCoupon(null)
        setCouponCode(null)
        setCouponInvalid(true)
      })

    return () => {
      cancelled = true
    }
  }, [couponCode, quantity, variantId, validateCoupon])

  const goNext = () => {
    if (method === 'HomeDelivery' && addressId == null) {
      setInvalidDelivery(true)
      return
    }
    setInvalidDelivery(false)
    setActive((step) => Math.min(step + 1, LAST_STEP))
  }

  const handleConfirm = async () => {
    setSubmitError(null)
    setConflict(null)

    try {
      const sale = await createSale.mutateAsync({
        items: [{ variantId, quantity }],
        channel,
        deliveryMethod: method,
        addressId: method === 'HomeDelivery' ? addressId : null,
        generationId,
        couponCode: coupon?.code ?? null,
        locale: language,
      })
      navigate(routes.checkoutConfirmation(sale.id))
    } catch (error) {
      if (error?.code === 'STOCK_INSUFFICIENT') {
        /*
          El conflicto de stock se informa sin perder la selección y se refresca
          la disponibilidad para que pueda ajustar la cantidad.
        */
        setConflict(error)
        productQuery.refetch()
      } else {
        setSubmitError(error)
      }
    }
  }

  const productRoute = product
    ? routes.product(product.id, { sizeId, generationId })
    : routes.catalog()

  if (!productId || !variantId) {
    return (
      <Container size="md" py="xl">
        <PageHeader title={t('checkout.title')} />
        <EmptyState
          icon={IconShoppingBag}
          title={t('checkout.missing.title')}
          description={t('checkout.missing.body')}
          action={
            <Button mt="sm" onClick={() => navigate(routes.catalog())}>
              {t('checkout.missing.cta')}
            </Button>
          }
        />
      </Container>
    )
  }

  return (
    <Container size="md" py="xl">
      <PageHeader title={t('checkout.title')} subtitle={t('checkout.subtitle')} />

      <QueryBoundary
        isLoading={productQuery.isPending}
        isError={productQuery.isError}
        error={productQuery.error}
        onRetry={productQuery.refetch}
      >
        {product &&
          (variant ? (
            <Stack gap="xl">
              <Stepper
                active={active}
                onStepClick={setActive}
                allowNextStepsSelect={false}
                orientation={isSmall ? 'vertical' : 'horizontal'}
              >
                <Stepper.Step label={t('checkout.steps.delivery')}>
                  <DeliveryStep
                    method={method}
                    onMethodChange={(value) => {
                      setMethod(value)
                      setInvalidDelivery(false)
                    }}
                    addresses={addresses}
                    isLoading={addressesQuery.isPending}
                    queryError={addressesQuery.error}
                    onRetry={addressesQuery.refetch}
                    addressId={addressId}
                    onAddressChange={(value) => {
                      setAddressChoice(value)
                      setInvalidDelivery(false)
                    }}
                    invalid={invalidDelivery}
                  />
                </Stepper.Step>

                <Stepper.Step label={t('checkout.steps.channel')}>
                  <ChannelStep channel={channel} onChannelChange={setChannel} />
                </Stepper.Step>

                <Stepper.Step label={t('checkout.steps.summary')}>
                  <SummaryStep
                    line={{
                      variantId,
                      product: {
                        id: product.id,
                        line: product.line,
                        model: product.model,
                      },
                      size: product.selectedSize
                        ? { id: product.selectedSize.id, code: product.selectedSize.code }
                        : null,
                      color: variant.color,
                      quantity,
                      unitPrice: product.price,
                      lineTotal: product.price * quantity,
                      available,
                    }}
                    totals={{
                      subtotal: product.price * quantity,
                      discount: coupon?.discount ?? 0,
                      total: coupon ? coupon.total : product.price * quantity,
                    }}
                    onQuantityChange={setQuantity}
                    coupon={{
                      applied: coupon,
                      invalid: couponInvalid,
                      isLoading: isValidatingCoupon,
                      onApply: (code) => {
                        setCouponInvalid(false)
                        setCouponCode(code)
                      },
                      onRemove: () => {
                        setCoupon(null)
                        setCouponCode(null)
                        setCouponInvalid(false)
                      },
                    }}
                    conflict={conflict}
                    submitError={submitError}
                    onRetry={handleConfirm}
                    onBackToProduct={() => navigate(productRoute)}
                  />
                </Stepper.Step>
              </Stepper>

              <Group justify="space-between">
                <Button
                  variant="default"
                  disabled={active === 0}
                  onClick={() => setActive((step) => Math.max(step - 1, 0))}
                >
                  {t('common.back')}
                </Button>

                {active < LAST_STEP ? (
                  <Button onClick={goNext}>{t('checkout.next')}</Button>
                ) : (
                  <Button
                    size="lg"
                    loading={createSale.isPending}
                    onClick={handleConfirm}
                  >
                    {t('checkout.confirm')}
                  </Button>
                )}
              </Group>
            </Stack>
          ) : (
            <EmptyState
              icon={IconShoppingBag}
              title={t('checkout.missing.title')}
              description={t('checkout.missing.body')}
              action={
                <Button mt="sm" onClick={() => navigate(productRoute)}>
                  {t('checkout.missing.back')}
                </Button>
              }
            />
          ))}
      </QueryBoundary>
    </Container>
  )
}
