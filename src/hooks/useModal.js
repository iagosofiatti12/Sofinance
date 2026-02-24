import { useState } from 'react'

/**
 * Hook reutilizável para gerenciar modais
 * @param {boolean} initialState - Estado inicial do modal (aberto/fechado)
 * @returns {Object} { isOpen, open, close, toggle }
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState)

  const open = () => setIsOpen(true)
  const close = () => setIsOpen(false)
  const toggle = () => setIsOpen(prev => !prev)

  return {
    isOpen,
    open,
    close,
    toggle
  }
}

export default useModal
