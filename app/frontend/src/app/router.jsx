/*
  Rutas de la app. Cada página entra por `lazy` para que el primer render no arrastre el
  bundle completo; `LandingPage` va directo porque es el entry point.
*/

import { GuestOnly } from '@app/guards/guest-only.jsx'
import { RequireAdmin } from '@app/guards/require-admin.jsx'
import { RequireAuth } from '@app/guards/require-auth.jsx'
import { routes } from '@app/routes.js'
import { AppShellLayout } from '@components/layout/app-shell-layout.jsx'
import { PublicLayout } from '@components/layout/public-layout.jsx'
import { NotFoundPage } from '@components/not-found-page.jsx'
import { RouteFallback } from '@components/route-fallback.jsx'
import { LandingPage } from '@features/landing/landing-page.jsx'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'

/*
  `lazy` espera un módulo con `default` y las páginas se exportan con nombre: el helper arma
  ese envoltorio y deja cada ruta en una línea.
*/
const lazyPage = (load, name) =>
  lazy(() => load().then((module) => ({ default: module[name] })))

const FitPage = lazyPage(() => import('@features/fit/fit-page.jsx'), 'FitPage')
const ResultPage = lazyPage(() => import('@features/fit/result-page.jsx'), 'ResultPage')

const LoginPage = lazyPage(() => import('@features/auth/login-page.jsx'), 'LoginPage')
const RegisterPage = lazyPage(
  () => import('@features/auth/register-page.jsx'),
  'RegisterPage',
)
const OtpPage = lazyPage(() => import('@features/auth/otp-page.jsx'), 'OtpPage')
const ForgotPasswordPage = lazyPage(
  () => import('@features/auth/forgot-password-page.jsx'),
  'ForgotPasswordPage',
)
const ResetPasswordPage = lazyPage(
  () => import('@features/auth/reset-password-page.jsx'),
  'ResetPasswordPage',
)

const CatalogPage = lazyPage(
  () => import('@features/catalog/catalog-page.jsx'),
  'CatalogPage',
)
const ProductDetailPage = lazyPage(
  () => import('@features/catalog/product-detail.jsx'),
  'ProductDetailPage',
)

const AccountInfoPage = lazyPage(
  () => import('@features/account/account-info-page.jsx'),
  'AccountInfoPage',
)
const HistoryPage = lazyPage(
  () => import('@features/account/history-page.jsx'),
  'HistoryPage',
)
const OrdersPage = lazyPage(
  () => import('@features/account/orders-page.jsx'),
  'OrdersPage',
)
const RewardsPage = lazyPage(
  () => import('@features/account/rewards-page.jsx'),
  'RewardsPage',
)

const CheckoutPage = lazyPage(
  () => import('@features/checkout/checkout-page.jsx'),
  'CheckoutPage',
)
const ConfirmationPage = lazyPage(
  () => import('@features/checkout/confirmation-page.jsx'),
  'ConfirmationPage',
)

const AdminSalesPage = lazyPage(
  () => import('@features/admin/sales/sales-page.jsx'),
  'AdminSalesPage',
)
const AdminSaleDetailPage = lazyPage(
  () => import('@features/admin/sales/sale-detail-page.jsx'),
  'AdminSaleDetailPage',
)
const DashboardPage = lazyPage(
  () => import('@features/admin/dashboard/dashboard-page.jsx'),
  'DashboardPage',
)
const InventoryPage = lazyPage(
  () => import('@features/admin/inventory/inventory-page.jsx'),
  'InventoryPage',
)
const MovementsPage = lazyPage(
  () => import('@features/admin/inventory/movements-page.jsx'),
  'MovementsPage',
)
const ProductsPage = lazyPage(
  () => import('@features/admin/catalog-admin/products-page.jsx'),
  'ProductsPage',
)
const MissingSizesPage = lazyPage(
  () => import('@features/admin/analytics/missing-sizes-page.jsx'),
  'MissingSizesPage',
)
const CommentsPage = lazyPage(
  () => import('@features/admin/analytics/comments-page.jsx'),
  'CommentsPage',
)
const CouponsPage = lazyPage(
  () => import('@features/admin/coupons/coupons-page.jsx'),
  'CouponsPage',
)
const SettingsPage = lazyPage(
  () => import('@features/admin/settings/settings-page.jsx'),
  'SettingsPage',
)
const UsersPage = lazyPage(
  () => import('@features/admin/users/users-page.jsx'),
  'UsersPage',
)

export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path={routes.home} element={<LandingPage />} />

        {/* Autenticación: solo sin sesión */}
        <Route
          element={
            <GuestOnly>
              <PublicLayout />
            </GuestOnly>
          }
        >
          <Route path={routes.login} element={<LoginPage />} />
          <Route path={routes.loginOtp} element={<OtpPage />} />
          <Route path={routes.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={routes.resetPassword} element={<ResetPasswordPage />} />
          <Route path={routes.register} element={<RegisterPage />} />
        </Route>

        {/* Cliente: invitado o logueado */}
        <Route element={<AppShellLayout />}>
          <Route path={routes.fit()} element={<FitPage />} />
          <Route path={routes.fitResult(':generationId')} element={<ResultPage />} />
          <Route path={routes.catalog()} element={<CatalogPage />} />
          <Route path={routes.product(':productId')} element={<ProductDetailPage />} />
        </Route>

        {/* Cliente: solo logueado */}
        <Route
          element={
            <RequireAuth>
              <AppShellLayout />
            </RequireAuth>
          }
        >
          <Route path={routes.checkout()} element={<CheckoutPage />} />
          <Route
            path={routes.checkoutConfirmation(':saleId')}
            element={<ConfirmationPage />}
          />
          <Route path={routes.account} element={<HistoryPage />} />
          <Route path={routes.accountInfo} element={<AccountInfoPage />} />
          <Route path={routes.accountHistory} element={<HistoryPage />} />
          <Route path={routes.accountOrders} element={<OrdersPage />} />
          <Route path={routes.accountRewards} element={<RewardsPage />} />
          {/* Rutas viejas de la cuenta: redirigen a la pestaña correspondiente de la
              información de cuenta para no romper enlaces existentes. */}
          <Route
            path={routes.accountProfiles}
            element={<Navigate to={`${routes.accountInfo}?tab=agenda`} replace />}
          />
          <Route
            path={routes.accountAddresses}
            element={<Navigate to={`${routes.accountInfo}?tab=agenda`} replace />}
          />
          <Route
            path={routes.accountAlerts}
            element={<Navigate to={`${routes.accountInfo}?tab=alerts`} replace />}
          />
        </Route>

        {/* Administración */}
        <Route
          element={
            <RequireAuth>
              <RequireAdmin>
                <AppShellLayout />
              </RequireAdmin>
            </RequireAuth>
          }
        >
          <Route path={routes.admin} element={<DashboardPage />} />
          <Route path={routes.adminSales} element={<AdminSalesPage />} />
          <Route path={routes.adminSale(':saleId')} element={<AdminSaleDetailPage />} />
          <Route path={routes.adminInventory} element={<InventoryPage />} />
          <Route path={routes.adminMovements} element={<MovementsPage />} />
          <Route path={routes.adminProducts} element={<ProductsPage />} />
          <Route path={routes.adminMissingSizes} element={<MissingSizesPage />} />
          <Route path={routes.adminComments} element={<CommentsPage />} />
          <Route path={routes.adminUsers} element={<UsersPage />} />
          <Route path={routes.adminCoupons} element={<CouponsPage />} />
          <Route path={routes.adminSettings} element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
