/*
  Constantes de rutas, centralizadas y en inglés: ningún componente escribe paths a mano, así
  que renombrar una ruta es cambiar este archivo.
*/

// Las pestañas del panel viven en la query: estos son los valores de `?tab=`.
export const ADMIN_INVENTORY_TABS = { inventory: 'inventory', products: 'products' }

const ADMIN_SALES_PATH = '/admin/sales'
const ADMIN_INVENTORY_PATH = '/admin/inventory'

function withQuery(path, query) {
  if (!query) return path
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  const queryString = params.toString()
  return queryString ? `${path}?${queryString}` : path
}

// Valida un `returnTo` recibido por query: solo rutas internas de la app.
export function safeReturnTo(returnTo) {
  if (typeof returnTo !== 'string') return null
  if (!returnTo.startsWith('/') || returnTo.startsWith('//')) return null
  return returnTo
}

export const routes = {
  // La landing pública es el entry point.
  home: '/',

  /*
    Destino post-login y post-logout del cliente. No apunta a `home` (la landing pública) ni a
    `/account` a secas: el layout autenticado no tiene `path` y un `index` matchea `/`, así que
    `/account` caía en el 404.
  */
  account: '/account/overview',
  accountRoot: '/account',

  // Datos del usuario y agenda de perfiles y direcciones.
  accountInfo: '/account/info',

  login: '/login',
  loginOtp: '/login/otp',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  register: '/register',

  fit: (query) => withQuery('/fit', query),
  fitResult: (generationId, query) => withQuery(`/fit/result/${generationId}`, query),

  catalog: (query) => withQuery('/catalog', query),
  product: (productId, query) => withQuery(`/catalog/${productId}`, query),

  checkout: (query) => withQuery('/checkout', query),
  checkoutConfirmation: (saleId) => `/checkout/confirmation/${saleId}`,

  accountProfiles: '/account/profiles',
  accountAddresses: '/account/addresses',
  accountHistory: '/account/history',
  accountOrders: '/account/orders',
  accountAlerts: '/account/alerts',
  accountRewards: '/account/rewards',

  // Analíticas del panel: indicadores, demanda insatisfecha y comentarios en una pantalla.
  admin: '/admin',
  adminSales: ADMIN_SALES_PATH,
  adminSale: (saleId) => `${ADMIN_SALES_PATH}/${saleId}`,
  adminInventory: ADMIN_INVENTORY_PATH,
  adminInventoryTab: (tab) => withQuery(ADMIN_INVENTORY_PATH, { tab }),
  adminUsers: '/admin/users',
  adminCoupons: '/admin/coupons',
  adminSettings: '/admin/settings',

  /*
    Rutas anteriores a la unificación: se mantienen para no romper enlaces guardados y
    redirigen a la pantalla que ahora las contiene.
  */
  adminProducts: '/admin/products',
  adminMovements: '/admin/inventory/movements',
  adminMissingSizes: '/admin/analytics/missing-sizes',
  adminComments: '/admin/analytics/comments',
}
