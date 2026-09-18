import { formatMesReferencia, parseISODateLocal } from './dates'

const ouNulo = (v) => (v === undefined || v === '' ? null : v)

export const montarPayloadTransacao = (form) => ({
  tipo: form.tipo,
  categoria: form.categoria,
  descricao: form.descricao,
  valor: Number(form.valor),
  data_transacao: form.data_transacao,
  mes_referencia: formatMesReferencia(parseISODateLocal(form.data_transacao)),
  conta_bancaria: form.metodo_pagamento === 'Crédito' ? null : ouNulo(form.conta_bancaria),
  metodo_pagamento: form.metodo_pagamento,
  cartao_credito_id: form.metodo_pagamento === 'Crédito' ? ouNulo(form.cartao_credito_id) : null,
  observacoes: ouNulo(form.observacoes),
})
