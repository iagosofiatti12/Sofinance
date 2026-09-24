const pad = n => String(n).padStart(2, '0')

export const toISODateLocal = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const hojeISO = () => toISODateLocal(new Date())

export const parseISODateLocal = iso => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const formatarData = iso => (iso ? parseISODateLocal(iso).toLocaleDateString('pt-BR') : '-')

export const formatarMesExtenso = mesRef =>
  parseISODateLocal(`${mesRef}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

export const formatMesReferencia = date => toISODateLocal(date).slice(0, 7)

export const mudarMes = (mesRef, delta) => {
  const [y, m] = mesRef.split('-').map(Number)
  return formatMesReferencia(new Date(y, m - 1 + delta, 1))
}
