import { ADMIN_INVENTORY_TABS } from '@app/routes.js'
import { PageHeader } from '@components/page-header.jsx'
import { ProductsBody } from '@features/admin/catalog-admin/products-body.jsx'
import { InventoryBody } from '@features/admin/inventory/inventory-body.jsx'
import { useTabParam } from '@hooks/use-tab-param.js'
import { useI18n } from '@i18n/context.js'
import { Container, Tabs } from '@mantine/core'
import { IconPackage, IconShirt } from '@tabler/icons-react'

const TABS = Object.values(ADMIN_INVENTORY_TABS)

/*
  Inventario y catálogo en una pantalla: el físico que se ajusta en una pestaña es el de las
  variantes que se cargan en la otra.
*/
export function InventoryPage() {
  const { t } = useI18n()
  const [tab, setTab] = useTabParam(TABS, ADMIN_INVENTORY_TABS.inventory)

  return (
    <Container size="xl" py="xl">
      <PageHeader
        title={t('admin.inventory.title')}
        subtitle={t('admin.inventory.subtitle')}
      />

      <Tabs value={tab} onChange={setTab} keepMounted={false}>
        <Tabs.List mb="md">
          <Tabs.Tab
            value={ADMIN_INVENTORY_TABS.inventory}
            leftSection={<IconPackage size={16} />}
          >
            {t('admin.inventory.tabInventory')}
          </Tabs.Tab>
          <Tabs.Tab
            value={ADMIN_INVENTORY_TABS.products}
            leftSection={<IconShirt size={16} />}
          >
            {t('admin.inventory.tabProducts')}
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value={ADMIN_INVENTORY_TABS.inventory}>
          <InventoryBody />
        </Tabs.Panel>

        <Tabs.Panel value={ADMIN_INVENTORY_TABS.products}>
          <ProductsBody />
        </Tabs.Panel>
      </Tabs>
    </Container>
  )
}
