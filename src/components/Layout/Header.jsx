import React from 'react'
import DarkModeToggle from './DarkModeToggle'
import './Header.css'

const Header = () => {
  return (
    <header className="header glass">
      <div className="header-content">
        <div className="header-left">
          <div className="logo">
            <img src="/logo-completo.png" alt="Sofinance" className="logo-image" />
          </div>
          <p className="tagline">Controle Financeiro Pessoal</p>
        </div>
        
        <div className="header-right">
          <DarkModeToggle />
        </div>
      </div>
    </header>
  )
}

export default Header
