-- ====================================
-- SOFINANCE - Scripts SQL para Supabase
-- ====================================

-- Criação das Tabelas
-- Execute estes comandos no SQL Editor do Supabase

-- 1. Tabela de Contas Fixas
CREATE TABLE contas_fixas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  categoria TEXT NOT NULL,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Tabela de Cartões de Crédito
CREATE TABLE cartoes_credito (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome_cartao TEXT NOT NULL,
  limite_total NUMERIC(10, 2) NOT NULL,
  limite_usado NUMERIC(10, 2) DEFAULT 0,
  dia_fechamento INTEGER NOT NULL CHECK (dia_fechamento >= 1 AND dia_fechamento <= 31),
  dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento >= 1 AND dia_vencimento <= 31),
  bandeira TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Tabela de Transações de Cartão
CREATE TABLE transacoes_cartao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cartao_id UUID NOT NULL REFERENCES cartoes_credito(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  data_compra DATE NOT NULL,
  categoria TEXT NOT NULL,
  parcelado BOOLEAN DEFAULT false,
  num_parcelas INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tabela de Financiamento Imobiliário
CREATE TABLE financiamento_imovel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  valor_total NUMERIC(12, 2) NOT NULL,
  valor_financiado NUMERIC(12, 2) NOT NULL,
  taxa_juros NUMERIC(5, 2) NOT NULL,
  num_parcelas INTEGER NOT NULL,
  parcela_valor NUMERIC(10, 2) NOT NULL,
  parcelas_pagas INTEGER DEFAULT 0,
  taxa_obra NUMERIC(10, 2) DEFAULT 0,
  data_inicio DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Tabela de Financiamento de Veículo
CREATE TABLE financiamento_carro (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  modelo_carro TEXT NOT NULL,
  valor_total NUMERIC(12, 2) NOT NULL,
  valor_entrada NUMERIC(12, 2) NOT NULL,
  valor_financiado NUMERIC(12, 2) NOT NULL,
  taxa_juros NUMERIC(5, 2) NOT NULL,
  num_parcelas INTEGER NOT NULL,
  parcela_valor NUMERIC(10, 2) NOT NULL,
  parcelas_pagas INTEGER DEFAULT 0,
  data_inicio DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Tabela de Metas e Desejos
CREATE TABLE metas_desejos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  valor_meta NUMERIC(12, 2) NOT NULL,
  valor_guardado NUMERIC(12, 2) DEFAULT 0,
  prazo_meses INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ====================================
-- Índices para Melhor Performance
-- ====================================

CREATE INDEX idx_contas_fixas_user ON contas_fixas(user_id);
CREATE INDEX idx_cartoes_credito_user ON cartoes_credito(user_id);
CREATE INDEX idx_transacoes_cartao_cartao ON transacoes_cartao(cartao_id);
CREATE INDEX idx_financiamento_imovel_user ON financiamento_imovel(user_id);
CREATE INDEX idx_financiamento_carro_user ON financiamento_carro(user_id);
CREATE INDEX idx_metas_desejos_user ON metas_desejos(user_id);

-- ====================================
-- Row Level Security (RLS)
-- ====================================
-- IMPORTANTE: Configure RLS no Supabase para segurança em produção
-- Para demo/desenvolvimento, você pode desabilitar RLS ou criar políticas permissivas

-- Habilitar RLS em todas as tabelas
ALTER TABLE contas_fixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartoes_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE financiamento_imovel ENABLE ROW LEVEL SECURITY;
ALTER TABLE financiamento_carro ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas_desejos ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajuste conforme necessidade)
-- Para desenvolvimento/demo, você pode usar políticas permissivas:

-- Contas Fixas
CREATE POLICY "Enable all for demo" ON contas_fixas FOR ALL USING (true);

-- Cartões de Crédito
CREATE POLICY "Enable all for demo" ON cartoes_credito FOR ALL USING (true);

-- Transações
CREATE POLICY "Enable all for demo" ON transacoes_cartao FOR ALL USING (true);

-- Financiamento Imóvel
CREATE POLICY "Enable all for demo" ON financiamento_imovel FOR ALL USING (true);

-- Financiamento Carro
CREATE POLICY "Enable all for demo" ON financiamento_carro FOR ALL USING (true);

-- Metas
CREATE POLICY "Enable all for demo" ON metas_desejos FOR ALL USING (true);

-- ====================================
-- Dados de Exemplo (OPCIONAL)
-- ====================================
-- Descomente para inserir dados de teste

/*
-- Contas Fixas
INSERT INTO contas_fixas (user_id, nome, valor, dia_vencimento, categoria, ativa) VALUES
('demo-user', 'Aluguel', 1200.00, 5, 'Moradia', true),
('demo-user', 'Energia Elétrica', 150.00, 10, 'Moradia', true),
('demo-user', 'Internet', 99.90, 15, 'Moradia', true),
('demo-user', 'Netflix', 39.90, 8, 'Lazer', true),
('demo-user', 'Academia', 89.00, 1, 'Saúde', true);

-- Cartões de Crédito
INSERT INTO cartoes_credito (user_id, nome_cartao, limite_total, limite_usado, dia_fechamento, dia_vencimento, bandeira) VALUES
('demo-user', 'Nubank Ultravioleta', 15000.00, 3280.50, 15, 25, 'Mastercard'),
('demo-user', 'Itaú Personnalité', 20000.00, 1850.00, 10, 20, 'Visa');

-- Metas
INSERT INTO metas_desejos (user_id, nome, valor_meta, valor_guardado, prazo_meses) VALUES
('demo-user', 'Viagem para Europa', 15000.00, 4500.00, 12),
('demo-user', 'iPhone 15 Pro Max', 8500.00, 2100.00, 6),
('demo-user', 'Fundo de Emergência', 30000.00, 12000.00, 18);
*/

-- ====================================
-- FIM DO SCRIPT
-- ====================================
