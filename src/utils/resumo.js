import { formatMesReferencia, parseISODateLocal } from './dates'

export const linhaParaResumo = (linha) => ({
  receitas: Number(linha?.total_receitas ?? 0),
  despesas: Number(linha?.total_despesas ?? 0),
  saldo: Number(linha?.saldo ?? 0),
})

export const ultimosMeses = (n, hoje = new Date()) =>
  Array.from({ length: n }, (_, i) => formatMesReferencia(new Date(hoje.getFullYear(), hoje.getMonth() - (n - 1 - i), 1)))

const rotuloMes = (mesRef) =>
  parseISODateLocal(`${mesRef}-01`).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

export const montarEvolucao = (linhas, mesesRef) =>
  mesesRef.map((mesReferencia) => ({
    mes: rotuloMes(mesReferencia),
    mesReferencia,
    ...linhaParaResumo(linhas.find((l) => l.mes_referencia === mesReferencia)),
  }))
