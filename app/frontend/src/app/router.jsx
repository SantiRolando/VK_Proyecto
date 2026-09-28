import { GuestOnly } from '@app/guards/guest-only.jsx'
import { RequireAuth } from '@app/guards/require-auth.jsx'
import { RequireRole } from '@app/guards/require-role.jsx'
import { routes } from '@app/routes.js'
import { AdminLayout } from '@components/layout/admin-layout.jsx'
import { CustomerLayout } from '@components/layout/customer-layout.jsx'
import { PublicLayout } from '@components/layout/public-layout.jsx'
import { RouteFallback } from '@components/route-fallback.jsx'
import { StubPage } from '@components/stub-page.jsx'
import { HomePage } from '@features/home/home-page.jsx'
import { LandingPage } from '@pages/landing-page/landing-page.jsx'
import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'

const FitPage = lazy(() =>
  import('@features/fit/fit-page.jsx').then((module) => ({
    default: module.FitPage,
  })),
)

const ResultPage = lazy(() =>
  import('@features/fit/result-page.jsx').then((module) => ({
    default: module.ResultPage,
  })),
)

const LoginPage = lazy(() =>
  import('@features/auth/login-page.jsx').then((module) => ({
    default: module.LoginPage,
  })),
)

const RegisterPage = lazy(() =>
  import('@features/auth/register-page.jsx').then((module) => ({
    default: module.RegisterPage,
  })),
)

const OtpPage = lazy(() =>
  import('@features/auth/otp-page.jsx').then((module) => ({
    default: module.OtpPage,
  })),
)

const ForgotPasswordPage = lazy(() =>
  import('@features/auth/forgot-password-page.jsx').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
)

const ResetPasswordPage = lazy(() =>
  import('@features/auth/reset-password-page.jsx').then((module) => ({
    default: module.ResetPasswordPage,
  })),
)

const CatalogPage = lazy(() =>
  import('@features/catalog/catalog-page.jsx').then((module) => ({
    default: module.CatalogPage,
  })),
)

const ProductDetailPage = lazy(() =>
  import('@features/catalog/product-detail.jsx').then((module) => ({
    default: module.ProductDetailPage,
  })),
)

const AlertsPage = lazy(() =>
  import('@features/account/alerts-page.jsx').then((module) => ({
    default: module.AlertsPage,
  })),
)

const ProfilesPage = lazy(() =>
  import('@features/account/profiles-page.jsx').then((module) => ({
    default: module.ProfilesPage,
  })),
)

const AddressesPage = lazy(() =>
  import('@features/account/addresses-page.jsx').then((module) => ({
    default: module.AddressesPage,
  })),
)

const HistoryPage = lazy(() =>
  import('@features/account/history-page.jsx').then((module) => ({
    default: module.HistoryPage,
  })),
)

const OrdersPage = lazy(() =>
  import('@features/account/orders-page.jsx').then((module) => ({
    default: module.OrdersPage,
  })),
)

const RewardsPage = lazy(() =>
  import('@features/account/rewards-page.jsx').then((module) => ({
    default: module.RewardsPage,
  })),
)

const CheckoutPage = lazy(() =>
  import('@features/checkout/checkout-page.jsx').then((module) => ({
    default: module.CheckoutPage,
  })),
)

const ConfirmationPage = lazy(() =>
  import('@features/checkout/confirmation-page.jsx').then((module) => ({
    default: module.ConfirmationPage,
  })),
)

const AdminSalesPage = lazy(() =>
  import('@features/admin/sales/sales-page.jsx').then((module) => ({
    default: module.AdminSalesPage,
  })),
)

const DashboardPage = lazy(() =>
  import('@features/admin/dashboard/dashboard-page.jsx').then((module) => ({
    default: module.DashboardPage,
  })),
)

const InventoryPage = lazy(() =>
  import('@features/admin/inventory/inventory-page.jsx').then((module) => ({
    default: module.InventoryPage,
  })),
)

const MovementsPage = lazy(() =>
  import('@features/admin/inventory/movements-page.jsx').then((module) => ({
    default: module.MovementsPage,
  })),
)

const ProductsPage = lazy(() =>
  import('@features/admin/catalog-admin/products-page.jsx').then((module) => ({
    default: module.ProductsPage,
  })),
)

const MissingSizesPage = lazy(() =>
  import('@features/admin/analytics/missing-sizes-page.jsx').then((module) => ({
    default: module.MissingSizesPage,
  })),
)

const CommentsPage = lazy(() =>
  import('@features/admin/analytics/comments-page.jsx').then((module) => ({
    default: module.CommentsPage,
  })),
)

const CouponsPage = lazy(() =>
  import('@features/admin/coupons/coupons-page.jsx').then((module) => ({
    default: module.CouponsPage,
  })),
)

const SettingsPage = lazy(() =>
  import('@features/admin/settings/settings-page.jsx').then((module) => ({
    default: module.SettingsPage,
  })),
)

const AssistantPage = lazy(() =>
  import('@features/admin/assistant/assistant-page.jsx').then((module) => ({
    default: module.AssistantPage,
  })),
)

const AdminSaleDetailPage = lazy(() =>
  import('@features/admin/sales/sale-detail-page.jsx').then((module) => ({
    default: module.AdminSaleDetailPage,
  })),
)

// La página /dev solo existe en modo mock; en el build http la rama es
// constante false y la página (y su chunk) se eliminan del bundle.
const IS_MOCK = (import.meta.env.VITE_API_MODE ?? 'mock') === 'mock'

const DevPage = IS_MOCK
  ? lazy(() =>
      import('@pages/dev/dev-page.jsx').then((module) => ({
        default: module.DevPage,
      })),
    )
  : null

// Todas las rutas de la app (§4.5 del plan), con las pantallas reales aún
// como stubs; cada historia reemplaza su stub por la página definitiva.
export function AppRouter() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        {/* Público */}
        <Route path={routes.home} element={<HomePage />} />
        <Route path={routes.about} element={<LandingPage />} />

        {/* Autenticación (solo sin sesión) */}
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
        <Route element={<CustomerLayout />}>
          <Route path={routes.fit()} element={<FitPage />} />
          <Route path={routes.fitResult(':generationId')} element={<ResultPage />} />
          <Route path={routes.catalog()} element={<CatalogPage />} />
          <Route path={routes.product(':productId')} element={<ProductDetailPage />} />
        </Route>

        {/* Cliente: solo logueado */}
        <Route
          element={
            <RequireAuth>
              <CustomerLayout />
            </RequireAuth>
          }
        >
          <Route path={routes.checkout()} element={<CheckoutPage />} />
          <Route
            path={routes.checkoutConfirmation(':saleId')}
            element={<ConfirmationPage />}
          />
          <Route path={routes.accountProfiles} element={<ProfilesPage />} />
          <Route path={routes.accountAddresses} element={<AddressesPage />} />
          <Route path={routes.accountHistory} element={<HistoryPage />} />
          <Route path={routes.accountOrders} element={<OrdersPage />} />
          <Route path={routes.accountAlerts} element={<AlertsPage />} />
          <Route path={routes.accountRewards} element={<RewardsPage />} />
        </Route>

        {/* Administración */}
        <Route
          element={
            <RequireAuth>
              <RequireRole requiredRole="Admin">
                <AdminLayout />
              </RequireRole>
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
          <Route path={routes.adminCoupons} element={<CouponsPage />} />
          <Route path={routes.adminSettings} element={<SettingsPage />} />
          <Route path={routes.adminAssistant} element={<AssistantPage />} />
        </Route>

        {/* Herramientas de demo */}
        {DevPage && <Route path={routes.dev} element={<DevPage />} />}

        {/* 404 */}
        <Route path="*" element={<StubPage titleKey="notFound.title" />} />
      </Routes>
    </Suspense>
  )
}
