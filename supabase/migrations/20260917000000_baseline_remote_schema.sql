SET local check_function_bodies = off;

CREATE TABLE "public"."cartoes_credito" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        uuid                     NOT NULL,
  "nome_cartao"    text                     NOT NULL,
  "limite_total"   numeric(10,2)            NOT NULL,
  "limite_usado"   numeric(10,2)            DEFAULT 0,
  "dia_fechamento" integer                  NOT NULL,
  "dia_vencimento" integer                  NOT NULL,
  "bandeira"       text                     NOT NULL,
  "created_at"     timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"     timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "cartoes_credito_dia_fechamento_check" CHECK (((dia_fechamento >= 1) AND (dia_fechamento <= 31))),
  CONSTRAINT "cartoes_credito_dia_vencimento_check" CHECK (((dia_vencimento >= 1) AND (dia_vencimento <= 31))),
  CONSTRAINT "cartoes_credito_pkey" PRIMARY KEY (id),
  CONSTRAINT "chk_dias_diferentes" CHECK ((dia_fechamento <> dia_vencimento)),
  CONSTRAINT "chk_limite_usado" CHECK ((limite_usado >= (0)::numeric))
);

ALTER TABLE "public"."cartoes_credito"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."contas_bancarias" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     uuid                     NOT NULL,
  "nome"        text                     NOT NULL,
  "tipo"        text                     NOT NULL,
  "saldo_atual" numeric(10,2)            DEFAULT 0,
  "cor"         text                     DEFAULT '#000000'::text,
  "ativa"       boolean                  DEFAULT true,
  "created_at"  timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"  timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "contas_bancarias_pkey" PRIMARY KEY (id),
  CONSTRAINT "contas_bancarias_tipo_check" CHECK ((tipo = ANY (ARRAY['corrente'::text, 'poupanca'::text, 'investimento'::text])))
);

ALTER TABLE "public"."contas_bancarias"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."contas_fixas" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        uuid                     NOT NULL,
  "nome"           text                     NOT NULL,
  "valor"          numeric(10,2)            NOT NULL,
  "dia_vencimento" integer                  NOT NULL,
  "categoria"      text                     NOT NULL,
  "ativa"          boolean                  DEFAULT true,
  "created_at"     timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "chk_valor" CHECK ((valor > (0)::numeric)),
  CONSTRAINT "contas_fixas_dia_vencimento_check" CHECK (((dia_vencimento >= 1) AND (dia_vencimento <= 31))),
  CONSTRAINT "contas_fixas_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."contas_fixas"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."financiamento_carro" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"          uuid                     NOT NULL,
  "modelo_carro"     text                     NOT NULL,
  "valor_total"      numeric(12,2)            NOT NULL,
  "valor_entrada"    numeric(12,2)            NOT NULL,
  "valor_financiado" numeric(12,2)            NOT NULL,
  "taxa_juros"       numeric(5,2)             NOT NULL,
  "num_parcelas"     integer                  NOT NULL,
  "parcela_valor"    numeric(10,2)            NOT NULL,
  "parcelas_pagas"   integer                  DEFAULT 0,
  "data_inicio"      date                     NOT NULL,
  "created_at"       timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "chk_valor_entrada" CHECK ((valor_entrada < valor_total)),
  CONSTRAINT "financiamento_carro_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."financiamento_carro"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."financiamento_imovel" (
  "id"               uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"          uuid                     NOT NULL,
  "valor_total"      numeric(12,2)            NOT NULL,
  "valor_financiado" numeric(12,2)            NOT NULL,
  "taxa_juros"       numeric(5,2)             NOT NULL,
  "num_parcelas"     integer                  NOT NULL,
  "parcela_valor"    numeric(10,2)            NOT NULL,
  "parcelas_pagas"   integer                  DEFAULT 0,
  "taxa_obra"        numeric(10,2)            DEFAULT 0,
  "data_inicio"      date                     NOT NULL,
  "created_at"       timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "financiamento_imovel_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."financiamento_imovel"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."metas_desejos" (
  "id"             uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        uuid                     NOT NULL,
  "nome"           text                     NOT NULL,
  "valor_meta"     numeric(12,2)            NOT NULL,
  "valor_guardado" numeric(12,2)            DEFAULT 0,
  "prazo_meses"    integer,
  "created_at"     timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "chk_valor_guardado" CHECK ((valor_guardado <= valor_meta)),
  CONSTRAINT "metas_desejos_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."metas_desejos"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."orcamentos" (
  "id"              uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"         uuid                     NOT NULL,
  "categoria"       text                     NOT NULL,
  "mes_referencia"  text                     NOT NULL,
  "valor_planejado" numeric(10,2)            NOT NULL,
  "tipo"            text                     NOT NULL,
  "created_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"      timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "orcamentos_pkey" PRIMARY KEY (id),
  CONSTRAINT "orcamentos_tipo_check" CHECK ((tipo = ANY (ARRAY['receita'::text, 'despesa'::text]))),
  CONSTRAINT "orcamentos_valor_planejado_check" CHECK ((valor_planejado >= (0)::numeric)),
  CONSTRAINT "unique_orcamento_categoria_mes" UNIQUE (user_id, categoria, mes_referencia, tipo)
);

ALTER TABLE "public"."orcamentos"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."perfis" (
  "id"              uuid                     NOT NULL,
  "nome_completo"   text,
  "avatar_url"      text,
  "telefone"        text,
  "data_nascimento" date,
  "created_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"      timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "perfis_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."perfis"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."transacoes_cartao" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "cartao_id"    uuid                     NOT NULL,
  "descricao"    text                     NOT NULL,
  "valor"        numeric(10,2)            NOT NULL,
  "data_compra"  date                     NOT NULL,
  "categoria"    text                     NOT NULL,
  "parcelado"    boolean                  DEFAULT false,
  "num_parcelas" integer                  DEFAULT 1,
  "created_at"   timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "chk_num_parcelas" CHECK (((NOT parcelado) OR (num_parcelas > 0))),
  CONSTRAINT "transacoes_cartao_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."transacoes_cartao"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."transacoes" (
  "id"                uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"           uuid                     NOT NULL,
  "tipo"              text                     NOT NULL,
  "categoria"         text                     NOT NULL,
  "descricao"         text                     NOT NULL,
  "valor"             numeric(10,2)            NOT NULL,
  "data_transacao"    date                     NOT NULL DEFAULT CURRENT_DATE,
  "mes_referencia"    text                     NOT NULL,
  "conta_bancaria"    text,
  "metodo_pagamento"  text,
  "observacoes"       text,
  "anexo_url"         text,
  "origem"            text,
  "origem_id"         uuid,
  "recorrente"        boolean                  DEFAULT false,
  "created_at"        timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"        timestamp with time zone DEFAULT timezone('utc'::text, now()),
  "cartao_credito_id" uuid,
  "is_parcelado"      boolean                  NOT NULL DEFAULT false,
  "parcela_atual"     integer,
  "total_parcelas"    integer,
  "transacao_pai_id"  uuid,
  "valor_original"    numeric(10,2),
  CONSTRAINT "transacoes_pkey" PRIMARY KEY (id),
  CONSTRAINT "transacoes_tipo_check" CHECK ((tipo = ANY (ARRAY['receita'::text, 'despesa'::text]))),
  CONSTRAINT "transacoes_valor_check" CHECK ((valor > (0)::numeric))
);

ALTER TABLE "public"."transacoes"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."usuarios" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "nome"       text                     NOT NULL,
  "email"      text                     NOT NULL,
  "senha_hash" text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "usuarios_email_key" UNIQUE (email),
  CONSTRAINT "usuarios_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."usuarios"
  ENABLE ROW LEVEL SECURITY;

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

ALTER TABLE "public"."cartoes_credito"
  ADD CONSTRAINT "fk_cartoes_user_id" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."contas_bancarias"
  ADD CONSTRAINT "contas_bancarias_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."contas_fixas"
  ADD CONSTRAINT "fk_contas_user_id" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."financiamento_carro"
  ADD CONSTRAINT "fk_financiamento_carro_user_id" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."financiamento_imovel"
  ADD CONSTRAINT "fk_financiamento_imovel_user_id" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."metas_desejos"
  ADD CONSTRAINT "fk_metas_user_id" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."orcamentos"
  ADD CONSTRAINT "orcamentos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."perfis"
  ADD CONSTRAINT "perfis_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."transacoes"
  ADD CONSTRAINT "transacoes_cartao_credito_id_fkey" FOREIGN KEY (cartao_credito_id) REFERENCES public.cartoes_credito(id) ON DELETE SET NULL;

ALTER TABLE "public"."transacoes"
  ADD CONSTRAINT "transacoes_transacao_pai_id_fkey" FOREIGN KEY (transacao_pai_id) REFERENCES public.transacoes(id) ON DELETE CASCADE;

ALTER TABLE "public"."transacoes"
  ADD CONSTRAINT "transacoes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."transacoes_cartao"
  ADD CONSTRAINT "transacoes_cartao_cartao_id_fkey" FOREIGN KEY (cartao_id) REFERENCES public.cartoes_credito(id) ON DELETE CASCADE;

CREATE VIEW "public"."gastos_por_categoria" WITH (security_invoker=true) AS  SELECT user_id,
    mes_referencia,
    categoria,
    sum(valor) AS total,
    count(*) AS quantidade
   FROM public.transacoes
  WHERE (tipo = 'despesa'::text)
  GROUP BY user_id, mes_referencia, categoria;

CREATE VIEW "public"."resumo_mensal" WITH (security_invoker=true) AS  SELECT user_id,
    mes_referencia,
    sum(
        CASE
            WHEN (tipo = 'receita'::text) THEN valor
            ELSE (0)::numeric
        END) AS total_receitas,
    sum(
        CASE
            WHEN (tipo = 'despesa'::text) THEN valor
            ELSE (0)::numeric
        END) AS total_despesas,
    sum(
        CASE
            WHEN (tipo = 'receita'::text) THEN valor
            ELSE (- valor)
        END) AS saldo
   FROM public.transacoes
  GROUP BY user_id, mes_referencia;

CREATE INDEX idx_cartoes_credito_user ON public.cartoes_credito USING btree (user_id);

CREATE INDEX idx_cartoes_user_id ON public.cartoes_credito USING btree (user_id);

CREATE INDEX idx_contas_bancarias_user_id ON public.contas_bancarias USING btree (user_id);

CREATE INDEX idx_contas_fixas_user ON public.contas_fixas USING btree (user_id);

CREATE INDEX idx_financiamento_carro_user ON public.financiamento_carro USING btree (user_id);

CREATE INDEX idx_financiamento_imovel_user ON public.financiamento_imovel USING btree (user_id);

CREATE INDEX idx_metas_desejos_user ON public.metas_desejos USING btree (user_id);

CREATE INDEX idx_orcamentos_mes ON public.orcamentos USING btree (mes_referencia);

CREATE INDEX idx_orcamentos_user_id ON public.orcamentos USING btree (user_id);

CREATE INDEX idx_transacoes_cartao_cartao ON public.transacoes_cartao USING btree (cartao_id);

CREATE INDEX idx_transacoes_cartao_id ON public.transacoes_cartao USING btree (cartao_id);

CREATE INDEX idx_transacoes_cartao ON public.transacoes USING btree (cartao_credito_id);

CREATE INDEX idx_transacoes_categoria ON public.transacoes USING btree (categoria);

CREATE INDEX idx_transacoes_data ON public.transacoes USING btree (data_transacao);

CREATE INDEX idx_transacoes_mes_referencia ON public.transacoes USING btree (mes_referencia);

CREATE INDEX idx_transacoes_tipo ON public.transacoes USING btree (tipo);

CREATE INDEX idx_transacoes_user_id ON public.transacoes USING btree (user_id);

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER trigger_set_updated_at
  BEFORE UPDATE ON public.cartoes_credito
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE POLICY "Usuários podem gerenciar seus cartões" ON "public"."cartoes_credito"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Usuários podem gerenciar suas contas bancárias" ON "public"."contas_bancarias"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Usuários podem gerenciar suas contas fixas" ON "public"."contas_fixas"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Usuários podem gerenciar financiamento carro" ON "public"."financiamento_carro"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Usuários podem gerenciar financiamento imóvel" ON "public"."financiamento_imovel"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Usuários podem gerenciar suas metas" ON "public"."metas_desejos"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Usuários podem gerenciar seus orçamentos" ON "public"."orcamentos"
  FOR ALL
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Usuários podem atualizar seu próprio perfil" ON "public"."perfis"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = id));

CREATE POLICY "Usuários podem inserir seu próprio perfil" ON "public"."perfis"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = id));

CREATE POLICY "Usuários podem ver seu próprio perfil" ON "public"."perfis"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = id));

CREATE POLICY "Usuários podem atualizar suas transações" ON "public"."transacoes"
  FOR UPDATE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Usuários podem criar suas transações" ON "public"."transacoes"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "Usuários podem deletar suas transações" ON "public"."transacoes"
  FOR DELETE
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Usuários podem ver suas transações" ON "public"."transacoes"
  FOR SELECT
  TO PUBLIC
  USING ((auth.uid() = user_id));

CREATE POLICY "Usuários podem atualizar transações de seus cartões" ON "public"."transacoes_cartao"
  FOR UPDATE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.cartoes_credito
  WHERE ((cartoes_credito.id = transacoes_cartao.cartao_id) AND (cartoes_credito.user_id = auth.uid())))));

CREATE POLICY "Usuários podem criar transações em seus cartões" ON "public"."transacoes_cartao"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((EXISTS ( SELECT 1
   FROM public.cartoes_credito
  WHERE ((cartoes_credito.id = transacoes_cartao.cartao_id) AND (cartoes_credito.user_id = auth.uid())))));

CREATE POLICY "Usuários podem deletar transações de seus cartões" ON "public"."transacoes_cartao"
  FOR DELETE
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.cartoes_credito
  WHERE ((cartoes_credito.id = transacoes_cartao.cartao_id) AND (cartoes_credito.user_id = auth.uid())))));

CREATE POLICY "Usuários podem ver transações de seus cartões" ON "public"."transacoes_cartao"
  FOR SELECT
  TO PUBLIC
  USING ((EXISTS ( SELECT 1
   FROM public.cartoes_credito
  WHERE ((cartoes_credito.id = transacoes_cartao.cartao_id) AND (cartoes_credito.user_id = auth.uid())))));

GRANT EXECUTE ON FUNCTION "public"."handle_new_user"() TO PUBLIC, "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."obter_despesas_mes"(uuid, text) TO PUBLIC, "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."obter_receitas_mes"(uuid, text) TO PUBLIC, "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."obter_saldo_total"(uuid) TO PUBLIC, "authenticated", "postgres", "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_updated_at"() TO PUBLIC, "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."cartoes_credito" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."contas_bancarias" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."contas_fixas" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."financiamento_carro" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."financiamento_imovel" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."metas_desejos" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."orcamentos" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."perfis" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."transacoes" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."transacoes_cartao" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."usuarios" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."gastos_por_categoria" TO "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."resumo_mensal" TO "authenticated", "postgres", "service_role";

