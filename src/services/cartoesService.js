import { supabase, getUserId } from './supabaseClient'

// ========== CARTÕES ==========
export const getCartoes = async () => {
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

export const addCartao = async cartao => {
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
  return data[0]
}

export const updateCartao = async (id, updates) => {
  // Mapear nome para nome_cartao (compatibilidade com banco)
  const dbUpdates = {
    ...updates,
    nome_cartao: updates.nome,
  }
  delete dbUpdates.nome

  const { data, error } = await supabase
    .from('cartoes_credito')
    .update(dbUpdates)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0]
}

export const deleteCartao = async id => {
  const { error } = await supabase.from('cartoes_credito').delete().eq('id', id)

  if (error) throw error
}
