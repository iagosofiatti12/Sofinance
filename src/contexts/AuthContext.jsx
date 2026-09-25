import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  getCurrentUser,
  getSession,
  signOut as authSignOut,
  onAuthStateChange,
} from '../services/authService'
import logger from '@/lib/logger'

/**
 * @typedef {Object} AuthContextValue
 * @property {import('@supabase/supabase-js').User | null} user
 * @property {import('@supabase/supabase-js').Session | null} session
 * @property {boolean} loading
 * @property {() => Promise<void>} signOut
 * @property {boolean} isAuthenticated
 * @property {boolean} recoveryMode
 * @property {() => void} clearRecovery
 */

const AuthContext = createContext({})

/** @returns {AuthContextValue} */
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
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    // Verificar sessão inicial
    checkUser()

    // Listener para mudanças de autenticação
    const { data: authListener } = onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
      if (event === 'SIGNED_OUT') setRecoveryMode(false)
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
    isAuthenticated: !!user,
    recoveryMode,
    clearRecovery: () => setRecoveryMode(false),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
