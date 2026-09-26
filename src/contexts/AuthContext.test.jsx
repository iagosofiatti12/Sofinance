import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, render, waitFor } from '@testing-library/react'
import { AuthProvider } from './AuthContext'
import { queryClient } from '@/lib/queryClient'
import * as authService from '../services/authService'

// Item 1 (Critical) do relatório pré-merge: o queryClient é uma instância
// única por aba (src/lib/queryClient.ts). Sem limpeza no logout, dados do
// usuário anterior continuam no cache e aparecem no primeiro render do
// próximo usuário, antes do skeleton de carregamento (com cache, `isPending`
// é `false`). Este teste prova que o AuthProvider limpa o cache no momento
// certo.
vi.mock('../services/authService')

const mockedAuthService = vi.mocked(authService)

describe('AuthProvider limpa o QueryClient ao trocar de sessão', () => {
  let authChangeCallback

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient.clear()
    authChangeCallback = undefined

    mockedAuthService.getSession.mockResolvedValue(null)
    mockedAuthService.getCurrentUser.mockResolvedValue(null)
    mockedAuthService.onAuthStateChange.mockImplementation(callback => {
      authChangeCallback = callback
      return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
  })

  afterEach(() => {
    queryClient.clear()
  })

  it('SIGNED_OUT esvazia o cache, para o próximo usuário não herdar dados do anterior', async () => {
    render(
      <AuthProvider>
        <div />
      </AuthProvider>
    )

    await waitFor(() => expect(authChangeCallback).toBeTypeOf('function'))

    // Dados do usuário A ainda no cache (ex.: contas fixas da tela piloto).
    queryClient.setQueryData(['contas-fixas'], [{ id: '1', nome: 'Aluguel do usuário A' }])
    expect(queryClient.getQueryData(['contas-fixas'])).toBeDefined()

    await act(async () => {
      await authChangeCallback('SIGNED_OUT', null)
    })

    expect(queryClient.getQueryData(['contas-fixas'])).toBeUndefined()
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
  })

  it('SIGNED_IN com usuário diferente do último visto também esvazia o cache', async () => {
    render(
      <AuthProvider>
        <div />
      </AuthProvider>
    )

    await waitFor(() => expect(authChangeCallback).toBeTypeOf('function'))

    await act(async () => {
      await authChangeCallback('SIGNED_IN', { user: { id: 'user-a' } })
    })

    queryClient.setQueryData(['contas-fixas'], [{ id: '1', nome: 'Aluguel do usuário A' }])

    // Sem SIGNED_OUT prévio nesta aba (ex.: sessão trocada em outra aba).
    await act(async () => {
      await authChangeCallback('SIGNED_IN', { user: { id: 'user-b' } })
    })

    expect(queryClient.getQueryData(['contas-fixas'])).toBeUndefined()
  })

  it('SIGNED_IN do mesmo usuário (ex.: refresh de token) não apaga o cache à toa', async () => {
    render(
      <AuthProvider>
        <div />
      </AuthProvider>
    )

    await waitFor(() => expect(authChangeCallback).toBeTypeOf('function'))

    await act(async () => {
      await authChangeCallback('SIGNED_IN', { user: { id: 'user-a' } })
    })

    queryClient.setQueryData(['contas-fixas'], [{ id: '1', nome: 'Aluguel do usuário A' }])

    await act(async () => {
      await authChangeCallback('SIGNED_IN', { user: { id: 'user-a' } })
    })

    expect(queryClient.getQueryData(['contas-fixas'])).toBeDefined()
  })
})
