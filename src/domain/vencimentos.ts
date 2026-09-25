const diasNoMes = (ano: number, mes: number): number => new Date(ano, mes + 1, 0).getDate()
const inicioDoDia = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const MS_DIA = 86_400_000

export type ContaComVencimento = {
  dia_vencimento: number | null
  ativa: boolean
}

export const diasAteVencimento = (
  diaVencimento: number | null | undefined,
  hoje: Date = new Date()
): number => {
  if (typeof diaVencimento !== 'number' || !Number.isInteger(diaVencimento) || diaVencimento < 1) {
    return Number.POSITIVE_INFINITY
  }

  const base = inicioDoDia(hoje)
  const ano = base.getFullYear()
  const mes = base.getMonth()
  let venc = new Date(ano, mes, Math.min(diaVencimento, diasNoMes(ano, mes)))
  if (venc < base) {
    venc = new Date(ano, mes + 1, Math.min(diaVencimento, diasNoMes(ano, mes + 1)))
  }
  return Math.round((venc.getTime() - base.getTime()) / MS_DIA)
}

export const proximosVencimentos = <T extends ContaComVencimento>(
  contas: T[],
  hoje: Date = new Date(),
  limite: number = 5
): (T & { diasRestantes: number })[] =>
  contas
    .filter(c => c.ativa)
    .map(c => ({ ...c, diasRestantes: diasAteVencimento(c.dia_vencimento, hoje) }))
    .sort((a, b) => a.diasRestantes - b.diasRestantes)
    .slice(0, limite)
