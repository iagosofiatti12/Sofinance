import React from 'react'
import './LoadingSkeleton.css'

const LoadingSkeleton = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'stat':
        return (
          <div className="skeleton skeleton-stat">
            <div className="skeleton-line skeleton-stat-label"></div>
            <div className="skeleton-line skeleton-stat-value"></div>
          </div>
        )
      
      case 'card':
        return (
          <div className="skeleton skeleton-card">
            <div className="skeleton-line skeleton-title"></div>
            <div className="skeleton-line skeleton-text"></div>
            <div className="skeleton-line skeleton-text-short"></div>
          </div>
        )
      
      case 'list-item':
        return (
          <div className="skeleton skeleton-list-item">
            <div className="skeleton-circle"></div>
            <div className="skeleton-content">
              <div className="skeleton-line skeleton-text"></div>
              <div className="skeleton-line skeleton-text-short"></div>
            </div>
          </div>
        )
      
      case 'table-row':
        return (
          <div className="skeleton skeleton-table-row">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
            <div className="skeleton-line skeleton-text-short"></div>
          </div>
        )
      
      default:
        return <div className="skeleton skeleton-default"></div>
    }
  }

  return (
    <div className="skeleton-container">
      {Array.from({ length: count }).map((_, index) => (
        <React.Fragment key={index}>
          {renderSkeleton()}
        </React.Fragment>
      ))}
    </div>
  )
}

export default LoadingSkeleton
