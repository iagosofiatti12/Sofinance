import React, { useState } from 'react'
import { Mail, Lock, LogIn, UserPlus, AlertCircle } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import toast from 'react-hot-toast'
import { 
  signInWithEmail, 
  signInWithGoogle 
} from '../../services/authService'
import './Auth.css'

const Login = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithEmail(formData.email, formData.password)
      toast.success('Login realizado com sucesso!')
    } catch (error) {
      console.error('Erro no login:', error)
      const message = error.message || 'Erro ao fazer login. Verifique suas credenciais.'
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    setLoading(true)

    try {
      await signInWithGoogle()
      // O redirect acontece automaticamente
    } catch (error) {
      console.error('Erro no login com Google:', error)
      const message = error.message || 'Erro ao fazer login com Google'
      setError(message)
      toast.error(message)
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <h1>Bem-vindo de volta!</h1>
          <p>Faça login para acessar suas finanças</p>
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
                Entrar
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>ou</span>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="btn btn-google btn-block"
          disabled={loading}
        >
          <FcGoogle size={20} />
          Continuar com Google
        </button>

        <div className="auth-footer">
          <p>
            Não tem uma conta?{' '}
            <button 
              type="button"
              onClick={onToggleMode}
              className="link-button"
              disabled={loading}
            >
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
