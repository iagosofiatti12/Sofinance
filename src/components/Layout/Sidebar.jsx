import React from 'react'
import { 
  LayoutDashboard, 
  Receipt, 
  CreditCard, 
  Home, 
  Car, 
  Target,
  User,
  LogOut,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import './Sidebar.css'

const Sidebar = ({ activeSection, setActiveSection }) => {
  const { signOut } = useAuth()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'extrato', label: 'Extrato Mensal', icon: FileText },
    { id: 'contas', label: 'Contas Fixas', icon: Receipt },
    { id: 'cartoes', label: 'Cartões', icon: CreditCard },
    { id: 'imovel', label: 'Financ. Imóvel', icon: Home },
    { id: 'carro', label: 'Financ. Carro', icon: Car },
    { id: 'metas', label: 'Metas', icon: Target },
  ]

  const handleSettings = () => {
    setActiveSection('settings')
  }

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logout realizado com sucesso!')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      toast.error('Erro ao sair do sistema')
    }
  }

  const handleLogoClick = () => {
    setActiveSection('dashboard')
  }

  const handleLogoKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleLogoClick()
    }
  }

  return (
    <aside 
      className="sidebar glass" 
      role="navigation" 
      aria-label="Menu principal"
    >
      <div 
        className="sidebar-logo" 
        onClick={handleLogoClick}
        onKeyDown={handleLogoKeyDown}
        role="button" 
        tabIndex={0}
        aria-label="Voltar ao Dashboard"
      >
        <img 
          src="/logo-completo.png"
          alt="Sofinance"
          className="logo-image"
        />
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(item => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
              onClick={() => setActiveSection(item.id)}
              aria-label={`Navegar para ${item.label}`}
              aria-current={activeSection === item.id ? 'page' : undefined}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
      
      <div className="sidebar-footer">
        <button
          className="sidebar-item sidebar-action"
          onClick={handleSettings}
          aria-label="Perfil"
        >
          <User size={20} aria-hidden="true" />
          <span>Perfil</span>
        </button>
        
        <button
          className="sidebar-item sidebar-action sidebar-logout"
          onClick={handleLogout}
          aria-label="Sair do sistema"
        >
          <LogOut size={20} aria-hidden="true" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
