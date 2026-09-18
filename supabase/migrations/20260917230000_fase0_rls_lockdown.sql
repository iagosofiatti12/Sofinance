-- ATENÇÃO (ordem das migrations): este arquivo ALTERA tabelas e views que ele não cria.
-- Antes de qualquer `supabase db push`/`db reset`/`supabase start`, gere o baseline do schema
-- (`supabase db pull`, exige Docker) com timestamp ANTERIOR a este (ex.: 20260917000000_baseline.sql)
-- e marque este arquivo como já aplicado em produção: `supabase migration repair --status applied 20260917230000`.

-- Fase 0 / passo 1: fechar o acesso aos dados em produção.
-- Auditoria de 2026-09-17 encontrou:
--   * RLS desligado em transacoes, cartoes_credito, contas_fixas, transacoes_cartao
--   * política "Enable all for authenticated users" USING (true) em 7 tabelas
--   * papel anon com todos os privilégios em todas as tabelas
--   * views resumo_mensal / gastos_por_categoria rodando com direitos do dono
-- Todas as operações abaixo são idempotentes e não alteram dados.

-- 1. Ligar RLS onde estava desligado
alter table public.cartoes_credito   enable row level security;
alter table public.contas_fixas      enable row level security;
alter table public.transacoes        enable row level security;
alter table public.transacoes_cartao enable row level security;

-- 2. Remover políticas permissivas (as políticas auth.uid() = user_id continuam)
drop policy if exists "Enable all for authenticated users" on public.cartoes_credito;
drop policy if exists "Enable all for authenticated users" on public.contas_fixas;
drop policy if exists "Enable all for authenticated users" on public.financiamento_carro;
drop policy if exists "Enable all for authenticated users" on public.financiamento_imovel;
drop policy if exists "Enable all for authenticated users" on public.metas_desejos;
drop policy if exists "Enable all for authenticated users" on public.transacoes;
drop policy if exists "Enable all for authenticated users" on public.transacoes_cartao;
-- duplicada de "Usuários podem gerenciar suas contas fixas"
drop policy if exists "Users can only access their own data" on public.contas_fixas;

-- 3. Views passam a respeitar RLS do usuário que consulta
alter view public.resumo_mensal          set (security_invoker = true);
alter view public.gastos_por_categoria   set (security_invoker = true);

-- 4. anon (sessão sem login) não precisa de nada em public: todo acesso a dados é pós-login
revoke all on all tables    in schema public from anon;
revoke all on all functions in schema public from anon;

-- Rollback (só se algo quebrar):
--   alter table public.<tabela> disable row level security;
--   create policy "Enable all for authenticated users" on public.<tabela> for all using (true) with check (true);
--   grant all on all tables in schema public to anon;
