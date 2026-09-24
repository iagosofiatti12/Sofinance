import { describe, it, expect } from 'vitest'
import { diasAteVencimento, proximosVencimentos } from './vencimentos'

describe('diasAteVencimento', () => {
  it('mesmo mês, ainda não venceu', () => {
    expect(diasAteVencimento(20, new Date(2026, 8, 17))).toBe(3)
  })
  it('vence hoje', () => {
    expect(diasAteVencimento(17, new Date(2026, 8, 17))).toBe(0)
  })
  it('já passou: vai para o mês seguinte', () => {
    expect(diasAteVencimento(5, new Date(2026, 8, 17))).toBe(18)
  })
  it('dia 31 em mês de 30 dias cai no último dia', () => {
    expect(diasAteVencimento(31, new Date(2026, 8, 29))).toBe(1)
  })
  it('dezembro para janeiro', () => {
    expect(diasAteVencimento(2, new Date(2026, 11, 30))).toBe(3)
  })
  it('dia de vencimento inválido vai para o fim (Infinity)', () => {
    expect(diasAteVencimento(undefined, new Date(2026, 8, 17))).toBe(Infinity)
  })
})

describe('proximosVencimentos', () => {
  it('ignora inativas, ordena e limita', () => {
    const contas = [
      { id: 1, nome: 'Luz', dia_vencimento: 25, ativa: true },
      { id: 2, nome: 'Aluguel', dia_vencimento: 5, ativa: true },
      { id: 3, nome: 'Academia', dia_vencimento: 18, ativa: false },
      { id: 4, nome: 'Internet', dia_vencimento: 18, ativa: true },
    ]
    const r = proximosVencimentos(contas, new Date(2026, 8, 17), 2)
    expect(r.map(c => c.nome)).toEqual(['Internet', 'Luz'])
    expect(r[0].diasRestantes).toBe(1)
  })
  it('conta com dia_vencimento inválido vai depois das válidas', () => {
    const contas = [
      { id: 1, nome: 'Sem dia', dia_vencimento: null, ativa: true },
      { id: 2, nome: 'Aluguel', dia_vencimento: 5, ativa: true },
    ]
    const r = proximosVencimentos(contas, new Date(2026, 8, 17), 5)
    expect(r.map(c => c.nome)).toEqual(['Aluguel', 'Sem dia'])
  })
})
