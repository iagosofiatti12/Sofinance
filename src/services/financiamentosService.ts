import { supabase, getUserId } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

export type FinanciamentoImovel = Database['public']['Tables']['financiamento_imovel']['Row']
export type FinanciamentoImovelInput =
  Database['public']['Tables']['financiamento_imovel']['Insert']

export type FinanciamentoCarro = Database['public']['Tables']['financiamento_carro']['Row']
export type FinanciamentoCarroInput = Database['public']['Tables']['financiamento_carro']['Insert']

// ========== FINANCIAMENTO IMÓVEL ==========
export const getFinanciamentoImovel = async (): Promise<FinanciamentoImovel | null> => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('financiamento_imovel')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const saveFinanciamentoImovel = async (
  financiamento: FinanciamentoImovelInput
): Promise<FinanciamentoImovel> => {
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
export const getFinanciamentoCarro = async (): Promise<FinanciamentoCarro | null> => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('financiamento_carro')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export const saveFinanciamentoCarro = async (
  financiamento: FinanciamentoCarroInput
): Promise<FinanciamentoCarro> => {
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
