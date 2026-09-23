# 💰 Sofinance

Sistema completo de gestão financeira pessoal desenvolvido com **React** e **Supabase**.

## 📋 Funcionalidades

- **Dashboard Inteligente**: Visualize suas finanças com gráficos e indicadores
- **Extrato Mensal**: Controle completo de receitas e despesas
- **Cartões de Crédito**: Gerencie cartões e faturas
- **Contas Fixas**: Acompanhe contas recorrentes
- **Metas Financeiras**: Defina e monitore objetivos de economia
- **Financiamentos**: Simule e acompanhe financiamentos de imóveis e carros
- **Modo Escuro**: Interface adaptável ao seu estilo

## 🚀 Tecnologias

- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **Estilização**: CSS Moderno com Glassmorphism
- **Validação**: Zod
- **Gráficos**: Recharts
- **Ícones**: Lucide React
- **Notificações**: React Hot Toast

## 🔒 Segurança

- **Row-Level Security (RLS)** no Supabase
- **Autenticação segura** com email/senha
- **Variáveis de ambiente** para credenciais
- **Logging production-safe** (sem expor dados sensíveis)

## ⚙️ Configuração

### Pré-requisitos

- Node.js 18+
- Conta no Supabase

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/sofinance.git
cd sofinance
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:

Crie um arquivo `.env` na raiz do projeto:

```env
# Enviadas ao navegador (prefixo VITE_)
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_SENTRY_DSN=sua_dsn_do_sentry   # opcional, ativa o monitoramento de erros

# Só para o terminal. Sem o prefixo VITE_, então nunca vai para o navegador.
# Está em Supabase → Project Settings → Database.
SUPABASE_DB_PASSWORD=senha_do_banco
```

4. Conecte o projeto e aplique as migrations:

```bash
npx supabase login
npx supabase link --project-ref <ref-do-projeto>
npm run db:push
```

A pasta `supabase/migrations/` contém o schema completo, começando pelo baseline. Um banco vazio reconstruído a partir dela fica idêntico ao de produção.

5. Publique a Edge Function de exclusão de conta:

```bash
npx supabase functions deploy delete-account --use-api
```

6. No painel Supabase → Authentication: adicione `http://localhost:3000/reset-password` e `https://<seu-domínio>/reset-password` em Redirect URLs, e defina o tamanho mínimo de senha como 8.

7. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 📂 Estrutura do Projeto

```
src/
├── components/      # Componentes React
├── contexts/        # Context API (Auth)
├── hooks/           # Custom Hooks
├── services/        # Integração com Supabase
├── utils/           # Utilitários (validações, formatação)
└── styles/          # CSS Global
```

## 🎨 Design

Interface moderna com:
- **Cor principal**: `#2563eb` (Azul Royal)
- **Glassmorphism** para cards e containers
- **Animações suaves** e transições
- **Acessibilidade** com ARIA labels
- **Responsivo** para mobile e desktop

## 🛠️ Comandos

### Aplicação

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o app em `http://localhost:3000` |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve localmente o que o build gerou |
| `npm run lint` | Verifica o código com ESLint |
| `npm run lint:fix` | Corrige automaticamente o que der |
| `npm run format` | Formata com Prettier |
| `npm test` | Testes em modo contínuo |
| `npm run test:run` | Testes uma vez, para automação |
| `npm run test:ui` | Testes com interface no navegador |
| `npm run test:coverage` | Relatório de cobertura |

### Banco de dados

Precisam do Docker Desktop aberto, exceto `db:push`, `db:diff` e `db:types`, que falam direto com a nuvem.

| Comando | O que faz |
|---|---|
| `npm run db:start` | Sobe o Supabase local: Postgres, autenticação, API e painel |
| `npm run db:stop` | Derruba o Supabase local |
| `npm run db:reset` | Apaga o banco local e reconstrói a partir de `supabase/migrations/` |
| `npm run db:diff` | Compara o banco local com o de produção. O esperado é `No schema changes found` |
| `npm run db:push` | Aplica em produção as migrations que ainda faltam |
| `npm run db:types` | Regenera `src/types/database.types.ts` a partir do schema |

Depois do `db:start`, o painel local abre em `http://localhost:54323` e os e-mails de teste ficam em `http://localhost:54324`.

**Importante:** os comandos que falam com produção precisam da senha do banco. Ela fica no `.env`, e o terminal não a carrega sozinho. Antes de usá-los:

```bash
set -a; source .env; set +a
```

### Como trabalhar com mudanças no banco

1. Crie o arquivo em `supabase/migrations/` no formato `AAAAMMDDHHMMSS_descricao.sql`
2. `npm run db:reset` para aplicar e testar localmente
3. `npm run db:push` para aplicar em produção
4. `npm run db:diff` para confirmar que os dois lados ficaram iguais

Nunca altere uma migration que já foi aplicada. Crie outra por cima.

## 📝 Licença

Em preparação para lançamento público. Veja `docs/superpowers/specs/`.

## 👤 Autor

Desenvolvido por **Iago Sofiatti** - [GitHub](https://github.com/iagosofiatti12)

---

⭐ Se você gostou deste projeto, considere dar uma estrela!
