import { ErrorState } from '@components/feedback/error-state.jsx'
import { useCouponDraft } from '@features/admin/coupons/hooks/use-coupon-draft.js'
import { useI18n } from '@i18n/context.js'
import {
  Button,
  Group,
  Modal,
  NumberInput,
  Radio,
  Stack,
  Switch,
  TextInput,
} from '@mantine/core'
import { DateInput } from '@mantine/dates'
import { IconCalendar, IconDeviceFloppy, IconPlus, IconX } from '@tabler/icons-react'
import 'dayjs/locale/es'

/*
  Alta y edición de una plantilla de cupón. Los valores, la validación y el guardado viven en
  el borrador; acá va el formulario y el error de cada campo.
*/
export function CouponFormModal({ coupon, takenCodes = [], opened, onClose }) {
  const { t, language } = useI18n()
  const { values, setField, errors, error, saving, handleSubmit, clearError } =
    useCouponDraft({
      coupon,
      takenCodes,
      onSaved: onClose,
    })

  return (
    <Modal
      closeButtonProps={{ 'aria-label': t('common.close') }}
      opened={opened}
      onClose={onClose}
      title={coupon ? t('admin.coupons.editTitle') : t('admin.coupons.new')}
      centered
    >
      <form onSubmit={handleSubmit} noValidate>
        <Stack gap="sm">
          <TextInput
            label={t('admin.coupons.form.code')}
            value={values.couponCode}
            onChange={(event) => setField('couponCode')(event.currentTarget.value)}
            error={errors.couponCode}
            required
          />

          <Radio.Group
            label={t('admin.coupons.form.discountType')}
            value={values.discountType}
            onChange={setField('discountType')}
            error={errors.discountType}
          >
            <Group gap="lg" mt="xs">
              {['Percentage', 'Fixed'].map((value) => (
                <Radio
                  key={value}
                  value={value}
                  label={t(`enums.discountType.${value}`)}
                />
              ))}
            </Group>
          </Radio.Group>

          <NumberInput
            label={t('admin.coupons.form.discountValue')}
            value={values.discountValue}
            onChange={setField('discountValue')}
            error={errors.discountValue}
            min={0}
            required
          />
          <NumberInput
            label={t('admin.coupons.form.maxDiscount')}
            description={t('admin.coupons.form.maxDiscountHint')}
            value={values.maxDiscount}
            onChange={setField('maxDiscount')}
            error={errors.maxDiscount}
            min={0}
          />
          <NumberInput
            label={t('admin.coupons.form.pointsCost')}
            description={t('admin.coupons.form.pointsCostHint')}
            value={values.pointsCost}
            onChange={setField('pointsCost')}
            error={errors.pointsCost}
            min={1}
            allowDecimal={false}
          />
          <NumberInput
            label={t('admin.coupons.form.maxUses')}
            description={t('admin.coupons.form.maxUsesHint')}
            value={values.maxUses}
            onChange={setField('maxUses')}
            error={errors.maxUses}
            min={1}
            allowDecimal={false}
          />

          <Group grow align="flex-start">
            <DateInput
              label={t('admin.coupons.form.validFrom')}
              valueFormat="YYYY-MM-DD"
              locale={language}
              rightSection={<IconCalendar size={16} />}
              rightSectionPointerEvents="none"
              value={values.validFrom}
              onChange={setField('validFrom')}
              error={errors.validFrom}
              required
            />
            <DateInput
              label={t('admin.coupons.form.validUntil')}
              valueFormat="YYYY-MM-DD"
              locale={language}
              rightSection={<IconCalendar size={16} />}
              rightSectionPointerEvents="none"
              value={values.validUntil}
              onChange={setField('validUntil')}
              error={errors.validUntil}
              required
            />
          </Group>

          <Switch
            label={t('admin.coupons.form.active')}
            checked={values.active}
            onChange={(event) => setField('active')(event.currentTarget.checked)}
          />

          {error && <ErrorState error={error} onRetry={clearError} />}

          <Group justify="flex-end">
            <Button
              variant="default"
              type="button"
              onClick={onClose}
              rightSection={<IconX size={16} />}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              loading={saving}
              rightSection={
                coupon ? <IconDeviceFloppy size={16} /> : <IconPlus size={16} />
              }
            >
              {coupon ? t('common.save') : t('admin.coupons.create')}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
