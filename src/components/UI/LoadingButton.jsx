import React from 'react'
import { Loader2 } from 'lucide-react'
import './LoadingButton.css'

/**
 * Botão com estado de loading integrado
 * Mostra spinner e desabilita automaticamente durante operações assíncronas
 */
const LoadingButton = ({ 
  loading = false, 
  disabled = false,
  children, 
  className = '',
  variant = 'primary',
  icon: Icon,
  ...props 
}) => {
  const isDisabled = loading || disabled
  const buttonClass = `btn btn-${variant} loading-button ${className} ${loading ? 'loading' : ''}`

  return (
    <button 
      className={buttonClass}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 size={18} className="spinner" />
          <span>{children}</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={18} />}
          <span>{children}</span>
        </>
      )}
    </button>
  )
}

export default LoadingButton
