import { describe, it, expect } from 'vitest'
import { formatCurrency, parseCurrency } from './currency'

describe('currency', () => {
  it('formata centavos digitados como moeda pt-BR', () => {
    expect(formatCurrency('123456')).toBe('R$ 1.234,56')
  })
  it('converte texto formatado em número', () => {
    expect(parseCurrency('R$ 1.234,56')).toBe(1234.56)
  })

  // Regressao: as telas passam parseFloat(valor) * 100, e essa multiplicacao nem sempre
  // fecha em inteiro. Antes do arredondamento, 19.90 chegava aqui como
  // 1989.9999999999998 e a tela mostrava R$ 199.000.000.000.000,00.
  it('nao explode com valores que o ponto flutuante suja', () => {
    expect(formatCurrency(parseFloat('19.90') * 100)).toBe('R$ 19,90')
    expect(formatCurrency(parseFloat('4.90') * 100)).toBe('R$ 4,90')
    expect(formatCurrency(parseFloat('130.89') * 100)).toBe('R$ 130,89')
    expect(formatCurrency(parseFloat('0.07') * 100)).toBe('R$ 0,07')
  })

  // O arredondamento nao pode ter mexido no caminho de string, que e o que o campo
  // digita, nem nos casos de borda que ja existiam.
  it('preserva o comportamento anterior nos demais casos', () => {
    expect(formatCurrency('1990')).toBe('R$ 19,90')
    expect(formatCurrency(10000)).toBe('R$ 100,00')
    expect(formatCurrency('')).toBe('R$ 0,00')
    expect(formatCurrency(0)).toBe('R$ 0,00')
  })
})
