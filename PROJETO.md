# FinançasPRO — Documentação do Projeto

> App web de gestão financeira pessoal desenvolvido com Claude Code  
> Repositório: https://github.com/mixatech/app-financas

---

## Stack Tecnológica

| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 16.2.4 | Framework React (App Router) |
| React | 19.2.4 | UI |
| TypeScript | 5.x | Tipagem estática |
| Tailwind CSS | 4.x | Estilização |
| shadcn/ui (base-ui) | 4.4 | Componentes de UI |
| Supabase JS | 2.x | Cliente do banco de dados |
| Supabase SSR | 0.10 | Auth com cookies no Next.js |
| Recharts | 3.x | Gráfico de categorias |
| date-fns | 4.x | Formatação de datas em pt-BR |
| lucide-react | 1.x | Ícones |
| Vercel | — | Deploy (integração via GitHub) |

---

## Funcionalidades Implementadas

### Autenticação
- [x] Cadastro com e-mail e senha (Supabase Auth)
- [x] Tela pós-cadastro com aviso de confirmação por e-mail (inclui alerta sobre pasta de spam)
- [x] Login com e-mail e senha
- [x] Logout
- [x] Proteção de rotas via proxy (middleware Next.js 16)
- [x] Redirecionamento automático: usuário logado → `/dashboard`, deslogado → `/auth/login`

### Transações (CRUD completo)
- [x] Criar transação: tipo (receita/despesa), valor, descrição, categoria, data
- [x] Listar transações com filtro por mês, tipo e categoria
- [x] Editar transação (modal de edição)
- [x] Excluir transação com confirmação (AlertDialog)

### Dashboard
- [x] Cards de resumo: total de receitas, total de despesas, saldo (verde/vermelho)
- [x] Gráfico de pizza — despesas por categoria (Recharts)
- [x] Lista das 7 transações mais recentes com link "Ver todas"
- [x] Seletor de mês para filtrar o período

### Layout & Design
- [x] Navbar responsiva com menu mobile e link ativo destacado em verde
- [x] Design inspirado no Pierre Finance: fundo branco, acento verde #16a34a, tipografia bold charcoal
- [x] Páginas de auth com layout split (painel escuro + formulário)
- [x] Mobile-first, totalmente responsivo
- [x] Row Level Security (RLS) — cada usuário vê apenas suas próprias transações

---

## Estrutura de Arquivos

```
app-financas/
├── .env.local                          ← Credenciais Supabase (não vai ao Git)
├── .env.example                        ← Modelo de variáveis de ambiente
├── supabase-schema.sql                 ← SQL para criar tabela + RLS no Supabase
├── src/
│   ├── proxy.ts                        ← Auth guard (Next.js 16 — antes era middleware.ts)
│   ├── types/index.ts                  ← Tipos TypeScript + categorias + cores
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts               ← Supabase client (browser)
│   │       ├── server.ts               ← Supabase client (server/RSC)
│   │       └── middleware.ts           ← Refresh de sessão via cookies
│   ├── app/
│   │   ├── layout.tsx                  ← Layout raiz (fontes, metadata)
│   │   ├── page.tsx                    ← Redirect → /dashboard
│   │   ├── globals.css                 ← Tema: verde #16a34a, charcoal #111827
│   │   ├── auth/
│   │   │   ├── login/page.tsx          ← Página de login
│   │   │   ├── signup/page.tsx         ← Página de cadastro + tela de confirmação
│   │   │   └── callback/route.ts       ← Troca de code por sessão (OAuth/e-mail)
│   │   └── (app)/                      ← Route group protegido
│   │       ├── layout.tsx              ← Layout com Navbar + verificação de auth
│   │       ├── dashboard/page.tsx      ← Página do dashboard
│   │       └── transactions/page.tsx   ← Página de transações com filtros
│   └── components/
│       ├── layout/
│       │   └── navbar.tsx              ← Navbar com links ativos e mobile menu
│       ├── dashboard/
│       │   ├── summary-cards.tsx       ← Cards: receitas / despesas / saldo
│       │   ├── expense-chart.tsx       ← Gráfico de pizza (Recharts)
│       │   └── recent-transactions.tsx ← Lista das últimas transações
│       ├── transactions/
│       │   ├── transaction-form.tsx    ← Modal de criar/editar transação
│       │   ├── transaction-list.tsx    ← Lista com indicador lateral colorido
│       │   ├── transaction-filters.tsx ← Filtros mês / tipo / categoria
│       │   └── delete-button.tsx       ← Botão excluir com confirmação
│       └── ui/                         ← Componentes shadcn/ui (base-ui)
│           ├── alert-dialog.tsx
│           ├── badge.tsx
│           ├── button.tsx
│           ├── card.tsx
│           ├── dialog.tsx
│           ├── dropdown-menu.tsx
│           ├── input.tsx
│           ├── label.tsx
│           ├── select.tsx
│           ├── table.tsx
│           └── tabs.tsx
```

---

## Banco de Dados (Supabase)

### Tabela: `transactions`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | uuid | Chave primária (gerada automaticamente) |
| user_id | uuid | FK para `auth.users` (cascade delete) |
| type | text | `'income'` ou `'expense'` |
| amount | numeric(12,2) | Valor positivo |
| description | text | Descrição livre |
| category | text | Categoria (ver lista abaixo) |
| date | date | Data da transação |
| created_at | timestamptz | Timestamp de criação |

### Categorias disponíveis

**Receitas:** `salary` (Salário), `freelance`, `investment` (Investimento), `other_income` (Outras receitas)

**Despesas:** `food` (Alimentação), `transport` (Transporte), `housing` (Moradia), `health` (Saúde), `education` (Educação), `entertainment` (Lazer), `clothing` (Vestuário), `other_expense` (Outras despesas)

### Row Level Security (RLS)
- Cada usuário só acessa, cria, edita e exclui suas próprias transações
- Políticas configuradas para `SELECT`, `INSERT`, `UPDATE` e `DELETE`

---

## Variáveis de Ambiente

Arquivo `.env.local` (na raiz do projeto):

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

---

## Como Rodar Localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar .env.local com suas credenciais do Supabase

# 3. Rodar o SQL em supabase-schema.sql no SQL Editor do Supabase

# 4. Iniciar o servidor de desenvolvimento
npm run dev
# Acesse: http://localhost:3000
```

---

## Deploy na Vercel

1. Importar o repositório `mixatech/app-financas` na Vercel
2. Adicionar as variáveis de ambiente:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automático a cada push na branch `master`

---

## Histórico de Commits

| Hash | Descrição |
|---|---|
| `471c0cf` | style: redesign visual inspirado no Pierre Finance |
| `2516dd6` | feat: app de finanças pessoais completo (FinançasPRO) |
| `2231c0c` | Initial commit from Create Next App |

---

## Observações Técnicas

- **`proxy.ts`** em vez de `middleware.ts` — Next.js 16 renomeou a convenção de arquivo
- **shadcn/ui usa base-ui** (não Radix UI) — `DialogTrigger` e `AlertDialogTrigger` usam prop `render={}` em vez de `asChild`
- **`dynamic = 'force-dynamic'`** nas páginas de auth para evitar pré-renderização estática sem credenciais
- O SQL em `supabase-schema.sql` precisa ser executado manualmente no SQL Editor do Supabase antes de usar o app
