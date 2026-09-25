import {
  getContasFixas,
  addContaFixa,
  updateContaFixa,
  deleteContaFixa,
} from '@/services/contasService'
import type { ContaFixa, ContaFixaInput } from '@/services/contasService'

export type { ContaFixa, ContaFixaInput }

export const listar = getContasFixas
export const criar = addContaFixa
export const atualizar = updateContaFixa
export const excluir = deleteContaFixa
