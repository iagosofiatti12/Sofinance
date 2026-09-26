import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Wrapper para testar hooks do TanStack Query com `renderHook`.
 * Cria um QueryClient novo por chamada (retry desligado, para não deixar um
 * teste de erro pendurado repetindo a chamada) e devolve também o próprio
 * client, para quando dois `renderHook` precisam compartilhar o mesmo cache
 * (ex.: uma listagem e uma mutação que deve invalidá-la).
 */
export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  return { wrapper, queryClient }
}
