import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import type { z } from 'zod'
import { AlertTriangle, Calendar, Check, DollarSign, Pencil, Plus, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { CurrencyInput } from '@/components/ui/currency-input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import EmptyState from '@/components/EmptyState'
import LoadingSkeleton from '@/components/LoadingSkeleton'
import { CATEGORIAS_CONTAS } from '@/config/constants'
import { formatReais } from '@/domain/currency'
import { contaFixaSchema } from '@/domain/validations'
import { diasAteVencimento } from '@/domain/vencimentos'
import { getErrorMessage, logError } from '@/lib/errorHandler'
import type { ContaFixa } from './api'
import {
  useAlternarContaFixa,
  useContasFixas,
  useExcluirContaFixa,
  useSalvarContaFixa,
} from './queries'

type FormValues = z.infer<typeof contaFixaSchema>

const VALORES_INICIAIS: FormValues = {
  nome: '',
  valor: 0,
  dia_vencimento: 1,
  categoria: 'Moradia',
  ativa: true,
}

function corDoSelo(dias: number): 'destructive' | 'warning' | 'success' {
  if (dias <= 3) return 'destructive'
  if (dias <= 7) return 'warning'
  return 'success'
}

function textoDoSelo(dias: number): string {
  if (dias === 0) return 'Vence hoje'
  return `${dias} dias restantes`
}

export default function ContasFixasPage() {
  const { data: contas = [], isPending, error, refetch } = useContasFixas()
  const salvar = useSalvarContaFixa()
  const excluir = useExcluirContaFixa()
  const alternar = useAlternarContaFixa()

  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [editando, setEditando] = useState<ContaFixa | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(contaFixaSchema),
    defaultValues: VALORES_INICIAIS,
  })

  const abrirDialogo = (conta: ContaFixa | null) => {
    setEditando(conta)
    form.reset(
      conta
        ? {
            nome: conta.nome,
            valor: Number(conta.valor),
            dia_vencimento: conta.dia_vencimento,
            categoria: conta.categoria,
            ativa: conta.ativa ?? true,
          }
        : VALORES_INICIAIS
    )
    setDialogoAberto(true)
  }

  const aoEnviar = form.handleSubmit(async dados => {
    try {
      await salvar.mutateAsync({ id: editando?.id, dados })
      toast.success(editando ? 'Conta atualizada!' : 'Conta adicionada!')
      setDialogoAberto(false)
    } catch (erro) {
      logError('Salvar conta fixa', erro)
      toast.error(getErrorMessage(erro))
    }
  })

  const aoExcluir = async (conta: ContaFixa) => {
    if (!window.confirm(`Excluir a conta "${conta.nome}"?`)) return
    try {
      await excluir.mutateAsync(conta.id)
      toast.success('Conta excluída!')
    } catch (erro) {
      logError('Excluir conta fixa', erro)
      toast.error(getErrorMessage(erro))
    }
  }

  const aoAlternar = async (conta: ContaFixa) => {
    try {
      await alternar.mutateAsync(conta)
      toast.success(conta.ativa ? 'Conta desativada.' : 'Conta ativada.')
    } catch (erro) {
      logError('Alternar conta fixa', erro)
      toast.error(getErrorMessage(erro))
    }
  }

  const totalMensal = contas
    .filter(conta => conta.ativa)
    .reduce((soma, conta) => soma + Number(conta.valor), 0)

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Não foi possível carregar suas contas"
        message={getErrorMessage(error)}
        actionLabel="Tentar de novo"
        onAction={() => refetch()}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Contas Fixas</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Total mensal: <strong>{formatReais(totalMensal)}</strong>
          </p>
        </div>
        <Button onClick={() => abrirDialogo(null)}>
          <Plus size={18} />
          Nova Conta
        </Button>
      </header>

      {isPending ? (
        <LoadingSkeleton type="card" count={3} />
      ) : contas.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nenhuma Conta Cadastrada"
          message="Adicione suas contas fixas mensais para melhor controle financeiro"
          actionLabel="Adicionar Primeira Conta"
          onAction={() => abrirDialogo(null)}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {contas.map(conta => {
            const dias = diasAteVencimento(conta.dia_vencimento)
            return (
              <Card key={conta.id} className={conta.ativa ? '' : 'opacity-60'}>
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-semibold">{conta.nome}</h3>
                    <Badge variant={conta.ativa ? 'default' : 'destructive'}>
                      {conta.ativa ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => abrirDialogo(conta)}
                      aria-label={`Editar conta ${conta.nome}`}
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => aoExcluir(conta)}
                      disabled={excluir.isPending && excluir.variables === conta.id}
                      aria-label={`Excluir conta ${conta.nome}`}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-2 text-sm">
                  <span className="flex items-center gap-2 text-lg font-bold">
                    <DollarSign size={18} />
                    {formatReais(Number(conta.valor))}
                  </span>
                  <span className="flex items-center gap-2">
                    <Calendar size={16} />
                    Vencimento: dia {conta.dia_vencimento}
                  </span>
                  <Badge variant="secondary">{conta.categoria}</Badge>
                  {conta.ativa && <Badge variant={corDoSelo(dias)}>{textoDoSelo(dias)}</Badge>}
                </CardContent>

                <CardFooter>
                  <Button
                    variant={conta.ativa ? 'secondary' : 'default'}
                    className="w-full"
                    onClick={() => aoAlternar(conta)}
                    disabled={alternar.isPending && alternar.variables?.id === conta.id}
                  >
                    {conta.ativa ? <X size={16} /> : <Check size={16} />}
                    {conta.ativa ? 'Desativar' : 'Ativar'}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={dialogoAberto} onOpenChange={setDialogoAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editando ? 'Editar Conta' : 'Nova Conta Fixa'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={aoEnviar} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="conta-nome">Nome da Conta *</Label>
              <Input
                id="conta-nome"
                placeholder="Ex: Aluguel, Luz, Internet..."
                aria-invalid={Boolean(form.formState.errors.nome)}
                {...form.register('nome')}
              />
              {form.formState.errors.nome && (
                <span className="text-sm text-[var(--accent-red)]">
                  {form.formState.errors.nome.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="conta-valor">Valor *</Label>
              <Controller
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <CurrencyInput
                    id="conta-valor"
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    aria-invalid={Boolean(form.formState.errors.valor)}
                  />
                )}
              />
              {form.formState.errors.valor && (
                <span className="text-sm text-[var(--accent-red)]">
                  {form.formState.errors.valor.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="conta-dia">Dia do Vencimento *</Label>
              <Input
                id="conta-dia"
                type="number"
                min={1}
                max={31}
                placeholder="1-31"
                aria-invalid={Boolean(form.formState.errors.dia_vencimento)}
                {...form.register('dia_vencimento', { valueAsNumber: true })}
              />
              {form.formState.errors.dia_vencimento && (
                <span className="text-sm text-[var(--accent-red)]">
                  {form.formState.errors.dia_vencimento.message}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="conta-categoria">Categoria *</Label>
              <Controller
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="conta-categoria">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_CONTAS.map(categoria => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex items-center gap-2">
              <Controller
                control={form.control}
                name="ativa"
                render={({ field }) => (
                  <Checkbox
                    id="conta-ativa"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label htmlFor="conta-ativa">Conta ativa</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setDialogoAberto(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvar.isPending}>
                {salvar.isPending
                  ? 'Salvando...'
                  : editando
                    ? 'Salvar Alterações'
                    : 'Adicionar Conta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
