-- ====================================
-- SOFINANCE - MIGRAÇÃO PARA AUTENTICAÇÃO
-- ====================================
-- Execute este script no SQL Editor do Supabase
-- Vai atualizar o sistema para usar Supabase Auth

-- ====================================
-- PASSO 1: REMOVER TABELA DE USUÁRIOS ANTIGA
-- ====================================
-- Vamos usar auth.users do Supabase em vez da tabela customizada

-- Primeiro, precisamos remover as foreign keys
ALTER TABLE cartoes_credito DROP CONSTRAINT IF EXISTS fk_cartoes_user_id;
ALTER TABLE contas_fixas DROP CONSTRAINT IF EXISTS fk_contas_user_id;

-- ====================================
-- PASSO 2: CRIAR TABELA DE PERFIS
-- ====================================
-- Complementa os dados do auth.users com info adicional

CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome_completo TEXT,
  avatar_url TEXT,
  telefone TEXT,
  data_nascimento DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Trigger para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfis (id, nome_completo)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================
-- PASSO 3: ATUALIZAR TABELAS EXISTENTES
-- ====================================

-- Atualizar user_id para referenciar auth.users
ALTER TABLE cartoes_credito 
  ALTER COLUMN user_id TYPE UUID,
  ADD CONSTRAINT fk_cartoes_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE contas_fixas 
  ALTER COLUMN user_id TYPE UUID,
  ADD CONSTRAINT fk_contas_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE metas_desejos
  ADD CONSTRAINT fk_metas_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE financiamento_imovel
  ADD CONSTRAINT fk_financiamento_imovel_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE financiamento_carro
  ADD CONSTRAINT fk_financiamento_carro_user_id 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Adicionar campos úteis nas tabelas existentes
ALTER TABLE contas_fixas 
  ADD COLUMN IF NOT EXISTS mes_referencia TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- ====================================
-- PASSO 4: CRIAR TABELA DE TRANSAÇÕES
-- ====================================
-- ESSENCIAL para histórico mensal de receitas/despesas

CREATE TABLE IF NOT EXISTS public.transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria TEXT NOT NULL,
  descricao TEXT NOT NULL,
  valor NUMERIC(10, 2) NOT NULL CHECK (valor > 0),
  data_transacao DATE NOT NULL DEFAULT CURRENT_DATE,
  mes_referencia TEXT NOT NULL, -- Formato: 'YYYY-MM' ex: '2026-02'
  conta_bancaria TEXT, -- 'Nubank', 'Itaú', etc
  metodo_pagamento TEXT, -- 'PIX', 'Dinheiro', 'Débito', 'Crédito'
  observacoes TEXT,
  anexo_url TEXT, -- Para futuro (comprovantes)
  origem TEXT, -- 'manual', 'conta_fixa', 'cartao'
  origem_id UUID, -- ID da conta_fixa ou cartao se for automático
  recorrente BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transacoes_user_id ON public.transacoes(user_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_mes_referencia ON public.transacoes(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON public.transacoes(data_transacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON public.transacoes(tipo);
CREATE INDEX IF NOT EXISTS idx_transacoes_categoria ON public.transacoes(categoria);

-- ====================================
-- PASSO 5: CRIAR TABELA DE ORÇAMENTOS
-- ====================================

CREATE TABLE IF NOT EXISTS public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL,
  mes_referencia TEXT NOT NULL, -- 'YYYY-MM'
  valor_planejado NUMERIC(10, 2) NOT NULL CHECK (valor_planejado >= 0),
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')), -- Permite orçar receitas também
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT unique_orcamento_categoria_mes UNIQUE (user_id, categoria, mes_referencia, tipo)
);

CREATE INDEX IF NOT EXISTS idx_orcamentos_user_id ON public.orcamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_mes ON public.orcamentos(mes_referencia);

-- ====================================
-- PASSO 6: CRIAR TABELA DE CONTAS BANCÁRIAS
-- ====================================
-- Para controlar saldo real

CREATE TABLE IF NOT EXISTS public.contas_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL, -- 'Nubank', 'Itaú', 'Caixa'
  tipo TEXT NOT NULL CHECK (tipo IN ('corrente', 'poupanca', 'investimento')),
  saldo_atual NUMERIC(10, 2) DEFAULT 0,
  cor TEXT DEFAULT '#000000', -- Para identificação visual
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE INDEX IF NOT EXISTS idx_contas_bancarias_user_id ON public.contas_bancarias(user_id);

-- ====================================
-- PASSO 7: ROW LEVEL SECURITY (RLS)
-- ====================================
-- IMPORTANTE: Garante que cada usuário vê apenas seus dados

-- Habilitar RLS em todas as tabelas
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_bancarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartoes_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_fixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_desejos ENABLE ROW LEVEL SECURITY;
ALTER TABLE financiamento_imovel ENABLE ROW LEVEL SECURITY;
ALTER TABLE financiamento_carro ENABLE ROW LEVEL SECURITY;

-- Políticas para PERFIS
DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON perfis;
CREATE POLICY "Usuários podem ver seu próprio perfil" ON perfis
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON perfis;
CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON perfis
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON perfis;
CREATE POLICY "Usuários podem inserir seu próprio perfil" ON perfis
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para TRANSAÇÕES
DROP POLICY IF EXISTS "Usuários podem ver suas transações" ON transacoes;
CREATE POLICY "Usuários podem ver suas transações" ON transacoes
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar suas transações" ON transacoes;
CREATE POLICY "Usuários podem criar suas transações" ON transacoes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas transações" ON transacoes;
CREATE POLICY "Usuários podem atualizar suas transações" ON transacoes
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas transações" ON transacoes;
CREATE POLICY "Usuários podem deletar suas transações" ON transacoes
  FOR DELETE USING (auth.uid() = user_id);

-- Políticas para ORÇAMENTOS
DROP POLICY IF EXISTS "Usuários podem gerenciar seus orçamentos" ON orcamentos;
CREATE POLICY "Usuários podem gerenciar seus orçamentos" ON orcamentos
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para CONTAS BANCÁRIAS
DROP POLICY IF EXISTS "Usuários podem gerenciar suas contas bancárias" ON contas_bancarias;
CREATE POLICY "Usuários podem gerenciar suas contas bancárias" ON contas_bancarias
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para CARTÕES DE CRÉDITO
DROP POLICY IF EXISTS "Usuários podem gerenciar seus cartões" ON cartoes_credito;
CREATE POLICY "Usuários podem gerenciar seus cartões" ON cartoes_credito
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para TRANSAÇÕES DE CARTÃO
DROP POLICY IF EXISTS "Usuários podem ver transações de seus cartões" ON transacoes_cartao;
CREATE POLICY "Usuários podem ver transações de seus cartões" ON transacoes_cartao
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM cartoes_credito 
      WHERE cartoes_credito.id = transacoes_cartao.cartao_id 
      AND cartoes_credito.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários podem criar transações em seus cartões" ON transacoes_cartao;
CREATE POLICY "Usuários podem criar transações em seus cartões" ON transacoes_cartao
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM cartoes_credito 
      WHERE cartoes_credito.id = transacoes_cartao.cartao_id 
      AND cartoes_credito.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários podem atualizar transações de seus cartões" ON transacoes_cartao;
CREATE POLICY "Usuários podem atualizar transações de seus cartões" ON transacoes_cartao
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM cartoes_credito 
      WHERE cartoes_credito.id = transacoes_cartao.cartao_id 
      AND cartoes_credito.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Usuários podem deletar transações de seus cartões" ON transacoes_cartao;
CREATE POLICY "Usuários podem deletar transações de seus cartões" ON transacoes_cartao
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM cartoes_credito 
      WHERE cartoes_credito.id = transacoes_cartao.cartao_id 
      AND cartoes_credito.user_id = auth.uid()
    )
  );

-- Políticas para CONTAS FIXAS
DROP POLICY IF EXISTS "Usuários podem gerenciar suas contas fixas" ON contas_fixas;
CREATE POLICY "Usuários podem gerenciar suas contas fixas" ON contas_fixas
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para METAS
DROP POLICY IF EXISTS "Usuários podem gerenciar suas metas" ON metas_desejos;
CREATE POLICY "Usuários podem gerenciar suas metas" ON metas_desejos
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para FINANCIAMENTOS
DROP POLICY IF EXISTS "Usuários podem gerenciar financiamento imóvel" ON financiamento_imovel;
CREATE POLICY "Usuários podem gerenciar financiamento imóvel" ON financiamento_imovel
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem gerenciar financiamento carro" ON financiamento_carro;
CREATE POLICY "Usuários podem gerenciar financiamento carro" ON financiamento_carro
  FOR ALL USING (auth.uid() = user_id);

-- ====================================
-- PASSO 8: FUNÇÕES ÚTEIS
-- ====================================

-- Função para obter saldo total do usuário
CREATE OR REPLACE FUNCTION obter_saldo_total(usuario_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(saldo_atual), 0)
  FROM contas_bancarias
  WHERE user_id = usuario_id AND ativa = true;
$$ LANGUAGE SQL STABLE;

-- Função para obter total de receitas do mês
CREATE OR REPLACE FUNCTION obter_receitas_mes(usuario_id UUID, mes TEXT)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(valor), 0)
  FROM transacoes
  WHERE user_id = usuario_id 
    AND tipo = 'receita'
    AND mes_referencia = mes;
$$ LANGUAGE SQL STABLE;

-- Função para obter total de despesas do mês
CREATE OR REPLACE FUNCTION obter_despesas_mes(usuario_id UUID, mes TEXT)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(valor), 0)
  FROM transacoes
  WHERE user_id = usuario_id 
    AND tipo = 'despesa'
    AND mes_referencia = mes;
$$ LANGUAGE SQL STABLE;

-- ====================================
-- PASSO 9: VIEWS ÚTEIS
-- ====================================

-- View para resumo mensal
CREATE OR REPLACE VIEW resumo_mensal AS
SELECT 
  user_id,
  mes_referencia,
  SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END) as total_receitas,
  SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END) as total_despesas,
  SUM(CASE WHEN tipo = 'receita' THEN valor ELSE -valor END) as saldo
FROM transacoes
GROUP BY user_id, mes_referencia;

-- View para gastos por categoria
CREATE OR REPLACE VIEW gastos_por_categoria AS
SELECT 
  user_id,
  mes_referencia,
  categoria,
  SUM(valor) as total,
  COUNT(*) as quantidade
FROM transacoes
WHERE tipo = 'despesa'
GROUP BY user_id, mes_referencia, categoria;

-- ====================================
-- CONCLUÍDO!
-- ====================================
-- Agora você tem:
-- ✅ Autenticação com Supabase Auth
-- ✅ Perfis de usuário
-- ✅ Sistema de transações completo
-- ✅ Orçamentos
-- ✅ Contas bancárias
-- ✅ Segurança com RLS
-- ✅ Funções e views úteis
-- ====================================
