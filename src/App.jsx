import React, { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './contexts/AuthContext'
import AuthPage from './components/Auth/AuthPage'
import DarkModeToggle from './components/Layout/DarkModeToggle'
import Sidebar from './components/Layout/Sidebar'
import DashboardHome from './components/Dashboard/DashboardHome'
import ExtratoMensal from './components/Extrato/ExtratoMensal'
import ContasFixasList from './components/ContasFixas/ContasFixasList'
import CartoesList from './components/Cartoes/CartoesList'
import FinanciamentoImovel from './components/Financiamentos/FinanciamentoImovel'
import FinanciamentoCarro from './components/Financiamentos/FinanciamentoCarro'
import MetasList from './components/Metas/MetasList'
import Settings from './components/Settings/Settings'
import './App.css'

function App() {
  const { isAuthenticated, loading } = useAuth()
  const [activeSection, setActiveSection] = useState('dashboard')

  // Loading state
  if (loading) {
    return (
      <div className="app-loading">
        <img src="/loading-icon.gif" alt="Carregando..." className="loading-icon" />
        <p>Carregando...</p>
      </div>
    )
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
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
