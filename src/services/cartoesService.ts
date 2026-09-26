import { supabase, getUserId } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

export type Cartao = Database['public']['Tables']['cartoes_credito']['Row']
export type CartaoInput = {
  nome: string
  bandeira: string
  limite_total: number
  dia_fechamento: number
  dia_vencimento: number
}

// ========== CARTÕES ==========
export const getCartoes = async (): Promise<(Cartao & { nome: string })[]> => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('cartoes_credito')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Mapear nome_cartao para nome (compatibilidade com frontend)
  return (data || []).map(cartao => ({
    ...cartao,
    nome: cartao.nome_cartao,
  }))
}

export const addCartao = async (cartao: CartaoInput): Promise<Cartao> => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('cartoes_credito')
    .insert([
      {
        user_id: userId,
        nome_cartao: cartao.nome,
        bandeira: cartao.bandeira,
        limite_total: cartao.limite_total,
        dia_fechamento: cartao.dia_fechamento,
        dia_vencimento: cartao.dia_vencimento,
      },
    ])
    .select()

  if (error) throw error
  const linha = data?.[0]
  if (!linha) throw new Error('Não foi possível criar o cartão')
  return linha
}

export const updateCartao = async (id: string, updates: Partial<CartaoInput>): Promise<Cartao> => {
  // Mapear nome para nome_cartao (compatibilidade com banco)
  const { nome, ...rest } = updates
  const dbUpdates: Database['public']['Tables']['cartoes_credito']['Update'] = {
    ...rest,
    nome_cartao: nome,
  }

  const { data, error } = await supabase
    .from('cartoes_credito')
    .update(dbUpdates)
    .eq('id', id)
    .select()

  if (error) throw error
  const linha = data?.[0]
  if (!linha) throw new Error('Cartão não encontrado')
  return linha
}

export const deleteCartao = async (id: string): Promise<void> => {
  const { error } = await supabase.from('cartoes_credito').delete().eq('id', id)

  if (error) throw error
}
