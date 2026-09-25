import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listar, criar, atualizar, excluir } from './api'
import type { ContaFixa, ContaFixaInput } from './api'

export const contasFixasKeys = {
  all: ['contas-fixas'] as const,
  detalhe: (id: string) => ['contas-fixas', id] as const,
}

export function useContasFixas() {
  return useQuery({
    queryKey: contasFixasKeys.all,
    queryFn: listar,
  })
}

export function useSalvarContaFixa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (entrada: { id?: string; dados: ContaFixaInput }) =>
      entrada.id ? atualizar(entrada.id, entrada.dados) : criar(entrada.dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasFixasKeys.all })
    },
  })
}

export function useExcluirContaFixa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => excluir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasFixasKeys.all })
    },
  })
}

export function useAlternarContaFixa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (conta: ContaFixa) => atualizar(conta.id, { ativa: !conta.ativa }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasFixasKeys.all })
    },
  })
}
