import { z } from 'zod'

/**
 * Schemas de validação usando Zod
 * Garante que dados inválidos não sejam enviados ao banco
 */

// Validação para Contas Fixas
export const contaFixaSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  valor: z.number()
    .positive('Valor deve ser positivo')
    .max(1000000, 'Valor máximo permitido: R$ 1.000.000'),
  dia_vencimento: z.number()
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia mínimo: 1')
    .max(31, 'Dia máximo: 31'),
  categoria: z.string()
    .min(1, 'Categoria é obrigatória'),
  ativa: z.boolean().optional()
})

// Validação para Transações
export const transacaoSchema = z.object({
  tipo: z.enum(['receita', 'despesa'], {
    errorMap: () => ({ message: 'Tipo deve ser receita ou despesa' })
  }),
  categoria: z.string()
    .min(1, 'Categoria é obrigatória'),
  descricao: z.string()
    .min(3, 'Descrição deve ter no mínimo 3 caracteres')
    .max(200, 'Descrição deve ter no máximo 200 caracteres'),
  valor: z.number()
    .positive('Valor deve ser positivo')
    .max(10000000, 'Valor máximo permitido: R$ 10.000.000'),
  data_transacao: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  metodo_pagamento: z.enum(['PIX', 'Dinheiro', 'Débito', 'Crédito', 'Transferência'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' })
  }),
  conta_bancaria: z.string().max(100).optional(),
  observacoes: z.string().max(500).optional()
})

// Validação para Cartões de Crédito
export const cartaoSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  bandeira: z.enum(['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard'], {
    errorMap: () => ({ message: 'Bandeira inválida' })
  }),
  limite_total: z.number()
    .positive('Limite deve ser positivo')
    .max(1000000, 'Limite máximo: R$ 1.000.000'),
  dia_fechamento: z.number()
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia mínimo: 1')
    .max(31, 'Dia máximo: 31'),
  dia_vencimento: z.number()
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia mínimo: 1')
    .max(31, 'Dia máximo: 31')
})

// Validação para Metas
export const metaSchema = z.object({
  nome: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(150, 'Nome deve ter no máximo 150 caracteres'),
  valor_meta: z.number()
    .positive('Valor da meta deve ser positivo')
    .max(100000000, 'Valor máximo: R$ 100.000.000'),
  valor_guardado: z.number()
    .min(0, 'Valor guardado não pode ser negativo')
    .max(100000000, 'Valor máximo: R$ 100.000.000'),
  prazo_meses: z.number()
    .int('Prazo deve ser um número inteiro')
    .min(1, 'Prazo mínimo: 1 mês')
    .max(600, 'Prazo máximo: 600 meses')
    .optional()
    .nullable()
})

// Validação para Financiamento de Imóvel
export const financiamentoImovelSchema = z.object({
  valor_total: z.number()
    .positive('Valor total deve ser positivo')
    .max(100000000, 'Valor máximo: R$ 100.000.000'),
  valor_financiado: z.number()
    .positive('Valor financiado deve ser positivo')
    .max(100000000, 'Valor máximo: R$ 100.000.000'),
  taxa_juros: z.number()
    .min(0, 'Taxa de juros não pode ser negativa')
    .max(100, 'Taxa máxima: 100%'),
  num_parcelas: z.number()
    .int('Número de parcelas deve ser inteiro')
    .min(1, 'Mínimo: 1 parcela')
    .max(600, 'Máximo: 600 parcelas'),
  parcela_valor: z.number()
    .positive('Valor da parcela deve ser positivo'),
  parcelas_pagas: z.number()
    .int('Parcelas pagas deve ser inteiro')
    .min(0, 'Não pode ser negativo'),
  taxa_obra: z.number()
    .min(0, 'Taxa não pode ser negativa')
    .optional(),
  data_inicio: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
})

// Validação para Financiamento de Carro
export const financiamentoCarroSchema = z.object({
  modelo_carro: z.string()
    .min(2, 'Modelo do carro deve ter no mínimo 2 caracteres')
    .max(100, 'Modelo deve ter no máximo 100 caracteres'),
  valor_total: z.number()
    .positive('Valor total deve ser positivo')
    .max(10000000, 'Valor máximo: R$ 10.000.000'),
  valor_entrada: z.number()
    .min(0, 'Entrada não pode ser negativa')
    .max(10000000, 'Valor máximo: R$ 10.000.000'),
  valor_financiado: z.number()
    .positive('Valor financiado deve ser positivo')
    .max(10000000, 'Valor máximo: R$ 10.000.000'),
  taxa_juros: z.number()
    .min(0, 'Taxa de juros não pode ser negativa')
    .max(100, 'Taxa máxima: 100%'),
  num_parcelas: z.number()
    .int('Número de parcelas deve ser inteiro')
    .min(1, 'Mínimo: 1 parcela')
    .max(120, 'Máximo: 120 parcelas'),
  parcela_valor: z.number()
    .positive('Valor da parcela deve ser positivo'),
  parcelas_pagas: z.number()
    .int('Parcelas pagas deve ser inteiro')
    .min(0, 'Não pode ser negativo'),
  data_inicio: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
})

/**
 * Função helper para validar e retornar erros formatados
 */
export const validateData = (schema, data) => {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }))
      return { success: false, errors }
    }
    return { success: false, errors: [{ message: 'Erro de validação desconhecido' }] }
  }
}

/**
 * Função para pegar mensagem de erro amigável
 */
export const getValidationErrorMessage = (errors) => {
  if (!errors || errors.length === 0) return 'Erro de validação'
  return errors[0].message
}
