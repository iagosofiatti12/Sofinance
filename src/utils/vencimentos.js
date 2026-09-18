const diasNoMes = (ano, mes) => new Date(ano, mes + 1, 0).getDate()
const inicioDoDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const MS_DIA = 86_400_000

export const diasAteVencimento = (diaVencimento, hoje = new Date()) => {
  if (!Number.isInteger(diaVencimento) || diaVencimento < 1) return Number.POSITIVE_INFINITY

  const base = inicioDoDia(hoje)
  const ano = base.getFullYear()
  const mes = base.getMonth()
  let venc = new Date(ano, mes, Math.min(diaVencimento, diasNoMes(ano, mes)))
  if (venc < base) {
    venc = new Date(ano, mes + 1, Math.min(diaVencimento, diasNoMes(ano, mes + 1)))
  }
  return Math.round((venc - base) / MS_DIA)
}

export const proximosVencimentos = (contas, hoje = new Date(), limite = 5) =>
  contas
    .filter((c) => c.ativa)
    .map((c) => ({ ...c, diasRestantes: diasAteVencimento(c.dia_vencimento, hoje) }))
    .sort((a, b) => a.diasRestantes - b.diasRestantes)
    .slice(0, limite)
