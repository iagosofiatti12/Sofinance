import React, { useState } from 'react'
import { Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { resetPassword } from '../../services/authService'
import { getErrorMessage } from '../../utils/errorHandler'
import './Auth.css'

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
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
          <h1>Recuperar senha</h1>
          <p>
            {sent
              ? 'Se este e-mail estiver cadastrado, você receberá um link em instantes.'
              : 'Informe seu e-mail e enviaremos um link para criar uma nova senha.'}
          </p>
        </div>
        {!sent && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="forgot-email">
                <Mail size={18} /> Email
              </label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>
          </form>
        )}
        <div className="auth-footer">
          <button type="button" onClick={onBack} className="link-button">
            <ArrowLeft size={14} /> Voltar ao login
          </button>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
