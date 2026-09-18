import React, { useState, Suspense, lazy } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './contexts/AuthContext'
import AuthPage from './components/Auth/AuthPage'
import ResetPassword from './components/Auth/ResetPassword'
import DarkModeToggle from './components/Layout/DarkModeToggle'
import Sidebar from './components/Layout/Sidebar'
import Spinner from './components/UI/Spinner'
import './App.css'

const DashboardHome = lazy(() => import('./components/Dashboard/DashboardHome'))
const ExtratoMensal = lazy(() => import('./components/Extrato/ExtratoMensal'))
const ContasFixasList = lazy(() => import('./components/ContasFixas/ContasFixasList'))
const CartoesList = lazy(() => import('./components/Cartoes/CartoesList'))
const FinanciamentoImovel = lazy(() => import('./components/Financiamentos/FinanciamentoImovel'))
const FinanciamentoCarro = lazy(() => import('./components/Financiamentos/FinanciamentoCarro'))
const MetasList = lazy(() => import('./components/Metas/MetasList'))
const Settings = lazy(() => import('./components/Settings/Settings'))

function App() {
  const { isAuthenticated, loading, recoveryMode } = useAuth()
  const [activeSection, setActiveSection] = useState('dashboard')

  // Loading state
  if (loading) {
    return (
      <div className="app-loading">
        <Spinner label="Carregando..." size={56} />
      </div>
    )
  }

  // Recuperação de senha - o link do e-mail já autentica a sessão via evento
  // PASSWORD_RECOVERY; mostrar a tela de nova senha antes do dashboard.
  if (recoveryMode) {
    return <ResetPassword />
  }

  // Not authenticated - show login
  if (!isAuthenticated) {
    return <AuthPage />
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardHome />
      case 'extrato':
        return <ExtratoMensal />
      case 'contas':
        return <ContasFixasList />
      case 'cartoes':
        return <CartoesList />
      case 'imovel':
        return <FinanciamentoImovel />
      case 'carro':
        return <FinanciamentoCarro />
      case 'metas':
        return <MetasList />
      case 'settings':
        return <Settings />
      default:
        return <DashboardHome />
    }
  }

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
            iconTheme: {
              primary: 'var(--accent-green)',
              secondary: 'var(--card-bg)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--accent-red)',
              secondary: 'var(--card-bg)',
            },
          },
        }}
      />
      
      <div className="dark-mode-float">
        <DarkModeToggle />
      </div>
      
      <div className="app-container">
        <Sidebar 
          activeSection={activeSection} 
          setActiveSection={setActiveSection} 
        />
        
        <main className="main-content">
          <div className="content-wrapper">
            <Suspense fallback={<Spinner />}>
              {renderContent()}
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
