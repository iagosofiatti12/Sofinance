import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import {
  getCurrentUser,
  getSession,
  signOut as authSignOut,
  onAuthStateChange,
} from '../services/authService'
import logger from '@/lib/logger'
// Import direto (não useQueryClient): o AuthProvider fica dentro do
// QueryClientProvider (src/app/providers.tsx), então o hook funcionaria,
// mas importar a instância direto deixa explícito que é o mesmo
// QueryClient único da aba e não depende da ordem dos providers.
import { queryClient } from '@/lib/queryClient'

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

  // Guarda o id do último usuário autenticado só para detectar troca de
  // usuário num SIGNED_IN sem SIGNED_OUT explícito antes (ver comentário abaixo).
  const lastUserIdRef = useRef(null)

  useEffect(() => {
    // Verificar sessão inicial
    checkUser()

    // Listener para mudanças de autenticação
    const { data: authListener } = onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
      if (event === 'SIGNED_OUT') setRecoveryMode(false)

      // O QueryClient é uma instância única por aba (src/lib/queryClient.ts).
      // Sem limpeza, dados do usuário anterior (ex.: contas fixas) continuam
      // no cache e aparecem no primeiro render do próximo usuário, antes
      // mesmo do skeleton de carregamento, porque com cache `isPending` é
      // `false`. O fluxo normal de logout/login sempre passa por SIGNED_OUT
      // antes de um novo SIGNED_IN (não existe "trocar de conta" sem sair
      // primeiro), então limpar aqui já fecha o vazamento nesse fluxo.
      if (event === 'SIGNED_OUT') {
        queryClient.clear()
        lastUserIdRef.current = null
      } else if (event === 'SIGNED_IN') {
        // Defesa extra para o caso fora do fluxo normal: sincronização entre
        // abas ou um SIGNED_IN que chega sem SIGNED_OUT prévio nesta aba
        // (ex.: troca de sessão em outra aba refletida aqui). Se o usuário
        // que está entrando é diferente do último visto, o cache também é
        // limpo antes de guardar o novo id.
        const incomingUserId = session?.user?.id ?? null
        if (incomingUserId && lastUserIdRef.current && incomingUserId !== lastUserIdRef.current) {
          queryClient.clear()
        }
        lastUserIdRef.current = incomingUserId
      }

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
