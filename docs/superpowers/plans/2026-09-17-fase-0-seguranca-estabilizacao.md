# Fase 0: Segurança e Estabilização — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deixar o Sofinance atual (JavaScript, sem roteador) seguro e sem bugs críticos para continuar em produção enquanto as Fases 1 a 4 são construídas.

**Architecture:** Nenhuma mudança de stack. Correções cirúrgicas nos serviços, utilitários e componentes existentes; uma Edge Function nova (`delete-account`); regras de negócio extraídas para funções puras em `src/utils/` com testes Vitest. Parcelamento no cartão e "pagar fatura" são **desativados na interface** (as RPCs nunca existiram em produção) até o modelo "cartão lite" da Fase 2.

**Tech Stack:** React 18, Vite 5, Vitest 4 + Testing Library, ESLint 9 (flat config), Zod 4, Supabase (Postgres 17, Edge Functions em Deno), Sentry.

**Spec:** `docs/superpowers/specs/2026-09-17-sofinance-revamp-design.md` (seções 1.3, 1.4, 7 Fase 0, 13.1, 13.3.1).

## Global Constraints

- Branch de trabalho: `fase-0/seguranca`, criada a partir de `main`. Nada é enviado para `main` antes da Task 12.
- Não instalar bibliotecas de UI, roteador, TypeScript ou Tailwind nesta fase (isso é Fase 1).
- Datas: nunca usar `new Date().toISOString().split('T')[0]` nem `new Date('YYYY-MM-DD')`; usar `src/utils/dates.js` (Task 4).
- Dinheiro continua `number` em reais nesta fase (centavos é Fase 2).
- Toda regra extraída vai para `src/utils/` como função pura com teste.
- `npm run lint`, `npm test -- --run` e `npm run build` devem passar ao final de cada task.
- Commits em português, no formato `tipo: descrição` (`fix:`, `feat:`, `chore:`, `test:`, `refactor:`), terminando com a linha `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.
- Estado do banco de produção já corrigido em 2026-09-17 (RLS, políticas, anon). Nenhuma task deste plano executa SQL em produção, exceto o deploy da Edge Function (Task 7).

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `eslint.config.js` (novo) | Flat config do ESLint 9 |
| `vitest.config.js` | Variáveis de ambiente de teste |
| `src/utils/validations.js` | Schemas Zod 4 |
| `src/utils/errorHandler.js` | Mensagens amigáveis (API Zod 4) |
| `src/utils/dates.js` (novo) | Datas locais sem bug de fuso |
| `src/utils/vencimentos.js` (novo) | Próximos vencimentos com virada de mês |
| `src/services/transacoesService.js` | Resumo e evolução via view `resumo_mensal`; edição segura; sem RPCs inexistentes |
| `src/services/authService.js` | Exclusão via Edge Function; remoção de código morto |
| `src/contexts/AuthContext.jsx` | Modo de recuperação de senha |
| `src/components/Auth/ForgotPassword.jsx` (novo), `ResetPassword.jsx` (novo) | Fluxo de senha |
| `src/components/UI/Spinner.jsx` (novo) | Loading único, substitui o GIF |
| `src/components/Dashboard/DashboardHome.jsx` | Sem valores fictícios, saldo do mês, vencimentos corretos |
| `src/components/Extrato/ExtratoMensal.jsx` | Sem parcelamento, typo, datas |
| `src/components/Cartoes/FaturaCartao.jsx` | Sem "pagar fatura" |
| `supabase/functions/delete-account/index.ts` (novo) | Exclusão real da conta |
| `src/main.jsx`, `src/components/ErrorBoundary.jsx` | Sentry |
| `src/App.jsx`, `vite.config.js` | Code-splitting |
| `docs/legacy/`, `docs/legacy-sql/` | Arquivos históricos movidos da raiz |

---

### Task 0: Branch e commit do que já existe

**Files:**
- Commit: `docs/`, `.claude/`, `.mcp.json`, `skills-lock.json`, `supabase/`, `package.json`, `package-lock.json`

- [ ] **Step 1: Criar a branch**

```bash
git checkout -b fase-0/seguranca
```

- [ ] **Step 2: Conferir que nenhum segredo entra no commit**

```bash
git add -n docs .claude .mcp.json skills-lock.json supabase package.json package-lock.json
grep -rIl "sbp_\|trgfMWib" docs .claude .mcp.json supabase || echo "sem segredos"
```

Expected: `sem segredos`. Se algum arquivo aparecer, remover o valor antes de continuar.

- [ ] **Step 3: Commit**

```bash
git add docs .claude .mcp.json skills-lock.json supabase package.json package-lock.json
git commit -m "chore: plano de revamp, ferramentas do Claude Code, Supabase CLI e migration de RLS

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 1: Lint e testes voltam a rodar

**Files:**
- Create: `eslint.config.js`
- Delete: `.eslintrc.json`, `.eslintignore`, `src/components/ContasFixas/ContasFixasList.test.jsx`
- Modify: `vitest.config.js`, `package.json` (scripts)

**Interfaces:**
- Produces: `npm run lint` e `npm test -- --run` funcionando; `import.meta.env.VITE_SUPABASE_URL` definido em testes.

- [ ] **Step 1: Instalar dependências do flat config**

```bash
npm i -D @eslint/js globals
```

- [ ] **Step 2: Criar `eslint.config.js`**

```js
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettier from 'eslint-config-prettier'

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'supabase/functions/**', 'docs/**'] },
  js.configs.recommended,
  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],
  jsxA11y.flatConfigs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    plugins: { 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      'react/prop-types': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },
  prettier,
]
```

- [ ] **Step 3: Remover config legada e o teste quebrado**

```bash
git rm .eslintrc.json .eslintignore src/components/ContasFixas/ContasFixasList.test.jsx
```

- [ ] **Step 4: Ajustar scripts e ambiente de teste**

Em `package.json`, trocar as linhas `lint` e `lint:fix` por:

```json
"lint": "eslint src --max-warnings 200",
"lint:fix": "eslint src --fix",
"test": "vitest",
"test:run": "vitest --run",
```

Em `vitest.config.js`, dentro de `test: { ... }`, adicionar:

```js
env: {
  VITE_SUPABASE_URL: 'http://localhost:54321',
  VITE_SUPABASE_ANON_KEY: 'test-anon-key',
},
```

- [ ] **Step 5: Criar um teste sentinela para provar que a suíte roda**

Create `src/utils/currency.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { formatCurrency, parseCurrency } from './currency'

describe('currency', () => {
  it('formata centavos digitados como moeda pt-BR', () => {
    expect(formatCurrency('123456')).toBe('R$ 1.234,56')
  })
  it('converte texto formatado em número', () => {
    expect(parseCurrency('R$ 1.234,56')).toBe(1234.56)
  })
})
```

- [ ] **Step 6: Rodar lint e testes**

```bash
npm run lint
npm run test:run
```

Expected: lint termina sem erro (warnings são aceitáveis nesta fase); `2 passed`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: migrar ESLint para flat config e fazer a suite de testes rodar

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Zod 4

**Files:**
- Modify: `src/utils/validations.js`, `src/utils/errorHandler.js`
- Test: `src/utils/validations.test.js`

**Interfaces:**
- Produces: `validateData(schema, data)` retorna `{ success, data }` ou `{ success, errors: [{ field, message }] }`; `getErrorMessage(zodError)` retorna a primeira mensagem.

- [ ] **Step 1: Escrever o teste que falha**

Create `src/utils/validations.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { cartaoSchema, transacaoSchema, validateData } from './validations'
import { getErrorMessage } from './errorHandler'

describe('validateData com Zod 4', () => {
  it('retorna a mensagem customizada de enum inválido', () => {
    const r = validateData(cartaoSchema, {
      nome: 'Nubank', bandeira: 'Diners', limite_total: 1000, dia_fechamento: 5, dia_vencimento: 15,
    })
    expect(r.success).toBe(false)
    expect(r.errors[0]).toEqual({ field: 'bandeira', message: 'Bandeira inválida' })
  })
  it('retorna mensagem de valor positivo', () => {
    const r = validateData(transacaoSchema, {
      tipo: 'despesa', categoria: 'Outros', descricao: 'Teste', valor: -5,
      data_transacao: '2026-09-17', metodo_pagamento: 'PIX',
    })
    expect(r.success).toBe(false)
    expect(r.errors[0].message).toBe('Valor deve ser positivo')
  })
  it('aceita dados válidos', () => {
    const r = validateData(cartaoSchema, {
      nome: 'Nubank', bandeira: 'Visa', limite_total: 1000, dia_fechamento: 5, dia_vencimento: 15,
    })
    expect(r.success).toBe(true)
    expect(r.data.nome).toBe('Nubank')
  })
})

describe('getErrorMessage', () => {
  it('lê a primeira issue de um ZodError', () => {
    const err = z.object({ n: z.number().positive('positivo!') }).safeParse({ n: -1 }).error
    expect(getErrorMessage(err)).toBe('positivo!')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npm run test:run -- src/utils/validations.test.js
```

Expected: FAIL (`TypeError: Cannot read properties of undefined (reading 'map')` ou mensagem de enum padrão em inglês).

- [ ] **Step 3: Migrar `validations.js` para a API do Zod 4**

Substituir todas as ocorrências de `errorMap: () => ({ message: 'X' })` por `error: 'X'`. São 3 lugares:

```js
tipo: z.enum(['receita', 'despesa'], { error: 'Tipo deve ser receita ou despesa' }),
metodo_pagamento: z.enum(['PIX', 'Dinheiro', 'Débito', 'Crédito', 'Transferência'], { error: 'Método de pagamento inválido' }),
bandeira: z.enum(['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard'], { error: 'Bandeira inválida' }),
```

E em `validateData`, trocar `error.errors.map` por `error.issues.map`:

```js
export const validateData = (schema, data) => {
  const result = schema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  return {
    success: false,
    errors: result.error.issues.map((err) => ({ field: err.path.join('.'), message: err.message })),
  }
}
```

- [ ] **Step 4: Migrar `errorHandler.js`**

Trocar o bloco `if (error.name === 'ZodError')` por:

```js
if (error.name === 'ZodError' || Array.isArray(error.issues)) {
  return error.issues?.[0]?.message || 'Dados inválidos'
}
```

- [ ] **Step 5: Rodar e ver passar**

```bash
npm run test:run -- src/utils/validations.test.js
```

Expected: `4 passed`.

- [ ] **Step 6: Commit**

```bash
git add src/utils/validations.js src/utils/errorHandler.js src/utils/validations.test.js
git commit -m "fix: migrar validações para a API do Zod 4 (issues e error)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Datas sem bug de fuso

**Files:**
- Create: `src/utils/dates.js`
- Test: `src/utils/dates.test.js`
- Modify: `src/services/transacoesService.js:12-18` (formatMesReferencia), `src/components/Extrato/ExtratoMensal.jsx` (linhas 37, 148, 261, 344), `src/components/Cartoes/FaturaCartao.jsx` (394, 457, 551), `src/components/Financiamentos/FinanciamentoImovel.jsx` (435, 775), `src/components/Financiamentos/FinanciamentoCarro.jsx` (817, 1179), `src/components/Settings/Settings.jsx` (94-101)

**Interfaces:**
- Produces: `hojeISO()`, `toISODateLocal(date)`, `parseISODateLocal('YYYY-MM-DD')`, `formatarData(iso)`, `formatarMesExtenso('YYYY-MM')`, `formatMesReferencia(date)`, `mudarMes('YYYY-MM', +1|-1)`.

- [ ] **Step 1: Teste**

Create `src/utils/dates.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  toISODateLocal, parseISODateLocal, formatarData, formatarMesExtenso, formatMesReferencia, mudarMes,
} from './dates'

describe('dates', () => {
  it('toISODateLocal usa a data local, não UTC', () => {
    expect(toISODateLocal(new Date(2026, 8, 17, 23, 30))).toBe('2026-09-17')
  })
  it('parseISODateLocal devolve meia-noite local', () => {
    const d = parseISODateLocal('2026-09-17')
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 8, 17])
  })
  it('formatarData não perde um dia', () => {
    expect(formatarData('2026-09-17')).toBe('17/09/2026')
    expect(formatarData('2026-09-17T00:00:00+00:00')).toBe('17/09/2026')
    expect(formatarData(null)).toBe('-')
  })
  it('formatarMesExtenso', () => {
    expect(formatarMesExtenso('2026-09')).toBe('setembro de 2026')
  })
  it('formatMesReferencia', () => {
    expect(formatMesReferencia(new Date(2026, 0, 31, 23, 59))).toBe('2026-01')
  })
  it('mudarMes cruza o ano', () => {
    expect(mudarMes('2026-12', 1)).toBe('2027-01')
    expect(mudarMes('2026-01', -1)).toBe('2025-12')
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npm run test:run -- src/utils/dates.test.js
```

Expected: FAIL, módulo não encontrado.

- [ ] **Step 3: Implementar `src/utils/dates.js`**

```js
const pad = (n) => String(n).padStart(2, '0')

export const toISODateLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const hojeISO = () => toISODateLocal(new Date())

export const parseISODateLocal = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const formatarData = (iso) => (iso ? parseISODateLocal(iso).toLocaleDateString('pt-BR') : '-')

export const formatarMesExtenso = (mesRef) =>
  parseISODateLocal(`${mesRef}-01`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

export const formatMesReferencia = (date) => toISODateLocal(date).slice(0, 7)

export const mudarMes = (mesRef, delta) => {
  const [y, m] = mesRef.split('-').map(Number)
  return formatMesReferencia(new Date(y, m - 1 + delta, 1))
}
```

- [ ] **Step 4: Rodar e ver passar**

```bash
npm run test:run -- src/utils/dates.test.js
```

Expected: `6 passed`.

- [ ] **Step 5: Substituir os usos**

Em `src/services/transacoesService.js`, apagar a função local `formatMesReferencia` (linhas 12-18) e adicionar no topo:

```js
import { formatMesReferencia } from '../utils/dates'
export { formatMesReferencia }
```

Em `ExtratoMensal.jsx`: importar `{ hojeISO, formatarData, formatarMesExtenso, mudarMes as mudarMesRef }` de `../../utils/dates`; trocar `new Date().toISOString().split('T')[0]` (2 lugares) por `hojeISO()`; trocar o bloco da função `mudarMes` por:

```js
const mudarMes = (direcao) => setMesAtual(mudarMesRef(mesAtual, direcao === 'anterior' ? -1 : 1))
```

Trocar `new Date(mesAtual + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })` por `formatarMesExtenso(mesAtual)` e `new Date(transacao.data_transacao).toLocaleDateString('pt-BR')` por `formatarData(transacao.data_transacao)`.

Em `FaturaCartao.jsx`: mesmas substituições (`hojeISO()` na linha 394, `mudarMes` idem, `formatarMesExtenso(mesAtual)` na linha 457, `formatarData(t.data)` na 551).

Em `FinanciamentoImovel.jsx` e `FinanciamentoCarro.jsx`: `data_inicio: hojeISO()` e `formatarData(financiamento.data_inicio)`.

Em `Settings.jsx`: manter `formatDate` (recebe timestamp completo com fuso, `new Date(ts)` está correto ali).

- [ ] **Step 6: Lint, testes, build**

```bash
npm run lint && npm run test:run && npm run build
```

Expected: tudo passa; `grep -rn "toISOString().split" src` retorna vazio.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix: datas em fuso local (toISOString e new Date('YYYY-MM-DD') causavam dia errado)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Próximos vencimentos com virada de mês

**Files:**
- Create: `src/utils/vencimentos.js`
- Test: `src/utils/vencimentos.test.js`
- Modify: `src/components/Dashboard/DashboardHome.jsx:678-683`, `src/components/ContasFixas/ContasFixasList.jsx:801-805`

**Interfaces:**
- Produces: `diasAteVencimento(diaVencimento, hoje)` → inteiro ≥ 0; `proximosVencimentos(contas, hoje, limite=5)` → contas ativas ordenadas, cada uma com `diasRestantes`.

- [ ] **Step 1: Teste**

Create `src/utils/vencimentos.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { diasAteVencimento, proximosVencimentos } from './vencimentos'

describe('diasAteVencimento', () => {
  it('mesmo mês, ainda não venceu', () => {
    expect(diasAteVencimento(20, new Date(2026, 8, 17))).toBe(3)
  })
  it('vence hoje', () => {
    expect(diasAteVencimento(17, new Date(2026, 8, 17))).toBe(0)
  })
  it('já passou: vai para o mês seguinte', () => {
    expect(diasAteVencimento(5, new Date(2026, 8, 17))).toBe(18)
  })
  it('dia 31 em mês de 30 dias cai no último dia', () => {
    expect(diasAteVencimento(31, new Date(2026, 8, 29))).toBe(1)
  })
  it('dezembro para janeiro', () => {
    expect(diasAteVencimento(2, new Date(2026, 11, 30))).toBe(3)
  })
})

describe('proximosVencimentos', () => {
  it('ignora inativas, ordena e limita', () => {
    const contas = [
      { id: 1, nome: 'Luz', dia_vencimento: 25, ativa: true },
      { id: 2, nome: 'Aluguel', dia_vencimento: 5, ativa: true },
      { id: 3, nome: 'Academia', dia_vencimento: 18, ativa: false },
      { id: 4, nome: 'Internet', dia_vencimento: 18, ativa: true },
    ]
    const r = proximosVencimentos(contas, new Date(2026, 8, 17), 2)
    expect(r.map((c) => c.nome)).toEqual(['Internet', 'Luz'])
    expect(r[0].diasRestantes).toBe(1)
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npm run test:run -- src/utils/vencimentos.test.js
```

- [ ] **Step 3: Implementar `src/utils/vencimentos.js`**

```js
const diasNoMes = (ano, mes) => new Date(ano, mes + 1, 0).getDate()
const inicioDoDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const MS_DIA = 86_400_000

export const diasAteVencimento = (diaVencimento, hoje = new Date()) => {
  const base = inicioDoDia(hoje)
  const ano = base.getFullYear()
  const mes = base.getMonth()
  let venc = new Date(ano, mes, Math.min(diaVencimento, diasNoMes(ano, mes)))
  if (venc < base) {
    venc = new Date(ano, mes + 1, Math.min(diaVencimento, diasNoMes(ano, mes + 1)))
  }
  return Math.round((venc - base) / MS_DIA)
}

export const proximosVencimentos = (contas, hoje = new Date(), limite = 5) =>
  contas
    .filter((c) => c.ativa)
    .map((c) => ({ ...c, diasRestantes: diasAteVencimento(c.dia_vencimento, hoje) }))
    .sort((a, b) => a.diasRestantes - b.diasRestantes)
    .slice(0, limite)
```

- [ ] **Step 4: Rodar e ver passar**

```bash
npm run test:run -- src/utils/vencimentos.test.js
```

Expected: `6 passed`.

- [ ] **Step 5: Usar nos componentes**

`DashboardHome.jsx`: importar `{ proximosVencimentos }` e substituir as linhas 678-683 por:

```js
const proximosVencimentosLista = proximosVencimentos(contas)
```

(e `proximosVencimentos: proximosVencimentosLista` no `setStats`). No JSX do item, trocar `Dia {conta.dia_vencimento}` por `{conta.diasRestantes === 0 ? 'Vence hoje' : `Dia ${conta.dia_vencimento} · em ${conta.diasRestantes} dias`}`.

`ContasFixasList.jsx`: apagar `getDiasRestantes` (801-805) e usar `diasAteVencimento(conta.dia_vencimento)`.

- [ ] **Step 6: Lint, testes, build e commit**

```bash
npm run lint && npm run test:run && npm run build
git add -A
git commit -m "fix: próximos vencimentos consideram virada de mês e meses curtos

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Dashboard real (resumo via view, sem valores fictícios)

**Files:**
- Modify: `src/services/transacoesService.js` (getResumoMensal, getEvolucaoMensal), `src/components/Dashboard/DashboardHome.jsx:638-645, 743-751`
- Test: `src/services/resumo.test.js` (função pura extraída)

**Interfaces:**
- Produces: `getResumoMensal(mes)` → `{ receitas, despesas, saldo }` sempre numérico; `getEvolucaoMensal(n)` → array de `{ mes, mesReferencia, receitas, despesas, saldo }` em **uma** consulta; `montarEvolucao(linhasView, mesesRef)` pura em `src/utils/resumo.js`.

- [ ] **Step 1: Teste da função pura**

Create `src/utils/resumo.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { montarEvolucao, linhaParaResumo, ultimosMeses } from './resumo'

describe('resumo', () => {
  it('linhaParaResumo converte strings numéricas e trata null', () => {
    expect(linhaParaResumo({ total_receitas: '1000.50', total_despesas: '200', saldo: '800.50' }))
      .toEqual({ receitas: 1000.5, despesas: 200, saldo: 800.5 })
    expect(linhaParaResumo(null)).toEqual({ receitas: 0, despesas: 0, saldo: 0 })
  })
  it('ultimosMeses gera N meses terminando no atual', () => {
    expect(ultimosMeses(3, new Date(2026, 0, 15))).toEqual(['2025-11', '2025-12', '2026-01'])
  })
  it('montarEvolucao preenche meses sem dados com zero', () => {
    const linhas = [{ mes_referencia: '2026-01', total_receitas: '10', total_despesas: '4', saldo: '6' }]
    const r = montarEvolucao(linhas, ['2025-12', '2026-01'])
    expect(r).toEqual([
      { mes: 'dez. 25', mesReferencia: '2025-12', receitas: 0, despesas: 0, saldo: 0 },
      { mes: 'jan. 26', mesReferencia: '2026-01', receitas: 10, despesas: 4, saldo: 6 },
    ])
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npm run test:run -- src/utils/resumo.test.js
```

- [ ] **Step 3: Implementar `src/utils/resumo.js`**

```js
import { formatMesReferencia, parseISODateLocal } from './dates'

export const linhaParaResumo = (linha) => ({
  receitas: Number(linha?.total_receitas ?? 0),
  despesas: Number(linha?.total_despesas ?? 0),
  saldo: Number(linha?.saldo ?? 0),
})

export const ultimosMeses = (n, hoje = new Date()) =>
  Array.from({ length: n }, (_, i) => formatMesReferencia(new Date(hoje.getFullYear(), hoje.getMonth() - (n - 1 - i), 1)))

const rotuloMes = (mesRef) =>
  parseISODateLocal(`${mesRef}-01`).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })

export const montarEvolucao = (linhas, mesesRef) =>
  mesesRef.map((mesReferencia) => ({
    mes: rotuloMes(mesReferencia),
    mesReferencia,
    ...linhaParaResumo(linhas.find((l) => l.mes_referencia === mesReferencia)),
  }))
```

- [ ] **Step 4: Rodar e ver passar**

```bash
npm run test:run -- src/utils/resumo.test.js
```

Expected: `3 passed`. Se o rótulo vier como `dez. de 25`, ajustar o teste ao formato real do Node, não a função.

- [ ] **Step 5: Reescrever `getResumoMensal` e `getEvolucaoMensal` no serviço**

Substituir as duas funções em `transacoesService.js` por:

```js
import { linhaParaResumo, montarEvolucao, ultimosMeses } from '../utils/resumo'

export const getResumoMensal = async (mesReferencia) => {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('resumo_mensal')
    .select('total_receitas, total_despesas, saldo')
    .eq('user_id', userId)
    .eq('mes_referencia', mesReferencia)
    .maybeSingle()
  if (error) throw error
  return linhaParaResumo(data)
}

export const getEvolucaoMensal = async (meses = 6) => {
  const userId = await getUserId()
  const mesesRef = ultimosMeses(meses)
  const { data, error } = await supabase
    .from('resumo_mensal')
    .select('mes_referencia, total_receitas, total_despesas, saldo')
    .eq('user_id', userId)
    .in('mes_referencia', mesesRef)
  if (error) throw error
  return montarEvolucao(data || [], mesesRef)
}
```

Apagar `getTotalReceitas` e `getTotalDespesas`; em `ExtratoMensal.jsx` (linhas 106-112) trocar por `const resumo = await getResumoMensal(mesAtual); setResumo(resumo)`.

- [ ] **Step 6: Dashboard sem números fictícios**

Em `DashboardHome.jsx`, estado inicial:

```js
const [stats, setStats] = useState({
  saldoMes: 0, gastosMes: 0, receitasMes: 0, proximosVencimentos: [],
  contasFixasTotal: 0, limiteDisponivel: 0, metasProgresso: 0, gastosPorCategoria: [], evolucaoMensal: [],
})
```

No `setStats`, `saldoMes: resumo.saldo`. No primeiro card: label `Saldo do mês`, valor `stats.saldoMes`, rodapé `{stats.receitasMes > 0 ? `${((stats.gastosMes / stats.receitasMes) * 100).toFixed(0)}% da receita gasta` : 'Sem receitas neste mês'}`. Remover o rodapé "% do total". Em "Progresso de Metas", trocar o texto fixo por `{stats.metasProgresso >= 100 ? 'Todas as metas atingidas!' : stats.metasProgresso > 0 ? 'Continue guardando.' : 'Crie uma meta para acompanhar aqui.'}`. Adicionar `toast.error('Não foi possível carregar o dashboard')` no `catch`.

- [ ] **Step 7: Lint, testes, build e commit**

```bash
npm run lint && npm run test:run && npm run build
git add -A
git commit -m "fix: dashboard usa a view resumo_mensal, remove valores fictícios e evolução em uma consulta

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Transações: edição segura, sem parcelamento, sem RPCs inexistentes, limite coerente

**Files:**
- Modify: `src/services/transacoesService.js` (addTransacao, updateTransacao, deleteTransacao; remover criarTransacaoParcelada, pagarFaturaCartao), `src/components/Extrato/ExtratoMensal.jsx` (form, linhas 168-203, 347, 536-548), `src/components/Cartoes/FaturaCartao.jsx` (remover pagamento), `src/components/Cartoes/CartoesList.jsx:160-165` (texto do banner)
- Test: `src/utils/transacaoPayload.test.js`

**Interfaces:**
- Produces: `montarPayloadTransacao(form)` pura em `src/utils/transacaoPayload.js` que devolve só colunas válidas, com `cartao_credito_id` `null` quando vazio e sem `num_parcelas`.

- [ ] **Step 1: Teste**

Create `src/utils/transacaoPayload.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { montarPayloadTransacao } from './transacaoPayload'

describe('montarPayloadTransacao', () => {
  it('remove campos de formulário e normaliza cartão vazio', () => {
    const p = montarPayloadTransacao({
      tipo: 'despesa', categoria: 'Compras', descricao: 'Mercado', valor: 85.9,
      data_transacao: '2026-09-17', conta_bancaria: 'Nubank', metodo_pagamento: 'PIX',
      cartao_credito_id: '', num_parcelas: 3, observacoes: '',
    })
    expect(p).toEqual({
      tipo: 'despesa', categoria: 'Compras', descricao: 'Mercado', valor: 85.9,
      data_transacao: '2026-09-17', mes_referencia: '2026-09', conta_bancaria: 'Nubank',
      metodo_pagamento: 'PIX', cartao_credito_id: null, observacoes: null,
    })
    expect('num_parcelas' in p).toBe(false)
  })
  it('mantém o cartão quando o método é Crédito', () => {
    const p = montarPayloadTransacao({
      tipo: 'despesa', categoria: 'Lazer', descricao: 'Cinema', valor: 40,
      data_transacao: '2026-09-17', metodo_pagamento: 'Crédito', cartao_credito_id: 'abc',
    })
    expect(p.cartao_credito_id).toBe('abc')
    expect(p.conta_bancaria).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

```bash
npm run test:run -- src/utils/transacaoPayload.test.js
```

- [ ] **Step 3: Implementar `src/utils/transacaoPayload.js`**

```js
import { formatMesReferencia, parseISODateLocal } from './dates'

const ouNulo = (v) => (v === undefined || v === '' ? null : v)

export const montarPayloadTransacao = (form) => ({
  tipo: form.tipo,
  categoria: form.categoria,
  descricao: form.descricao,
  valor: Number(form.valor),
  data_transacao: form.data_transacao,
  mes_referencia: formatMesReferencia(parseISODateLocal(form.data_transacao)),
  conta_bancaria: form.metodo_pagamento === 'Crédito' ? null : ouNulo(form.conta_bancaria),
  metodo_pagamento: form.metodo_pagamento,
  cartao_credito_id: form.metodo_pagamento === 'Crédito' ? ouNulo(form.cartao_credito_id) : null,
  observacoes: ouNulo(form.observacoes),
})
```

- [ ] **Step 4: Rodar e ver passar**

```bash
npm run test:run -- src/utils/transacaoPayload.test.js
```

- [ ] **Step 5: Serviço**

Em `transacoesService.js`:

- Apagar `criarTransacaoParcelada`, `pagarFaturaCartao` e o branch "Se for crédito parcelado" de `addTransacao`. `addTransacao(payload)` passa a inserir `{ user_id: userId, ...payload }` e, se `payload.metodo_pagamento === 'Crédito' && payload.cartao_credito_id`, chama `atualizarLimiteCartao(id, payload.valor, 'aumentar')`.
- `updateTransacao(id, payload)`: antes de atualizar, buscar a transação atual (`select('*').eq('id', id).single()`); se `atual.is_parcelado` lançar `new Error('Transações parceladas não podem ser editadas')`; aplicar `update({ ...payload, updated_at: new Date().toISOString() })`; depois ajustar limite: se a atual era crédito com cartão, `diminuir` o valor antigo; se a nova é crédito com cartão, `aumentar` o novo.
- `deleteTransacao(id)`: buscar a transação; excluir; se era crédito com cartão e `!is_parcelado`, `atualizarLimiteCartao(cartao, valor, 'diminuir')`.
- Manter `calcularFaturaCartao` **apenas com o cálculo manual** (remover a chamada `supabase.rpc('calcular_fatura_cartao')`).

- [ ] **Step 6: Extrato**

Em `ExtratoMensal.jsx`:

- Trocar `'↑ Receúita'` por `'↑ Receita'`.
- Remover o `<select>` de Parcelas (linhas 536-548) e `num_parcelas` do estado.
- `handleSubmit`: montar `const payload = montarPayloadTransacao({ ...formData, categoria: formData.categoria || (formData.tipo === 'receita' ? 'Salário' : 'Outros') })` e chamar `updateTransacao(editingTransacao.id, payload)` ou `addTransacao(payload)`; mensagem de sucesso única `'Transação salva!'`; no `catch`, `toast.error(getErrorMessage(error))`.
- Substituir `window.confirm` do delete por: manter (troca de modal é Fase 1), mas usar `getErrorMessage` no catch.

- [ ] **Step 7: Fatura e cartões**

Em `FaturaCartao.jsx`: remover `showPagarModal`, `formPagamento`, `handlePagarFatura`, o botão "Pagar Fatura" e o modal de pagamento; remover import de `pagarFaturaCartao`. Abaixo do resumo da fatura, adicionar:

```jsx
<p className="text-muted" style={{ fontSize: 13 }}>
  Para registrar o pagamento, lance uma despesa na categoria "Cartão de Crédito" no Extrato.
</p>
```

Em `CartoesList.jsx`, banner: `Para adicionar compras no cartão, vá em "Extrato Mensal" e escolha "Crédito" como método. Parcelamento chega na próxima versão.`

- [ ] **Step 8: Lint, testes, build e commit**

```bash
npm run lint && npm run test:run && npm run build
git add -A
git commit -m "fix: edição e exclusão de transações coerentes com o limite; desativar parcelamento e pagar fatura (RPCs inexistentes)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: Exclusão de conta real (Edge Function)

**Files:**
- Create: `supabase/functions/delete-account/index.ts`
- Modify: `src/services/authService.js:422-452`, `src/components/Settings/Settings.jsx:69-92`
- Manual: deploy com a CLI

**Interfaces:**
- Produces: `POST /functions/v1/delete-account` com header `Authorization: Bearer <jwt do usuário>` → `{ ok: true }`; apaga dados em todas as tabelas, `perfis` e `auth.users`.

- [ ] **Step 1: Escrever a função**

Create `supabase/functions/delete-account/index.ts`:

```ts
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

const TABELAS_POR_USER_ID = [
  'transacoes', 'contas_fixas', 'metas_desejos', 'financiamento_imovel',
  'financiamento_carro', 'contas_bancarias', 'orcamentos', 'cartoes_credito',
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const authHeader = req.headers.get('Authorization') ?? ''

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } })
  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) return json({ error: 'unauthorized' }, 401)

  const admin = createClient(url, serviceKey)

  const { data: cartoes } = await admin.from('cartoes_credito').select('id').eq('user_id', user.id)
  const cartaoIds = (cartoes ?? []).map((c) => c.id)
  if (cartaoIds.length > 0) {
    const { error } = await admin.from('transacoes_cartao').delete().in('cartao_id', cartaoIds)
    if (error) return json({ error: `transacoes_cartao: ${error.message}` }, 500)
  }
  for (const tabela of TABELAS_POR_USER_ID) {
    const { error } = await admin.from(tabela).delete().eq('user_id', user.id)
    if (error) return json({ error: `${tabela}: ${error.message}` }, 500)
  }
  const { error: perfilError } = await admin.from('perfis').delete().eq('id', user.id)
  if (perfilError) return json({ error: `perfis: ${perfilError.message}` }, 500)

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) return json({ error: `auth: ${deleteError.message}` }, 500)

  return json({ ok: true })
})
```

- [ ] **Step 2: Frontend chama a função**

Em `authService.js`, substituir `deleteAccount` inteira por:

```js
export const deleteAccount = async () => {
  const { data, error } = await supabase.functions.invoke('delete-account', { method: 'POST' })
  if (error) throw new Error(error.message || 'Não foi possível excluir a conta')
  if (!data?.ok) throw new Error(data?.error || 'Não foi possível excluir a conta')
  await supabase.auth.signOut()
  return true
}
```

Em `Settings.jsx`, `handleDeleteAccount`: após `await deleteAccount()`, `toast.success('Conta excluída. Sentiremos sua falta.')`; o `AuthContext` já redireciona no `SIGNED_OUT`.

- [ ] **Step 3: Deploy**

```bash
npx supabase functions deploy delete-account --use-api --project-ref ctchgljqbardmzajgyjp
```

Expected: `Deployed Functions on project ctchgljqbardmzajgyjp: delete-account`. Se a CLI reclamar de Docker, o `--use-api` é o que evita isso; se ainda assim falhar, instalar Docker antes.

- [ ] **Step 4: Verificar de ponta a ponta**

1. `npm run dev`, criar uma conta nova `teste-exclusao+<data>@example.com` (a confirmação de e-mail pode estar ligada; se estiver, confirmar pelo painel Auth → Users → "Confirm").
2. Lançar uma transação e um cartão.
3. Configurações → Excluir conta → digitar EXCLUIR.
4. Conferir no painel Supabase (Auth → Users) que o usuário sumiu, e no SQL Editor:

```sql
select count(*) from transacoes where user_id not in (select id from auth.users);
```

Expected: `0`.

- [ ] **Step 5: Lint e commit**

```bash
npm run lint && npm run test:run
git add -A
git commit -m "feat: exclusão de conta real via Edge Function com service role

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Esqueci minha senha e redefinição

**Files:**
- Create: `src/components/Auth/ForgotPassword.jsx`, `src/components/Auth/ResetPassword.jsx`
- Modify: `src/contexts/AuthContext.jsx`, `src/components/Auth/AuthPage.jsx`, `src/components/Auth/Login.jsx` (rodapé), `src/App.jsx`, `src/services/authService.js` (resetPassword redirect), `src/components/Auth/SignUp.jsx` (mínimo 8)
- Manual: Supabase Auth → URL Configuration

**Interfaces:**
- Consumes: `resetPassword(email)`, `updatePassword(nova)` de `authService.js` (já existem).
- Produces: `useAuth().recoveryMode` (boolean) e `useAuth().clearRecovery()`.

- [ ] **Step 1: AuthContext reconhece o evento de recuperação**

Em `AuthContext.jsx`, adicionar estado `const [recoveryMode, setRecoveryMode] = useState(false)`; no listener:

```js
const { data: authListener } = onAuthStateChange(async (event, session) => {
  setSession(session)
  setUser(session?.user ?? null)
  if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true)
  if (event === 'SIGNED_OUT') setRecoveryMode(false)
  setLoading(false)
})
```

Expor `recoveryMode` e `clearRecovery: () => setRecoveryMode(false)` no `value`.

- [ ] **Step 2: Componentes**

Create `ForgotPassword.jsx`:

```jsx
import React, { useState } from 'react'
import { Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { resetPassword } from '../../services/authService'
import { getErrorMessage } from '../../utils/errorHandler'
import './Auth.css'

const ForgotPassword = ({ onBack }) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <h1>Recuperar senha</h1>
          <p>{sent ? 'Se este e-mail estiver cadastrado, você receberá um link em instantes.' : 'Informe seu e-mail e enviaremos um link para criar uma nova senha.'}</p>
        </div>
        {!sent && (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="forgot-email"><Mail size={18} /> Email</label>
              <input id="forgot-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link'}
            </button>
          </form>
        )}
        <div className="auth-footer">
          <button type="button" onClick={onBack} className="link-button"><ArrowLeft size={14} /> Voltar ao login</button>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
```

Create `ResetPassword.jsx`:

```jsx
import React, { useState } from 'react'
import { Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { updatePassword } from '../../services/authService'
import { getErrorMessage } from '../../utils/errorHandler'
import { useAuth } from '../../contexts/AuthContext'
import './Auth.css'

const ResetPassword = () => {
  const { clearRecovery } = useAuth()
  const [senha, setSenha] = useState('')
  const [confirma, setConfirma] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (senha.length < 8) return toast.error('A senha deve ter pelo menos 8 caracteres')
    if (senha !== confirma) return toast.error('As senhas não coincidem')
    setLoading(true)
    try {
      await updatePassword(senha)
      toast.success('Senha atualizada!')
      clearRecovery()
      window.history.replaceState({}, '', '/')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <h1>Nova senha</h1>
          <p>Escolha uma senha com pelo menos 8 caracteres.</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nova-senha"><Lock size={18} /> Nova senha</label>
            <input id="nova-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} minLength={8} required disabled={loading} />
          </div>
          <div className="form-group">
            <label htmlFor="confirma-senha"><Lock size={18} /> Confirmar senha</label>
            <input id="confirma-senha" type="password" value={confirma} onChange={(e) => setConfirma(e.target.value)} minLength={8} required disabled={loading} />
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
```

- [ ] **Step 3: Ligar as telas**

`AuthPage.jsx`: estado `mode` com valores `'login' | 'signup' | 'forgot'`; `Login` recebe `onForgotPassword={() => setMode('forgot')}`; `ForgotPassword` recebe `onBack={() => setMode('login')}`.

`Login.jsx`: no `auth-footer`, antes de "Não tem uma conta?", adicionar:

```jsx
<p><button type="button" onClick={onForgotPassword} className="link-button" disabled={loading}>Esqueci minha senha</button></p>
```

`App.jsx`: após o `if (loading)`, adicionar `if (recoveryMode) return <ResetPassword />` (pegar `recoveryMode` do `useAuth()`).

`authService.js`: em `resetPassword`, `redirectTo: `${window.location.origin}/reset-password``. Manter (a rota é reescrita para `index.html` pela Vercel e o evento `PASSWORD_RECOVERY` chega pelo hash).

`SignUp.jsx`: mínimo de senha 8 (validação, `minLength`, texto "Mínimo 8 caracteres").

- [ ] **Step 4: Configuração no painel Supabase (manual, Iago)**

Authentication → URL Configuration → adicionar em Redirect URLs: `http://localhost:3000/reset-password` e `https://<domínio-vercel>/reset-password`. Authentication → Providers → Email → Minimum password length: 8.

- [ ] **Step 5: Verificar manualmente**

`npm run dev` → Esqueci minha senha → e-mail recebido → link abre o app já na tela "Nova senha" → salvar → cai no dashboard logado.

- [ ] **Step 6: Lint, testes, build e commit**

```bash
npm run lint && npm run test:run && npm run build
git add -A
git commit -m "feat: esqueci minha senha e redefinição via evento PASSWORD_RECOVERY

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Assets leves, loading único e code-splitting

**Files:**
- Create: `public/favicon.svg`, `src/components/UI/Spinner.jsx`, `src/components/UI/Spinner.css`
- Delete: `public/loading-icon.gif`, `public/logo-icon.png`
- Modify: `index.html`, `src/App.jsx`, `src/App.css` (`.app-loading .loading-icon`), `vite.config.js`, e os 5 usos de `loading-icon.gif` (`App.jsx`, `ExtratoMensal.jsx`, `CartoesList.jsx`, `MetasList.jsx`, `FinanciamentoImovel.jsx`, `FinanciamentoCarro.jsx`, `DashboardHome.jsx`)

- [ ] **Step 1: Favicon SVG**

Create `public/favicon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#2563eb"/><path d="M40.5 22.5c-1.6-2.4-4.5-3.7-8.2-3.7-5.2 0-8.8 2.6-8.8 6.6 0 3.6 2.6 5.4 8.3 6.7 5.6 1.3 7.5 2.6 7.5 5.1 0 2.6-2.5 4.2-6.4 4.2-4 0-6.7-1.6-8.4-4.4" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>
```

`index.html`: `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`.

- [ ] **Step 2: Spinner**

Create `src/components/UI/Spinner.jsx`:

```jsx
import React from 'react'
import './Spinner.css'

const Spinner = ({ label = 'Carregando...', size = 40 }) => (
  <div className="spinner-wrap" role="status" aria-live="polite">
    <span className="spinner-ring" style={{ width: size, height: size }} aria-hidden="true" />
    <p>{label}</p>
  </div>
)

export default Spinner
```

Create `src/components/UI/Spinner.css`:

```css
.spinner-wrap { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; min-height: 240px; color: var(--text-secondary); font-weight: 600; font-size: 14px; }
.spinner-ring { border-radius: 50%; border: 3px solid var(--glass-border); border-top-color: var(--primary); animation: spinner-rotate 0.8s linear infinite; }
@keyframes spinner-rotate { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) { .spinner-ring { animation-duration: 2s; } }
```

Substituir cada bloco `<div className="loading-container"><img src="/loading-icon.gif" .../><p>Carregando X...</p></div>` por `<Spinner label="Carregando X..." />` nos 7 arquivos. Em `App.jsx`, o loading inicial vira `<div className="app-loading"><Spinner label="Carregando..." size={56} /></div>`; remover a regra `.app-loading .loading-icon` e o keyframe `float` de `App.css`.

```bash
git rm public/loading-icon.gif public/logo-icon.png
```

- [ ] **Step 3: Code-splitting**

`App.jsx`: trocar os imports de tela por `React.lazy`:

```jsx
import React, { useState, Suspense, lazy } from 'react'
const DashboardHome = lazy(() => import('./components/Dashboard/DashboardHome'))
const ExtratoMensal = lazy(() => import('./components/Extrato/ExtratoMensal'))
const ContasFixasList = lazy(() => import('./components/ContasFixas/ContasFixasList'))
const CartoesList = lazy(() => import('./components/Cartoes/CartoesList'))
const FinanciamentoImovel = lazy(() => import('./components/Financiamentos/FinanciamentoImovel'))
const FinanciamentoCarro = lazy(() => import('./components/Financiamentos/FinanciamentoCarro'))
const MetasList = lazy(() => import('./components/Metas/MetasList'))
const Settings = lazy(() => import('./components/Settings/Settings'))
```

E envolver `{renderContent()}` em `<Suspense fallback={<Spinner />}>`.

`vite.config.js`:

```js
build: {
  rollupOptions: {
    output: {
      manualChunks: { recharts: ['recharts'], supabase: ['@supabase/supabase-js'], react: ['react', 'react-dom'] },
    },
  },
},
```

- [ ] **Step 4: Build e checar tamanho**

```bash
npm run build
```

Expected: nenhum chunk acima de 500 kB; `dist/` sem `loading-icon.gif`.

- [ ] **Step 5: Lint, testes, commit**

```bash
npm run lint && npm run test:run
git add -A
git commit -m "perf: favicon SVG, spinner único no lugar do GIF e code-splitting por tela

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Sentry

**Files:**
- Modify: `src/main.jsx`, `src/components/ErrorBoundary.jsx`, `.env.example`, `src/utils/logger.js`
- Manual: criar projeto no Sentry e variável na Vercel

- [ ] **Step 1: Instalar**

```bash
npm i @sentry/react
```

- [ ] **Step 2: Inicializar só quando houver DSN**

`src/main.jsx`, antes do `createRoot`:

```jsx
import * as Sentry from '@sentry/react'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  })
}
```

`ErrorBoundary.jsx`, em `componentDidCatch`, adicionar `Sentry.captureException(error, { extra: { componentStack: errorInfo?.componentStack } })` (importar `* as Sentry from '@sentry/react'`). Em `logger.error`, além do console em dev, chamar `Sentry.captureMessage(message, { level: 'error', extra: { args } })` quando `import.meta.env.VITE_SENTRY_DSN` existir.

`.env.example`: adicionar `VITE_SENTRY_DSN=` com comentário "opcional".

- [ ] **Step 3: Manual (Iago)**

Criar conta/projeto React em https://sentry.io, copiar o DSN, adicionar `VITE_SENTRY_DSN` em Vercel → Settings → Environment Variables (Production e Preview) e no `.env` local.

- [ ] **Step 4: Verificar**

Com o DSN no `.env`, `npm run dev`, abrir o console e rodar `throw new Error('teste sentry')` dentro de um handler (ou temporariamente em um botão). O evento deve aparecer no Sentry em até 1 minuto.

- [ ] **Step 5: Lint, build, commit**

```bash
npm run lint && npm run test:run && npm run build
git add -A
git commit -m "feat: monitoramento de erros com Sentry (ativo só com VITE_SENTRY_DSN)

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Limpeza de código morto e arquivos da raiz

**Files:**
- Delete: `src/components/Layout/Header.jsx`, `src/components/Layout/Header.css`, `react-icons` (dependência)
- Move: `EXEMPLOS-UX-QUICK-WINS.jsx`, `UX-QUICK-WINS.md` → `docs/legacy/`; `supabase-setup.sql`, `database/*.sql` → `docs/legacy-sql/`
- Create: `docs/legacy-sql/README.md`
- Modify: `src/services/authService.js` (remover `signInWithMicrosoft`), `src/services/cartoesService.js` (remover `getTransacoes`, `addTransacao`, `deleteTransacao`), `src/components/Auth/Login.jsx` e `SignUp.jsx` (ícone Google inline), `README.md`

- [ ] **Step 1: Mover arquivos**

```bash
mkdir -p docs/legacy docs/legacy-sql
git mv EXEMPLOS-UX-QUICK-WINS.jsx UX-QUICK-WINS.md docs/legacy/
git mv supabase-setup.sql database/supabase-migration-auth.sql database/supabase-migration-parcelas.sql database/supabase-fix-foreign-keys.sql database/supabase-fix-demo-user.sql docs/legacy-sql/
git rm src/components/Layout/Header.jsx src/components/Layout/Header.css
```

Create `docs/legacy-sql/README.md`:

```markdown
# SQL legado (não aplicar)

Estes scripts foram usados manualmente em 2026 e **não refletem o banco de produção**:
a migração de parcelas nunca foi aplicada e a de auth foi aplicada parcialmente (sem foreign keys).
A fonte de verdade a partir da Fase 1 é `supabase/migrations/`. Mantidos só para consulta histórica.
```

- [ ] **Step 2: Ícone do Google sem react-icons**

Create `src/components/Auth/GoogleIcon.jsx`:

```jsx
import React from 'react'

const GoogleIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.8 6C12.3 13.2 17.7 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17.5z"/>
    <path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/>
    <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.7-3.7-13.6-9l-7.8 6C6.5 42.6 14.6 48 24 48z"/>
  </svg>
)

export default GoogleIcon
```

Em `Login.jsx` e `SignUp.jsx`: trocar `import { FcGoogle } from 'react-icons/fc'` por `import GoogleIcon from './GoogleIcon'` e `<FcGoogle size={20} />` por `<GoogleIcon />`.

```bash
npm uninstall react-icons
```

- [ ] **Step 3: Remover funções mortas**

`authService.js`: apagar `signInWithMicrosoft`. `cartoesService.js`: apagar a seção `// ========== TRANSAÇÕES ==========` inteira (tabela `transacoes_cartao` é legado).

- [ ] **Step 4: README**

Em `README.md`: seção "Configuração" item 4 passa a ser "Execute as migrations em `supabase/migrations/` (Supabase CLI)"; adicionar `VITE_SENTRY_DSN` opcional; remover a menção a `supabase-setup.sql`; trocar "Este projeto é privado e de uso pessoal" por "Em preparação para lançamento público. Veja `docs/superpowers/specs/`".

- [ ] **Step 5: Lint, testes, build, commit**

```bash
npm run lint && npm run test:run && npm run build
git add -A
git commit -m "chore: remover código morto, react-icons e mover SQL e docs legados

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Revisão de segurança, verificação final e integração

**Files:**
- Nenhum novo. Verificação e merge.

- [ ] **Step 1: Verificação completa**

```bash
npm run lint && npm run test:run && npm run build
grep -rn "toISOString().split\|Receúita\|loading-icon.gif\|react-icons\|criar_transacao_parcelada\|pagar_fatura_cartao\|signInWithMicrosoft" src index.html || echo "limpo"
```

Expected: tudo passa; `limpo`.

- [ ] **Step 2: Smoke test manual no app (`npm run dev`)**

1. Login com a conta do Iago: dashboard mostra saldo do mês real (não 5.420,50).
2. Extrato: criar despesa PIX, editar, excluir. Criar despesa Crédito com cartão: limite usado sobe; excluir: limite volta.
3. Cartões → Ver fatura: lista compras do mês, sem botão "Pagar".
4. Contas fixas: "dias restantes" corretos para uma conta com dia já passado.
5. Sair → Esqueci minha senha → fluxo completo.
6. Trocar de aba com o DevTools em Network: telas carregam chunks separados.

- [ ] **Step 3: Revisão de segurança**

Invocar a skill `security-review` na branch. Corrigir qualquer achado de severidade alta antes de seguir.

- [ ] **Step 4: Revisão de código**

Invocar `superpowers:requesting-code-review` com o diff `main..fase-0/seguranca`. Aplicar correções e commitar.

- [ ] **Step 5: Integrar**

Seguir `superpowers:finishing-a-development-branch`: merge em `main` (fast-forward ou squash, a escolha do Iago) e push. A Vercel publica automaticamente. Depois do deploy, repetir os passos 1 a 3 do smoke test em produção.

- [ ] **Step 6: Registrar**

No spec (`docs/superpowers/specs/2026-09-17-sofinance-revamp-design.md`), marcar a Fase 0 como concluída com a data, e atualizar a página visual do plano.

---

## Itens que dependem do Iago

| Item | Quando | Onde |
|---|---|---|
| Redirect URLs de `/reset-password` e senha mínima 8 | Task 8 | Supabase → Authentication |
| Projeto Sentry e `VITE_SENTRY_DSN` na Vercel | Task 10 | sentry.io e Vercel |
| Aprovar merge em `main` | Task 12 | Git |
| Docker Desktop (para `db pull` e Fase 1) | Antes da Fase 1 | docs.docker.com/desktop |
