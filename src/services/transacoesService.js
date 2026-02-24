import { supabase } from './supabaseClient'
import { getCurrentUser } from './authService'

// Helper para obter user_id
const getUserId = async () => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Usuário não autenticado')
  return user.id
}

// Helper para formatar mês de referência
export const formatMesReferencia = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

// ========== TRANSAÇÕES ==========

/**
 * Listar todas as transações do usuário
 */
export const getTransacoes = async (filtros = {}) => {
  const userId = await getUserId()
  
  let query = supabase
    .from('transacoes')
    .select('*')
    .eq('user_id', userId)
    .order('data_transacao', { ascending: false })
  
  // Aplicar filtros
  if (filtros.mes_referencia) {
    query = query.eq('mes_referencia', filtros.mes_referencia)
  }
  
  if (filtros.tipo) {
    query = query.eq('tipo', filtros.tipo)
  }
  
  if (filtros.categoria) {
    query = query.eq('categoria', filtros.categoria)
  }
  
  if (filtros.data_inicial && filtros.data_final) {
    query = query
      .gte('data_transacao', filtros.data_inicial)
      .lte('data_transacao', filtros.data_final)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data || []
}

/**
 * Obter transações por mês
 */
export const getTransacoesPorMes = async (mesReferencia) => {
  return await getTransacoes({ mes_referencia: mesReferencia })
}

/**
 * Adicionar nova transação
 * Se for crédito com parcelas, chama função para criar todas as parcelas
 */
export const addTransacao = async (transacao) => {
  const userId = await getUserId()
  
  // Se for crédito parcelado, usar função especial
  if (transacao.metodo_pagamento === 'Crédito' && transacao.num_parcelas && transacao.num_parcelas > 1) {
    return await criarTransacaoParcelada({
      descricao: transacao.descricao,
      valor_total: transacao.valor,
      categoria: transacao.categoria,
      data_primeira_parcela: transacao.data_transacao,
      cartao_id: transacao.cartao_credito_id,
      num_parcelas: transacao.num_parcelas,
      observacoes: transacao.observacoes
    })
  }
  
  // Transação normal (PIX, débito, dinheiro, ou crédito à vista)
  const { data, error } = await supabase
    .from('transacoes')
    .insert([{
      user_id: userId,
      tipo: transacao.tipo,
      categoria: transacao.categoria,
      descricao: transacao.descricao,
      valor: transacao.valor,
      data_transacao: transacao.data_transacao,
      mes_referencia: formatMesReferencia(transacao.data_transacao),
      conta_bancaria: transacao.conta_bancaria,
      metodo_pagamento: transacao.metodo_pagamento,
      observacoes: transacao.observacoes,
      recorrente: transacao.recorrente || false
    }])
    .select()
  
  if (error) throw error
  
  // Se for crédito à vista, atualizar limite do cartão
  if (transacao.metodo_pagamento === 'Crédito' && transacao.cartao_credito_id) {
    await atualizarLimiteCartao(transacao.cartao_credito_id, transacao.valor, 'aumentar')
  }
  
  return data[0]
}

/**
 * Criar transação parcelada no cartão de crédito
 */
export const criarTransacaoParcelada = async ({
  descricao,
  valor_total,
  categoria,
  data_primeira_parcela,
  cartao_id,
  num_parcelas,
  observacoes = null
}) => {
  const userId = await getUserId()
  
  const { data, error } = await supabase.rpc('criar_transacao_parcelada', {
    p_user_id: userId,
    p_descricao: descricao,
    p_valor_total: valor_total,
    p_categoria: categoria,
    p_data_primeira_parcela: data_primeira_parcela,
    p_cartao_id: cartao_id,
    p_num_parcelas: num_parcelas,
    p_observacoes: observacoes
  })
  
  if (error) throw error
  return data
}

/**
 * Atualizar limite usado do cartão
 */
const atualizarLimiteCartao = async (cartaoId, valor, operacao = 'aumentar') => {
  const { data: cartao } = await supabase
    .from('cartoes_credito')
    .select('limite_usado')
    .eq('id', cartaoId)
    .single()
  
  if (!cartao) return
  
  const novoLimite = operacao === 'aumentar' 
    ? parseFloat(cartao.limite_usado) + parseFloat(valor)
    : Math.max(0, parseFloat(cartao.limite_usado) - parseFloat(valor))
  
  await supabase
    .from('cartoes_credito')
    .update({ limite_usado: novoLimite })
    .eq('id', cartaoId)
}

/**
 * Atualizar transação
 */
export const updateTransacao = async (id, updates) => {
  const { data, error } = await supabase
    .from('transacoes')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
  
  if (error) throw error
  return data[0]
}

/**
 * Deletar transação
 */
export const deleteTransacao = async (id) => {
  const { error } = await supabase
    .from('transacoes')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// ========== RESUMOS E ESTATÍSTICAS ==========

/**
 * Obter resumo mensal
 */
export const getResumoMensal = async (mesReferencia) => {
  const userId = await getUserId()
  
  const { data, error } = await supabase
    .rpc('obter_receitas_mes', { usuario_id: userId, mes: mesReferencia })
  
  if (error && error.code !== 'PGRST116') {
    // Se a função RPC não existir, calcular manualmente
    const transacoes = await getTransacoesPorMes(mesReferencia)
    
    const receitas = transacoes
      .filter(t => t.tipo === 'receita')
      .reduce((sum, t) => sum + parseFloat(t.valor), 0)
    
    const despesas = transacoes
      .filter(t => t.tipo === 'despesa')
      .reduce((sum, t) => sum + parseFloat(t.valor), 0)
    
    return {
      receitas,
      despesas,
      saldo: receitas - despesas
    }
  }
  
  return data
}

/**
 * Obter gastos por categoria
 */
export const getGastosPorCategoria = async (mesReferencia) => {
  const transacoes = await getTransacoesPorMes(mesReferencia)
  
  const gastosPorCategoria = transacoes
    .filter(t => t.tipo === 'despesa')
    .reduce((acc, t) => {
      const categoria = t.categoria
      if (!acc[categoria]) {
        acc[categoria] = {
          categoria,
          total: 0,
          quantidade: 0
        }
      }
      acc[categoria].total += parseFloat(t.valor)
      acc[categoria].quantidade += 1
      return acc
    }, {})
  
  return Object.values(gastosPorCategoria)
}

/**
 * Obter receitas por categoria
 */
export const getReceitasPorCategoria = async (mesReferencia) => {
  const transacoes = await getTransacoesPorMes(mesReferencia)
  
  const receitasPorCategoria = transacoes
    .filter(t => t.tipo === 'receita')
    .reduce((acc, t) => {
      const categoria = t.categoria
      if (!acc[categoria]) {
        acc[categoria] = {
          categoria,
          total: 0,
          quantidade: 0
        }
      }
      acc[categoria].total += parseFloat(t.valor)
      acc[categoria].quantidade += 1
      return acc
    }, {})
  
  return Object.values(receitasPorCategoria)
}

/**
 * Obter evolução mensal (últimos N meses)
 */
export const getEvolucaoMensal = async (meses = 6) => {
  const userId = await getUserId()
  const hoje = new Date()
  
  // Criar array de promessas para buscar todos os meses em paralelo
  const promises = Array.from({ length: meses }, (_, index) => {
    const i = meses - 1 - index
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    const mesRef = formatMesReferencia(data)
    
    return getTransacoesPorMes(mesRef).then(transacoes => {
      const receitas = transacoes
        .filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + parseFloat(t.valor), 0)
      
      const despesas = transacoes
        .filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + parseFloat(t.valor), 0)
      
      return {
        mes: data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        mesReferencia: mesRef,
        receitas,
        despesas,
        saldo: receitas - despesas
      }
    })
  })
  
  const resultado = await Promise.all(promises)
  
  return resultado
}

/**
 * Obter total de receitas de um mês
 */
export const getTotalReceitas = async (mesReferencia) => {
  const transacoes = await getTransacoesPorMes(mesReferencia)
  return transacoes
    .filter(t => t.tipo === 'receita')
    .reduce((sum, t) => sum + parseFloat(t.valor), 0)
}

/**
 * Obter total de despesas de um mês
 */
export const getTotalDespesas = async (mesReferencia) => {
  const transacoes = await getTransacoesPorMes(mesReferencia)
  return transacoes
    .filter(t => t.tipo === 'despesa')
    .reduce((sum, t) => sum + parseFloat(t.valor), 0)
}

/**
 * Obter categorias mais usadas
 */
export const getCategoriasMaisUsadas = async (tipo = 'despesa', limite = 10) => {
  const userId = await getUserId()
  
  const { data, error } = await supabase
    .from('transacoes')
    .select('categoria')
    .eq('user_id', userId)
    .eq('tipo', tipo)
  
  if (error) throw error
  
  const contagem = data.reduce((acc, t) => {
    acc[t.categoria] = (acc[t.categoria] || 0) + 1
    return acc
  }, {})
  
  return Object.entries(contagem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limite)
    .map(([categoria, quantidade]) => ({ categoria, quantidade }))
}

// ========== CARTÕES DE CRÉDITO ==========

/**
 * Calcular fatura de um cartão em um mês específico
 */
export const calcularFaturaCartao = async (cartaoId, mesReferencia) => {
  const { data, error } = await supabase.rpc('calcular_fatura_cartao', {
    p_cartao_id: cartaoId,
    p_mes_referencia: mesReferencia
  })
  
  if (error) {
    // Se a função RPC não existir, calcular manualmente
    const userId = await getUserId()
    const transacoes = await supabase
      .from('transacoes')
      .select('*')
      .eq('user_id', userId)
      .eq('cartao_credito_id', cartaoId)
      .eq('mes_referencia', mesReferencia)
      .eq('tipo', 'despesa')
    
    if (transacoes.error) throw transacoes.error
    
    const total = transacoes.data.reduce((sum, t) => sum + parseFloat(t.valor), 0)
    
    return {
      total_fatura: total,
      total_transacoes: transacoes.data.length,
      transacoes: transacoes.data.map(t => ({
        id: t.id,
        descricao: t.descricao,
        valor: t.valor,
        data: t.data_transacao,
        categoria: t.categoria,
        parcela: t.is_parcelado ? `${t.parcela_atual}/${t.total_parcelas}` : 'À vista'
      }))
    }
  }
  
  return data[0] || { total_fatura: 0, total_transacoes: 0, transacoes: [] }
}

/**
 * Pagar fatura do cartão
 */
export const pagarFaturaCartao = async ({
  cartaoId,
  mesReferencia,
  valorPago,
  dataPagamento,
  contaBancaria = null
}) => {
  const userId = await getUserId()
  
  const { data, error } = await supabase.rpc('pagar_fatura_cartao', {
    p_user_id: userId,
    p_cartao_id: cartaoId,
    p_mes_referencia: mesReferencia,
    p_valor_pago: valorPago,
    p_data_pagamento: dataPagamento,
    p_conta_bancaria: contaBancaria
  })
  
  if (error) throw error
  return data
}

/**
 * Obter todas as faturas de um cartão (histórico)
 */
export const getHistoricoFaturasCartao = async (cartaoId) => {
  const userId = await getUserId()
  
  const { data, error } = await supabase
    .from('transacoes')
    .select('mes_referencia, valor')
    .eq('user_id', userId)
    .eq('cartao_credito_id', cartaoId)
    .eq('tipo', 'despesa')
    .order('mes_referencia', { ascending: false })
  
  if (error) throw error
  
  // Agrupar por mês
  const faturasPorMes = data.reduce((acc, t) => {
    if (!acc[t.mes_referencia]) {
      acc[t.mes_referencia] = {
        mes: t.mes_referencia,
        total: 0,
        mesFormatado: new Date(t.mes_referencia + '-01').toLocaleDateString('pt-BR', {
          month: 'long',
          year: 'numeric'
        })
      }
    }
    acc[t.mes_referencia].total += parseFloat(t.valor)
    return acc
  }, {})
  
  return Object.values(faturasPorMes)
}
