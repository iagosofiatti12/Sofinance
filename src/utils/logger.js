/**
 * Sistema de logging production-safe
 * Em produção, os logs não são exibidos no console (evita expor informações sensíveis)
 */

const isDevelopment = import.meta.env.DEV

/**
 * Logger que só funciona em desenvolvimento
 */
const logger = {
  /**
   * Log de erro - importante para debugging
   * @param {string} message - Mensagem de erro
   * @param {...any} args - Argumentos adicionais
   */
  error: (message, ...args) => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, ...args)
    }
  },

  /**
   * Log de warning
   * @param {string} message - Mensagem de warning
   * @param {...any} args - Argumentos adicionais
   */
  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },

  /**
   * Log de informação
   * @param {string} message - Mensagem de info
   * @param {...any} args - Argumentos adicionais
   */
  info: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args)
    }
  },

  /**
   * Log de debug - muito verboso, só em dev
   * @param {string} message - Mensagem de debug
   * @param {...any} args - Argumentos adicionais
   */
  debug: (message, ...args) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  }
}

export default logger
