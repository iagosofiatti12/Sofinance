import React, { useState } from 'react'
import Login from './Login'
import SignUp from './SignUp'

const AuthPage = () => {
  const [mode, setMode] = useState('login') // 'login' ou 'signup'

  return mode === 'login' ? (
    <Login onToggleMode={() => setMode('signup')} />
  ) : (
    <SignUp onToggleMode={() => setMode('login')} />
  )
}

export default AuthPage
