import { PageHeader } from '@components/page-header.jsx'
import { MovementsBody } from '@features/admin/inventory/movements-body.jsx'
import { SalesBody } from '@features/admin/sales/sales-body.jsx'
import { useI18n } from '@i18n/context.js'
import { Container, Stack } from '@mantine/core'

/*
  Ventas y movimientos de stock en una pantalla: confirmar una venta descuenta el físico y deja
  el movimiento que se audita abajo.
*/
export function AdminSalesPage() {
  const { t } = useI18n()

  return (
    <Container size="xl" py="xl">
      <PageHeader title={t('admin.sales.title')} subtitle={t('admin.sales.subtitle')} />

      <Stack gap="lg">
        <SalesBody />
        <MovementsBody />
      </Stack>
    </Container>
  )
}
