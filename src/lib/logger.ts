/**
 * Sistema de logging production-safe
 * Em produção, os logs não são exibidos no console (evita expor informações sensíveis)
 */

import * as Sentry from '@sentry/react'

const isDevelopment = import.meta.env.DEV

/**
 * Logger que só funciona em desenvolvimento
 */
const logger = {
  /**
   * Log de erro - importante para debugging
   */
  error: (message: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, ...args)
    }
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.captureMessage(message, { level: 'error', extra: { args } })
    }
  },

  /**
   * Log de warning
   */
  warn: (message: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args)
    }
  },

  /**
   * Log de informação
   */
  info: (message: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args)
    }
  },

  /**
   * Log de debug - muito verboso, só em dev
   */
  debug: (message: string, ...args: unknown[]): void => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  },
}

export default logger
