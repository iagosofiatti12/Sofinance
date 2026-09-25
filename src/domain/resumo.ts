import { formatMesReferencia, parseISODateLocal } from './dates'

export type LinhaResumo = {
  mes_referencia?: string
  total_receitas?: string | number | null
  total_despesas?: string | number | null
  saldo?: string | number | null
}

export type Resumo = { receitas: number; despesas: number; saldo: number }

export const linhaParaResumo = (linha: LinhaResumo | null | undefined): Resumo => ({
  receitas: Number(linha?.total_receitas ?? 0),
  despesas: Number(linha?.total_despesas ?? 0),
  saldo: Number(linha?.saldo ?? 0),
})

export const ultimosMeses = (n: number, hoje: Date = new Date()): string[] =>
  Array.from({ length: n }, (_, i) =>
    formatMesReferencia(new Date(hoje.getFullYear(), hoje.getMonth() - (n - 1 - i), 1))
  )

const rotuloMes = (mesRef: string): string =>
  parseISODateLocal(`${mesRef}-01`).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

export const montarEvolucao = (
  linhas: LinhaResumo[],
  mesesRef: string[]
): (Resumo & { mes: string; mesReferencia: string })[] =>
  mesesRef.map(mesReferencia => ({
    mes: rotuloMes(mesReferencia),
    mesReferencia,
    ...linhaParaResumo(linhas.find(l => l.mes_referencia === mesReferencia)),
  }))
