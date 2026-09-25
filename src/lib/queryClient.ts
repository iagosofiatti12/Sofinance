import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados financeiros mudam pouco durante uma sessão; 30s evita refazer
      // a mesma consulta ao trocar de tela e voltar.
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
