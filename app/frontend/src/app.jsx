import { Route, Routes } from 'react-router'
import { LandingPage } from './pages/landing-page/landing-page.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
    </Routes>
  )
}

export default App
