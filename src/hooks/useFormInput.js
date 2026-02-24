import { useState, useCallback } from 'react'

/**
 * Hook para gerenciar inputs com validação em tempo real
 * @param {*} initialValue - Valor inicial
 * @param {Function} validator - Função de validação que retorna { valid: boolean, message: string }
 * @returns {Object} - Estado e funções do input
 */
export const useFormInput = (initialValue = '', validator = null) => {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)
  const [isValid, setIsValid] = useState(true)

  const validate = useCallback((newValue) => {
    if (!validator) return true

    const result = validator(newValue)
    
    if (typeof result === 'boolean') {
      setIsValid(result)
      setError(result ? '' : 'Valor inválido')
      return result
    }
    
    setIsValid(result.valid)
    setError(result.valid ? '' : result.message)
    return result.valid
  }, [validator])

  const handleChange = useCallback((e) => {
    const newValue = e.target?.value ?? e
    setValue(newValue)
    
    if (touched) {
      validate(newValue)
    }
  }, [touched, validate])

  const handleBlur = useCallback(() => {
    setTouched(true)
    validate(value)
  }, [value, validate])

  const reset = useCallback(() => {
    setValue(initialValue)
    setError('')
    setTouched(false)
    setIsValid(true)
  }, [initialValue])

  const forceValidation = useCallback(() => {
    setTouched(true)
    return validate(value)
  }, [value, validate])

  return {
    value,
    error,
    touched,
    isValid,
    setValue,
    handleChange,
    handleBlur,
    reset,
    validate: forceValidation,
    // Props para espalhar no input
    inputProps: {
      value,
      onChange: handleChange,
      onBlur: handleBlur,
      className: touched ? (isValid ? 'success' : 'error') : ''
    }
  }
}

/**
 * Validadores prontos para uso
 */
export const validators = {
  required: (message = 'Campo obrigatório') => (value) => ({
    valid: value && value.toString().trim().length > 0,
    message
  }),

  minLength: (min, message) => (value) => ({
    valid: value && value.toString().length >= min,
    message: message || `Mínimo de ${min} caracteres`
  }),

  maxLength: (max, message) => (value) => ({
    valid: !value || value.toString().length <= max,
    message: message || `Máximo de ${max} caracteres`
  }),

  email: (message = 'Email inválido') => (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return {
      valid: !value || emailRegex.test(value),
      message
    }
  },

  number: (message = 'Deve ser um número') => (value) => ({
    valid: !value || !isNaN(Number(value)),
    message
  }),

  min: (min, message) => (value) => ({
    valid: !value || Number(value) >= min,
    message: message || `Valor mínimo: ${min}`
  }),

  max: (max, message) => (value) => ({
    valid: !value || Number(value) <= max,
    message: message || `Valor máximo: ${max}`
  }),

  // Combinar múltiplos validadores
  combine: (...validatorFns) => (value) => {
    for (const fn of validatorFns) {
      const result = fn(value)
      if (!result.valid) return result
    }
    return { valid: true, message: '' }
  }
}
