import { routes } from '@app/routes.js'
import { CUSTOMER_NAV_ITEMS, matchNavItem, PANEL_NAV_ITEMS } from '@config/navigation.js'
import { describe, expect, it } from 'vitest'

/*
  El resaltado del menú es exclusivo: entre los ítems que coinciden por prefijo gana el más
  específico. Evaluar cada ítem por separado encendía a la vez el padre y el hijo.
*/
const NESTED_ITEMS = [
  { to: '/panel', labelKey: 'panel' },
  { to: '/panel/hijo', labelKey: 'hijo' },
]

describe('resaltado del menú', () => {
  it('en una ruta anidada gana el ítem más específico', () => {
    expect(matchNavItem('/panel/hijo', NESTED_ITEMS)).toBe('/panel/hijo')
    expect(matchNavItem('/panel/hijo', NESTED_ITEMS)).not.toBe('/panel')
  })

  it('en la ruta padre gana el padre', () => {
    expect(matchNavItem('/panel', NESTED_ITEMS)).toBe('/panel')
  })

  it('una ruta hija sin ítem propio resalta su padre', () => {
    // `/admin/sales/7` no tiene ítem propio: debe quedar "Ventas".
    expect(matchNavItem(routes.adminSale(7), PANEL_NAV_ITEMS)).toBe(routes.adminSales)
  })

  it('las pestañas de una pantalla resaltan esa pantalla', () => {
    // El pathname no lleva la query: la pestaña se resuelve aparte.
    expect(matchNavItem(routes.adminSales, PANEL_NAV_ITEMS)).toBe(routes.adminSales)
    expect(matchNavItem(routes.adminInventory, PANEL_NAV_ITEMS)).toBe(
      routes.adminInventory,
    )
  })

  it('no confunde ítems que comparten prefijo parcial', () => {
    expect(matchNavItem(routes.accountHistory, CUSTOMER_NAV_ITEMS)).toBe(
      routes.accountHistory,
    )
    expect(matchNavItem(routes.admin, PANEL_NAV_ITEMS)).toBe(routes.admin)
  })

  it('devuelve null cuando ninguna ruta corresponde', () => {
    expect(matchNavItem('/ruta-sin-item', PANEL_NAV_ITEMS)).toBeNull()
  })

  it('la raíz no queda resaltada por un ítem cualquiera', () => {
    expect(matchNavItem('/', PANEL_NAV_ITEMS)).toBeNull()
  })
})
