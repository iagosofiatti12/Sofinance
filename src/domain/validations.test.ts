import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { cartaoSchema, transacaoSchema, validateData } from './validations'
import { getErrorMessage } from '@/lib/errorHandler'

describe('validateData com Zod 4', () => {
  it('retorna a mensagem customizada de enum inválido', () => {
    const r = validateData(cartaoSchema, {
      nome: 'Nubank',
      bandeira: 'Diners',
      limite_total: 1000,
      dia_fechamento: 5,
      dia_vencimento: 15,
    })
    expect(r.success).toBe(false)
    expect(r.errors[0]).toEqual({ field: 'bandeira', message: 'Bandeira inválida' })
  })
  it('retorna mensagem de valor positivo', () => {
    const r = validateData(transacaoSchema, {
      tipo: 'despesa',
      categoria: 'Outros',
      descricao: 'Teste',
      valor: -5,
      data_transacao: '2026-09-17',
      metodo_pagamento: 'PIX',
    })
    expect(r.success).toBe(false)
    expect(r.errors[0].message).toBe('Valor deve ser positivo')
  })
  it('aceita dados válidos', () => {
    const r = validateData(cartaoSchema, {
      nome: 'Nubank',
      bandeira: 'Visa',
      limite_total: 1000,
      dia_fechamento: 5,
      dia_vencimento: 15,
    })
    expect(r.success).toBe(true)
    expect(r.data.nome).toBe('Nubank')
  })
})

describe('getErrorMessage', () => {
  it('lê a primeira issue de um ZodError', () => {
    const err = z.object({ n: z.number().positive('positivo!') }).safeParse({ n: -1 }).error
    expect(getErrorMessage(err)).toBe('positivo!')
  })
})
