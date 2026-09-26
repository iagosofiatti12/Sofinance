import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { Toaster } from 'react-hot-toast'
import DarkModeToggle from '@/components/Layout/DarkModeToggle'
import Sidebar from '@/components/Layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import '@/App.css'

export default function AppLayout() {
  return (
    <div className="app">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--card-bg)',
            color: 'var(--text-primary)',
            border: '1.5px solid var(--glass-border)',
            backdropFilter: 'blur(10px)',
            fontSize: '13px',
            fontWeight: '600',
          },
          success: {
            iconTheme: { primary: 'var(--accent-green)', secondary: 'var(--card-bg)' },
          },
          error: {
            iconTheme: { primary: 'var(--accent-red)', secondary: 'var(--card-bg)' },
          },
        }}
      />

      <div className="dark-mode-float">
        <DarkModeToggle />
      </div>

      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <div className="content-wrapper">
            <Suspense fallback={<Spinner />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
