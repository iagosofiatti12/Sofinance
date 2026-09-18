import { describe, it, expect } from 'vitest'
import { montarEvolucao, linhaParaResumo, ultimosMeses } from './resumo'

describe('resumo', () => {
  it('linhaParaResumo converte strings numéricas e trata null', () => {
    expect(linhaParaResumo({ total_receitas: '1000.50', total_despesas: '200', saldo: '800.50' }))
      .toEqual({ receitas: 1000.5, despesas: 200, saldo: 800.5 })
    expect(linhaParaResumo(null)).toEqual({ receitas: 0, despesas: 0, saldo: 0 })
  })
  it('ultimosMeses gera N meses terminando no atual', () => {
    expect(ultimosMeses(3, new Date(2026, 0, 15))).toEqual(['2025-11', '2025-12', '2026-01'])
  })
  it('montarEvolucao preenche meses sem dados com zero', () => {
    const linhas = [{ mes_referencia: '2026-01', total_receitas: '10', total_despesas: '4', saldo: '6' }]
    const r = montarEvolucao(linhas, ['2025-12', '2026-01'])
    expect(r).toEqual([
      { mes: 'dez. de 25', mesReferencia: '2025-12', receitas: 0, despesas: 0, saldo: 0 },
      { mes: 'jan. de 26', mesReferencia: '2026-01', receitas: 10, despesas: 4, saldo: 6 },
    ])
  })
})
