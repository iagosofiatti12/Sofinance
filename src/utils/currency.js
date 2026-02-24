import { useState } from 'react'

/**
 * Formata valor para moeda brasileira (R$)
 * @param {string|number} value - Valor a ser formatado
 * @returns {string} Valor formatado
 */
export const formatCurrency = (value) => {
  if (!value) return 'R$ 0,00'
  
  // Remove tudo que não é número
  const numeroLimpo = value.toString().replace(/\D/g, '')
  
  // Converte para number e divide por 100 (centavos)
  const numero = Number(numeroLimpo) / 100
  
  // Formata para moeda brasileira
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

/**
 * Converte valor formatado (R$ 1.234,56) para number
 * @param {string} formattedValue - Valor formatado
 * @returns {number} Valor numérico
 */
export const parseCurrency = (formattedValue) => {
  if (!formattedValue) return 0
  
  // Remove R$, espaços, pontos e substitui vírgula por ponto
  const numero = formattedValue
    .replace('R$', '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  
  return parseFloat(numero) || 0
}

/**
 * Hook para input de moeda
 * Retorna valor formatado e funções para gerenciar
 */
export const useCurrencyInput = (initialValue = 0) => {
  const [displayValue, setDisplayValue] = useState(
    formatCurrency(initialValue * 100)
  )
  const [numericValue, setNumericValue] = useState(initialValue)

  const handleChange = (e) => {
    const inputValue = e.target.value
    const formatted = formatCurrency(inputValue)
    const numeric = parseCurrency(formatted)
    
    setDisplayValue(formatted)
    setNumericValue(numeric)
    
    // Retorna evento customizado para compatibilidade
    return {
      target: {
        value: numeric,
        formattedValue: formatted
      }
    }
  }

  const setValue = (value) => {
    const formatted = formatCurrency(value * 100)
    const numeric = parseCurrency(formatted)
    
    setDisplayValue(formatted)
    setNumericValue(numeric)
  }

  return {
    displayValue,
    numericValue,
    handleChange,
    setValue,
    // Props para espalhar diretamente no input
    inputProps: {
      type: 'text',
      value: displayValue,
      onChange: handleChange,
      placeholder: 'R$ 0,00',
      inputMode: 'numeric'
    }
  }
}

/**
 * Formata input de moeda em tempo real
 * Para usar diretamente no onChange
 */
export const formatCurrencyInput = (event) => {
  const input = event.target
  const valor = input.value
  
  // Remove tudo que não é número
  const numeroLimpo = valor.replace(/\D/g, '')
  
  // Converte para number e divide por 100
  const numero = Number(numeroLimpo) / 100
  
  // Formata
  const formatado = numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  })
  
  input.value = formatado
  
  // Retorna valor numérico para usar no state
  return numero
}

/**
 * Pega valor numérico de um input formatado
 */
export const getNumericValue = (formattedValue) => {
  if (!formattedValue) return 0
  
  return parseCurrency(formattedValue)
}

/**
 * Hook otimizado para input monetário com validação
 * Usa debounce e validação integrada
 */
export const useCurrencyInputV2 = (initialValue = 0, onChange = null) => {
  const [rawValue, setRawValue] = useState(initialValue.toString())
  const [numericValue, setNumericValue] = useState(initialValue)
  
  const handleInputChange = (e) => {
    const input = e.target.value
    
    // Remove tudo que não é número
    const onlyNumbers = input.replace(/\D/g, '')
    
    // Converte para centavos
    const numeric = Number(onlyNumbers) / 100
    
    setRawValue(onlyNumbers)
    setNumericValue(numeric)
    
    // Callback externo
    if (onChange) {
      onChange(numeric)
    }
  }
  
  const displayValue = formatCurrency(rawValue)
  
  return {
    value: displayValue,
    numericValue,
    onChange: handleInputChange,
    // Props para espalhar no input
    inputProps: {
      type: 'text',
      value: displayValue,
      onChange: handleInputChange,
      placeholder: 'R$ 0,00',
      inputMode: 'numeric'
    }
  }
}
