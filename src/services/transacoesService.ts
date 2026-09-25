import { supabase } from '@/lib/supabase'
import { getCurrentUser } from './authService'
import { formatMesReferencia, formatarMesExtenso } from '@/domain/dates'
import { linhaParaResumo, montarEvolucao, ultimosMeses } from '@/domain/resumo'
import type { Resumo } from '@/domain/resumo'
import logger from '@/lib/logger'
import type { Database } from '@/types/database.types'

export { formatMesReferencia }

export type Transacao = Database['public']['Tables']['transacoes']['Row']
export type TransacaoInput = Database['public']['Tables']['transacoes']['Insert']

type FiltrosTransacoes = {
  mes_referencia?: string
  tipo?: string
  categoria?: string
  data_inicial?: string
  data_final?: string
}

// Helper para obter user_id
const getUserId = async (): Promise<string> => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Usuário não autenticado')
  return user.id
}

// ========== TRANSAÇÕES ==========

/**
 * Listar todas as transações do usuário
 */
export const getTransacoes = async (filtros: FiltrosTransacoes = {}): Promise<Transacao[]> => {
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
export const getTransacoesPorMes = async (mesReferencia: string): Promise<Transacao[]> => {
  return await getTransacoes({ mes_referencia: mesReferencia })
}

/**
 * Adicionar nova transação
 */
export const addTransacao = async (
  payload: Omit<TransacaoInput, 'user_id'>
): Promise<Transacao & { limiteAtualizado: boolean }> => {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('transacoes')
    .insert([{ user_id: userId, ...payload }])
    .select()

  if (error) throw error

  let limiteAtualizado = true
  if (payload.metodo_pagamento === 'Crédito' && payload.cartao_credito_id) {
    limiteAtualizado = await atualizarLimiteCartao(
      payload.cartao_credito_id,
      payload.valor,
      'aumentar'
    )
  }

  return { ...data[0], limiteAtualizado }
}

/**
 * Atualizar limite usado do cartão
 * @returns true em caso de sucesso, false se o cartão não foi encontrado ou houve erro
 */
const atualizarLimiteCartao = async (
  cartaoId: string,
  valor: number,
  operacao: 'aumentar' | 'diminuir' = 'aumentar'
): Promise<boolean> => {
  const { data: cartao, error: erroSelect } = await supabase
    .from('cartoes_credito')
    .select('limite_usado')
    .eq('id', cartaoId)
    .single()

  if (erroSelect) {
    logger.error('Erro ao atualizar limite do cartão:', erroSelect)
    return false
  }

  if (!cartao) return false

  const novoLimite =
    operacao === 'aumentar'
      ? parseFloat(String(cartao.limite_usado)) + parseFloat(String(valor))
      : Math.max(0, parseFloat(String(cartao.limite_usado)) - parseFloat(String(valor)))

  const { error: erroUpdate } = await supabase
    .from('cartoes_credito')
    .update({ limite_usado: novoLimite })
    .eq('id', cartaoId)

  if (erroUpdate) {
    logger.error('Erro ao atualizar limite do cartão:', erroUpdate)
    return false
  }

  return true
}

/**
 * Atualizar transação
 */
export const updateTransacao = async (
  id: string,
  payload: Partial<Omit<TransacaoInput, 'user_id'>>
): Promise<Transacao & { limiteAtualizado: boolean }> => {
  const { data: atual, error: erroAtual } = await supabase
    .from('transacoes')
    .select('*')
    .eq('id', id)
    .single()

  if (erroAtual) throw erroAtual
  if (atual.is_parcelado) throw new Error('Transações parceladas não podem ser editadas')

  const { data, error } = await supabase
    .from('transacoes')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()

  if (error) throw error
  if (!data || data.length === 0) throw new Error('Transação não encontrada')

  let limiteAtualizado = true
  if (atual.metodo_pagamento === 'Crédito' && atual.cartao_credito_id) {
    const ok = await atualizarLimiteCartao(atual.cartao_credito_id, atual.valor, 'diminuir')
    limiteAtualizado = limiteAtualizado && ok
  }
  if (payload.metodo_pagamento === 'Crédito' && payload.cartao_credito_id) {
    const ok = await atualizarLimiteCartao(
      payload.cartao_credito_id,
      payload.valor as number,
      'aumentar'
    )
    limiteAtualizado = limiteAtualizado && ok
  }

  return { ...data[0], limiteAtualizado }
}

/**
 * Deletar transação
 */
export const deleteTransacao = async (id: string): Promise<{ limiteAtualizado: boolean }> => {
  const { data: atual, error: erroAtual } = await supabase
    .from('transacoes')
    .select('*')
    .eq('id', id)
    .single()

  if (erroAtual) throw erroAtual

  const { data, error } = await supabase.from('transacoes').delete().eq('id', id).select()

  if (error) throw error
  if (!data || data.length === 0) throw new Error('Transação não encontrada')

  let limiteAtualizado = true
  if (atual.metodo_pagamento === 'Crédito' && atual.cartao_credito_id && !atual.is_parcelado) {
    limiteAtualizado = await atualizarLimiteCartao(atual.cartao_credito_id, atual.valor, 'diminuir')
  }

  return { limiteAtualizado }
}

// ========== RESUMOS E ESTATÍSTICAS ==========

/**
 * Obter resumo mensal
 */
export const getResumoMensal = async (mesReferencia: string): Promise<Resumo> => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('resumo_mensal')
    .select('total_receitas, total_despesas, saldo')
    .eq('user_id', userId)
    .eq('mes_referencia', mesReferencia)
    .maybeSingle()
  if (error) throw error
  return linhaParaResumo(data)
}

type CategoriaResumo = { categoria: string; total: number; quantidade: number }

/**
 * Obter gastos por categoria
 */
export const getGastosPorCategoria = async (mesReferencia: string): Promise<CategoriaResumo[]> => {
  const transacoes = await getTransacoesPorMes(mesReferencia)

  const gastosPorCategoria = transacoes
    .filter(t => t.tipo === 'despesa')
    .reduce<Record<string, CategoriaResumo>>((acc, t) => {
      const categoria = t.categoria
      if (!acc[categoria]) {
        acc[categoria] = {
          categoria,
          total: 0,
          quantidade: 0,
        }
      }
      acc[categoria].total += parseFloat(String(t.valor))
      acc[categoria].quantidade += 1
      return acc
    }, {})

  return Object.values(gastosPorCategoria)
}

/**
 * Obter receitas por categoria
 */
export const getReceitasPorCategoria = async (
  mesReferencia: string
): Promise<CategoriaResumo[]> => {
  const transacoes = await getTransacoesPorMes(mesReferencia)

  const receitasPorCategoria = transacoes
    .filter(t => t.tipo === 'receita')
    .reduce<Record<string, CategoriaResumo>>((acc, t) => {
      const categoria = t.categoria
      if (!acc[categoria]) {
        acc[categoria] = {
          categoria,
          total: 0,
          quantidade: 0,
        }
      }
      acc[categoria].total += parseFloat(String(t.valor))
      acc[categoria].quantidade += 1
      return acc
    }, {})

  return Object.values(receitasPorCategoria)
}

/**
 * Obter evolução mensal (últimos N meses)
 */
export const getEvolucaoMensal = async (meses = 6): Promise<ReturnType<typeof montarEvolucao>> => {
  const userId = await getUserId()
  const mesesRef = ultimosMeses(meses)
  const { data, error } = await supabase
    .from('resumo_mensal')
    .select('mes_referencia, total_receitas, total_despesas, saldo')
    .eq('user_id', userId)
    .in('mes_referencia', mesesRef)
  if (error) throw error
  // A view retorna colunas nullable como `null`; LinhaResumo (domain) espera `undefined`.
  // Conversão pura de forma, sem efeito no valor: `??` em linhaParaResumo trata os dois igual,
  // e a comparação por mes_referencia em montarEvolucao não depende dessa diferença.
  const linhas = (data || []).map(linha => ({
    mes_referencia: linha.mes_referencia ?? undefined,
    total_receitas: linha.total_receitas,
    total_despesas: linha.total_despesas,
    saldo: linha.saldo,
  }))
  return montarEvolucao(linhas, mesesRef)
}

/**
 * Obter categorias mais usadas
 */
export const getCategoriasMaisUsadas = async (
  tipo = 'despesa',
  limite = 10
): Promise<{ categoria: string; quantidade: number }[]> => {
  const userId = await getUserId()

  const { data, error } = await supabase
    .from('transacoes')
    .select('categoria')
    .eq('user_id', userId)
    .eq('tipo', tipo)

  if (error) throw error

  const contagem = data.reduce<Record<string, number>>((acc, t) => {
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
export const calcularFaturaCartao = async (cartaoId: string, mesReferencia: string) => {
  const userId = await getUserId()
  const transacoes = await supabase
    .from('transacoes')
    .select('*')
    .eq('user_id', userId)
    .eq('cartao_credito_id', cartaoId)
    .eq('mes_referencia', mesReferencia)
    .eq('tipo', 'despesa')

  if (transacoes.error) throw transacoes.error

  const total = transacoes.data.reduce((sum, t) => sum + parseFloat(String(t.valor)), 0)

  return {
    total_fatura: total,
    total_transacoes: transacoes.data.length,
    transacoes: transacoes.data.map(t => ({
      id: t.id,
      descricao: t.descricao,
      valor: t.valor,
      data: t.data_transacao,
      categoria: t.categoria,
      parcela: t.is_parcelado ? `${t.parcela_atual}/${t.total_parcelas}` : 'À vista',
    })),
  }
}

/**
 * Obter todas as faturas de um cartão (histórico)
 */
export const getHistoricoFaturasCartao = async (cartaoId: string) => {
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
  type FaturaMes = { mes: string; total: number; mesFormatado: string }
  const faturasPorMes = data.reduce<Record<string, FaturaMes>>((acc, t) => {
    if (!acc[t.mes_referencia]) {
      acc[t.mes_referencia] = {
        mes: t.mes_referencia,
        total: 0,
        mesFormatado: formatarMesExtenso(t.mes_referencia),
      }
    }
    acc[t.mes_referencia].total += parseFloat(String(t.valor))
    return acc
  }, {})

  return Object.values(faturasPorMes)
}
