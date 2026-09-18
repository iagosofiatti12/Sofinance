import React, { useState } from 'react'
import Login from './Login'
import SignUp from './SignUp'
import ForgotPassword from './ForgotPassword'

const AuthPage = () => {
  const [mode, setMode] = useState('login') // 'login' | 'signup' | 'forgot'

  if (mode === 'forgot') {
    return <ForgotPassword onBack={() => setMode('login')} />
  }

  return mode === 'login' ? (
    <Login onToggleMode={() => setMode('signup')} onForgotPassword={() => setMode('forgot')} />
  ) : (
    <SignUp onToggleMode={() => setMode('login')} />
  )
}

export default AuthPage
