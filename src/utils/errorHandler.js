/**
 * Utilitário para tratamento de erros
 * Converte erros técnicos em mensagens amigáveis para o usuário
 */

import logger from './logger'

/**
 * Mapeia códigos de erro do Supabase para mensagens amigáveis
 */
const SUPABASE_ERROR_MESSAGES = {
  // Auth errors
  'invalid_credentials': 'Email ou senha incorretos',
  'email_not_confirmed': 'Por favor, confirme seu email',
  'user_not_found': 'Usuário não encontrado',
  'user_already_registered': 'Este email já está cadastrado',
  'weak_password': 'Senha muito fraca. Use no mínimo 6 caracteres',
  
  // Database errors
  'PGRST116': 'Nenhum registro encontrado',
  '23505': 'Este registro já existe',
  '23503': 'Não é possível excluir - existem registros relacionados',
  '42501': 'Você não tem permissão para esta ação',
  
  // RLS errors  
  'row-level security': 'Acesso negado. Faça login novamente',
  'permission denied': 'Você não tem permissão para esta ação',
  
  // Network errors
  'fetch': 'Erro de conexão. Verifique sua internet',
  'network': 'Erro de conexão. Verifique sua internet',
  'timeout': 'A requisição demorou muito. Tente novamente',
  
  // Validation errors
  'validation': 'Dados inválidos. Verifique os campos',
  'required': 'Preencha todos os campos obrigatórios'
}

/**
 * Retorna mensagem de erro amigável baseada no erro do Supabase
 * @param {Error} error - Erro do Supabase ou genérico
 * @returns {string} Mensagem amigável
 */
export const getErrorMessage = (error) => {
  if (!error) return 'Ocorreu um erro desconhecido'
  
  // Erro de validação Zod (já vem formatado)
  if (error.name === 'ZodError') {
    return error.errors[0]?.message || 'Dados inválidos'
  }
  
  // Erro do Supabase
  if (error.code) {
    const message = SUPABASE_ERROR_MESSAGES[error.code]
    if (message) return message
  }
  
  // Erro com mensagem personalizada
  if (error.message) {
    const msg = error.message.toLowerCase()
    
    // Procurar por palavras-chave na mensagem
    for (const [key, value] of Object.entries(SUPABASE_ERROR_MESSAGES)) {
      if (msg.includes(key.toLowerCase())) {
        return value
      }
    }
    
    // Se a mensagem for técnica demais, generalizar
    if (msg.includes('sql') || msg.includes('postgres') || msg.includes('database')) {
      return 'Erro ao processar dados. Tente novamente'
    }
    
    // Retornar mensagem original se for compreensível
    if (msg.length < 100) {
      return error.message
    }
  }
  
  // Fallback genérico
  return 'Ocorreu um erro. Tente novamente'
}

/**
 * Log de erro para debugging (só em desenvolvimento)
 */
export const logError = (context, error) => {
  if (import.meta.env.DEV) {
    logger.error(`❌ Erro: ${context}`)
    logger.error('Error object:', error)
    logger.error('Message:', error?.message)
    logger.error('Code:', error?.code)
    logger.error('Details:', error?.details)
  }
}

/**
 * Wrapper para tratamento consistente de erros assíncronos
 * @param {Function} asyncFn - Função assíncrona
 * @param {string} context - Contexto da operação (para logging)
 * @returns {Promise} Resultado ou erro tratado
 */
export const handleAsyncError = async (asyncFn, context = 'Operação') => {
  try {
    return await asyncFn()
  } catch (error) {
    logError(context, error)
    throw new Error(getErrorMessage(error))
  }
}

/**
 * Verifica se usuário está autenticado e retorna erro amigável
 */
export const checkAuth = (user) => {
  if (!user) {
    throw new Error('Você precisa estar logado para realizar esta ação')
  }
}

export default {
  getErrorMessage,
  logError,
  handleAsyncError,
  checkAuth
}
