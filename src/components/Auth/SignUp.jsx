import React, { useState } from 'react'
import { Mail, Lock, User, LogIn, AlertCircle, CheckCircle } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import toast from 'react-hot-toast'
import { 
  signUpWithEmail, 
  signInWithGoogle 
} from '../../services/authService'
import './Auth.css'

const SignUp = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('As senhas não coincidem')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return false
    }

    if (!formData.fullName.trim()) {
      setError('Por favor, insira seu nome completo')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!validateForm()) return

    setLoading(true)

    try {
      await signUpWithEmail(formData.email, formData.password, formData.fullName)
      setSuccess(true)
      toast.success('Conta criada! Verifique seu email para confirmar.')
      
      // Limpar formulário
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
      })

      // Redirecionar para login após 3 segundos
      setTimeout(() => {
        onToggleMode()
      }, 3000)
    } catch (error) {
      console.error('Erro no cadastro:', error)
      const message = error.message || 'Erro ao criar conta. Tente novamente.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError('')
    setLoading(true)

    try {
      await signInWithGoogle()
      // O redirect acontece automaticamente
    } catch (error) {
      console.error('Erro no cadastro com Google:', error)
      const message = error.message || 'Erro ao cadastrar com Google'
      setError(message)
      toast.error(message)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card glass-card">
          <div className="auth-success">
            <CheckCircle size={64} className="success-icon" />
            <h2>Conta criada com sucesso!</h2>
            <p>Verifique seu email para confirmar sua conta.</p>
            <p className="text-muted">Redirecionando para login...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <h1>Criar conta</h1>
          <p>Comece a gerenciar suas finanças agora</p>
        </div>

        {error && (
          <div className="auth-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>
              <User size={18} />
              Nome Completo
            </label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="João Silva"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>
              <Mail size={18} />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>
              <Lock size={18} />
              Senha
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              minLength={6}
              required
              disabled={loading}
            />
            <small className="form-hint">Mínimo 6 caracteres</small>
          </div>

          <div className="form-group">
            <label>
              <Lock size={18} />
              Confirmar Senha
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              minLength={6}
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-small"></span>
            ) : (
              <>
                <LogIn size={18} />
                Criar Conta
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>ou</span>
        </div>

        <button 
          onClick={handleGoogleSignUp}
          className="btn btn-google btn-block"
          disabled={loading}
        >
          <FcGoogle size={20} />
          Cadastrar com Google
        </button>

        <div className="auth-footer">
          <p>
            Já tem uma conta?{' '}
            <button 
              type="button"
              onClick={onToggleMode}
              className="link-button"
              disabled={loading}
            >
              Faça login
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUp
