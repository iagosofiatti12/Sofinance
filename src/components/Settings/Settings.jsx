import React, { useState, useEffect } from 'react'
import { User, LogOut, Mail, Calendar, Shield, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../services/supabaseClient'
import './Settings.css'

const Settings = () => {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    email: ''
  })

  useEffect(() => {
    if (user) {
      setProfile({
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        email: user.email || ''
      })
    }
  }, [user])

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    
    if (!profile.full_name.trim()) {
      toast.error('Nome não pode estar vazio')
      return
    }

    if (profile.full_name.length < 3) {
      toast.error('Nome deve ter no mínimo 3 caracteres')
      return
    }

    try {
      setLoading(true)
      
      const { error } = await supabase.auth.updateUser({
        data: { full_name: profile.full_name.trim() }
      })

      if (error) throw error

      toast.success('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast.error('Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (!confirm('Deseja realmente sair?')) return

    try {
      await signOut()
      toast.success('Logout realizado com sucesso!')
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
      toast.error('Erro ao fazer logout')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <div className="settings-title">
          <Shield size={32} />
          <div>
            <h1>Configurações</h1>
            <p>Gerencie suas informações pessoais e preferências</p>
          </div>
        </div>
      </div>

      <div className="settings-content">
        {/* Informações da Conta */}
        <div className="settings-card">
          <h2>
            <User size={20} />
            Informações da Conta
          </h2>

          <form onSubmit={handleUpdateProfile} className="settings-form">
            <div className="form-group">
              <label htmlFor="full_name">Nome Completo</label>
              <input
                id="full_name"
                type="text"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Seu nome"
                disabled={loading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="disabled"
                />
              </div>
              <small>O email não pode ser alterado</small>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        {/* Informações da Conta */}
        <div className="settings-card">
          <h2>
            <Calendar size={20} />
            Detalhes da Conta
          </h2>

          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Provedor de Login</span>
              <span className="info-value">
                {user?.app_metadata?.provider === 'google' ? '🔵 Google' : '📧 Email'}
              </span>
            </div>

            <div className="info-item">
              <span className="info-label">Conta criada em</span>
              <span className="info-value">{formatDate(user?.created_at)}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Último acesso</span>
              <span className="info-value">{formatDate(user?.last_sign_in_at)}</span>
            </div>

            <div className="info-item">
              <span className="info-label">Status</span>
              <span className="info-value status-active">
                ✓ Ativo
              </span>
            </div>
          </div>
        </div>

        {/* Ações Perigosas */}
        <div className="settings-card danger-zone">
          <h2>
            <Trash2 size={20} />
            Gerenciar Conta
          </h2>

          <div className="danger-actions">
            <div className="danger-action">
              <div>
                <h3>Sair da Conta</h3>
                <p>Você será desconectado e redirecionado para a tela de login</p>
              </div>
              <button 
                onClick={handleLogout}
                className="btn btn-danger"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
