import { supabase, getUserId } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

export type FinanciamentoImovel = Database['public']['Tables']['financiamento_imovel']['Row']
// O user_id nunca vem do chamador: o servico o obtem da sessao e sobrescreve.
// Deixa-lo fora do tipo faz o compilador impedir que alguem sequer tente informa-lo.
export type FinanciamentoImovelInput = Omit<
  Database['public']['Tables']['financiamento_imovel']['Insert'],
  'user_id'
>

export type FinanciamentoCarro = Database['public']['Tables']['financiamento_carro']['Row']
export type FinanciamentoCarroInput = Omit<
  Database['public']['Tables']['financiamento_carro']['Insert'],
  'user_id'
>

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

  if (existing) {
    const { data, error } = await supabase
      .from('financiamento_imovel')
      .update(financiamento)
      .eq('id', existing.id)
      .select()

    if (error) throw error
    const linha = data?.[0]
    if (!linha) throw new Error('Financiamento não encontrado')
    return linha
  } else {
    const { data, error } = await supabase
      .from('financiamento_imovel')
      .insert([{ ...financiamento, user_id: userId }])
      .select()

    if (error) throw error
    const linha = data?.[0]
    if (!linha) throw new Error('Não foi possível salvar o financiamento')
    return linha
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

  if (existing) {
    const { data, error } = await supabase
      .from('financiamento_carro')
      .update(financiamento)
      .eq('id', existing.id)
      .select()

    if (error) throw error
    const linha = data?.[0]
    if (!linha) throw new Error('Financiamento não encontrado')
    return linha
  } else {
    const { data, error } = await supabase
      .from('financiamento_carro')
      .insert([{ ...financiamento, user_id: userId }])
      .select()

    if (error) throw error
    const linha = data?.[0]
    if (!linha) throw new Error('Não foi possível salvar o financiamento')
    return linha
  }
}
