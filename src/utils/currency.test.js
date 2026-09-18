import { describe, it, expect } from 'vitest'
import { formatCurrency, parseCurrency } from './currency'

describe('currency', () => {
  it('formata centavos digitados como moeda pt-BR', () => {
    expect(formatCurrency('123456')).toBe('R$ 1.234,56')
  })
  it('converte texto formatado em número', () => {
    expect(parseCurrency('R$ 1.234,56')).toBe(1234.56)
  })
})
