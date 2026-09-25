import { describe, it, expect } from 'vitest'
import { contasFixasKeys } from './queries'

describe('contasFixasKeys', () => {
  it('tem uma chave estável para a lista', () => {
    expect(contasFixasKeys.all).toEqual(['contas-fixas'])
  })

  it('deriva a chave de uma conta específica da chave da lista', () => {
    expect(contasFixasKeys.detalhe('abc')).toEqual(['contas-fixas', 'abc'])
  })
})
