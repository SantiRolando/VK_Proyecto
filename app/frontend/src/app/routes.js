// Constantes de rutas en inglés, centralizadas (constitución IV, §4.5 del
// plan). Ningún componente escribe paths a mano. Renombrar una ruta es
// cambiar este archivo (Q-10).

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
  // La landing pública es el entry point (bug squash sesión #1, F1).
  home: '/',

  // Destino post-login / post-logout del cliente. No puede ser `home` porque
  // `home` es la landing pública: mandar ahí a un cliente logueado lo dejaría
  // en la página de marketing.
  //
  // Apunta al resumen (`/account/overview`) y no a `/account` a secas: el layout
  // autenticado no tiene `path`, y el `index` de una ruta sin path matchea la
  // ruta del padre (o sea `/`), no `/account`. Con un `index`, `/account` caía en
  // el catch-all y mostraba el 404. Con una ruta con path real, resuelve siempre.
  account: '/account/overview',
  accountRoot: '/account',

  // Información de cuenta: datos del usuario y agenda de perfiles/direcciones.
  // Antes no existía ninguna pantalla para ver los datos de la cuenta.
  accountInfo: '/account/info',
  accountInfoProfiles: '/account/info/perfiles',

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

  admin: '/admin',
  adminSales: '/admin/sales',
  adminSale: (saleId) => `/admin/sales/${saleId}`,
  adminInventory: '/admin/inventory',
  adminMovements: '/admin/inventory/movements',
  adminProducts: '/admin/products',
  adminMissingSizes: '/admin/analytics/missing-sizes',
  adminComments: '/admin/analytics/comments',
  adminUsers: '/admin/users',
  adminCoupons: '/admin/coupons',
  adminSettings: '/admin/settings',
}
