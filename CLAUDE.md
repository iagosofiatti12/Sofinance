# Sofinance

App brasileiro de finanças pessoais. React 19 + Vite 8 + TypeScript na frente, Supabase (Postgres, Auth, Edge Functions) atrás, Vercel na hospedagem. Público: pessoas físicas no Brasil. Idioma da interface: português do Brasil.

## Comandos

| Comando                        | O que faz                                           |
| ------------------------------ | --------------------------------------------------- |
| `npm run dev`                  | Sobe o app em http://localhost:3000                 |
| `npm run lint`                 | ESLint                                              |
| `npm run typecheck`            | `tsc --noEmit`                                      |
| `npm run test:run`             | Testes uma vez                                      |
| `npm run build`                | Build de produção                                   |
| `npm run db:start` / `db:stop` | Sobe e derruba o Supabase local (precisa de Docker) |
| `npm run db:reset`             | Recria o banco local a partir das migrations        |
| `npm run db:diff`              | Compara o banco local com produção                  |
| `npm run db:push`              | Aplica migrations pendentes em produção             |
| `npm run db:types`             | Regenera `src/types/database.types.ts`              |

Antes de dizer que terminou: `npm run lint && npm run typecheck && npm run test:run && npm run build`.

## Estrutura

- `src/app/` — roteador, providers, guarda de autenticação, layout
- `src/domain/` — regras puras com teste, sem React e sem Supabase
- `src/lib/` — infraestrutura: cliente Supabase, cache, log, tradução de erro
- `src/features/<feature>/` — `api.ts`, `queries.ts` e telas de cada área
- `src/components/ui/` — componentes do shadcn
- `src/components/` — telas antigas em `.jsx`, migradas conforme forem reescritas
- `src/types/database.types.ts` — gerado pelo Supabase, nunca editar à mão
- `supabase/migrations/` — única fonte de verdade do schema

## Convenções

- Regra de negócio vive em `src/domain` ou no banco, nunca na tela.
- Dinheiro é `number` em reais nesta fase; a Fase 2 troca para inteiro em centavos.
- Datas sempre por `src/domain/dates.ts`. Nunca `new Date('YYYY-MM-DD')` nem `toISOString().split('T')[0]`.
- Toda tabela tem RLS com `user_id = auth.uid()`. Nenhuma função aceita `user_id` do cliente.
- Busca de dados por TanStack Query. Nada de `useEffect` com `fetch` em tela nova.
- Teste antes da implementação para qualquer regra de domínio.
- Commits em português, `tipo: descrição`.

## Ao mexer em dinheiro, fatura, parcela, saldo, dívida ou dado pessoal

Use o agente `sofinance-senior-engineer` e a skill `sofinance-domain`.

## Onde está a documentação

- Plano geral: `docs/superpowers/specs/2026-09-17-sofinance-revamp-design.md`
- Planos por fase: `docs/superpowers/plans/`
- SQL histórico que não reflete produção: `docs/legacy-sql/` (não aplicar)

## Armadilhas aprendidas na Fase 1

Cada item abaixo já causou um bug real, um CI vermelho ou uma investigação perdida durante a Fase 1. Leia antes de repetir o erro.

### Dinheiro

- O app guarda valores em **reais como número** (`1500.50`). Centavos inteiros são da Fase 2, não antecipe a conversão.
- `formatCurrency` recebe **centavos**, não reais — é contraintuitivo. As telas chamavam `formatCurrency(parseFloat(v) * 100)`, e `19.90 * 100` dá `1989.9999999999998`, então a tela mostrava `R$ 199.000.000.000.000,00`. Atingiu 13 dos 85 registros reais em produção.
- **Use sempre `formatReais(valor)`** de `@/domain/currency`, que já faz a conversão e o arredondamento. É o único ponto que a Fase 2 vai precisar mudar.
- Nunca deixe valor não validado chegar ao banco: `NaN` e `Infinity` são `number` válidos para o TypeScript, e `'NaN'::numeric` passa numa constraint `>= 0` no Postgres, porque lá `NaN` é maior que tudo. Uma constraint que barra é `CHECK (coluna IS NULL OR coluna <> 'NaN'::numeric)` — `CHECK (coluna = coluna)` **não** barra, porque no Postgres `NaN = NaN` é verdadeiro.

### Cache e dados

- Chaves de consulta ficam numa fábrica por feature, como `contasFixasKeys` em `src/features/contas-fixas/queries.ts`. Invalide por prefixo.
- `onSuccess` precisa **retornar** o `invalidateQueries`, senão `isPending` cai antes do refetch terminar.
- **Contrato a respeitar quando outra tela migrar:** hoje cada feature só invalida a si mesma. O `DashboardHome` lê `getContasFixas` e nada o invalida — hoje é inofensivo porque ele usa `useState`/`useEffect` e remonta, mas quando ele virar Query, toda mutação que afete o dashboard vai precisar invalidá-lo também. Registre isso ao migrar qualquer tela nova, para não ser descoberto sete telas depois.
- Serviço de leitura **não engole erro**. `getContasFixas` tinha `catch { return [] }`, o que tornava a UI de erro inalcançável e, pior, fazia o React Query cachear lista vazia como sucesso: o usuário criava uma conta, o refetch falhava, e ele via "Nenhuma Conta Cadastrada" em vez de um erro.

### Coisas que quebram só no CI ou só em produção

- A pasta é **`src/components/ui` em minúsculas**. O git já teve `UI` registrado; no Windows é a mesma pasta, no Ubuntu do CI são duas. Nunca crie a variante maiúscula.
- Finais de linha são **LF**, travados pelo `.gitattributes`. Para conferir use `git ls-files --eol` (mostra `i/lf w/lf`), **não** `git status`, que pode marcar arquivo como modificado por resíduo de `stat` mesmo com o conteúdo idêntico — nesse caso `git checkout -- <arquivo>` resolve, e `git update-index --refresh` não.
- A rota **`/reset-password` nunca pode ser renomeada**. É a única em inglês do app e parece descuido, mas essa string exata está no `redirectTo` do `authService` e cadastrada como Redirect URL no painel do Supabase. Renomear faz todo e-mail de recuperação de senha cair num 404, e nenhum teste acusa.
- Nesta máquina o Vite escuta em **IPv6**: `curl http://127.0.0.1:3000` devolve zero mesmo com o app funcionando; use `curl "http://[::1]:3000"`.

### Verificação

- Não confie em busca por nome de identificador dentro de bundle minificado — os nomes são embaralhados. **Chaves de objeto e literais de texto sobrevivem**, então procure por esses, e sempre com um controle positivo.
- Teste que nunca falhou não prova nada. Prove por sabotagem: quebre o comportamento de propósito e confirme que o teste certo acusa. Foi assim que validamos os testes de `src/features/contas-fixas/queries.test.ts`.

### Ferramental travado

- TypeScript fica em **5.9.3**: o `typescript-eslint` declara peer `>=4.8.4 <6.1.0`, e com TypeScript 7 o lint com informação de tipos para de funcionar.
- `settings.react.version` está fixo em `'19.3.0'` no `eslint.config.js` em vez de `'detect'`, porque o `eslint-plugin-react` 7.37.5 chama `context.getFilename()`, removido no ESLint 10. Reverter para `'detect'` quando o plugin publicar suporte ao ESLint 10.
- Há `overrides` no `package.json` forçando o peer do ESLint em `eslint-plugin-jsx-a11y` e `eslint-plugin-react`, porque nenhum dos dois declara suporte ao ESLint 10 ainda. Sem isso, `npm ci` numa máquina limpa falha com ERESOLVE. Remova cada entrada assim que o pacote correspondente publicar o peer novo.
- `src/types/database.types.ts` é gerado (`npm run db:types`) e **nunca** editado à mão.

### Segurança

- O `.env` tem a senha do banco de produção, sem prefixo `VITE_` justamente para não ir ao navegador. Nunca imprima, copie nem faça commit do conteúdo.
- A fronteira de segurança real é o **RLS no banco**, com `auth.uid() = user_id`. O `RequireAuth` do roteador é experiência do usuário, não segurança.
- Tipos de entrada dos serviços excluem `user_id` (`Omit<..., 'user_id'>`), porque o serviço o obtém da sessão. Isso já fechou uma brecha real, em que um spread reenviava `user_id` no UPDATE.
