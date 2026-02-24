import React, { createContext, useContext, useState, useEffect } from 'react'
import { 
  getCurrentUser, 
  getSession, 
  signOut as authSignOut,
  onAuthStateChange 
} from '../services/authService'
import logger from '../utils/logger'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar sessão inicial
    checkUser()

    // Listener para mudanças de autenticação
    const { data: authListener } = onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Cleanup
    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    try {
      setLoading(true)
      const session = await getSession()
      setSession(session)
      setUser(session?.user ?? null)
    } catch (error) {
      logger.error('Error checking user:', error)
      setUser(null)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await authSignOut()
      setUser(null)
      setSession(null)
    } catch (error) {
      logger.error('Error signing out:', error)
      throw error
    }
  }

  const value = {
    user,
    session,
    loading,
    signOut,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
