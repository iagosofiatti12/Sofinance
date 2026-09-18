import { describe, it, expect } from 'vitest'
import { montarPayloadTransacao } from './transacaoPayload'

describe('montarPayloadTransacao', () => {
  it('remove campos de formulário e normaliza cartão vazio', () => {
    const p = montarPayloadTransacao({
      tipo: 'despesa', categoria: 'Compras', descricao: 'Mercado', valor: 85.9,
      data_transacao: '2026-09-17', conta_bancaria: 'Nubank', metodo_pagamento: 'PIX',
      cartao_credito_id: '', num_parcelas: 3, observacoes: '',
    })
    expect(p).toEqual({
      tipo: 'despesa', categoria: 'Compras', descricao: 'Mercado', valor: 85.9,
      data_transacao: '2026-09-17', mes_referencia: '2026-09', conta_bancaria: 'Nubank',
      metodo_pagamento: 'PIX', cartao_credito_id: null, observacoes: null,
    })
    expect('num_parcelas' in p).toBe(false)
  })
  it('mantém o cartão quando o método é Crédito', () => {
    const p = montarPayloadTransacao({
      tipo: 'despesa', categoria: 'Lazer', descricao: 'Cinema', valor: 40,
      data_transacao: '2026-09-17', metodo_pagamento: 'Crédito', cartao_credito_id: 'abc',
    })
    expect(p.cartao_credito_id).toBe('abc')
    expect(p.conta_bancaria).toBeNull()
  })
})
