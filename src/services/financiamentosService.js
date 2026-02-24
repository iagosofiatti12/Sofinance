import { supabase, getUserId } from './supabaseClient'

// ========== FINANCIAMENTO IMÓVEL ==========
export const getFinanciamentoImovel = async () => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('financiamento_imovel')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const saveFinanciamentoImovel = async (financiamento) => {
  const userId = await getUserId()
  const existing = await getFinanciamentoImovel()
  
  // Preparar dados sem user_id no update
  const { user_id, ...dataToSave } = financiamento
  
  if (existing) {
    const { data, error } = await supabase
      .from('financiamento_imovel')
      .update(dataToSave)
      .eq('id', existing.id)
      .select()
    
    if (error) throw error
    return data[0]
  } else {
    const { data, error } = await supabase
      .from('financiamento_imovel')
      .insert([{ ...dataToSave, user_id: userId }])
      .select()
    
    if (error) throw error
    return data[0]
  }
}

// ========== FINANCIAMENTO CARRO ==========
export const getFinanciamentoCarro = async () => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('financiamento_carro')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const saveFinanciamentoCarro = async (financiamento) => {
  const userId = await getUserId()
  const existing = await getFinanciamentoCarro()
  
  // Preparar dados sem user_id no update
  const { user_id, ...dataToSave } = financiamento
  
  if (existing) {
    const { data, error } = await supabase
      .from('financiamento_carro')
      .update(dataToSave)
      .eq('id', existing.id)
      .select()
    
    if (error) throw error
    return data[0]
  } else {
    const { data, error } = await supabase
      .from('financiamento_carro')
      .insert([{ ...dataToSave, user_id: userId }])
      .select()
    
    if (error) throw error
    return data[0]
  }
}
