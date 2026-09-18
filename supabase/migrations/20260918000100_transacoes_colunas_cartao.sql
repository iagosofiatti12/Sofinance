-- Fase 0 / correção encontrada no smoke test de 2026-09-18.
-- A migração legada de parcelas (docs/legacy-sql/supabase-migration-parcelas.sql) nunca foi aplicada
-- em produção, então `transacoes` não tinha as colunas de cartão que o frontend sempre envia.
-- Sem elas, NENHUMA transação pode ser inserida ("Could not find the 'cartao_credito_id' column").
-- Adiciona apenas as colunas (todas opcionais); as RPCs de parcelamento continuam fora
-- (o modelo "cartão lite" da Fase 2 substitui esse desenho).
-- Idempotente. Ordem: depois de 20260917230000 e antes do baseline (ver nota naquele arquivo).

alter table public.transacoes
  add column if not exists cartao_credito_id uuid references public.cartoes_credito(id) on delete set null,
  add column if not exists is_parcelado boolean not null default false,
  add column if not exists parcela_atual integer,
  add column if not exists total_parcelas integer,
  add column if not exists transacao_pai_id uuid references public.transacoes(id) on delete cascade,
  add column if not exists valor_original numeric(10, 2);

create index if not exists idx_transacoes_cartao on public.transacoes(cartao_credito_id);

-- PostgREST precisa recarregar o cache de schema para enxergar as colunas novas.
notify pgrst, 'reload schema';
