/**
 * Formata valor para moeda brasileira (R$)
 * @param value - Valor a ser formatado
 * @returns Valor formatado
 */
export const formatCurrency = (value: string | number): string => {
  if (!value) return 'R$ 0,00'

  // As telas chamam formatCurrency(parseFloat(valor) * 100), e essa multiplicacao nem
  // sempre fecha em inteiro: 19.90 * 100 da 1989.9999999999998. Sem arredondar, a
  // extracao de digitos abaixo le 19899999999999998 e a tela mostra
  // R$ 199.000.000.000.000,00. Para string de digitos, arredondar nao muda nada.
  const valorBase = typeof value === 'number' ? Math.round(value) : value

  // Remove tudo que não é número
  const numeroLimpo = valorBase.toString().replace(/\D/g, '')

  // Converte para number e divide por 100 (centavos)
  const numero = Number(numeroLimpo) / 100

  // Formata para moeda brasileira
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/**
 * Converte valor formatado (R$ 1.234,56) para number
 * @param formattedValue - Valor formatado
 * @returns Valor numérico
 */
export const parseCurrency = (formattedValue: string): number => {
  if (!formattedValue) return 0

  // Remove R$, espaços, pontos e substitui vírgula por ponto
  const numero = formattedValue
    .replace('R$', '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')

  return parseFloat(numero) || 0
}
