import React from 'react'
import { AlertTriangle } from 'lucide-react'
import logger from '../utils/logger'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({
      error,
      errorInfo
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #171717 100%)',
          color: '#fafafa'
        }}>
          <AlertTriangle size={64} style={{ color: '#ef4444', marginBottom: '1.5rem' }} />
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: '900', 
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            Oops! Algo deu errado
          </h1>
          <p style={{ 
            fontSize: '1rem', 
            color: '#d4d4d4', 
            marginBottom: '2rem',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            Ocorreu um erro inesperado na aplicação. Por favor, tente recarregar a página.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '12px 32px',
              fontSize: '14px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              background: '#1a1a1a',
              color: '#fafafa',
              border: '1.5px solid #404040',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#404040'
            }}
            onMouseOut={(e) => {
              e.target.style.background = '#1a1a1a'
            }}
          >
            Recarregar Página
          </button>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ 
              marginTop: '2rem', 
              padding: '1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid #ef4444',
              borderRadius: '8px',
              maxWidth: '800px',
              width: '100%'
            }}>
              <summary style={{ 
                cursor: 'pointer', 
                fontWeight: '700',
                marginBottom: '0.5rem' 
              }}>
                Detalhes do Erro (Dev Mode)
              </summary>
              <pre style={{ 
                fontSize: '0.875rem',
                overflow: 'auto',
                color: '#ef4444'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
