import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router'
import { routes } from './routes.js'
import { RequireAuth } from './guards/require-auth.jsx'
import { RequireRole } from './guards/require-role.jsx'
import { GuestOnly } from './guards/guest-only.jsx'
import { PublicLayout } from '../components/layout/public-layout.jsx'
import { CustomerLayout } from '../components/layout/customer-layout.jsx'
import { AdminLayout } from '../components/layout/admin-layout.jsx'
import { RouteFallback } from '../components/route-fallback.jsx'
import { StubPage } from '../components/stub-page.jsx'
import { LandingPage } from '../pages/landing-page/landing-page.jsx'

// La página /dev solo existe en modo mock; en el build http la rama es
// constante false y la página (y su chunk) se eliminan del bundle.
const IS_MOCK = (import.meta.env.VITE_API_MODE ?? 'mock') === 'mock'

const DevPage = IS_MOCK
  ? lazy(() =>
      import('../pages/dev/dev-page.jsx').then((module) => ({
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
        <Route path={routes.home} element={<LandingPage />} />
        <Route path={routes.about} element={<LandingPage />} />

        {/* Autenticación (solo sin sesión) */}
        <Route
          element={
            <GuestOnly>
              <PublicLayout />
            </GuestOnly>
          }
        >
          <Route
            path={routes.login}
            element={<StubPage titleKey="auth.login.title" />}
          />
          <Route
            path={routes.loginOtp}
            element={<StubPage titleKey="auth.otp.title" />}
          />
          <Route
            path={routes.forgotPassword}
            element={<StubPage titleKey="auth.forgot.title" />}
          />
          <Route
            path={routes.resetPassword}
            element={<StubPage titleKey="auth.reset.title" />}
          />
          <Route
            path={routes.register}
            element={<StubPage titleKey="auth.register.title" />}
          />
        </Route>

        {/* Cliente: invitado o logueado */}
        <Route element={<CustomerLayout />}>
          <Route path={routes.fit()} element={<StubPage titleKey="fit.title" />} />
          <Route
            path={routes.fitResult(':generationId')}
            element={<StubPage titleKey="fit.result.title" />}
          />
          <Route
            path={routes.catalog()}
            element={<StubPage titleKey="catalog.title" />}
          />
          <Route
            path={routes.product(':productId')}
            element={<StubPage titleKey="catalog.detail.title" />}
          />
        </Route>

        {/* Cliente: solo logueado */}
        <Route
          element={
            <RequireAuth>
              <CustomerLayout />
            </RequireAuth>
          }
        >
          <Route
            path={routes.checkout}
            element={<StubPage titleKey="checkout.title" />}
          />
          <Route
            path={routes.checkoutConfirmation(':saleId')}
            element={<StubPage titleKey="checkout.confirmation.title" />}
          />
          <Route
            path={routes.accountProfiles}
            element={<StubPage titleKey="account.profiles.title" />}
          />
          <Route
            path={routes.accountAddresses}
            element={<StubPage titleKey="account.addresses.title" />}
          />
          <Route
            path={routes.accountHistory}
            element={<StubPage titleKey="account.history.title" />}
          />
          <Route
            path={routes.accountOrders}
            element={<StubPage titleKey="account.orders.title" />}
          />
          <Route
            path={routes.accountAlerts}
            element={<StubPage titleKey="account.alerts.title" />}
          />
          <Route
            path={routes.accountRewards}
            element={<StubPage titleKey="account.rewards.title" />}
          />
        </Route>

        {/* Administración */}
        <Route
          element={
            <RequireAuth>
              <RequireRole role="Admin">
                <AdminLayout />
              </RequireRole>
            </RequireAuth>
          }
        >
          <Route
            path={routes.admin}
            element={<StubPage titleKey="admin.dashboard.title" />}
          />
          <Route
            path={routes.adminSales}
            element={<StubPage titleKey="admin.sales.title" />}
          />
          <Route
            path={routes.adminSale(':saleId')}
            element={<StubPage titleKey="admin.saleDetail.title" />}
          />
          <Route
            path={routes.adminInventory}
            element={<StubPage titleKey="admin.inventory.title" />}
          />
          <Route
            path={routes.adminMovements}
            element={<StubPage titleKey="admin.movements.title" />}
          />
          <Route
            path={routes.adminProducts}
            element={<StubPage titleKey="admin.products.title" />}
          />
          <Route
            path={routes.adminMissingSizes}
            element={<StubPage titleKey="admin.missingSizes.title" />}
          />
          <Route
            path={routes.adminComments}
            element={<StubPage titleKey="admin.comments.title" />}
          />
          <Route
            path={routes.adminCoupons}
            element={<StubPage titleKey="admin.coupons.title" />}
          />
          <Route
            path={routes.adminSettings}
            element={<StubPage titleKey="admin.settings.title" />}
          />
          <Route
            path={routes.adminAssistant}
            element={<StubPage titleKey="admin.assistant.title" />}
          />
        </Route>

        {/* Herramientas de demo */}
        {DevPage && <Route path={routes.dev} element={<DevPage />} />}

        {/* 404 */}
        <Route path="*" element={<StubPage titleKey="notFound.title" />} />
      </Routes>
    </Suspense>
  )
}
