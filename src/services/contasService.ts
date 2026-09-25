import { supabase, getUserId } from '@/lib/supabase'
import logger from '@/lib/logger'
import type { Database } from '@/types/database.types'

export type ContaFixa = Database['public']['Tables']['contas_fixas']['Row']
// O user_id nunca vem do chamador: o servico o obtem da sessao e sobrescreve.
// Deixa-lo fora do tipo faz o compilador impedir que alguem sequer tente informa-lo.
export type ContaFixaInput = Omit<Database['public']['Tables']['contas_fixas']['Insert'], 'user_id'>

// Pega todas as contas fixas do usuário
export const getContasFixas = async (): Promise<ContaFixa[]> => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('contas_fixas')
    .select('*')
    .eq('user_id', userId)
    .order('dia_vencimento', { ascending: true })

  if (error) {
    logger.error('Error fetching contas:', error)
    throw error
  }
  return data || []
}

// Adiciona nova conta fixa
export const addContaFixa = async (conta: ContaFixaInput): Promise<ContaFixa> => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('contas_fixas')
    .insert([{ ...conta, user_id: userId }])
    .select()

  if (error) throw error
  return data[0]
}

// Atualiza conta fixa
export const updateContaFixa = async (
  id: string,
  updates: Partial<ContaFixaInput>
): Promise<ContaFixa> => {
  const { data, error } = await supabase.from('contas_fixas').update(updates).eq('id', id).select()

  if (error) throw error
  return data[0]
}

// Deleta conta fixa
export const deleteContaFixa = async (id: string): Promise<void> => {
  const { error } = await supabase.from('contas_fixas').delete().eq('id', id)

  if (error) throw error
}
