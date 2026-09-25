import React from 'react'
import './Spinner.css'

const Spinner = ({ label = 'Carregando...', size = 40 }) => (
  <div className="spinner-wrap" role="status" aria-live="polite">
    <span className="spinner-ring" style={{ width: size, height: size }} aria-hidden="true" />
    <p>{label}</p>
  </div>
)

export default Spinner
