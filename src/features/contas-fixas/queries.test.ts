import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { createQueryWrapper } from '@/test/queryWrapper'
import {
  useAlternarContaFixa,
  useContasFixas,
  useExcluirContaFixa,
  useSalvarContaFixa,
} from './queries'
import * as api from './api'
import type { ContaFixa, ContaFixaInput } from './api'

vi.mock('./api')

const listar = vi.mocked(api.listar)
const criar = vi.mocked(api.criar)
const atualizar = vi.mocked(api.atualizar)
const excluir = vi.mocked(api.excluir)

const contaMock: ContaFixa = {
  id: 'conta-1',
  nome: 'Aluguel',
  valor: 1500,
  dia_vencimento: 5,
  categoria: 'Moradia',
  ativa: true,
  user_id: 'user-1',
  created_at: '2026-01-01T00:00:00.000Z',
}

const dadosMock: ContaFixaInput = {
  nome: 'Luz',
  valor: 200,
  dia_vencimento: 10,
  categoria: 'Utilidades',
  ativa: true,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAlternarContaFixa', () => {
  it('envia exatamente { ativa: !conta.ativa }, e nada mais', async () => {
    atualizar.mockResolvedValue({ ...contaMock, ativa: false })
    listar.mockResolvedValue([contaMock])
    const { wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useAlternarContaFixa(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync(contaMock)
    })

    expect(atualizar).toHaveBeenCalledTimes(1)
    expect(atualizar).toHaveBeenCalledWith(contaMock.id, { ativa: false })
  })
})

describe('refetch após mutação', () => {
  it('cada mutação bem-sucedida provoca refetch da listagem', async () => {
    listar.mockResolvedValue([contaMock])
    atualizar.mockResolvedValue({ ...contaMock, ativa: false })
    const { wrapper } = createQueryWrapper()

    const { result: lista } = renderHook(() => useContasFixas(), { wrapper })
    await waitFor(() => expect(lista.current.isSuccess).toBe(true))
    expect(listar).toHaveBeenCalledTimes(1)

    const { result: mutacao } = renderHook(() => useAlternarContaFixa(), { wrapper })
    await act(async () => {
      await mutacao.current.mutateAsync(contaMock)
    })

    await waitFor(() => expect(listar).toHaveBeenCalledTimes(2))
  })
})

describe('useSalvarContaFixa', () => {
  it('sem id chama criar e não atualizar', async () => {
    criar.mockResolvedValue(contaMock)
    listar.mockResolvedValue([])
    const { wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useSalvarContaFixa(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ dados: dadosMock })
    })

    expect(criar).toHaveBeenCalledWith(dadosMock)
    expect(atualizar).not.toHaveBeenCalled()
  })

  it('com id chama atualizar(id, dados) e não criar', async () => {
    atualizar.mockResolvedValue(contaMock)
    listar.mockResolvedValue([])
    const { wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useSalvarContaFixa(), { wrapper })

    await act(async () => {
      await result.current.mutateAsync({ id: contaMock.id, dados: dadosMock })
    })

    expect(atualizar).toHaveBeenCalledWith(contaMock.id, dadosMock)
    expect(criar).not.toHaveBeenCalled()
  })
})

describe('useContasFixas', () => {
  it('chama listar e expõe os dados retornados', async () => {
    listar.mockResolvedValue([contaMock])
    const { wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useContasFixas(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(listar).toHaveBeenCalledTimes(1)
    expect(result.current.data).toEqual([contaMock])
  })
})

describe('erro de mutação', () => {
  it('propaga por mutateAsync', async () => {
    listar.mockResolvedValue([])
    const erro = new Error('falha ao excluir')
    excluir.mockRejectedValue(erro)
    const { wrapper } = createQueryWrapper()
    const { result } = renderHook(() => useExcluirContaFixa(), { wrapper })

    await expect(result.current.mutateAsync(contaMock.id)).rejects.toThrow('falha ao excluir')
  })
})
