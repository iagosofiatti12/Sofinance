import { describe, it, expect } from 'vitest'
import {
  toISODateLocal,
  parseISODateLocal,
  formatarData,
  formatarMesExtenso,
  formatMesReferencia,
  mudarMes,
} from './dates'

describe('dates', () => {
  it('toISODateLocal usa a data local, não UTC', () => {
    expect(toISODateLocal(new Date(2026, 8, 17, 23, 30))).toBe('2026-09-17')
  })
  it('parseISODateLocal devolve meia-noite local', () => {
    const d = parseISODateLocal('2026-09-17')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 8, 17])
  })
  it('formatarData não perde um dia', () => {
    expect(formatarData('2026-09-17')).toBe('17/09/2026')
    expect(formatarData('2026-09-17T00:00:00+00:00')).toBe('17/09/2026')
    expect(formatarData(null)).toBe('-')
  })
  it('formatarMesExtenso', () => {
    expect(formatarMesExtenso('2026-09')).toBe('setembro de 2026')
  })
  it('formatMesReferencia', () => {
    expect(formatMesReferencia(new Date(2026, 0, 31, 23, 59))).toBe('2026-01')
  })
  it('mudarMes cruza o ano', () => {
    expect(mudarMes('2026-12', 1)).toBe('2027-01')
    expect(mudarMes('2026-01', -1)).toBe('2025-12')
  })
})
