/*
  Navegación compartida por la barra lateral (escritorio) y el drawer (móvil): un solo
  origen para que las dos superficies no se desincronicen.
*/

import { routes } from '@app/routes.js'
import {
  IconChartHistogram,
  IconClock,
  IconPackage,
  IconReceipt,
  IconRuler,
  IconSettings,
  IconTicket,
  IconUsers,
} from '@tabler/icons-react'

/*
  Ítems del sitio: los mismos para cualquier rol y en cualquier pantalla.
*/
export const CUSTOMER_NAV_ITEMS = [
  { to: routes.fit(), labelKey: 'nav.fit', icon: IconRuler },
  { to: routes.catalog(), labelKey: 'nav.catalog', icon: IconPackage },
  { to: routes.accountHistory, labelKey: 'nav.history', icon: IconClock },
]

/*
  Sub-ítems del panel, visibles para un admin autenticado.
*/
export const PANEL_NAV_ITEMS = [
  { to: routes.admin, labelKey: 'nav.analytics', icon: IconChartHistogram },
  { to: routes.adminSales, labelKey: 'nav.sales', icon: IconReceipt },
  { to: routes.adminInventory, labelKey: 'nav.inventory', icon: IconPackage },
  { to: routes.adminUsers, labelKey: 'nav.users', icon: IconUsers },
  { to: routes.adminCoupons, labelKey: 'nav.coupons', icon: IconTicket },
  { to: routes.adminSettings, labelKey: 'nav.settings', icon: IconSettings },
]

// Por prefijo: una ruta hija (`/admin/sales/7`) sigue marcando su ítem padre.
export function isNavItemActive(pathname, to) {
  return pathname === to || pathname.startsWith(`${to}/`)
}

/*
  Ruta del ítem que debe quedar resaltado, o `null`. El resaltado es exclusivo: entre los
  ítems que coinciden por prefijo gana el más específico. Mirarlos por separado enciende el
  padre y el hijo a la vez; el empate por longitud se rompe por orden de declaración.
*/
export function matchNavItem(pathname, items) {
  let best = null
  let bestLength = -1

  for (const item of items) {
    if (!isNavItemActive(pathname, item.to)) continue
    if (item.to.length > bestLength) {
      best = item.to
      bestLength = item.to.length
    }
  }

  return best
}
