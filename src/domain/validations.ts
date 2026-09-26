import { z } from 'zod'

/**
 * Schemas de validação usando Zod
 * Garante que dados inválidos não sejam enviados ao banco
 */

// Validação para Contas Fixas
export const contaFixaSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  valor: z
    .number()
    .positive('Valor deve ser positivo')
    .max(1000000, 'Valor máximo permitido: R$ 1.000.000'),
  dia_vencimento: z
    .number()
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia mínimo: 1')
    .max(31, 'Dia máximo: 31'),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  ativa: z.boolean().optional(),
})

// Validação para Transações
export const transacaoSchema = z.object({
  tipo: z.enum(['receita', 'despesa'], { error: 'Tipo deve ser receita ou despesa' }),
  categoria: z.string().min(1, 'Categoria é obrigatória'),
  descricao: z
    .string()
    .min(3, 'Descrição deve ter no mínimo 3 caracteres')
    .max(200, 'Descrição deve ter no máximo 200 caracteres'),
  valor: z
    .number()
    .positive('Valor deve ser positivo')
    .max(10000000, 'Valor máximo permitido: R$ 10.000.000'),
  data_transacao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  metodo_pagamento: z.enum(['PIX', 'Dinheiro', 'Débito', 'Crédito', 'Transferência'], {
    error: 'Método de pagamento inválido',
  }),
  conta_bancaria: z.string().max(100).optional(),
  observacoes: z.string().max(500).optional(),
})

// Validação para Cartões de Crédito
export const cartaoSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  bandeira: z.enum(['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard'], {
    error: 'Bandeira inválida',
  }),
  limite_total: z
    .number()
    .positive('Limite deve ser positivo')
    .max(1000000, 'Limite máximo: R$ 1.000.000'),
  dia_fechamento: z
    .number()
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia mínimo: 1')
    .max(31, 'Dia máximo: 31'),
  dia_vencimento: z
    .number()
    .int('Dia deve ser um número inteiro')
    .min(1, 'Dia mínimo: 1')
    .max(31, 'Dia máximo: 31'),
})

// Validação para Metas
export const metaSchema = z.object({
  nome: z
    .string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(150, 'Nome deve ter no máximo 150 caracteres'),
  valor_meta: z
    .number()
    .positive('Valor da meta deve ser positivo')
    .max(100000000, 'Valor máximo: R$ 100.000.000'),
  valor_guardado: z
    .number()
    .min(0, 'Valor guardado não pode ser negativo')
    .max(100000000, 'Valor máximo: R$ 100.000.000'),
  prazo_meses: z
    .number()
    .int('Prazo deve ser um número inteiro')
    .min(1, 'Prazo mínimo: 1 mês')
    .max(600, 'Prazo máximo: 600 meses')
    .optional()
    .nullable(),
})

// Validação para Financiamento de Imóvel
export const financiamentoImovelSchema = z.object({
  valor_total: z
    .number()
    .positive('Valor total deve ser positivo')
    .max(100000000, 'Valor máximo: R$ 100.000.000'),
  valor_financiado: z
    .number()
    .positive('Valor financiado deve ser positivo')
    .max(100000000, 'Valor máximo: R$ 100.000.000'),
  taxa_juros: z
    .number()
    .min(0, 'Taxa de juros não pode ser negativa')
    .max(100, 'Taxa máxima: 100%'),
  num_parcelas: z
    .number()
    .int('Número de parcelas deve ser inteiro')
    .min(1, 'Mínimo: 1 parcela')
    .max(600, 'Máximo: 600 parcelas'),
  parcela_valor: z.number().positive('Valor da parcela deve ser positivo'),
  parcelas_pagas: z.number().int('Parcelas pagas deve ser inteiro').min(0, 'Não pode ser negativo'),
  taxa_obra: z.number().min(0, 'Taxa não pode ser negativa').optional(),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
})

// Validação para Financiamento de Carro
export const financiamentoCarroSchema = z.object({
  modelo_carro: z
    .string()
    .min(2, 'Modelo do carro deve ter no mínimo 2 caracteres')
    .max(100, 'Modelo deve ter no máximo 100 caracteres'),
  valor_total: z
    .number()
    .positive('Valor total deve ser positivo')
    .max(10000000, 'Valor máximo: R$ 10.000.000'),
  valor_entrada: z
    .number()
    .min(0, 'Entrada não pode ser negativa')
    .max(10000000, 'Valor máximo: R$ 10.000.000'),
  valor_financiado: z
    .number()
    .positive('Valor financiado deve ser positivo')
    .max(10000000, 'Valor máximo: R$ 10.000.000'),
  taxa_juros: z
    .number()
    .min(0, 'Taxa de juros não pode ser negativa')
    .max(100, 'Taxa máxima: 100%'),
  num_parcelas: z
    .number()
    .int('Número de parcelas deve ser inteiro')
    .min(1, 'Mínimo: 1 parcela')
    .max(120, 'Máximo: 120 parcelas'),
  parcela_valor: z.number().positive('Valor da parcela deve ser positivo'),
  parcelas_pagas: z.number().int('Parcelas pagas deve ser inteiro').min(0, 'Não pode ser negativo'),
  data_inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
})

export type ValidationError = { field: string; message: string }

/**
 * Forma pública "achatada" (success/data/errors sempre presentes no tipo).
 * Em runtime o objeto retornado só tem um dos dois (`data` OU `errors`) —
 * exatamente como no JS original. A forma discriminada correta seria
 * `{ success: true; data: T } | { success: false; errors: ValidationError[] }`,
 * mas o teste pré-existente (validations.test.ts) lê `r.data` e `r.errors`
 * sem antes estreitar por `r.success`, e a Task 7 proíbe alterar o teste além
 * do caminho do import. Por isso o tipo público expõe os dois campos como
 * obrigatórios; ver a asserção documentada em `validateData` abaixo.
 */
export type ValidationResult<T> = {
  success: boolean
  data: T
  errors: ValidationError[]
}

/**
 * Função helper para validar e retornar erros formatados
 */
export const validateData = <Schema extends z.ZodType>(
  schema: Schema,
  data: unknown
): ValidationResult<z.infer<Schema>> => {
  const result = schema.safeParse(data)
  if (result.success) {
    // Asserção necessária: o objeto real só tem `success`+`data` (sem `errors`),
    // mas o tipo público declara os dois campos como obrigatórios (ver acima).
    // Isso não muda nada em tempo de execução — `as` só afasta o checador de
    // tipos, o objeto retornado continua com as mesmas duas chaves de sempre.
    return { success: true, data: result.data } as ValidationResult<z.infer<Schema>>
  }
  return {
    success: false,
    errors: result.error.issues.map(err => ({ field: err.path.join('.'), message: err.message })),
  } as ValidationResult<z.infer<Schema>>
}

/**
 * Função para pegar mensagem de erro amigável
 */
export const getValidationErrorMessage = (errors: ValidationError[] | null | undefined): string => {
  const primeiro = errors?.[0]
  if (!primeiro) return 'Erro de validação'
  return primeiro.message
}
