import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Mantém a sessão após fechar o navegador
    autoRefreshToken: true, // Atualiza automaticamente o token de autenticação
    detectSessionInUrl: true, // Detecta código de autenticação na URL (OAuth)
    storage: window.localStorage // Usa localStorage para armazenar a sessão
  }
})

/**
 * Obtém o ID do usuário autenticado
 * @returns {Promise<string>} User ID
 * @throws {Error} Se não houver usuário autenticado
 */
export const getUserId = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    throw new Error('Usuário não autenticado')
  }
  
  return user.id
}
