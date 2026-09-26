import React from 'react'
import { NavLink } from 'react-router'
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Home,
  Car,
  Target,
  User,
  LogOut,
  FileText,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import './Sidebar.css'

const menuItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/lancamentos', label: 'Extrato Mensal', icon: FileText },
  { to: '/contas', label: 'Contas Fixas', icon: Receipt },
  { to: '/cartoes', label: 'Cartões', icon: CreditCard },
  { to: '/dividas/imovel', label: 'Financ. Imóvel', icon: Home },
  { to: '/dividas/carro', label: 'Financ. Carro', icon: Car },
  { to: '/metas', label: 'Metas', icon: Target },
]

const Sidebar = () => {
  const { signOut } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut()
      toast.success('Logout realizado com sucesso!')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      toast.error('Erro ao sair do sistema')
    }
  }

  return (
    <aside className="sidebar glass" role="navigation" aria-label="Menu principal">
      <NavLink to="/" className="sidebar-logo" aria-label="Voltar ao Dashboard">
        <img src="/logo-completo.png" alt="Sofinance" className="logo-image" />
      </NavLink>

      <nav className="sidebar-nav">
        {menuItems.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              aria-label={`Navegar para ${item.label}`}
            >
              <Icon size={20} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="sidebar-footer">
        <NavLink to="/configuracoes" className="sidebar-item sidebar-action" aria-label="Perfil">
          <User size={20} aria-hidden="true" />
          <span>Perfil</span>
        </NavLink>

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
