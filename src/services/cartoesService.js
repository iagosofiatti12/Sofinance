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
    nome: cartao.nome_cartao
  }))
}

export const addCartao = async (cartao) => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('cartoes_credito')
    .insert([{ 
      user_id: userId,
      nome_cartao: cartao.nome,
      bandeira: cartao.bandeira,
      limite_total: cartao.limite_total,
      dia_fechamento: cartao.dia_fechamento,
      dia_vencimento: cartao.dia_vencimento
    }])
    .select()
  
  if (error) throw error
  return data[0]
}

export const updateCartao = async (id, updates) => {
  // Mapear nome para nome_cartao (compatibilidade com banco)
  const dbUpdates = {
    ...updates,
    nome_cartao: updates.nome
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

export const deleteCartao = async (id) => {
  const { error } = await supabase
    .from('cartoes_credito')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ========== TRANSAÇÕES ==========
export const getTransacoes = async (cartaoId) => {
  const { data, error } = await supabase
    .from('transacoes_cartao')
    .select('*')
    .eq('cartao_id', cartaoId)
    .order('data_compra', { ascending: false })
  
  if (error) throw error
  return data || []
}

export const addTransacao = async (transacao) => {
  const { data, error } = await supabase
    .from('transacoes_cartao')
    .insert([transacao])
    .select()
  
  if (error) throw error
  
  // Atualiza limite usado do cartão
  const { data: cartao, error: cartaoError } = await supabase
    .from('cartoes_credito')
    .select('limite_usado')
    .eq('id', transacao.cartao_id)
    .single()
  
  if (!cartaoError && cartao) {
    await supabase
      .from('cartoes_credito')
      .update({ limite_usado: cartao.limite_usado + transacao.valor })
      .eq('id', transacao.cartao_id)
  }
  
  return data[0]
}

export const deleteTransacao = async (id, cartaoId, valor) => {
  const { error } = await supabase
    .from('transacoes_cartao')
    .delete()
    .eq('id', id)
  
  if (error) throw error
  
  // Atualiza limite usado do cartão
  const { data: cartao, error: cartaoError } = await supabase
    .from('cartoes_credito')
    .select('limite_usado')
    .eq('id', cartaoId)
    .single()
  
  if (!cartaoError && cartao) {
    await supabase
      .from('cartoes_credito')
      .update({ limite_usado: Math.max(0, cartao.limite_usado - valor) })
      .eq('id', cartaoId)
  }
}
