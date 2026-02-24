-- ====================================
-- CORREÇÃO - Remover dados de teste antigos
-- ====================================
-- Execute este script ANTES do migration principal

-- OPÇÃO 1: LIMPAR DADOS DE TESTE (RECOMENDADO se não tem dados importantes)
-- Isso vai apagar todos os dados antigos e começar do zero

DELETE FROM transacoes_cartao;
DELETE FROM cartoes_credito;
DELETE FROM contas_fixas;
DELETE FROM metas_desejos;
DELETE FROM financiamento_imovel;
DELETE FROM financiamento_carro;
DELETE FROM usuarios WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- ====================================
-- Agora sim podemos adicionar as Foreign Keys
-- ====================================

-- Cartões de Crédito
ALTER TABLE cartoes_credito DROP CONSTRAINT IF EXISTS fk_cartoes_user_id;
ALTER TABLE cartoes_credito 
  ADD CONSTRAINT fk_cartoes_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Contas Fixas
ALTER TABLE contas_fixas DROP CONSTRAINT IF EXISTS fk_contas_user_id;
ALTER TABLE contas_fixas 
  ADD CONSTRAINT fk_contas_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Metas e Desejos
ALTER TABLE metas_desejos DROP CONSTRAINT IF EXISTS fk_metas_user_id;
ALTER TABLE metas_desejos
  ADD CONSTRAINT fk_metas_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Financiamento Imóvel
ALTER TABLE financiamento_imovel DROP CONSTRAINT IF EXISTS fk_financiamento_imovel_user_id;
ALTER TABLE financiamento_imovel
  ADD CONSTRAINT fk_financiamento_imovel_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Financiamento Carro
ALTER TABLE financiamento_carro DROP CONSTRAINT IF EXISTS fk_financiamento_carro_user_id;
ALTER TABLE financiamento_carro
  ADD CONSTRAINT fk_financiamento_carro_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- ====================================
-- SUCESSO! Agora pode executar o migration principal
-- ====================================
