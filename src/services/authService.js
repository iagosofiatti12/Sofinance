import { supabase } from './supabaseClient'

// ========== AUTENTICAÇÃO ==========

/**
 * Fazer login com email e senha
 */
export const signInWithEmail = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

/**
 * Registrar novo usuário com email e senha
 */
export const signUpWithEmail = async (email, password, fullName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      }
    }
  })
  
  if (error) throw error
  return data
}

/**
 * Login com Google
 */
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/`
    }
  })
  
  if (error) throw error
  return data
}

/**
 * Login com Microsoft
 */
export const signInWithMicrosoft = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: `${window.location.origin}/`,
      scopes: 'email'
    }
  })
  
  if (error) throw error
  return data
}

/**
 * Logout
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Excluir conta do usuário (CUIDADO - ação irreversível)
 */
export const deleteAccount = async () => {
  try {
    // Primeiro, obter o ID do usuário atual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Usuário não autenticado')
    }

    const userId = user.id

    // Deletar dados do usuário em todas as tabelas (RLS vai garantir que só delete seus próprios dados)
    await supabase.from('contas_fixas').delete().eq('user_id', userId)
    await supabase.from('cartoes').delete().eq('user_id', userId)
    await supabase.from('faturas').delete().eq('user_id', userId)
    await supabase.from('parcelas').delete().eq('user_id', userId)
    await supabase.from('financiamentos').delete().eq('user_id', userId)
    await supabase.from('metas').delete().eq('user_id', userId)

    // Deletar perfil do usuário
    await supabase.from('profiles').delete().eq('id', userId)

    // Por último, fazer logout (a conta auth ficará, mas sem dados)
    await signOut()

    return true
  } catch (error) {
    console.error('Erro ao excluir conta:', error)
    throw error
  }
}

/**
 * Obter usuário atual
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

/**
 * Obter sessão atual
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

/**
 * Resetar senha (envia email)
 */
export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })
  
  if (error) throw error
  return data
}

/**
 * Atualizar senha
 */
export const updatePassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })
  
  if (error) throw error
  return data
}

/**
 * Atualizar perfil do usuário
 */
export const updateProfile = async (updates) => {
  const { data, error } = await supabase.auth.updateUser({
    data: updates
  })
  
  if (error) throw error
  return data
}

// ========== PERFIL DO USUÁRIO ==========

/**
 * Obter perfil completo do usuário
 */
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

/**
 * Atualizar perfil no banco
 */
export const updateUserProfile = async (userId, profile) => {
  const { data, error } = await supabase
    .from('perfis')
    .upsert({
      id: userId,
      ...profile,
      updated_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

/**
 * Upload de avatar
 */
export const uploadAvatar = async (userId, file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`
  
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file)
  
  if (uploadError) throw uploadError
  
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)
  
  // Atualizar perfil com URL do avatar
  await updateUserProfile(userId, { avatar_url: publicUrl })
  
  return publicUrl
}

// ========== LISTENERS ==========

/**
 * Escutar mudanças no estado de autenticação
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session)
  })
}
