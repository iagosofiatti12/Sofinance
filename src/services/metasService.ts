import { supabase, getUserId } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

export type Meta = Database['public']['Tables']['metas_desejos']['Row']
// O user_id nunca vem do chamador: o servico o obtem da sessao e sobrescreve.
// Deixa-lo fora do tipo faz o compilador impedir que alguem sequer tente informa-lo.
export type MetaInput = Omit<Database['public']['Tables']['metas_desejos']['Insert'], 'user_id'>

export const getMetas = async (): Promise<Meta[]> => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('metas_desejos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export const addMeta = async (meta: MetaInput): Promise<Meta> => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('metas_desejos')
    .insert([{ ...meta, user_id: userId }])
    .select()

  if (error) throw error
  const linha = data?.[0]
  if (!linha) throw new Error('Não foi possível criar a meta')
  return linha
}

export const updateMeta = async (id: string, updates: Partial<MetaInput>): Promise<Meta> => {
  const { data, error } = await supabase.from('metas_desejos').update(updates).eq('id', id).select()

  if (error) throw error
  const linha = data?.[0]
  if (!linha) throw new Error('Meta não encontrada')
  return linha
}

export const deleteMeta = async (id: string): Promise<void> => {
  const { error } = await supabase.from('metas_desejos').delete().eq('id', id)

  if (error) throw error
}
