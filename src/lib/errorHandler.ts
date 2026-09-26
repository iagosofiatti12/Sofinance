/**
 * Utilitário para tratamento de erros
 * Converte erros técnicos em mensagens amigáveis para o usuário
 */

import logger from './logger'

/**
 * Forma mínima e não garantida de um erro capturado em runtime (Error nativo,
 * PostgrestError do Supabase, ZodError ou qualquer valor lançado com `throw`).
 * Usada apenas para o duck-typing que este módulo já fazia em JS.
 */
type ErrorLike = {
  name?: string
  issues?: Array<{ message?: string }>
  code?: string | number
  message?: string
  details?: unknown
}

/**
 * Mapeia códigos de erro do Supabase para mensagens amigáveis
 */
const SUPABASE_ERROR_MESSAGES: Record<string, string> = {
  // Auth errors
  invalid_credentials: 'Email ou senha incorretos',
  email_not_confirmed: 'Por favor, confirme seu email',
  user_not_found: 'Usuário não encontrado',
  user_already_registered: 'Este email já está cadastrado',
  weak_password: 'Senha muito fraca. Use no mínimo 8 caracteres',

  // Database errors
  PGRST116: 'Nenhum registro encontrado',
  23505: 'Este registro já existe',
  23503: 'Não é possível excluir - existem registros relacionados',
  42501: 'Você não tem permissão para esta ação',

  // RLS errors
  'row-level security': 'Acesso negado. Faça login novamente',
  'permission denied': 'Você não tem permissão para esta ação',

  // Network errors
  fetch: 'Erro de conexão. Verifique sua internet',
  network: 'Erro de conexão. Verifique sua internet',
  timeout: 'A requisição demorou muito. Tente novamente',

  // Validation errors
  validation: 'Dados inválidos. Verifique os campos',
  required: 'Preencha todos os campos obrigatórios',
}

/**
 * Retorna mensagem de erro amigável baseada no erro do Supabase
 * @param error - Erro do Supabase ou genérico (forma não garantida em runtime)
 * @returns Mensagem amigável
 */
export const getErrorMessage = (error: unknown): string => {
  if (!error) return 'Ocorreu um erro desconhecido'

  const err = error as ErrorLike

  // Erro de validação Zod (já vem formatado)
  if (err.name === 'ZodError' || Array.isArray(err.issues)) {
    return err.issues?.[0]?.message || 'Dados inválidos'
  }

  // Erro do Supabase
  if (err.code) {
    const message = SUPABASE_ERROR_MESSAGES[err.code]
    if (message) return message
  }

  // Erro com mensagem personalizada
  if (err.message) {
    const msg = err.message.toLowerCase()

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
      return err.message
    }
  }

  // Fallback genérico
  return 'Ocorreu um erro. Tente novamente'
}

/**
 * Log de erro para debugging (só em desenvolvimento)
 */
export const logError = (context: string, error: unknown): void => {
  if (import.meta.env.DEV) {
    const err = error as ErrorLike | null | undefined
    logger.error(`❌ Erro: ${context}`)
    logger.error('Error object:', error)
    logger.error('Message:', err?.message)
    logger.error('Code:', err?.code)
    logger.error('Details:', err?.details)
  }
}

/**
 * Wrapper para tratamento consistente de erros assíncronos
 * @param asyncFn - Função assíncrona
 * @param context - Contexto da operação (para logging)
 * @returns Resultado ou erro tratado
 */
export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context: string = 'Operação'
): Promise<T> => {
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
export const checkAuth = (user: unknown): void => {
  if (!user) {
    throw new Error('Você precisa estar logado para realizar esta ação')
  }
}

export default {
  getErrorMessage,
  logError,
  handleAsyncError,
  checkAuth,
}
