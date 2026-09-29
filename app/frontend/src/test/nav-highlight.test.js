import { routes } from '@app/routes.js'
import { matchNavItem } from '@config/navigation.js'
import { describe, expect, it } from 'vitest'

// Bug squash sesión #1: el resaltado del menú debe ser EXCLUSIVO. Antes cada ítem
// se evaluaba por separado y estar en una ruta anidada encendía a la vez el ítem
// padre y el hijo (`/admin/inventory/movements` resaltaba "Inventario" **y**
// "Movimientos").
const ITEMS = [
  { to: routes.admin, labelKey: 'nav.analytics' },
  { to: routes.adminSales, labelKey: 'nav.sales' },
  { to: routes.adminInventory, labelKey: 'nav.inventory' },
  { to: routes.adminMovements, labelKey: 'nav.movements' },
  { to: routes.fit(), labelKey: 'nav.fit' },
  { to: routes.accountHistory, labelKey: 'nav.history' },
]

describe('resaltado del menú', () => {
  it('en una ruta anidada gana el ítem más específico', () => {
    // El caso reportado: movimientos vive dentro de /admin/inventory.
    expect(matchNavItem(routes.adminMovements, ITEMS)).toBe(routes.adminMovements)
    expect(matchNavItem(routes.adminMovements, ITEMS)).not.toBe(routes.adminInventory)
  })

  it('en la ruta padre gana el padre', () => {
    expect(matchNavItem(routes.adminInventory, ITEMS)).toBe(routes.adminInventory)
  })

  it('una ruta hija sin ítem propio resalta su padre', () => {
    // `/admin/sales/7` no tiene ítem propio: debe quedar "Ventas".
    expect(matchNavItem('/admin/sales/7', ITEMS)).toBe(routes.adminSales)
  })

  it('no confunde ítems que comparten prefijo parcial', () => {
    // `/account/history` no debe matchear nada de `/admin`.
    expect(matchNavItem(routes.accountHistory, ITEMS)).toBe(routes.accountHistory)
    expect(matchNavItem('/admin', ITEMS)).toBe(routes.admin)
  })

  it('devuelve null cuando ninguna ruta corresponde', () => {
    expect(matchNavItem('/ruta-sin-item', ITEMS)).toBeNull()
  })

  it('la raíz no queda resaltada por un ítem cualquiera', () => {
    expect(matchNavItem('/', ITEMS)).toBeNull()
  })
})
