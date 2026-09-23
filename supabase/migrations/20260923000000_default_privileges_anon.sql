-- Recomendação da revisão final da Fase 0.
--
-- A Supabase concede privilégios ao papel `anon` automaticamente em tabelas novas
-- do schema public. A Fase 0 revogou os privilégios que existiam, mas qualquer
-- tabela criada depois nasceria aberta de novo. Como a Fase 2 vai criar várias
-- tabelas, isto fecha a porta antes.
--
-- Não altera dados e não mexe em nenhuma tabela existente.

alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on functions from anon;

-- Sequências que já existem também não precisam ficar acessíveis ao anon.
revoke all on all sequences in schema public from anon;
