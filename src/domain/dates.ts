const pad = (n: number): string => String(n).padStart(2, '0')

export const toISODateLocal = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const hojeISO = (): string => toISODateLocal(new Date())

export const parseISODateLocal = (iso: string): Date => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const formatarData = (iso: string | null | undefined): string =>
  iso ? parseISODateLocal(iso).toLocaleDateString('pt-BR') : '-'

export const formatarMesExtenso = (mesRef: string): string =>
  parseISODateLocal(`${mesRef}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

export const formatMesReferencia = (date: Date): string => toISODateLocal(date).slice(0, 7)

export const mudarMes = (mesRef: string, delta: number): string => {
  const [y, m] = mesRef.split('-').map(Number)
  return formatMesReferencia(new Date(y, m - 1 + delta, 1))
}
