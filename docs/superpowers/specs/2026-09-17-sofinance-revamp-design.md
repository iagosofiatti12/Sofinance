# Sofinance — Plano de Reestruturação (Complete Product Revamp)

**Data:** 2026-09-17
**Autor:** Claude (Fable 5.1), a pedido de Iago Sofiatti
**Status:** **Aprovado por Iago em 2026-09-17** com ajustes (ver seção 13: cartão de crédito simplificado, design de referência, automações, beta e auditoria autorizados). Nenhuma alteração de código de produto foi feita.
**Escopo:** refactoring, redesign, revamp, modernização, reengenharia e melhoria contínua do Sofinance para lançamento público multiusuário.

---

## 0. Sumário executivo

O Sofinance hoje é um **MVP pessoal bem-intencionado e visualmente cuidado**, mas que **não está pronto para receber outros usuários**. Ele foi escrito para uma pessoa, com pressupostos de uma pessoa (um financiamento por usuário, categorias fixas, contas bancárias como texto livre) e com atalhos aceitáveis num projeto pessoal, mas perigosos em produção pública (políticas de RLS permissivas ainda presentes no script inicial, funções `SECURITY DEFINER` que aceitam `user_id` vindo do cliente, exclusão de conta que não exclui nada de verdade).

**Nota geral: 4,2 / 10.** Boa base de UI e de intenção de produto, arquitetura frágil, segurança insuficiente para público e regras de negócio financeiras abaixo do padrão de mercado (Mobills, Organizze, Minhas Economias).

**Recomendação:** não fazer um "big bang rewrite". Fazer um **revamp em fases, no mesmo repositório**, começando por **segurança e estabilização (Fase 0)**, depois **fundação técnica (Fase 1)**, depois **remodelagem do domínio financeiro (Fase 2)**, **redesign (Fase 3)** e por fim **preparação para público e lançamento (Fase 4)**, com diferenciação (Fase 5) depois do lançamento. Estimativa total até o lançamento público: **10 a 14 semanas** de trabalho de 1 desenvolvedor apoiado por Claude Code com subagentes.

A seção 9 define as **skills, MCPs e o agente "Engenheiro Sênior Sofinance"** que vão executar esse plano.

---

## 1. Diagnóstico do estado atual

### 1.1 Stack e arquitetura (como está)

| Camada | Hoje |
|---|---|
| Frontend | React 18.2, Vite 5, JavaScript puro (sem TypeScript), CSS artesanal (~3.600 linhas), Recharts, lucide-react + react-icons, react-hot-toast, Zod 4 |
| Roteamento | **Não existe.** Navegação por `useState('activeSection')` em `App.jsx`. Sem URLs, sem deep link, sem botão voltar, refresh volta ao dashboard |
| Estado/dados | `useState` + `useEffect` em cada tela; cada componente chama serviços diretamente; sem cache, sem invalidação, sem estado global além de `AuthContext` |
| Backend | Supabase (Postgres + Auth + RPC). SQL espalhado em 5 arquivos manuais, sem migrations versionadas nem CLI |
| Deploy | Vercel (SPA rewrite) |
| Testes | 1 teste, quebrado (seletores inexistentes, sem mock do Supabase) |
| CI/CD | Nenhum |
| Observabilidade | Nenhuma (sem Sentry, sem analytics) |

Estrutura de código: `components/<Feature>/<Feature>List.jsx` com 300 a 600 linhas cada, misturando busca de dados, validação, formulário, modal e listagem. Modais, formulários e máscaras monetárias estão **copiados e colados** em 7 arquivos (o mesmo `onChange` de moeda aparece 12 vezes).

### 1.2 Avaliação por módulo

| Módulo | Nota | Comentário |
|---|---|---|
| Autenticação | 5 | Login/cadastro/Google funcionam. Faltam: esqueci a senha (serviço existe, UI não), reenviar confirmação, rota `/reset-password` (não existe, o link do e-mail cai no dashboard), login Microsoft é código morto |
| Dashboard | 4 | Estado inicial com valores **fictícios hardcoded** (R$ 5.420,50 / R$ 3.280,00). "Saldo Total" é na verdade o saldo do mês. `getResumoMensal` chama uma RPC que retorna um número, mas o código espera um objeto: o saldo vira `undefined`. "Próximos vencimentos" ignora virada de mês. Texto de metas é fixo ("Continue assim!") |
| Extrato (transações) | 6 | Melhor módulo. Parcelamento no cartão via RPC é bom. Problemas: edição envia `cartao_credito_id: ''` para coluna UUID (erro), não ajusta limite ao editar/excluir compra à vista no crédito, typo "Receúita", categorias de receita hardcoded no componente, data com bug de fuso (UTC) |
| Contas fixas | 4 | São só lembretes. **Nunca viram transações**, então não afetam saldo, extrato nem gráficos. As colunas `origem`/`origem_id` da tabela `transacoes` existem para isso e não são usadas. "Dias restantes" assume mês de 30 dias |
| Cartões e fatura | 4 | Fatura calculada pelo **mês da compra**, ignorando `dia_fechamento`. Isso é o erro mais visível para quem já usou Mobills/Organizze. `limite_usado` é desnormalizado e atualizado por read-modify-write no cliente (deriva com o tempo). A RPC `pagar_fatura_cartao` e a view `faturas_cartao` referenciam `c.nome`, mas a coluna é `nome_cartao`: **pagar fatura está quebrado** a menos que o banco tenha sido corrigido à mão. `criar_transacao_parcelada` atualiza `updated_at` em `cartoes_credito`, coluna que o `supabase-setup.sql` não cria |
| Metas | 5 | Funciona, mas "Adicionar valor" usa `window.prompt`, sem histórico de aportes, e "meses restantes" ignora o tempo já decorrido |
| Financiamentos | 3 | Modelado para **uma pessoa**: uma tabela por tipo (imóvel, carro), `.single()` = um financiamento por usuário. Saldo devedor = parcelas restantes × parcela (ignora amortização SAC/Price). Deveria ser um módulo genérico de "Dívidas e empréstimos" |
| Configurações | 3 | `deleteAccount` apaga tabelas que **não existem** (`faturas`, `parcelas`, `financiamentos`, `metas`, `profiles`), ignora `transacoes` e nunca apaga o usuário do Auth. Os erros são engolidos. O usuário acha que excluiu a conta e não excluiu |
| Design system | 6 | Tokens CSS bem definidos, dark mode, glassmorphism bonito. Mas: `scale`/`translate` em hover de todos os cards (jitter com conteúdo), sem `prefers-reduced-motion`, toggle de tema flutuando sobre o conteúdo, `Header.jsx` nunca usado, 4 padrões diferentes de loading, favicon de **2 MB** e GIF de loading de 500 KB |

### 1.3 Bugs e defeitos encontrados (verificados no código)

**Críticos (bloqueiam lançamento público)**

1. **RLS permissiva.** `supabase-setup.sql` cria políticas `"Enable all for demo" ... USING (true)` em 6 tabelas. `supabase-migration-auth.sql` cria as políticas corretas, mas **nunca dropa as permissivas**. Em Postgres, políticas são combinadas com OR: se as de demo ainda existirem no banco, **qualquer usuário autenticado (e possivelmente o anon) lê e altera dados de todos**. Precisa de auditoria imediata no projeto Supabase real.
2. **Funções `SECURITY DEFINER` confiam no cliente.** `criar_transacao_parcelada(p_user_id, ...)` e `pagar_fatura_cartao(p_user_id, ...)` aceitam `user_id` como parâmetro. `calcular_fatura_cartao(p_cartao_id, ...)` não verifica dono. Qualquer usuário pode inserir transações em outra conta ou ler a fatura de outro cartão passando IDs. Devem usar `auth.uid()` e verificar posse.
3. **Exclusão de conta não exclui** (ver 1.2). Violação de LGPD (direito à eliminação) e de expectativa do usuário.
4. **Fatura do cartão errada** (mês da compra em vez de ciclo de fechamento) e RPC de pagamento referenciando coluna inexistente.

**Altos**

5. **Confirmado em execução:** Zod instalado é 4.3.6 e o código usa API da versão 3. Na v4, `error.errors` não existe (só `error.issues`) e `errorMap` é ignorado. Resultado: `validateData` lança `TypeError` em toda falha de validação (Cartões, Contas fixas, Metas, Financiamentos) em vez de mostrar a mensagem ao usuário.
6. **Confirmado em execução:** `npm run lint` falha ("ESLint couldn't find an eslint.config.js"): ESLint 9 com `.eslintrc.json` legado. Ninguém roda lint neste projeto hoje.
7. Dashboard com valores fictícios e resumo mensal `undefined` (item 1.2).
8. Datas: `new Date().toISOString().split('T')[0]` usa UTC (à noite no Brasil vira o dia seguinte) e `new Date('YYYY-MM-DD')` é interpretado como UTC meia-noite, exibindo o dia anterior em `pt-BR`.
9. Edição de transação envia campos inválidos (`cartao_credito_id: ''`, `num_parcelas`) para o `update`.
10. `limite_usado` deriva: compra à vista no crédito excluída não devolve limite (o trigger só trata parceladas), edição não ajusta, concorrência não é tratada.
11. Sem rotas: `/reset-password` não existe, então redefinição de senha não funciona.

**Médios**

12. Contas fixas não geram lançamentos; tabelas `contas_bancarias` e `orcamentos` existem sem UI; tabela `transacoes_cartao` e funções `cartoesService.getTransacoes/addTransacao/deleteTransacao` são legado morto.
13. `confirm`/`prompt` nativos para ações destrutivas e aporte em metas.
14. Categorias fixas, sem ícone, cor, subcategoria ou personalização.
15. Conta bancária é texto livre por transação.
16. `getEvolucaoMensal` faz 6 consultas em vez de 1 (a view `resumo_mensal` já existe e não é usada).
17. Nomes inconsistentes: `perfis` vs `profiles`, `nome` vs `nome_cartao`, `metas_desejos`.
18. `react-icons` importado só pelo ícone do Google (lucide já cobre); `date-fns` usado em um lugar.
19. `EXEMPLOS-UX-QUICK-WINS.jsx` e `UX-QUICK-WINS.md` na raiz do repositório (documentação de sessão, não do produto).
20. `logo-icon.png` 2 MB como favicon; `loading-icon.gif` 500 KB.

### 1.4 Segurança e conformidade

| Item | Estado | Necessário para público |
|---|---|---|
| RLS | Enfraquecida (item 1) | Políticas estritas por tabela, testadas com `pgTAP` ou testes de integração |
| RPCs | Inseguras (item 2) | `auth.uid()` interno, `SECURITY INVOKER` quando possível, `REVOKE EXECUTE FROM anon` |
| Exclusão de conta | Não funciona | Edge Function com service role: apaga dados, storage e `auth.users` |
| LGPD | Nada | Termos de uso, política de privacidade, consentimento no cadastro, exportação de dados (portabilidade), eliminação, registro de base legal |
| Senhas | Mínimo 6 caracteres | Mínimo 8, checagem de senha vazada (Supabase Auth suporta HaveIBeenPwned), rate limit |
| Sessão | localStorage | Aceitável para SPA; considerar PKCE (padrão no supabase-js atual) e refresh silencioso |
| Secrets | `.env` ignorado, ok | Manter. Nunca expor `service_role` no cliente |
| Cabeçalhos | Nenhum | CSP, HSTS e afins via `vercel.json` |

### 1.5 Qualidade de código e experiência de desenvolvimento

Verificação executada em 2026-09-17 (após `npm install`):

| Comando | Resultado |
|---|---|
| `npm run lint` | **Falha**: ESLint 9 exige `eslint.config.js` |
| `npx vitest run` | **Falha na importação**: `supabaseClient.js` lança erro sem `.env`; o único teste nem chega a rodar (e seus seletores não existem na tela) |
| `npm run build` | Passa, mas gera **um único chunk de 910 KB** (248 KB gzip) sem code-splitting; `dist/` com 3,6 MB por causa das imagens |

- **Sem TypeScript**: os bugs 5, 7 e 9 seriam pegos em compilação.
- **Sem camada de dados**: cada tela repete `loading/try/catch/toast`. Sem cache: trocar de aba refaz todas as consultas.
- **Sem testes reais**, sem CI, sem pre-commit.
- **Lógica de negócio no cliente** (limite, fatura, resumo) e duplicada no banco. Deve ficar **em um lugar só**: no banco (views/funções) ou em um módulo de domínio puro e testável.
- **SQL não versionado**: cinco scripts com histórico contraditório (`usuarios` custom, depois `auth.users`; `fix-demo-user` cria tabela com coluna `senha_hash` que não existe no `CREATE TABLE`). Impossível reproduzir o banco do zero com confiança.

### 1.6 UX/UI

Pontos fortes: identidade visual consistente, dark mode, empty states, toasts, acessibilidade básica (`aria-label`, `role`). Pontos fracos: sem navegação por URL, modais sem `Escape`/foco preso, formulários sem biblioteca (validação inconsistente entre telas), sidebar vira barra inferior em mobile mas as telas não foram desenhadas mobile-first, nenhum onboarding para usuário novo (cai num dashboard vazio com quatro cards zerados), termos técnicos ("Financ. Imóvel", "Extrato Mensal").

### 1.7 Scorecard consolidado

| Dimensão | Nota (0–10) |
|---|---|
| Arquitetura de software | 4 |
| Modelo de dados | 4 |
| Segurança | 3 |
| Regras de negócio financeiras | 4 |
| Funcionalidades vs. mercado | 5 |
| UX/UI | 6 |
| Qualidade de código | 4 |
| Testes e CI | 1 |
| Performance | 5 |
| Prontidão multiusuário/produção | 3 |
| **Média** | **4,2** |

---

## 2. Mercado (Brasil, 2026)

### 2.1 Concorrentes e preços

| App | Modelo | Preço premium (referência 2026) | Destaques |
|---|---|---|---|
| Mobills | Freemium | ~R$ 18/mês, R$ 96 a R$ 99,90/ano (promoções de 2 anos por R$ 199,90) | Mais completo: sync bancário (Open Finance), planejamento, relatórios, web + mobile |
| Organizze | Freemium (trial 7 dias) | ~R$ 17,90/mês, faixas até R$ 599,90 | Interface limpa, importação Open Finance, limite por categoria, lembretes |
| Minhas Economias | Freemium | R$ 99,90/ano | Manual + Open Finance, orçamento com alertas, metas |
| Money Lover, Monefy, Spendee, Fin, Buddy | Freemium | R$ 100 a R$ 280/ano | Nichos: simplicidade, multi-moeda, compartilhamento |
| Serasa "Minhas Contas" | Grátis | — | Agregação de contas por CPF, alertas |

Fontes: [Encaixei comparativo de preços](https://www.encaixei.com.br/comparativo-de-precos-apps-financas), [Canaltech: Organizze ou Mobills](https://canaltech.com.br/apps/organizze-ou-mobills-qual-aplicativo-melhor-para-controlar-gastos/), [Mobills pricing](https://www.mobills.com.br/pricing/), [TechTudo: 10 apps 2026](https://www.techtudo.com.br/listas/2026/01/10-apps-de-controle-financeiro-para-cuidar-melhor-do-dinheiro-em-2026-edapps.ghtml), [Serasa: top 10 apps](https://www.serasa.com.br/score/blog/opcoes-de-aplicativo-para-controle-financeiro/).

### 2.2 O que o usuário brasileiro espera (tabela de mesa)

1. **Contas** (corrente, poupança, carteira, investimento) com saldo real e transferências entre elas.
2. **Cartões de crédito** com fatura por ciclo de fechamento, parcelamento, pagamento de fatura que debita de uma conta.
3. **Lançamentos** com categoria e subcategoria personalizáveis, status pago/pendente, recorrência, anexos.
4. **Orçamento por categoria** com alerta de estouro.
5. **Metas** com aportes.
6. **Relatórios**: por categoria, evolução, comparação mês a mês, fluxo de caixa projetado.
7. **Lembretes** de vencimento (push/e-mail/WhatsApp).
8. **Importação** (OFX/CSV) e **exportação** (CSV/Excel/PDF).
9. **Mobile-first / PWA** ou app nativo.
10. **Sincronização bancária** (Open Finance) como premium.

### 2.3 Open Finance: realidade de custo

Agregadores cobram na faixa de **R$ 540 a R$ 6.000/mês** (Tecnospeed, Pluggy, Belvo), o que inviabiliza para um app indie no início. Alternativas usadas pela comunidade: importação OFX/CSV bem documentada por banco, lançamento via WhatsApp, e o "Meu Pluggy" (o usuário conecta na Pluggy e autoriza o app). Fontes: [TabNews: custo do Open Finance para apps indie](https://www.tabnews.com.br/GuilhermeVieira/estou-desenvolvendo-um-app-de-financas-pessoais-e-nao-consigo-pagar-o-open-finance-pluggy-r2-5k-mes-belvo-r6k-mes-tecnospeed-r1-5k-de-entrada-r540), [Pluggy](https://www.pluggy.ai/).

**Decisão proposta:** Open Finance fica **fora** do lançamento. Entrar com importação OFX/CSV (Fase 5) e avaliar Meu Pluggy depois de ter usuários pagantes.

### 2.4 Onde o Sofinance pode se diferenciar

Competir de frente com Mobills em "ter tudo" não é viável. Diferenciação possível:

- **Simplicidade e velocidade de lançamento** (entrada de transação em 3 toques, atalhos, PWA rápido).
- **Dívidas e financiamentos como cidadãos de primeira classe** (SAC/Price, amortização extra, "quando eu quito?"), coisa que os concorrentes tratam mal.
- **Contas fixas que viram lançamentos automaticamente** com "pagar" em um toque.
- **Preço agressivo** e plano gratuito generoso.
- Depois: **compartilhamento familiar** e **categorização por IA** (Claude) de descrições.

---

## 3. Visão do produto

**Posicionamento:** "Controle financeiro pessoal simples, rápido e honesto com quem tem cartão, contas fixas e financiamento para pagar."

**Público inicial:** brasileiros de 22 a 45 anos, assalariados ou autônomos, que usam cartão de crédito e têm ao menos um financiamento ou dívida, e que desistiram do Mobills/Organizze por complexidade ou preço.

**Princípios de produto**

1. Uma transação nunca some nem duplica (integridade acima de feature).
2. O usuário vê o saldo real e a fatura real, iguais aos do banco.
3. Tudo funciona no celular primeiro.
4. Cada tela responde "e agora, o que eu faço?".
5. Dados do usuário são dele: exportar e apagar em um clique.

---

## 4. O que fica, sai, muda e entra

### Fica
- Supabase (Postgres, Auth, RLS, Storage, Edge Functions).
- React + Vite + Vercel.
- Identidade visual (azul `#2563eb`, dark mode, logo).
- Recharts, lucide-react, react-hot-toast (ou Sonner), Zod.
- Conceitos: extrato, cartões com parcelamento, contas fixas, metas, financiamentos.
- Português do Brasil como único idioma no lançamento.

### Sai
- Navegação por `useState` (entra roteador).
- CSS artesanal duplicado por feature (entra design system com tokens + utilitários).
- Tabelas `transacoes_cartao`, `usuarios`, scripts `fix-*`, políticas de demo.
- `financiamento_imovel` e `financiamento_carro` como tabelas separadas.
- `limite_usado` como coluna gravada (vira valor calculado).
- `conta_bancaria` como texto livre.
- `confirm`/`prompt` nativos.
- Login Microsoft (código morto), `react-icons`, `Header.jsx`, GIF de loading, favicon de 2 MB.
- Arquivos `EXEMPLOS-UX-QUICK-WINS.jsx` e `UX-QUICK-WINS.md` da raiz (mover para `docs/` ou apagar).
- Valores fictícios no dashboard.

### Muda
- JavaScript → **TypeScript** (gradual, começando por domínio e serviços).
- Serviços soltos → **camada de dados com TanStack Query** (cache, invalidação, otimismo) e tipos gerados do banco (`supabase gen types`).
- Componentes de 500 linhas → **feature folders** (`src/features/<feature>/{api,components,hooks,model}`) com componentes de UI reutilizáveis (`Modal`, `Form`, `CurrencyInput`, `DataTable`, `Page`).
- Formulários manuais → **react-hook-form + Zod 4** (um padrão só).
- SQL manual → **Supabase CLI com migrations versionadas** em `supabase/migrations`, `supabase db reset` reproduzível, seed de desenvolvimento.
- Regras de negócio no cliente → **no banco** (views, funções com `auth.uid()`, triggers) e num módulo `domain/` puro e testado.
- Contas fixas → **regras de recorrência** que geram lançamentos pendentes.
- Fatura → calculada por **ciclo de fechamento**.
- Financiamentos → **Dívidas** (n por usuário, tipos: imóvel, veículo, empréstimo, consórcio, outro; sistema SAC/Price; amortização extraordinária).
- Metas → com **histórico de aportes** e ligação opcional a uma conta.
- Dashboard → saldo real por conta, fatura atual, orçamento do mês, próximos vencimentos reais.
- Configurações → perfil, preferências (tema, moeda, dia de início do mês), segurança, exportação e exclusão de dados.

### Entra
- **Contas bancárias** com saldo e **transferências**.
- **Categorias personalizáveis** (ícone, cor, subcategoria, tipo).
- **Orçamento mensal por categoria**.
- **Status pago/pendente** e **fluxo de caixa projetado**.
- **Onboarding** (primeira conta, primeiro cartão, primeiras contas fixas) e **dados de exemplo opcionais**.
- **Rotas** (`/dashboard`, `/lancamentos`, `/cartoes/:id/fatura/:mes`, `/reset-password`, ...).
- **Esqueci minha senha**, reenvio de confirmação, troca de e-mail.
- **PWA** instalável com cache offline de leitura.
- **Termos, privacidade e consentimento (LGPD)**, exportação e exclusão real.
- **Observabilidade**: Sentry (erros), PostHog ou Umami (uso), Vercel Analytics.
- **CI**: lint, typecheck, testes unitários, testes de RLS, build, preview deploy; Playwright para fluxos críticos.
- **Landing page** e **plano Free/Pro** (Stripe ou Mercado Pago/Asaas, decisão na Fase 4).
- **Notificações** de vencimento por e-mail (Supabase Cron + Resend); push via PWA depois.

---

## 5. Arquitetura alvo

### 5.1 Frontend

| Tema | Decisão | Motivo |
|---|---|---|
| Linguagem | TypeScript estrito | Elimina classe inteira dos bugs encontrados |
| Framework | React 19 + Vite (versões estáveis atuais, confirmar com Context7) | Continuidade; sem necessidade de SSR |
| Rotas | React Router (data APIs) | Deep links, guards de auth, `/reset-password` |
| Dados | TanStack Query + `supabase-js` tipado | Cache, invalidação, loading/erro padronizados |
| Formulários | react-hook-form + Zod 4 + `zodResolver` | Um padrão só, validação compartilhada com o domínio |
| Estilo | Tailwind CSS v4 + tokens CSS já existentes + shadcn/ui (Radix) para primitivos acessíveis | Remove 3.600 linhas de CSS duplicado, modais/dialogs acessíveis prontos |
| Gráficos | Recharts (manter) | Já funciona |
| Datas | date-fns v4 com `@date-fns/tz` (`America/Sao_Paulo`) | Corrige bugs de fuso |
| Dinheiro | Inteiros em centavos no domínio (`bigint`/`number` inteiro), formatação com `Intl.NumberFormat('pt-BR')` | Evita erro de ponto flutuante |
| PWA | `vite-plugin-pwa` | Instalável, ícones corretos |
| Estrutura | `src/app` (rotas, providers), `src/features/*`, `src/shared/ui`, `src/shared/lib`, `src/domain` (regras puras) | Isolamento e testabilidade |

### 5.2 Banco de dados (schema v2)

Modelo único de **ledger**: toda movimentação é uma linha em `transactions`.

```
profiles            (id = auth.users.id, nome, avatar_url, moeda, dia_inicio_mes, onboarding_done, aceite_termos_em)
accounts            (id, user_id, nome, tipo[corrente|poupanca|carteira|investimento|outro], saldo_inicial, cor, icone, arquivada)
categories          (id, user_id NULL=global, parent_id, nome, tipo[receita|despesa], icone, cor, arquivada)
credit_cards        (id, user_id, nome, cor, dia_vencimento NULL, dia_fechamento NULL, account_id_pagamento NULL, arquivado)
                    -- "cartão lite": só um nome. Sem limite, sem obrigação de lançar compra por compra (decisão da seção 13.1)
invoices            (id, user_id, credit_card_id, mes_referencia, valor_informado_centavos NULL, status[aberta|fechada|paga],
                     transaction_id NULL)   -- a fatura é uma conta a pagar; o valor pode ser informado ou calculado dos itens
invoice_items       (id, invoice_id, user_id, descricao, valor_centavos, data, category_id, parcela_n, parcelas_total,
                     origem[manual|import], import_hash)  -- detalhamento opcional (manual ou importado)
transactions        (id, user_id, tipo[receita|despesa|transferencia], valor_centavos, descricao, data, data_competencia,
                     category_id, account_id, account_destino_id, invoice_id NULL, status[pendente|pago],
                     installment_group_id, parcela_n, parcelas_total, recurrence_id, anexo_url, observacoes, tags[])
installment_groups  (id, user_id, valor_total_centavos, parcelas, descricao)
recurrences         (id, user_id, descricao, valor_centavos, tipo, category_id, account_id|credit_card_id,
                     frequencia[mensal|semanal|anual], dia, inicio, fim, ativa)   -- substitui contas_fixas
budgets             (id, user_id, category_id, mes, valor_centavos)
goals               (id, user_id, nome, valor_alvo_centavos, prazo, account_id, cor, icone, concluida_em)
goal_contributions  (id, goal_id, valor_centavos, data, transaction_id)
debts               (id, user_id, nome, tipo[imovel|veiculo|emprestimo|consorcio|outro], valor_total, entrada,
                     valor_financiado, taxa_juros_aa, sistema[price|sac|fixo], parcelas, primeira_parcela, account_id)
debt_payments       (id, debt_id, parcela_n, valor_centavos, data, transaction_id, amortizacao_extra)
```

Regras no banco:

- **RLS estrita** em todas as tabelas: `USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`; categorias globais com `user_id IS NULL` somente leitura.
- **Nenhuma função aceita `user_id`**; todas usam `auth.uid()`. `REVOKE EXECUTE ... FROM anon`.
- **Views**: `account_balances` (saldo = inicial + receitas pagas − despesas pagas ± transferências), `card_invoices` (fatura por ciclo: compra entre fechamento anterior e fechamento atual → fatura do mês de vencimento), `monthly_summary`, `category_spend`, `budget_status`, `upcoming_bills`.
- **Funções**: `create_installments(...)`, `pay_invoice(card_id, mes, account_id, valor, data)` (gera transferência/despesa e marca parcelas pagas), `materialize_recurrences(ate_data)` (rodada por `pg_cron` diário e ao abrir o app), `delete_my_account()` (chamada por Edge Function com service role para remover `auth.users`).
- **Triggers**: `updated_at`, coerência de transferências (origem ≠ destino), impedimento de `credit_card_id` e `account_id` simultâneos.
- **Migração de dados** existentes (do próprio Iago): script único `migrations/00xx_migrate_v1_to_v2.sql`: `contas_fixas` → `recurrences`, `cartoes_credito` → `credit_cards`, `transacoes` → `transactions` (mapeando `conta_bancaria` texto para `accounts` criadas por nome), `metas_desejos` → `goals`, `financiamento_*` → `debts`. Executar em staging primeiro, com backup.

### 5.3 Backend serverless

- **Edge Functions** (Deno): `delete-account`, `export-data` (JSON/CSV zip), `send-reminders` (agendada), futuramente `categorize` (Claude API para sugerir categoria a partir da descrição).
- **pg_cron**: materialização de recorrências e lembretes.
- **Supabase CLI** local (`supabase start`) para desenvolvimento e testes de RLS.

### 5.4 Qualidade, CI e observabilidade

- ESLint flat config + Prettier + `typescript-eslint`; Husky + lint-staged.
- Vitest para domínio e hooks; Testing Library para componentes; **pgTAP ou testes SQL de RLS** rodando contra Supabase local; Playwright para: cadastro → onboarding → lançar despesa → fatura → pagar.
- GitHub Actions: `lint`, `typecheck`, `test`, `db-test`, `build`; Vercel preview por PR.
- Sentry (frontend + Edge Functions), PostHog/Umami com eventos de ativação (primeira conta, primeira transação, D7).

---

## 6. Redesign (Fase 3)

Diretrizes:

1. **Mobile-first**: barra inferior com 5 destinos (Início, Lançamentos, + Novo, Cartões, Mais) e FAB para lançar; desktop mantém sidebar.
2. **Reduzir glassmorphism** a superfícies-chave (cards de resumo); remover `scale` em hover de cards com conteúdo; respeitar `prefers-reduced-motion`.
3. **Tokens** semânticos (`--color-income`, `--color-expense`, `--surface-1/2/3`, `--radius-*`, escala tipográfica) em `:root` e `[data-theme]`.
4. **Componentes**: `Page`, `StatCard`, `MoneyText` (cor por sinal, tabular-nums), `TransactionRow`, `CategoryPill`, `Dialog`, `Sheet` (mobile), `Form*`, `CurrencyInput` único, `MonthPicker`, `EmptyState`, `Skeleton` único.
5. **Fluxo de lançamento rápido**: valor → tipo → categoria → conta/cartão → salvar, com teclado numérico e "Salvar e novo".
6. **Dashboard**: saldo consolidado das contas, fatura aberta dos cartões, orçamento do mês, próximos vencimentos (com "pagar"), gráfico de categoria e evolução de 6 meses (uma consulta).
7. **Onboarding** em 3 passos com dados de exemplo opcionais e checklist de ativação.
8. Copy revisada: "Lançamentos" em vez de "Extrato Mensal"; "Dívidas" em vez de "Financ. Imóvel/Carro"; "Contas a pagar" em vez de "Contas Fixas".
9. Acessibilidade: foco visível, foco preso em dialogs, `Escape`, contraste AA, labels ligados a inputs.

Ferramentas: skill `frontend-design` (Anthropic) para direção visual; skill `web-design-guidelines` (Vercel) para auditoria; `dataviz` (já instalada) para os gráficos; Figma MCP disponível se quiser prototipar antes.

---

## 7. Roadmap por fases

Estimativas para 1 dev + Claude Code (subagentes em paralelo onde marcado ∥). Cada fase vira um plano de implementação próprio via `superpowers:writing-plans` e é executada com `superpowers:executing-plans` ou `subagent-driven-development`, com TDD e `verification-before-completion`.

### Fase 0 — Segurança e estabilização (1 semana) — pode ir para produção sozinha
Objetivo: parar de sangrar antes de reformar.
1. Auditar o Supabase real: listar políticas (`select * from pg_policies`), dropar as `"Enable all for demo"`, revisar `GRANT`s.
2. Reescrever as 3 RPCs para `auth.uid()` e verificação de posse; `REVOKE FROM anon`.
3. Corrigir `pagar_fatura_cartao`/view (`nome_cartao`) e `updated_at` faltante.
4. Edge Function `delete-account` real (dados + storage + `auth.users`) e ajustar `Settings`.
5. Corrigir `getResumoMensal`, remover valores fictícios, corrigir edição de transação, fuso horário, typo, `/reset-password` mínimo (rota provisória) e "esqueci minha senha".
6. Migrar Zod para API v4 (`issues`, `error` em vez de `errorMap`); migrar ESLint para flat config; fazer `supabaseClient` não lançar na importação em teste; consertar ou remover o teste quebrado.
7. Trocar favicon/loader por SVG leve; ativar code-splitting por rota (`React.lazy`) e `manualChunks` para Recharts.
8. Adicionar Sentry.
Skills: `security-review`, `systematic-debugging`, `test-driven-development`, `supabase` (a instalar).

### Fase 1 — Fundação técnica (2 semanas)
1. Supabase CLI + `supabase/migrations` reproduzindo o schema atual (baseline) + `supabase start` local.
2. TypeScript (`allowJs`, migração gradual), tipos gerados do banco.
3. React Router com guards; TanStack Query; `shared/ui` com Dialog/Form/CurrencyInput/Skeleton/EmptyState únicos.
4. Tailwind v4 + tokens; substituir CSS por feature em uma tela piloto (Contas fixas) para validar o padrão.
5. ESLint/Prettier/Husky; GitHub Actions; Vitest com testes do domínio (moeda, datas, fatura).
Skills: `writing-plans`, `subagent-driven-development` ∥, `using-git-worktrees`, `react-best-practices` (a instalar), Context7 para versões atuais.

### Fase 2 — Domínio financeiro v2 (3 a 4 semanas)
1. Schema v2 (seção 5.2) em migrations; views e funções; testes de RLS.
2. Script de migração v1 → v2 (dados do Iago) testado em staging.
3. Features, nesta ordem (cada uma com API tipada + hooks + UI + testes):
   a. Contas e transferências ∥ Categorias personalizáveis
   b. Lançamentos (novo fluxo rápido, status, filtros, busca)
   c. Cartão lite: fatura como conta a pagar ("Fatura Nubank · set/2026"), pagamento debita conta; itens opcionais (seção 13.1)
   d. Recorrências (contas a pagar) com materialização e "pagar em um toque"
   e. Orçamentos
   f. Metas com aportes
   g. Dívidas (SAC/Price, cronograma, amortização extra)
4. Dashboard v2 sobre as views.
Skills: `test-driven-development`, `subagent-driven-development` ∥, `supabase-postgres-best-practices`, `code-review` a cada feature, `dataviz`.

### Fase 3 — Redesign (2 semanas, parte ∥ com Fase 2 a partir da 2ª semana)
1. Direção visual com `frontend-design`; tokens; componentes do design system.
2. Mobile-first: bottom nav + sheet de lançamento rápido; desktop sidebar.
3. Aplicar em todas as telas; auditoria com `web-design-guidelines`; acessibilidade; `prefers-reduced-motion`.
4. PWA (manifest, ícones, service worker).
5. Playwright nos fluxos críticos.

### Fase 4 — Pronto para o público (2 semanas)
1. Onboarding + dados de exemplo + checklist de ativação (skill `onboarding`, `signup`).
2. LGPD: termos, privacidade, consentimento, exportação de dados, exclusão (já da Fase 0), página de "seus dados".
3. Configurações completas (perfil, preferências, segurança, sessões).
4. Landing page (skills `copywriting`, `cro`, `seo-audit`) e domínio próprio; cabeçalhos de segurança; e-mails transacionais com template (Resend).
5. Plano Free/Pro: definir limites (skill `pricing`, `paywalls`); integrar cobrança (Stripe se aceitar cartão internacional e Pix via Stripe BR, ou Asaas/Mercado Pago para Pix e boleto nativos).
6. Analytics de produto (skill `analytics`), Sentry alertas, status de erro.
7. Beta fechado (20 a 50 usuários) por 2 semanas com feedback (skill `customer-research`), depois lançamento (skill `launch`, `directory-submissions`).

### Fase 5 — Diferenciação (contínua, pós-lançamento)
1. Importação OFX/CSV (Nubank, Itaú, Inter, Bradesco, C6) com deduplicação.
2. Lembretes por e-mail e push (PWA).
3. Categorização assistida por IA (Claude Haiku 4.5 via Edge Function; custo por chamada baixo).
4. Compartilhamento familiar (workspace com membros; exige `workspace_id` no schema, planejar já na Fase 2 com coluna `workspace_id` opcional para não migrar duas vezes).
5. Relatórios avançados e exportação PDF.
6. Avaliar Meu Pluggy / Open Finance quando houver receita recorrente.
7. Programa de indicação (skill `referrals`), retenção (skill `churn-prevention`).

### Cronograma resumido

| Fase | Duração | Entregável | Pode ir a produção? |
|---|---|---|---|
| 0 | 1 sem | App atual seguro e sem bugs críticos | Sim |
| 1 | 2 sem | Base TS/rotas/query/CI, tela piloto | Sim (sem mudança visível) |
| 2 | 3–4 sem | Domínio v2 e dados migrados | Sim, atrás de feature flag por usuário |
| 3 | 2 sem (∥) | Novo design, mobile, PWA | Sim |
| 4 | 2 sem | Onboarding, LGPD, cobrança, landing, beta | Lançamento |
| **Total** | **10–14 sem** | | |

---

## 8. Modelo de negócio proposto

- **Free**: 2 contas, 2 cartões, categorias ilimitadas, lançamentos ilimitados, 1 dívida, 3 metas, relatórios básicos, exportação CSV.
- **Pro**: R$ 9,90/mês ou R$ 79,90/ano (abaixo de Mobills/Organizze, para conversão por preço). Ilimitado, orçamentos com alertas, dívidas ilimitadas com simulações, lembretes, importação OFX, anexos, IA de categorização, compartilhamento familiar (quando existir).
- Métricas-alvo do beta: ativação (1ª transação em D0) > 60%, retenção D30 > 25%, conversão Free→Pro > 3% em 90 dias.
- Validar preço com a skill `pricing` e testar via `ab-testing` depois de ter tráfego.

---

## 9. Skills, MCPs e o agente Engenheiro Sênior

### 9.1 Skills já instaladas que serão usadas

| Skill | Uso no plano |
|---|---|
| `superpowers:brainstorming` | Este documento; refinamento de cada fase |
| `superpowers:writing-plans` | Plano de implementação de cada fase |
| `superpowers:executing-plans` / `subagent-driven-development` | Execução com subagentes em paralelo |
| `superpowers:test-driven-development` | Domínio financeiro, RLS, hooks |
| `superpowers:systematic-debugging` | Fase 0 |
| `superpowers:using-git-worktrees` | Fases 2 e 3 em paralelo |
| `superpowers:requesting-code-review` / `receiving-code-review` / `code-review` | A cada feature |
| `superpowers:verification-before-completion` | Antes de marcar qualquer tarefa como pronta |
| `superpowers:finishing-a-development-branch` | Fechamento de PRs |
| `security-review` | Fase 0 e antes do lançamento |
| `simplify` | Depois de cada feature grande |
| `dataviz` | Gráficos do dashboard e relatórios |
| `run` + `claude-in-chrome` | Verificação visual e e2e manual |
| Marketing: `pricing`, `paywalls`, `onboarding`, `signup`, `copywriting`, `cro`, `seo-audit`, `analytics`, `launch`, `directory-submissions`, `customer-research`, `churn-prevention`, `referrals`, `product-marketing` | Fases 4 e 5 |
| `anthropic-skills:skill-creator` | Criar a skill interna `sofinance-domain` (regras de negócio) |

### 9.2 Skills e MCPs a instalar (comandos)

| Item | Para quê | Instalação |
|---|---|---|
| **Context7 MCP** | Documentação atualizada de React, Vite, Tailwind v4, TanStack Query, supabase-js, Zod 4 | `claude mcp add --scope user context7 -- npx -y @upstash/context7-mcp` ([docs](https://context7.com/docs/clients/claude-code)) |
| **Supabase MCP** | Consultar schema, políticas, rodar migrations e gerar tipos direto do Claude Code | `claude mcp add --transport http supabase https://mcp.supabase.com/mcp?project_ref=<ref>` ([docs](https://supabase.com/features/mcp-server)); usar em **modo read-only** contra produção |
| **Supabase agent skills** | Boas práticas de Auth, RLS, migrations, Postgres | `claude plugin marketplace add supabase/agent-skills` e `claude plugin install supabase@supabase-agent-skills` ([repo](https://github.com/supabase/agent-skills)) |
| **Vercel agent skills** | `react-best-practices`, `web-design-guidelines`, `composition-patterns` | `npx skills add vercel-labs/agent-skills` ([repo](https://github.com/vercel-labs/agent-skills)) |
| **frontend-design (Anthropic)** | Direção visual do redesign | plugin `frontend-design` do marketplace oficial `anthropics/claude-code` ([SKILL.md](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md)) |
| **Playwright MCP** | Testes e2e e verificação visual automatizada | `claude mcp add playwright -- npx -y @playwright/mcp@latest` |
| **Skill interna `sofinance-domain`** | Regras de negócio brasileiras (fatura, parcelas, SAC/Price, LGPD, formatação) para todos os agentes | Criar com `skill-creator` em `.claude/skills/sofinance-domain/SKILL.md` na Fase 1 |

Skills sem substituto encontrado e que **não** vale buscar: nada crítico ficou descoberto. Se surgir necessidade de app nativo, buscar `react-native-guidelines` (já no pacote Vercel) ou Expo skills.

### 9.3 Agente: Engenheiro de Software Sênior Sofinance

Criar em `.claude/agents/sofinance-senior-engineer.md` (Fase 1, primeiro item). Conteúdo proposto:

```markdown
---
name: sofinance-senior-engineer
description: Engenheiro de software sênior e product engineer do Sofinance. Use para decisões de arquitetura, regras de negócio financeiras brasileiras, revisão de PRs, modelagem de dados, segurança (RLS/LGPD) e para questionar requisitos com visão de mercado (Mobills, Organizze, Minhas Economias). Invoque sempre que uma tarefa tocar dinheiro, fatura, parcelas, saldo, recorrência, dívidas ou dados pessoais.
model: opus
tools: Read, Grep, Glob, Bash, Edit, Write, WebSearch, WebFetch
---

Você é o engenheiro sênior responsável pelo Sofinance, um app brasileiro de finanças pessoais
(React + TypeScript + Vite no frontend, Supabase/Postgres no backend, Vercel). Você combina
15 anos de engenharia com experiência de produto em fintechs de consumo.

## Como você trabalha
- Antes de propor código, verifique o que já existe (leia `docs/superpowers/specs/` e o schema em `supabase/migrations`).
- Prefira regras de negócio no banco (views, funções com `auth.uid()`, triggers) ou em `src/domain` puro e testado. Nunca nas telas.
- Dinheiro é inteiro em centavos. Datas no fuso `America/Sao_Paulo`. Nunca use `new Date('YYYY-MM-DD')` sem tratar fuso.
- Toda tabela tem RLS estrita. Nenhuma função aceita `user_id` do cliente. `anon` não executa RPC.
- TDD: escreva o teste da regra antes da implementação. Rode `npm run lint && npm run typecheck && npm test` antes de dizer que terminou.
- Use Context7 para confirmar APIs de bibliotecas antes de escrever código com elas.
- Se um requisito contraria como o mercado brasileiro funciona, diga isso com exemplos concretos e proponha alternativa.

## Regras de negócio que você conhece de cor
- Cartão de crédito: compras entre o fechamento anterior (exclusivo) e o fechamento atual (inclusivo)
  entram na fatura que vence no `dia_vencimento` seguinte. Se `dia_vencimento` < `dia_fechamento`, o vencimento
  é no mês seguinte ao fechamento. Compra após o fechamento cai na próxima fatura.
- Parcelamento: N parcelas de valor arredondado, com a última absorvendo a diferença de centavos; cada parcela
  cai em uma fatura consecutiva; limite usado = soma das parcelas ainda não pagas.
- Pagamento de fatura: gera uma saída na conta pagadora e marca as parcelas daquela fatura como pagas;
  pagamento parcial mantém saldo remanescente na fatura seguinte (sem calcular juros rotativos na v2).
- Saldo de conta = saldo inicial + entradas pagas − saídas pagas ± transferências. Pendentes entram no "projetado".
- Recorrências geram lançamentos pendentes por materialização (nunca on-the-fly na tela); pagar = marcar pago.
- Dívidas: Price (parcela fixa), SAC (amortização fixa), fixo (parcela informada). Amortização extra reduz prazo
  ou parcela, escolha do usuário. Financiamento imobiliário no Brasil costuma ser SAC + TR; veículo, Price.
- Orçamento por categoria compara gasto pago + pendente do mês contra o limite; alerta em 80% e 100%.
- LGPD: consentimento explícito no cadastro, exportação de dados, exclusão completa (dados, storage e auth).
- Formatação: `R$ 1.234,56`; datas `dd/MM/yyyy`; mês de referência `YYYY-MM`.

## Ao revisar código
Procure: dinheiro em float, datas sem fuso, RLS ausente, `user_id` vindo do cliente, lógica duplicada entre
cliente e banco, componentes acima de 250 linhas, `confirm`/`prompt`, estados de loading/erro faltando,
consultas N+1, mutações sem invalidação de cache. Cite arquivo e linha.
```

Complementos:

- **`CLAUDE.md` na raiz** (Fase 1) com: stack, comandos (`npm run dev|lint|typecheck|test|db:reset`), convenções (centavos, fuso, RLS, feature folders), e a instrução "para tarefas de domínio financeiro use o agente `sofinance-senior-engineer` e a skill `sofinance-domain`".
- **Skill `sofinance-domain`** com as regras acima em formato consultável, exemplos numéricos e casos de teste canônicos (ex.: cartão fecha dia 15 e vence dia 25; compra dia 16/03 vai para fatura de 25/04).
- Opcional: agente `sofinance-designer` (frontend-design + web-design-guidelines) para a Fase 3 e agente `sofinance-growth` (skills de marketing) para a Fase 4.

---

## 10. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Dados atuais do Iago se perderem na migração v1→v2 | Backup (`pg_dump`) antes, migração em staging, comparação de totais por mês antes/depois |
| Escopo da Fase 2 crescer | Cada feature vira PR próprio com plano; nada entra sem estar no schema v2 |
| Redesign atrasar o domínio | Fase 3 começa só depois de Contas/Lançamentos prontos; design system primeiro, telas depois |
| Custo de Supabase/Vercel com usuários | Plano Free do Supabase aguenta o beta; monitorar; Pro (US$ 25/mês) a partir do lançamento |
| Cobrança no Brasil | Decidir provedor na Fase 4 com base em Pix; não bloquear o beta (beta é gratuito) |
| Dependência de um único desenvolvedor | Documentação viva (`docs/`), CLAUDE.md, agente sênior com regras, CI que impede regressão |

## 11. Decisões que precisam do Iago

1. **Aprovar o faseamento** (0 → 4) e a ordem, ou pedir um MVP público mais enxuto (por exemplo, pular Dívidas SAC/Price e Orçamentos para depois do lançamento).
2. **Tailwind + shadcn/ui** para o design system, ou manter CSS artesanal com tokens (mais trabalho, mais controle)?
3. **Preço e limites do Free/Pro** (proposta na seção 8) e **provedor de cobrança** (Stripe vs Asaas/Mercado Pago).
4. **Nome de produto e domínio** para a landing page.
5. **Beta fechado** de 2 semanas antes do lançamento, sim ou não?
6. Autorizar a **auditoria imediata do Supabase de produção** (Fase 0, item 1), que é leitura de políticas e depois remoção das permissivas.

## 12. Próximos passos imediatos (após aprovação)

1. Instalar MCPs e skills da seção 13.5.
2. `superpowers:writing-plans` para a **Fase 0** (plano detalhado, tarefas de 1 a 2 horas cada).
3. Executar a Fase 0 em branch `fase-0/seguranca`, com `security-review` ao final, e publicar.
4. Repetir para as Fases 1 a 4.

---

## 13. Decisões registradas em 2026-09-17 (segunda rodada)

| Decisão | Resposta do Iago | Consequência |
|---|---|---|
| Faseamento 0 → 4 | Aprovado | Fase 0 começa após instalação das ferramentas |
| Cartão de crédito | **Remover o cadastro detalhado**; tratar como gasto "Fatura do Cartão X"; avaliar importação de arquivo via workflow (n8n) | Modelo "cartão lite" abaixo (13.1) |
| Design | "O melhor design possível", pesquisar componentes e bibliotecas | Stack de design em 13.2 |
| Preço / cobrança | Não respondido | Mantém proposta da seção 8 como hipótese; decidir na Fase 4 |
| Beta fechado | Sim | Entra na Fase 4 |
| Auditoria do Supabase de produção | Sim | Primeiro item da Fase 0 |
| Automações e rotinas | Pediu ideias | Lista em 13.3 |

### 13.1 Cartão de crédito: modelo "fatura como conta a pagar"

**Problema apontado:** pedir bandeira, limite, dia de fechamento e vencimento na hora de cadastrar assusta e o usuário desiste. Pedir que lance cada compra no cartão é ainda pior.

**Opinião técnica honesta:** remover cartão por completo enfraquece o produto frente a Mobills/Organizze, porque a fatura é a maior despesa mensal de boa parte do público. Mas o que o mercado faz (compra a compra, limite, ciclo) é exatamente o atrito que você quer evitar. A saída é **inverter a prioridade**: a fatura vira a unidade principal e o detalhamento vira opcional.

**Como funciona:**

1. **Criar um cartão = digitar um nome** ("Nubank", "Inter"). Cor e dia de vencimento são opcionais. Nada de limite ou bandeira.
2. Todo mês o app cria automaticamente uma **conta a pagar "Fatura Nubank · setembro"** com valor em aberto. No dashboard aparece "Sua fatura do Nubank chegou? Informe o valor". O usuário digita o total e pronto. Pagar a fatura debita da conta escolhida, categoria "Cartão de crédito".
3. **Detalhar é opcional.** Quem quiser pode abrir a fatura e adicionar itens ("Mercado R$ 320", "Uber R$ 45") manualmente ou por importação. Quando há itens, os relatórios por categoria usam os itens; quando não há, usam o total. Nunca conta duas vezes.
4. **Lançamento rápido "no cartão":** ao lançar uma despesa, existe um toggle opcional "foi no cartão Nubank". Isso cria um item pendente na próxima fatura, sem o usuário precisar saber de ciclo. Parcelar em Nx é um campo opcional que cria N itens futuros.
5. **Ciclo de fechamento** só é perguntado (e opcional) quando o usuário usa o item 4, para decidir em qual fatura o item cai. Se não informar, cai na fatura do mês.

Para quem só quer "Fatura do Cartão X", o fluxo é 1 + 2 e nunca vê o resto. Para quem quer detalhe, o produto ainda entrega. Isso mantém a diferenciação "simples" sem abrir mão de relatórios por categoria para quem importa.

**Importação de fatura (CSV/OFX/PDF):** útil, sim, mas **Fase 5**, e validada primeiro no seu n8n:

- Fluxo pessoal no n8n (você, agora): gatilho Gmail "fatura chegou" → baixa o PDF/CSV → extrai texto → Claude com saída estruturada (data, descrição, valor, parcela) → dedupe por hash → grava em `invoices`/`invoice_items` no Supabase via API com service role → resumo no Telegram. Se você usar isso por 2 meses e achar bom, vira feature.
- Fluxo no app (Fase 5): upload → Edge Function → parser determinístico para CSV/OFX (Nubank, Inter, Itaú, Bradesco, C6) e Claude para PDF → tela de revisão com categorias sugeridas → confirmar. Dedupe por `import_hash`.

Mudanças no schema já registradas na seção 5.2 (`credit_cards` reduzido, `invoices`, `invoice_items`, `transactions.invoice_id`). A tabela `transacoes_cartao` e as RPCs de parcelamento por cartão da v1 saem; a migração v1 → v2 converte compras no cartão existentes em `invoice_items` das faturas correspondentes.

### 13.2 Stack de design (pesquisa de 2026)

| Camada | Escolha | Por quê |
|---|---|---|
| Sistema de componentes | **shadcn/ui com base Base UI** (padrão desde julho/2026; Radix e React Aria como alternativas) + **Tailwind CSS v4** | Componentes acessíveis, código no repositório (sem lock-in), ecossistema de registries direto na CLI (`npx shadcn add @registro/componente`) |
| Dashboard e gráficos | **shadcn Charts** (Recharts) + **Tremor** (open source, Vercel) para KPI cards, bar lists, tracker, spark charts, date range picker | Padrão de mercado para dashboards financeiros; 300+ blocks para referência |
| Mobile | **Vaul** (Drawer/Sheet do shadcn) para lançamento rápido, bottom nav próprio | Gesto nativo de arrastar |
| Tabelas | **TanStack Table** via DataTable do shadcn | Ordenação, filtros, virtualização |
| Formulários | react-hook-form + Zod 4 + componentes Form do shadcn; **react-number-format** para moeda pt-BR | Um padrão só |
| Feedback | **Sonner** (toasts), `cmdk` (paleta de comandos com atalhos) | Leves e acessíveis |
| Motion | **Motion** (motion.dev) com `prefers-reduced-motion` | Transições de tela e microinterações com controle |
| Ícones | Lucide (manter) | Já usado |
| Tema | **tweakcn** para gerar o tema a partir do azul `#2563eb` em light/dark | Consistência de tokens |
| Prototipagem | Figma MCP (já disponível) + **shadcn Figma kit** | Mockups antes de codar as telas principais |
| Referências visuais | Mobbin (Nubank, Monarch, Copilot Money, Organizze) e Tremor Blocks | Padrões testados em fintech |

Fontes: [shadcn/ui changelog julho 2026](https://ui.shadcn.com/docs/changelog/2026-07-react-aria), [Builder.io: 15 best React UI libraries 2026](https://www.builder.io/blog/react-component-libraries-2026), [Untitled UI: React component libraries 2026](https://www.untitledui.com/blog/react-component-libraries), [Tremor](https://tremor.so/), [shadcn registry directory](https://ui.shadcn.com/docs/directory).

### 13.3 Automações e rotinas (ideias)

**No produto (Supabase pg_cron + Edge Functions), para todos os usuários**

1. Materialização diária de recorrências e faturas do mês (cria as contas a pagar pendentes).
2. Lembretes D-3 e D-0 de vencimento por e-mail; push via PWA na Fase 5; WhatsApp como premium depois.
3. "Sua fatura chegou?": no dia do vencimento menos 7, pedir o valor da fatura de cada cartão.
4. Alerta de orçamento em 80% e 100% da categoria.
5. Fechamento mensal automático: e-mail "Seu setembro em números" (receitas, despesas, top 3 categorias, comparação com agosto, metas).
6. Categorização automática por regras ("Uber" → Transporte) aprendidas do histórico do próprio usuário; IA (Claude Haiku 4.5) como fallback para descrições novas.
7. Detecção de anomalias: gasto 2× acima da média da categoria gera aviso.
8. Detecção de salário: entrada recorrente identificada sugere distribuir em metas/orçamentos.
9. Reengajamento: 7 dias sem lançamento → e-mail curto com "lançar agora" (deep link).
10. Backup mensal: exportação CSV enviada por e-mail ao usuário (portabilidade LGPD).
11. Deduplicação na importação por hash (data + valor + descrição normalizada).

**Pessoais, no seu n8n (laboratório para validar antes de virar feature)**

12. Fatura por e-mail → parser → Supabase (13.1).
13. Bot Telegram/WhatsApp: mandar "mercado 85,90" cria uma despesa via API; responde com saldo do dia.
14. Resumo diário às 20h no Telegram com gastos do dia e contas que vencem amanhã.
15. Recibos do Gmail (Uber, iFood, Amazon) → despesa automática com categoria.
16. Planilha Google Sheets espelho para análises ad hoc.
17. Quando (e se) houver Open Finance: webhook Pluggy → transações.

**De engenharia, com Claude Code (skill `schedule` e GitHub Actions)**

18. Rotina diária: triagem de erros novos no Sentry, abrir issue com hipótese de causa.
19. Rotina semanal: revisão de PRs abertos com `code-review`, atualização de dependências (Dependabot) e auditoria `npm audit`.
20. Rotina semanal: relatório de métricas de produto (PostHog): ativação, retenção D7, conversão Free→Pro.
21. Rotina mensal: `security-review` completo e teste das políticas de RLS contra o banco local.
22. A cada deploy: Playwright nos 5 fluxos críticos; falhou, reverte.

### 13.3.1 Auditoria de produção executada em 2026-09-17 (Fase 0, item 1: concluído)

Encontrado no banco real (projeto `ctchgljqbardmzajgyjp`, 6 usuários, 84 transações):

- RLS **desligado** em `transacoes`, `cartoes_credito`, `contas_fixas`, `transacoes_cartao`.
- Política `"Enable all for authenticated users" USING (true)` em 7 tabelas, para o papel `public`.
- Papel `anon` com SELECT/INSERT/UPDATE/DELETE/TRUNCATE em todas as tabelas e views.
- Views `resumo_mensal` e `gastos_por_categoria` sem `security_invoker` (expunham agregados de todos).
- As funções da migração de parcelas (`criar_transacao_parcelada`, `calcular_fatura_cartao`, `pagar_fatura_cartao`, trigger `excluir_parcelas_relacionadas`) **nunca foram aplicadas**: parcelamento e pagamento de fatura já estavam quebrados no app. Só existem `handle_new_user`, `obter_receitas_mes`, `obter_despesas_mes`, `obter_saldo_total`, `set_updated_at`.
- `cartoes_credito` já possui `updated_at` em produção (diferente do `supabase-setup.sql`).
- Tabela legada `usuarios` ainda existe, com RLS ligado e sem políticas.

Correção aplicada via Management API e registrada em `supabase/migrations/20260917230000_fase0_rls_lockdown.sql`
(estado anterior salvo em `docs/superpowers/audits/2026-09-17-rls-policies-before.json`):
RLS ligado nas 11 tabelas, políticas permissivas removidas, `security_invoker` nas views, `anon` sem privilégios em `public`.
Verificação: Iago vê 83 transações próprias, outro usuário vê 1, anon recebe `permission denied`.

Consequência para o plano: os itens 2 (RPCs com `auth.uid()`) e 3 (`nome_cartao`, `updated_at`) da Fase 0 mudam de
"corrigir" para "não aplicar a migração de parcelas antiga; implementar parcelamento/fatura já no modelo cartão lite da Fase 2".
Enquanto isso, o app deve esconder ou desabilitar parcelamento e "pagar fatura" (Fase 0, item 5).

Exclusão de conta (Task 7 da Fase 0): a Edge Function apaga todas as tabelas de dados, `perfis` e `auth.users`.
Storage não é tocado porque `uploadAvatar` não tem chamador e o bucket `avatars` não tem objetos de usuário;
incluir quando o upload de avatar existir. A tabela legada `usuarios` (id, nome, email, senha_hash) tem 0 linhas
e será removida na Fase 2.

### 13.4 Agente e arquivos de configuração

- `.claude/agents/sofinance-senior-engineer.md` criado nesta rodada, com as regras do modelo de cartão lite.
- `CLAUDE.md` e a skill `.claude/skills/sofinance-domain/` serão criados na Fase 1, quando a stack estiver fixada.

### 13.5 Instalação das ferramentas (comandos verificados)

Ver a mensagem de entrega ou o resumo abaixo. Comandos prefixados com `/` rodam dentro do Claude Code; os demais no terminal (ou com `! ` no prompt do Claude Code).

```bash
# 1. Context7 (documentação atualizada)
/plugin marketplace add upstash/context7
/plugin install context7@context7-marketplace
# alternativa: npx ctx7 setup --claude

# 2. Supabase MCP (somente leitura contra produção; <REF> vem da URL do painel)
claude mcp add --scope project --transport http supabase "https://mcp.supabase.com/mcp?project_ref=<REF>&read_only=true"
# depois, no Claude Code: /mcp -> supabase -> Authenticate

# 3. Skills oficiais da Supabase
/plugin marketplace add supabase/agent-skills
/plugin install supabase@supabase-agent-skills
/plugin install postgres-best-practices@supabase-agent-skills

# 4. Skills da Vercel (React, design, composição)
npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices web-design-guidelines vercel-composition-patterns -a claude-code -y
# (instalado em 2026-09-17 em .claude/skills/; os nomes no repositório levam o prefixo "vercel-")

# 5. frontend-design (Anthropic)
/plugin install frontend-design@claude-plugins-official
# se não encontrar: /plugin marketplace add anthropics/claude-code  e  /plugin install frontend-design@claude-code-plugins

# 6. Playwright MCP (Windows nativo precisa do cmd /c)
claude mcp add --scope project playwright -- cmd /c npx -y @playwright/mcp@latest

# 7. Supabase CLI (precisa de Docker Desktop para o banco local)
npm i -D supabase
npx supabase login
npx supabase init
npx supabase link --project-ref <REF>
```
