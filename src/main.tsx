import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import { RouterProvider } from 'react-router'
import { router } from '@/app/router'
import ErrorBoundary from '@/components/ErrorBoundary'
import Providers from '@/app/providers'
import '@/styles/index.css'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  })
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </ErrorBoundary>
  </React.StrictMode>
)
