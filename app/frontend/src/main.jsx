import { ReactLenis } from 'lenis/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-900.css'
import './index.css'
import App from '@app/app.jsx'
import { Providers } from '@app/providers.jsx'
import { APP_NAME } from '@constants/app.js'

document.title = APP_NAME

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Providers>
      <BrowserRouter>
        <ReactLenis root>
          <App />
        </ReactLenis>
      </BrowserRouter>
    </Providers>
  </StrictMode>,
)
