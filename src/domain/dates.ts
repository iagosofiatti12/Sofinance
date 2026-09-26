const pad = (n: number): string => String(n).padStart(2, '0')

export const toISODateLocal = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const hojeISO = (): string => toISODateLocal(new Date())

export const parseISODateLocal = (iso: string): Date => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  // `split('-')` devolve `string[]` de tamanho variável para o TS, então
  // `.map(Number)` não garante 3 posições em tempo de compilação. Um ISO
  // malformado já resultava em `undefined - 1` (NaN) e Data Inválida antes
  // desta guarda; `?? NaN` preserva exatamente esse comportamento.
  return new Date(y ?? NaN, (m ?? NaN) - 1, d ?? NaN)
}

export const formatarData = (iso: string | null | undefined): string =>
  iso ? parseISODateLocal(iso).toLocaleDateString('pt-BR') : '-'

export const formatarMesExtenso = (mesRef: string): string =>
  parseISODateLocal(`${mesRef}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

export const formatMesReferencia = (date: Date): string => toISODateLocal(date).slice(0, 7)

export const mudarMes = (mesRef: string, delta: number): string => {
  const [y, m] = mesRef.split('-').map(Number)
  return formatMesReferencia(new Date(y ?? NaN, (m ?? NaN) - 1 + delta, 1))
}
