import { routes } from '@app/routes.js'
import {
  IconArrowsRightLeft,
  IconChartHistogram,
  IconClock,
  IconMessageCircle,
  IconPackage,
  IconReceipt,
  IconRuler,
  IconSettings,
  IconShirt,
  IconTicket,
  IconUsers,
} from '@tabler/icons-react'

// Navegación compartida por la barra lateral (desktop) y el drawer (móvil).
// Un solo origen para que las dos superficies no se desincronicen.

// Ítems genéricos del sitio (bug squash sesión #1, F3): los mismos para cualquier
// rol, en cualquier pantalla.
//
// "Cuenta" ya no está: se llega desde el avatar del header (`Mi cuenta`), así que
// el ítem era un duplicado en la navegación.
export const CUSTOMER_NAV_ITEMS = [
  { to: routes.fit(), labelKey: 'nav.fit', icon: IconRuler },
  { to: routes.catalog(), labelKey: 'nav.catalog', icon: IconPackage },
  { to: routes.accountHistory, labelKey: 'nav.history', icon: IconClock },
]

// Sub-ítems del panel: visibles para un admin en cuanto está autenticado.
//
// El modo asistente NO tiene ítem propio: es el mismo formulario de medición con
// un switch "para terceros", así que vive dentro de `/fit` y aparece solo para
// admins (bug squash sesión #1).
export const PANEL_NAV_ITEMS = [
  { to: routes.admin, labelKey: 'nav.analytics', icon: IconChartHistogram },
  { to: routes.adminSales, labelKey: 'nav.sales', icon: IconReceipt },
  { to: routes.adminInventory, labelKey: 'nav.inventory', icon: IconPackage },
  { to: routes.adminMovements, labelKey: 'nav.movements', icon: IconArrowsRightLeft },
  { to: routes.adminProducts, labelKey: 'nav.products', icon: IconShirt },
  { to: routes.adminMissingSizes, labelKey: 'nav.missingSizes', icon: IconRuler },
  { to: routes.adminComments, labelKey: 'nav.comments', icon: IconMessageCircle },
  { to: routes.adminUsers, labelKey: 'nav.users', icon: IconUsers },
  { to: routes.adminCoupons, labelKey: 'nav.coupons', icon: IconTicket },
  { to: routes.adminSettings, labelKey: 'nav.settings', icon: IconSettings },
]

// ¿Esta ruta corresponde a este ítem? Por prefijo, para que una ruta hija
// (`/admin/sales/7`) siga marcando su ítem padre.
export function isNavItemActive(pathname, to) {
  return pathname === to || pathname.startsWith(`${to}/`)
}

// Devuelve la ruta del ítem que debe quedar resaltado, o `null`.
//
// El resaltado es **exclusivo**: entre todos los ítems que matchean por prefijo
// gana el más específico (el prefijo más largo). Antes cada ítem se evaluaba por
// separado, así que estar en `/admin/inventory/movements` resaltaba a la vez
// "Inventario" y "Movimientos" — dos ítems encendidos a la vez, que no se lee.
//
// El empate por longitud se rompe por orden de declaración, por eso la lista de
// rutas se pasa completa y no ítem por ítem.
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
