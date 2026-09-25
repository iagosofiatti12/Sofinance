import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/domain/currency'

type CurrencyInputProps = {
  id?: string
  value: number
  onChange: (valor: number) => void
  onBlur?: () => void
  disabled?: boolean
  'aria-invalid'?: boolean
}

// Guarda o valor como number em reais e mostra formatado. formatCurrency já
// arredonda por dentro, mas o Math.round aqui é proteção em profundidade: sem
// ele, 19.90 * 100 vira 1989.9999999999998 e a extração de dígitos abaixo lia
// esse valor errado, chegando a mostrar R$ 199.000.000.000.000,00 em produção.
export function CurrencyInput({ value, onChange, ...props }: CurrencyInputProps) {
  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      placeholder="R$ 0,00"
      value={value ? formatCurrency(Math.round(value * 100)) : ''}
      onChange={event => {
        const digitos = event.target.value.replace(/\D/g, '')
        onChange(Number(digitos) / 100)
      }}
    />
  )
}
