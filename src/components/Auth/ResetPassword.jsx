import React, { useState } from 'react'
import { Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { updatePassword } from '../../services/authService'
import { getErrorMessage } from '@/lib/errorHandler'
import { useAuth } from '../../contexts/AuthContext'
import './Auth.css'

const ResetPassword = () => {
  const { clearRecovery } = useAuth()
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    if (senha.length < 8) return toast.error('A senha deve ter pelo menos 8 caracteres')
    if (senha !== confirma) return toast.error('As senhas não coincidem')
    setLoading(true)
    try {
      await updatePassword(senha)
      toast.success('Senha atualizada!')
      clearRecovery()
      window.history.replaceState({}, '', '/')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <h1>Nova senha</h1>
          <p>Escolha uma senha com pelo menos 8 caracteres.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nova-senha">
              <Lock size={18} /> Nova senha
            </label>
            <input
              id="nova-senha"
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              minLength={8}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirma-senha">
              <Lock size={18} /> Confirmar senha
            </label>
            <input
              id="confirma-senha"
              type="password"
              value={confirma}
              onChange={e => setConfirma(e.target.value)}
              minLength={8}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
