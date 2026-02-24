import React from 'react'
import { Inbox } from 'lucide-react'
import './EmptyState.css'

const EmptyState = ({ 
  icon: Icon = Inbox, 
  title = 'Nenhum item encontrado', 
  message = 'Adicione seu primeiro item para começar',
  actionLabel,
  onAction 
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={64} />
      </div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-message">{message}</p>
      {actionLabel && onAction && (
        <button 
          className="btn btn-primary empty-state-btn"
          onClick={onAction}
          aria-label={actionLabel}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
