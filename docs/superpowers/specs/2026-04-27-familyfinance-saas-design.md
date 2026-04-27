# FamilyFinance — Design: SaaS com Stripe + UI Fintech Bold

**Data:** 2026-04-27  
**Status:** Aprovado  
**Abordagem escolhida:** Fatia fina de ponta a ponta (billing → enforcement → UI)

---

## 1. Contexto

O FamilyFinance é um app de gestão financeira pessoal e familiar (Next.js 16 + Supabase + shadcn/ui). Já possui: auth, CRUD de transações, dashboard com gráficos, grupos familiares, chat IA (Claude Haiku 4.5), importação de extrato CSV e PDF.

O objetivo deste design é transformá-lo em um produto SaaS com monetização via Stripe, 3 planos de assinatura, enforcement de cotas de IA e redesign visual no estilo Fintech Bold.

---

## 2. Planos de Assinatura

| | Gratuito | Pro | Família |
|---|---|---|---|
| Preço | R$0 | R$19,90/mês | R$39,90/mês |
| Trial | — | 7 dias | 14 dias |
| Transações manuais | ✅ Ilimitadas | ✅ Ilimitadas | ✅ Ilimitadas |
| Import CSV | ✅ | ✅ | ✅ |
| Chat IA | ❌ | ✅ 30/mês | ✅ 200/mês |
| Import PDF | ❌ | ✅ 2/mês | ✅ Ilimitado |
| Membros família | 1 | 2 | 6 |
| Dashboard família | ❌ | ❌ | ✅ |

**Regras de cota:**
- Contadores resetam no 1º dia de cada mês (via webhook `invoice.paid`)
- Cota de IA é **compartilhada** entre todos os membros da família (um pool por assinatura)
- Ao atingir o limite: modal de upgrade — nunca erro genérico silencioso

**Desconto anual:** 20% (toggle na página de pricing — UI preparada, lógica implementada depois)

---

## 3. Análise de Custos de IA

Modelo em uso: `claude-haiku-4-5-20251001` com prompt caching.

| Uso | Custo (USD) | Custo (BRL ~5,5) |
|---|---|---|
| 1 chat IA | ~$0,0003 | ~R$0,0017 |
| 1 import PDF (extrato médio ~15k tokens) | ~$0,018 | ~R$0,10 |
| Usuário Pro típico/mês (20 chats + 1 PDF) | ~$0,024 | ~R$0,13 |
| Usuário Família intenso/mês (200 chats + 4 PDFs) | ~$0,132 | ~R$0,73 |

**Custo total por usuário pago (IA + Supabase + Vercel + Stripe):**
- Pro: ~R$1,64 → receita líquida **R$18,26/usuário/mês**
- Família: ~R$2,77 → receita líquida **R$37,13/usuário/mês**

Supabase free tier cobre até ~800 usuários pagos. Acima disso: Pro $25/mês (~R$138).

---

## 4. Arquitetura Técnica

### 4.1 Novas tabelas no Supabase

```sql
-- Uma por usuário
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) unique not null,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text check (plan in ('free', 'pro', 'family')) default 'free' not null,
  status text check (status in ('active', 'trialing', 'canceled', 'past_due')) default 'active' not null,
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz default now() not null
);

-- Contadores mensais por assinatura (não por usuário individual)
-- Para planos Família, todos os membros compartilham o mesmo pool —
-- o counter fica no owner da assinatura (admin do grupo familiar)
create table usage (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) not null, -- sempre o admin/titular da assinatura
  period text not null, -- formato 'YYYY-MM', ex: '2026-04'
  ai_chats_used int default 0 not null,
  pdf_imports_used int default 0 not null,
  updated_at timestamptz default now() not null,
  unique (owner_user_id, period)
);
```

RLS: usuário lê apenas seus próprios registros. Escrita via service role key nos webhooks e no plan-gate.

**Resolução do pool compartilhado:** quando qualquer membro da família faz uma chamada de IA, o `plan-gate.ts` identifica o `owner_user_id` da assinatura (admin do `family_group`) e incrementa o contador dele. Usuários sem família são seus próprios owners.

**Enforcement do limite de membros:** ao tentar adicionar um novo membro em `family_members`, o servidor verifica `subscriptions.plan` do admin — se o count atual atingir o limite (2 para Pro, 6 para Família), retorna erro com link para upgrade.

### 4.2 Novos arquivos

```
src/
  app/
    (app)/
      pricing/page.tsx              ← página pública de planos (mockup aprovado)
      settings/billing/page.tsx     ← resumo do plano atual + link portal Stripe
    api/
      stripe/
        checkout/route.ts           ← cria sessão de pagamento Stripe Checkout
        webhook/route.ts            ← recebe eventos do Stripe (3 webhooks)
  lib/
    plan-gate.ts                    ← verifica plano + uso antes de cada chamada IA
    usage.ts                        ← incrementa/consulta contadores mensais
    stripe.ts                       ← instância singleton do cliente Stripe
  components/
    billing/
      upgrade-modal.tsx             ← modal ao atingir limite de uso
      plan-badge.tsx                ← badge do plano atual na navbar
```

### 4.3 Fluxo Stripe — 3 webhooks

```
1. checkout.session.completed
   → Upsert em subscriptions com plan, status, stripe_customer_id, stripe_subscription_id
   → Redireciona para /dashboard

2. invoice.paid
   → Reseta usage do usuário para o novo período (ai_chats_used = 0, pdf_imports_used = 0)

3. customer.subscription.updated / deleted
   → Atualiza subscriptions.plan e status
   → Se cancelado: plan = 'free', acesso às features pagas bloqueado imediatamente
```

### 4.4 Feature gate

Chamado em `/api/parse-transaction` e `/api/import-statement` antes de invocar o Claude:

```typescript
// src/lib/plan-gate.ts
export async function checkAiFeature(userId: string, feature: 'ai_chat' | 'pdf_import')
  : Promise<{ allowed: true } | { allowed: false; reason: 'upgrade_required' | 'limit_reached' }>

// Lógica:
// 1. Busca subscriptions do userId
// 2. Se plan === 'free' → { allowed: false, reason: 'upgrade_required' }
// 3. Busca usage do período atual
// 4. Se uso >= limite do plano → { allowed: false, reason: 'limit_reached' }
// 5. Caso contrário → { allowed: true } e incrementa contador
```

Resposta HTTP ao frontend quando bloqueado: status **402** com `{ error: 'upgrade_required' | 'limit_reached' }`. O componente exibe `<UpgradeModal />`.

---

## 5. Direção Visual — Fintech Bold

**Inspiração:** Nubank, Wise — header escuro com gradiente, cards de saldo em destaque.

**Paleta:**
- Header/hero: `linear-gradient(135deg, #18181b, #3b0764)`
- Accent principal: `#7B2FBE` (mantido)
- Corpo: `#ffffff` / `#f9fafb`
- Saldo positivo: `#059669` | Despesa: `#ef4444`
- Cards escuros (plano Pro): `linear-gradient(160deg, #3b0764, #18181b)`

**Páginas a modificar (em ordem de prioridade):**
1. `/pricing` — nova página (mockup aprovado no brainstorming)
2. `dashboard/page.tsx` — cards de resumo com gradiente escuro no topo
3. `navbar.tsx` — adicionar `<PlanBadge />` com uso restante de IA
4. `auth/login` e `auth/signup` — visual consistente com o brand
5. `<UpgradeModal />` — exibido ao atingir limite

---

## 6. Faseamento — Abordagem C (Fatia Fina)

### Semana 1 — Billing funcional
- Tabelas `subscriptions` e `usage` no Supabase (migration SQL)
- `src/lib/stripe.ts`, `plan-gate.ts`, `usage.ts`
- `/api/stripe/checkout/route.ts`
- `/api/stripe/webhook/route.ts` (3 eventos)
- Página `/pricing` com mockup aprovado
- Feature gate nas rotas de IA existentes

### Semana 2 — Enforcement + UX de upgrade
- `<UpgradeModal />` ao atingir limite
- `<PlanBadge />` na navbar (plano atual + uso restante)
- Página `/settings/billing`
- Testes de ponta a ponta: checkout → webhook → gate → modal

### Semana 3 — UI Fintech Bold
- Redesign `dashboard/page.tsx`
- Redesign `navbar.tsx`
- Redesign `auth/login` e `auth/signup`
- Polish geral

---

## 7. Variáveis de Ambiente Necessárias

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_FAMILY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

---

## 8. Fora de Escopo

- App mobile
- Lógica de billing para plano anual (toggle de UI preparado, implementar depois)
- Notificações por email de cota quase esgotada
- Relatórios exportáveis
- Agentes adicionais (aitmpl.com) — avaliar após billing estar estável
