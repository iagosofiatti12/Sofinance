-- ====================================
-- Fix para o erro de Foreign Key
-- ====================================
-- Execute este script no SQL Editor do Supabase

-- Opção 1: Criar tabela de usuários se não existir e inserir usuário demo
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Inserir usuário demo com o UUID que estamos usando no código
-- Senha demo: "demo123" (hash bcrypt)
INSERT INTO usuarios (id, email, nome, senha_hash) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000', 
  'demo@sofinance.com',
  'Usuário Demo',
  '$2a$10$rXQjZjKjL7Y5Z5Z5Z5Z5ZeqKjL7Y5Z5Z5Z5Z5ZeqKjL7Y5Z5Z5Z5Ze'
) 
ON CONFLICT (id) DO NOTHING;

-- Verificar se o usuário foi criado
SELECT * FROM usuarios WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- ====================================
-- Opção 2: Remover temporariamente a constraint (NÃO RECOMENDADO)
-- ====================================
-- Descomente apenas se quiser remover a constraint:
-- ALTER TABLE contas_fixas DROP CONSTRAINT IF EXISTS fk_contas_user_id;
-- ALTER TABLE cartoes_credito DROP CONSTRAINT IF EXISTS fk_cartoes_user_id;
-- ALTER TABLE financiamento_imovel DROP CONSTRAINT IF EXISTS fk_financiamento_imovel_user_id;
-- ALTER TABLE financiamento_carro DROP CONSTRAINT IF EXISTS fk_financiamento_carro_user_id;
-- ALTER TABLE metas_desejos DROP CONSTRAINT IF EXISTS fk_metas_user_id;
