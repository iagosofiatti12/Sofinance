-- Normaliza as quebras de linha dentro do corpo das cinco funções do schema public.
--
-- Contexto: estas funções foram criadas em produção a partir de arquivos SQL
-- editados no Windows, então o corpo guardado no Postgres contém CRLF. O banco
-- local, reconstruído pelas migrations, guarda LF. As funções são idênticas na
-- execução, mas o texto difere, e por isso o `supabase db diff --linked` nunca
-- ficava vazio, o que inutiliza a comparação como verificação de sincronia.
--
-- Este arquivo apenas reescreve as mesmas definições com LF. Nenhuma lógica muda,
-- nenhum dado é tocado. O `.gitattributes` adicionado junto impede que o problema
-- volte a acontecer.

SET local check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $function$
BEGIN
  INSERT INTO public.perfis (id, nome_completo)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.obter_despesas_mes (
  usuario_id uuid,
  mes        text
)
  RETURNS numeric
  LANGUAGE sql
  STABLE
  AS $function$
  SELECT COALESCE(SUM(valor), 0)
  FROM transacoes
  WHERE user_id = usuario_id
    AND tipo = 'despesa'
    AND mes_referencia = mes;
$function$;

CREATE OR REPLACE FUNCTION public.obter_receitas_mes (
  usuario_id uuid,
  mes        text
)
  RETURNS numeric
  LANGUAGE sql
  STABLE
  AS $function$
  SELECT COALESCE(SUM(valor), 0)
  FROM transacoes
  WHERE user_id = usuario_id
    AND tipo = 'receita'
    AND mes_referencia = mes;
$function$;

CREATE OR REPLACE FUNCTION public.obter_saldo_total (
  usuario_id uuid
)
  RETURNS numeric
  LANGUAGE sql
  STABLE
  AS $function$
  SELECT COALESCE(SUM(saldo_atual), 0)
  FROM contas_bancarias
  WHERE user_id = usuario_id AND ativa = true;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$function$;
