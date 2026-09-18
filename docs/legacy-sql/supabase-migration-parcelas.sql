-- ============================================
-- MIGRAÇÃO: Sistema de Parcelas e Cartões
-- ============================================
-- Este script adiciona suporte a transações parceladas no cartão de crédito
-- Modelo profissional igual Mobills/Organizze

-- PASSO 1: Adicionar campos na tabela transacoes
-- ============================================

-- Adicionar campos para suporte a cartão de crédito
ALTER TABLE transacoes
ADD COLUMN IF NOT EXISTS cartao_credito_id UUID REFERENCES cartoes_credito(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS parcela_atual INTEGER,
ADD COLUMN IF NOT EXISTS total_parcelas INTEGER,
ADD COLUMN IF NOT EXISTS transacao_pai_id UUID REFERENCES transacoes(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_parcelado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS valor_original DECIMAL(10,2);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_transacoes_cartao ON transacoes(cartao_credito_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_pai ON transacoes(transacao_pai_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_parcelado ON transacoes(is_parcelado) WHERE is_parcelado = true;

-- PASSO 2: Criar view para faturas de cartão
-- ============================================

CREATE OR REPLACE VIEW faturas_cartao AS
SELECT 
  c.id as cartao_id,
  c.user_id,
  c.nome as cartao_nome,
  c.limite_total,
  c.limite_usado,
  to_char(t.data_transacao, 'YYYY-MM') as mes_referencia,
  COUNT(t.id) as total_transacoes,
  SUM(t.valor) as valor_fatura,
  json_agg(
    json_build_object(
      'id', t.id,
      'descricao', t.descricao,
      'valor', t.valor,
      'data', t.data_transacao,
      'categoria', t.categoria,
      'parcela_atual', t.parcela_atual,
      'total_parcelas', t.total_parcelas
    ) ORDER BY t.data_transacao DESC
  ) as transacoes
FROM cartoes_credito c
LEFT JOIN transacoes t ON t.cartao_credito_id = c.id
WHERE t.tipo = 'despesa' OR t.tipo IS NULL
GROUP BY c.id, c.user_id, c.nome, c.limite_total, c.limite_usado, to_char(t.data_transacao, 'YYYY-MM');

-- PASSO 3: Função para criar transação parcelada
-- ============================================

CREATE OR REPLACE FUNCTION criar_transacao_parcelada(
  p_user_id UUID,
  p_descricao TEXT,
  p_valor_total DECIMAL(10,2),
  p_categoria TEXT,
  p_data_primeira_parcela DATE,
  p_cartao_id UUID,
  p_num_parcelas INTEGER,
  p_observacoes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_transacao_pai_id UUID;
  v_valor_parcela DECIMAL(10,2);
  v_mes_atual DATE;
  i INTEGER;
BEGIN
  -- Calcular valor de cada parcela
  v_valor_parcela := ROUND(p_valor_total / p_num_parcelas, 2);
  
  -- Criar transação pai (primeira parcela)
  INSERT INTO transacoes (
    user_id,
    tipo,
    descricao,
    valor,
    valor_original,
    categoria,
    data_transacao,
    mes_referencia,
    cartao_credito_id,
    parcela_atual,
    total_parcelas,
    is_parcelado,
    observacoes,
    metodo_pagamento
  ) VALUES (
    p_user_id,
    'despesa',
    p_descricao || ' (1/' || p_num_parcelas || 'x)',
    v_valor_parcela,
    p_valor_total,
    p_categoria,
    p_data_primeira_parcela,
    to_char(p_data_primeira_parcela, 'YYYY-MM'),
    p_cartao_id,
    1,
    p_num_parcelas,
    true,
    p_observacoes,
    'Crédito'
  ) RETURNING id INTO v_transacao_pai_id;
  
  -- Criar parcelas seguintes
  FOR i IN 2..p_num_parcelas LOOP
    v_mes_atual := p_data_primeira_parcela + (i - 1) * INTERVAL '1 month';
    
    -- Ajustar última parcela para compensar arredondamentos
    IF i = p_num_parcelas THEN
      v_valor_parcela := p_valor_total - (v_valor_parcela * (p_num_parcelas - 1));
    END IF;
    
    INSERT INTO transacoes (
      user_id,
      tipo,
      descricao,
      valor,
      valor_original,
      categoria,
      data_transacao,
      mes_referencia,
      cartao_credito_id,
      parcela_atual,
      total_parcelas,
      is_parcelado,
      transacao_pai_id,
      observacoes,
      metodo_pagamento
    ) VALUES (
      p_user_id,
      'despesa',
      p_descricao || ' (' || i || '/' || p_num_parcelas || 'x)',
      v_valor_parcela,
      p_valor_total,
      p_categoria,
      v_mes_atual,
      to_char(v_mes_atual, 'YYYY-MM'),
      p_cartao_id,
      i,
      p_num_parcelas,
      true,
      v_transacao_pai_id,
      p_observacoes,
      'Crédito'
    );
  END LOOP;
  
  -- Atualizar limite usado do cartão
  UPDATE cartoes_credito
  SET limite_usado = limite_usado + p_valor_total,
      updated_at = now()
  WHERE id = p_cartao_id;
  
  RETURN v_transacao_pai_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 4: Função para calcular fatura do mês
-- ============================================

CREATE OR REPLACE FUNCTION calcular_fatura_cartao(
  p_cartao_id UUID,
  p_mes_referencia TEXT
)
RETURNS TABLE (
  total_fatura DECIMAL(10,2),
  total_transacoes INTEGER,
  transacoes JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(t.valor), 0)::DECIMAL(10,2) as total_fatura,
    COUNT(t.id)::INTEGER as total_transacoes,
    COALESCE(
      json_agg(
        json_build_object(
          'id', t.id,
          'descricao', t.descricao,
          'valor', t.valor,
          'data', t.data_transacao,
          'categoria', t.categoria,
          'parcela', 
            CASE 
              WHEN t.is_parcelado THEN t.parcela_atual || '/' || t.total_parcelas
              ELSE 'À vista'
            END
        ) ORDER BY t.data_transacao DESC
      ),
      '[]'::json
    ) as transacoes
  FROM transacoes t
  WHERE t.cartao_credito_id = p_cartao_id
    AND t.mes_referencia = p_mes_referencia
    AND t.tipo = 'despesa';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 5: Trigger para excluir parcelas quando excluir transação pai
-- ============================================

CREATE OR REPLACE FUNCTION excluir_parcelas_relacionadas()
RETURNS TRIGGER AS $$
BEGIN
  -- Se for transação parcelada (pai), excluir todas as parcelas filhas
  IF OLD.is_parcelado = true AND OLD.transacao_pai_id IS NULL THEN
    DELETE FROM transacoes WHERE transacao_pai_id = OLD.id;
    
    -- Devolver limite ao cartão
    IF OLD.cartao_credito_id IS NOT NULL THEN
      UPDATE cartoes_credito
      SET limite_usado = GREATEST(0, limite_usado - OLD.valor_original),
          updated_at = now()
      WHERE id = OLD.cartao_credito_id;
    END IF;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_excluir_parcelas
BEFORE DELETE ON transacoes
FOR EACH ROW
EXECUTE FUNCTION excluir_parcelas_relacionadas();

-- PASSO 6: Função para pagar fatura (gera transação de débito)
-- ============================================

CREATE OR REPLACE FUNCTION pagar_fatura_cartao(
  p_user_id UUID,
  p_cartao_id UUID,
  p_mes_referencia TEXT,
  p_valor_pago DECIMAL(10,2),
  p_data_pagamento DATE,
  p_conta_bancaria TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_cartao_nome TEXT;
  v_transacao_id UUID;
BEGIN
  -- Buscar nome do cartão
  SELECT nome INTO v_cartao_nome
  FROM cartoes_credito
  WHERE id = p_cartao_id AND user_id = p_user_id;
  
  IF v_cartao_nome IS NULL THEN
    RAISE EXCEPTION 'Cartão não encontrado';
  END IF;
  
  -- Criar transação de pagamento da fatura
  INSERT INTO transacoes (
    user_id,
    tipo,
    descricao,
    valor,
    categoria,
    data_transacao,
    mes_referencia,
    conta_bancaria,
    metodo_pagamento,
    observacoes
  ) VALUES (
    p_user_id,
    'despesa',
    'Pagamento Fatura ' || v_cartao_nome || ' (' || p_mes_referencia || ')',
    p_valor_pago,
    'Cartão de Crédito',
    p_data_pagamento,
    to_char(p_data_pagamento, 'YYYY-MM'),
    p_conta_bancaria,
    'PIX',
    'Pagamento de fatura do cartão de crédito'
  ) RETURNING id INTO v_transacao_id;
  
  -- Atualizar limite do cartão (devolver o limite pago)
  UPDATE cartoes_credito
  SET limite_usado = GREATEST(0, limite_usado - p_valor_pago),
      updated_at = now()
  WHERE id = p_cartao_id;
  
  RETURN v_transacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- PASSO 7: Atualizar RLS policies
-- ============================================

-- Garantir que usuário só vê suas próprias faturas
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;

-- Policy já existe, mas vamos garantir
DROP POLICY IF EXISTS "Usuários podem ver suas transações" ON transacoes;
CREATE POLICY "Usuários podem ver suas transações" 
  ON transacoes FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem criar suas transações" ON transacoes;
CREATE POLICY "Usuários podem criar suas transações" 
  ON transacoes FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem atualizar suas transações" ON transacoes;
CREATE POLICY "Usuários podem atualizar suas transações" 
  ON transacoes FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar suas transações" ON transacoes;
CREATE POLICY "Usuários podem deletar suas transações" 
  ON transacoes FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================
-- MIGRAÇÃO COMPLETA!
-- ============================================

-- Comentários finais:
COMMENT ON COLUMN transacoes.cartao_credito_id IS 'ID do cartão usado (quando método = Crédito)';
COMMENT ON COLUMN transacoes.parcela_atual IS 'Número da parcela atual (ex: 3 de 12)';
COMMENT ON COLUMN transacoes.total_parcelas IS 'Total de parcelas da compra';
COMMENT ON COLUMN transacoes.transacao_pai_id IS 'ID da primeira parcela (transação pai)';
COMMENT ON COLUMN transacoes.is_parcelado IS 'Indica se é uma transação parcelada';
COMMENT ON COLUMN transacoes.valor_original IS 'Valor total da compra (antes de dividir nas parcelas)';

COMMENT ON FUNCTION criar_transacao_parcelada IS 'Cria uma compra parcelada no cartão, gerando automaticamente N parcelas';
COMMENT ON FUNCTION calcular_fatura_cartao IS 'Calcula o valor total da fatura de um cartão em um mês específico';
COMMENT ON FUNCTION pagar_fatura_cartao IS 'Registra o pagamento de uma fatura e ajusta o limite do cartão';

-- ✅ Pronto! Execute este script no Supabase SQL Editor
