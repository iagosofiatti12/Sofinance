import { supabase, getUserId } from './supabaseClient'
import logger from '../utils/logger'

// Pega todas as contas fixas do usuário
export const getContasFixas = async () => {
  try {
    const userId = await getUserId()
    const { data, error } = await supabase
      .from('contas_fixas')
      .select('*')
      .eq('user_id', userId)
      .order('dia_vencimento', { ascending: true })
    
    if (error) {
      logger.error('Supabase error:', error)
      throw error
    }
    return data || []
  } catch (error) {
    logger.error('Error fetching contas:', error)
    return []
  }
}

// Adiciona nova conta fixa
export const addContaFixa = async (conta) => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('contas_fixas')
    .insert([{ ...conta, user_id: userId }])
    .select()
  
  if (error) throw error
  return data[0]
}

// Atualiza conta fixa
export const updateContaFixa = async (id, updates) => {
  const { data, error } = await supabase
    .from('contas_fixas')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data[0]
}

// Deleta conta fixa
export const deleteContaFixa = async (id) => {
  const { error } = await supabase
    .from('contas_fixas')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}
