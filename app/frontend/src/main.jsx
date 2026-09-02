import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router'
import { ReactLenis } from 'lenis/react'
import './index.css'
import App from './app.jsx'
import { APP_NAME } from './constants.js'
import { I18nProvider } from './i18n/i18n-provider.jsx'
import { theme } from './theme.js'

document.title = APP_NAME

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <I18nProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <ReactLenis root>
              <App />
            </ReactLenis>
          </BrowserRouter>
        </QueryClientProvider>
      </I18nProvider>
    </MantineProvider>
  </StrictMode>,
)
