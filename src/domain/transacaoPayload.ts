import { formatMesReferencia, parseISODateLocal } from './dates'

export type TransacaoFormInput = {
  tipo: string
  categoria: string
  descricao: string
  valor: string | number
  data_transacao: string
  conta_bancaria?: string
  metodo_pagamento: string
  cartao_credito_id?: string
  observacoes?: string
  [key: string]: unknown
}

export type TransacaoPayload = {
  tipo: string
  categoria: string
  descricao: string
  valor: number
  data_transacao: string
  mes_referencia: string
  conta_bancaria: string | null
  metodo_pagamento: string
  cartao_credito_id: string | null
  observacoes: string | null
}

const ouNulo = (v: string | undefined): string | null => (v === undefined || v === '' ? null : v)

export const montarPayloadTransacao = (form: TransacaoFormInput): TransacaoPayload => ({
  tipo: form.tipo,
  categoria: form.categoria,
  descricao: form.descricao,
  valor: Number(form.valor),
  data_transacao: form.data_transacao,
  mes_referencia: formatMesReferencia(parseISODateLocal(form.data_transacao)),
  conta_bancaria:
    form.metodo_pagamento === 'Crédito' || form.metodo_pagamento === 'Dinheiro'
      ? null
      : ouNulo(form.conta_bancaria),
  metodo_pagamento: form.metodo_pagamento,
  cartao_credito_id: form.metodo_pagamento === 'Crédito' ? ouNulo(form.cartao_credito_id) : null,
  observacoes: ouNulo(form.observacoes),
})
