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
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. Configure o banco de dados:

Execute o arquivo `supabase-setup.sql` no SQL Editor do Supabase.

5. Inicie o servidor de desenvolvimento:
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

## 📦 Build

Para gerar a versão de produção:

```bash
npm run build
```

Os arquivos otimizados estarão em `dist/`.

## 🧪 Testes

```bash
npm test
```

## 📝 Licença

Este projeto é privado e de uso pessoal.

## 👤 Autor

Desenvolvido por **Igor** - [Portfolio](https://seu-portfolio.com)

---

⭐ Se você gostou deste projeto, considere dar uma estrela!
