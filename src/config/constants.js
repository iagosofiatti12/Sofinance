// ====================================
// CONSTANTES DA APLICAÇÃO
// ====================================

// REMOVIDO: DEMO_USER_ID
// Agora usamos getUserId() do supabaseClient.js para pegar o user autenticado
// Isso garante segurança e funcionamento correto em produção

// Categorias
export const CATEGORIAS_CONTAS = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Seguros',
  'Outros'
]

export const CATEGORIAS_TRANSACOES = [
  'Compras',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Lazer',
  'Educação',
  'Viagem',
  'Outros'
]

export const BANDEIRAS_CARTAO = [
  'Visa',
  'Mastercard',
  'Elo',
  'American Express',
  'Hipercard'
]

// Validações
export const VALIDACAO = {
  DIA_MIN: 1,
  DIA_MAX: 31,
  VALOR_MIN: 0,
  PARCELAS_MIN: 1,
  PARCELAS_MAX: 48
}
