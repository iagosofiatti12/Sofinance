import { supabase, getUserId } from './supabaseClient'

export const getMetas = async () => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('metas_desejos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const addMeta = async (meta) => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('metas_desejos')
    .insert([{ ...meta, user_id: userId }])
    .select()
  
  if (error) throw error
  return data[0]
}

export const updateMeta = async (id, updates) => {
  const { data, error } = await supabase
    .from('metas_desejos')
    .update(updates)
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data[0]
}

export const deleteMeta = async (id) => {
  const { error } = await supabase
    .from('metas_desejos')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}
