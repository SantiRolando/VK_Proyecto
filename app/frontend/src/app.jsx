import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router'
import { LandingPage } from './pages/landing-page/landing-page.jsx'
import { AppLayout } from './components/app-layout.jsx'
import { RouteFallback } from './components/route-fallback.jsx'

const GeneratorPage = lazy(() =>
  import('./pages/generator/generator-page.jsx').then((module) => ({
    default: module.GeneratorPage,
  })),
)

const ReportsPage = lazy(() =>
  import('./pages/reports/reports-page.jsx').then((module) => ({
    default: module.ReportsPage,
  })),
)

const UsersPage = lazy(() =>
  import('./pages/users/users-page.jsx').then((module) => ({
    default: module.UsersPage,
  })),
)

const CouponsPage = lazy(() =>
  import('./pages/coupons/coupons-page.jsx').then((module) => ({
    default: module.CouponsPage,
  })),
)

const StockPage = lazy(() =>
  import('./pages/stock/stock-page.jsx').then((module) => ({
    default: module.StockPage,
  })),
)

const TransactionsPage = lazy(() =>
  import('./pages/transactions/transactions-page.jsx').then((module) => ({
    default: module.TransactionsPage,
  })),
)

function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<AppLayout />}>
          <Route path="/generator" element={<GeneratorPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/stock" element={<StockPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
