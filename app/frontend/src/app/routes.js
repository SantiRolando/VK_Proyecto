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

export const routes = {
  home: '/',
  about: '/about',

  login: '/login',
  loginOtp: '/login/otp',
  forgotPassword: '/forgot-password',
  resetPassword: '/reset-password',
  register: '/register',

  fit: (query) => withQuery('/fit', query),
  fitResult: (generationId) => `/fit/result/${generationId}`,

  catalog: (query) => withQuery('/catalog', query),
  product: (productId) => `/catalog/${productId}`,

  checkout: '/checkout',
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
  adminCoupons: '/admin/coupons',
  adminSettings: '/admin/settings',
  adminAssistant: '/admin/assistant',

  dev: '/dev',
}
