# FamilyFinance SaaS — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform FamilyFinance into a monetized SaaS with Stripe billing, 3 subscription plans, AI usage enforcement, and Fintech Bold visual redesign.

**Architecture:** Stripe Checkout (server-side redirect) handles payments; webhooks sync subscription state to Supabase `subscriptions` table; `plan-gate.ts` checks plan + usage before every Claude API call and returns HTTP 402 on block; shared family usage pool tracked under the family admin's `owner_user_id`.

**Tech Stack:** Next.js 16 App Router, Supabase (service role for writes), Stripe Node SDK, shadcn/ui, Tailwind v4, Vitest + Testing Library

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/types/index.ts` | Modify | Add Plan, Subscription, Usage types and PLAN_LIMITS constants |
| `supabase-schema-v3.sql` | Create | Migration: subscriptions + usage tables |
| `supabase-schema-v3-rpc.sql` | Create | RPC: increment_usage stored procedure |
| `src/lib/stripe.ts` | Create | Stripe singleton client |
| `src/lib/supabase/admin.ts` | Already exists | Service role client (bypass RLS) |
| `src/lib/usage.ts` | Create | getOwnerUserId, getUsage, incrementUsage, resetUsage |
| `src/lib/plan-gate.ts` | Create | checkAiFeature — verify plan + quota before AI calls |
| `src/app/api/stripe/checkout/route.ts` | Create | Create Stripe Checkout session |
| `src/app/api/stripe/webhook/route.ts` | Create | Handle 3 Stripe events |
| `src/app/api/parse-transaction/route.ts` | Modify | Add plan-gate check |
| `src/app/api/import-statement/route.ts` | Modify | Add plan-gate check |
| `src/app/(app)/pricing/page.tsx` | Create | Public pricing page (Fintech Bold) |
| `src/components/billing/checkout-button.tsx` | Create | Client component — initiates checkout |
| `src/components/billing/upgrade-modal.tsx` | Create | Modal shown when quota is hit |
| `src/components/billing/plan-badge.tsx` | Create | Navbar badge — plan name + usage remaining |
| `src/app/(app)/settings/billing/page.tsx` | Create | Billing settings page |
| `src/components/layout/navbar.tsx` | Modify | Add PlanBadge |
| `src/app/(app)/dashboard/page.tsx` | Modify | Fintech Bold dark header |
| `src/app/auth/login/page.tsx` | Modify | Consistent brand styling |
| `src/app/auth/signup/page.tsx` | Modify | Consistent brand styling |

---

## Phase 1 — Billing Foundation

### Task 1: Install Stripe SDK

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install stripe**

```bash
npm install stripe
```

Expected output: `added 1 package` (stripe v14+)

- [ ] **Step 2: Verify installation**

```bash
node -e "require('stripe'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install stripe sdk"
```

---

### Task 2: Database Migration — subscriptions + usage tables

**Files:**
- Create: `supabase-schema-v3.sql`
- Create: `supabase-schema-v3-rpc.sql`

- [ ] **Step 1: Create migration file**

Create `supabase-schema-v3.sql`:

```sql
-- Tabela de assinaturas (uma por usuário)
create table if not exists subscriptions (
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

-- RLS: usuário lê apenas seu próprio registro
alter table subscriptions enable row level security;

create policy "subscriptions: select own"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Contadores mensais por assinatura (pool compartilhado por owner_user_id)
create table if not exists usage (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) not null,
  period text not null, -- 'YYYY-MM'
  ai_chats_used int default 0 not null,
  pdf_imports_used int default 0 not null,
  updated_at timestamptz default now() not null,
  unique (owner_user_id, period)
);

-- RLS: owner lê seu próprio uso; membros da família não acessam diretamente
alter table usage enable row level security;

create policy "usage: select own"
  on usage for select
  using (auth.uid() = owner_user_id);
```

- [ ] **Step 2: Create RPC file**

Create `supabase-schema-v3-rpc.sql`:

```sql
-- RPC para incrementar uso atomicamente (executa como service role via webhook/plan-gate)
create or replace function increment_ai_chat(p_owner_user_id uuid, p_period text)
returns void language plpgsql security definer as $$
begin
  insert into usage (owner_user_id, period, ai_chats_used, pdf_imports_used)
  values (p_owner_user_id, p_period, 1, 0)
  on conflict (owner_user_id, period)
  do update set ai_chats_used = usage.ai_chats_used + 1, updated_at = now();
end;
$$;

create or replace function increment_pdf_import(p_owner_user_id uuid, p_period text)
returns void language plpgsql security definer as $$
begin
  insert into usage (owner_user_id, period, ai_chats_used, pdf_imports_used)
  values (p_owner_user_id, p_period, 0, 1)
  on conflict (owner_user_id, period)
  do update set pdf_imports_used = usage.pdf_imports_used + 1, updated_at = now();
end;
$$;
```

- [ ] **Step 3: Apply migration in Supabase Dashboard**

Open Supabase Dashboard → SQL Editor → paste and run `supabase-schema-v3.sql`, then `supabase-schema-v3-rpc.sql`.

- [ ] **Step 4: Commit**

```bash
git add supabase-schema-v3.sql supabase-schema-v3-rpc.sql
git commit -m "feat: add subscriptions and usage tables migration"
```

---

### Task 3: Types and Constants

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Read current types file**

Read `src/types/index.ts` to find insertion point.

- [ ] **Step 2: Add billing types**

Add to `src/types/index.ts`:

```typescript
export type Plan = 'free' | 'pro' | 'family'
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due'

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan: Plan
  status: SubscriptionStatus
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  created_at: string
}

export interface Usage {
  id: string
  owner_user_id: string
  period: string
  ai_chats_used: number
  pdf_imports_used: number
  updated_at: string
}

export const PLAN_LIMITS: Record<Plan, { ai_chats: number | null; pdf_imports: number | null; family_members: number }> = {
  free:   { ai_chats: 0,    pdf_imports: 0,    family_members: 1 },
  pro:    { ai_chats: 30,   pdf_imports: 2,    family_members: 2 },
  family: { ai_chats: 200,  pdf_imports: null, family_members: 6 }, // null = unlimited
}

export const PLAN_LABELS: Record<Plan, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  family: 'Família',
}

export const PLAN_PRICES: Record<Plan, string> = {
  free: 'R$0',
  pro: 'R$19,90/mês',
  family: 'R$39,90/mês',
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add billing types, PLAN_LIMITS, PLAN_LABELS, PLAN_PRICES"
```

---

### Task 4: Stripe Singleton

**Files:**
- Create: `src/lib/stripe.ts`

- [ ] **Step 1: Create stripe.ts**

```typescript
import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
})
```

- [ ] **Step 2: Add env vars to .env.local**

Add to `.env.local` (use test keys for development):

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_FAMILY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/stripe.ts
git commit -m "feat: add stripe singleton client"
```

---

### Task 5: Usage Helpers (with tests)

**Files:**
- Create: `src/lib/usage.ts`
- Create: `src/lib/usage.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/usage.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCurrentPeriod, getOwnerUserId } from './usage'

describe('getCurrentPeriod', () => {
  it('returns YYYY-MM format', () => {
    vi.setSystemTime(new Date('2026-04-15'))
    expect(getCurrentPeriod()).toBe('2026-04')
    vi.useRealTimers()
  })
})

describe('getOwnerUserId', () => {
  it('returns userId itself when user has no family', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    }
    const result = await getOwnerUserId('user-123', mockSupabase as any)
    expect(result).toBe('user-123')
  })

  it('returns admin user_id when user belongs to a family', async () => {
    const mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { family_groups: { created_by: 'admin-456' } },
        error: null,
      }),
    }
    const result = await getOwnerUserId('user-123', mockSupabase as any)
    expect(result).toBe('admin-456')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/usage.test.ts
```

Expected: FAIL with "Cannot find module './usage'"

- [ ] **Step 3: Implement usage.ts**

Create `src/lib/usage.ts`:

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Usage, Plan, PLAN_LIMITS } from '@/types'

export function getCurrentPeriod(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export async function getOwnerUserId(
  userId: string,
  client?: SupabaseClient
): Promise<string> {
  const supabase = client ?? createAdminClient()
  const { data } = await supabase
    .from('family_members')
    .select('family_groups(created_by)')
    .eq('user_id', userId)
    .single()

  if (data?.family_groups && 'created_by' in (data.family_groups as object)) {
    return (data.family_groups as { created_by: string }).created_by
  }
  return userId
}

export async function getUsage(ownerUserId: string, period: string): Promise<Usage | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('usage')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .eq('period', period)
    .single()
  return data ?? null
}

export async function incrementUsage(
  ownerUserId: string,
  period: string,
  feature: 'ai_chat' | 'pdf_import'
): Promise<void> {
  const supabase = createAdminClient()
  const rpcName = feature === 'ai_chat' ? 'increment_ai_chat' : 'increment_pdf_import'
  await supabase.rpc(rpcName, { p_owner_user_id: ownerUserId, p_period: period })
}

export async function resetUsage(ownerUserId: string, period: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('usage')
    .upsert({ owner_user_id: ownerUserId, period, ai_chats_used: 0, pdf_imports_used: 0 })
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/usage.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/usage.ts src/lib/usage.test.ts
git commit -m "feat: add usage helpers with tests"
```

---

### Task 6: Plan Gate (with tests)

**Files:**
- Create: `src/lib/plan-gate.ts`
- Create: `src/lib/plan-gate.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/plan-gate.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./usage', () => ({
  getCurrentPeriod: vi.fn().mockReturnValue('2026-04'),
  getOwnerUserId: vi.fn().mockResolvedValue('owner-123'),
  getUsage: vi.fn(),
  incrementUsage: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }),
}))

import { checkAiFeature } from './plan-gate'
import { getUsage } from './usage'
import { createAdminClient } from '@/lib/supabase/admin'

describe('checkAiFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getUsage as ReturnType<typeof vi.fn>).mockResolvedValue(null)
  })

  it('blocks free plan users from ai_chat', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { plan: 'free', status: 'active' },
      error: null,
    })
    ;(createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })

    const result = await checkAiFeature('user-123', 'ai_chat')
    expect(result).toEqual({ allowed: false, reason: 'upgrade_required' })
  })

  it('blocks pro user who hit ai_chat limit', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { plan: 'pro', status: 'active' },
      error: null,
    })
    ;(createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })
    ;(getUsage as ReturnType<typeof vi.fn>).mockResolvedValue({
      ai_chats_used: 30,
      pdf_imports_used: 0,
    })

    const result = await checkAiFeature('user-123', 'ai_chat')
    expect(result).toEqual({ allowed: false, reason: 'limit_reached' })
  })

  it('allows pro user within ai_chat limit', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { plan: 'pro', status: 'active' },
      error: null,
    })
    ;(createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })
    ;(getUsage as ReturnType<typeof vi.fn>).mockResolvedValue({
      ai_chats_used: 15,
      pdf_imports_used: 0,
    })

    const result = await checkAiFeature('user-123', 'ai_chat')
    expect(result).toEqual({ allowed: true })
  })

  it('allows family plan unlimited pdf_import', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { plan: 'family', status: 'active' },
      error: null,
    })
    ;(createAdminClient as ReturnType<typeof vi.fn>).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: mockSingle,
    })
    ;(getUsage as ReturnType<typeof vi.fn>).mockResolvedValue({
      ai_chats_used: 0,
      pdf_imports_used: 999,
    })

    const result = await checkAiFeature('user-123', 'pdf_import')
    expect(result).toEqual({ allowed: true })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/lib/plan-gate.test.ts
```

Expected: FAIL with "Cannot find module './plan-gate'"

- [ ] **Step 3: Implement plan-gate.ts**

Create `src/lib/plan-gate.ts`:

```typescript
import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentPeriod, getOwnerUserId, getUsage, incrementUsage } from './usage'
import { PLAN_LIMITS } from '@/types'
import type { Plan } from '@/types'

type GateResult =
  | { allowed: true }
  | { allowed: false; reason: 'upgrade_required' | 'limit_reached' }

export async function checkAiFeature(
  userId: string,
  feature: 'ai_chat' | 'pdf_import'
): Promise<GateResult> {
  const supabase = createAdminClient()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single()

  const plan: Plan = sub?.plan ?? 'free'
  const limits = PLAN_LIMITS[plan]

  const limit = feature === 'ai_chat' ? limits.ai_chats : limits.pdf_imports

  if (limit === 0) {
    return { allowed: false, reason: 'upgrade_required' }
  }

  if (limit === null) {
    // unlimited — still increment for analytics
    const ownerUserId = await getOwnerUserId(userId)
    await incrementUsage(ownerUserId, getCurrentPeriod(), feature)
    return { allowed: true }
  }

  const ownerUserId = await getOwnerUserId(userId)
  const period = getCurrentPeriod()
  const usage = await getUsage(ownerUserId, period)

  const used = feature === 'ai_chat'
    ? (usage?.ai_chats_used ?? 0)
    : (usage?.pdf_imports_used ?? 0)

  if (used >= limit) {
    return { allowed: false, reason: 'limit_reached' }
  }

  await incrementUsage(ownerUserId, period, feature)
  return { allowed: true }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/lib/plan-gate.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/plan-gate.ts src/lib/plan-gate.test.ts
git commit -m "feat: add plan-gate with tests"
```

---

### Task 7: Stripe Checkout Route

**Files:**
- Create: `src/app/api/stripe/checkout/route.ts`

- [ ] **Step 1: Create route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan } = await req.json() as { plan: 'pro' | 'family' }

  const priceId = plan === 'pro'
    ? process.env.STRIPE_PRO_PRICE_ID!
    : process.env.STRIPE_FAMILY_PRICE_ID!

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: sub?.stripe_customer_id ?? undefined,
    customer_email: sub?.stripe_customer_id ? undefined : user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: plan === 'pro' ? 7 : 14,
      metadata: { user_id: user.id, plan },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: { user_id: user.id, plan },
  })

  return NextResponse.json({ url: session.url })
}
```

- [ ] **Step 2: Add NEXT_PUBLIC_APP_URL to .env.local**

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/stripe/checkout/route.ts
git commit -m "feat: add stripe checkout route"
```

---

### Task 8: Stripe Webhook Route

**Files:**
- Create: `src/app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Create webhook route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { resetUsage, getCurrentPeriod } from '@/lib/usage'
import type Stripe from 'stripe'

export const config = { api: { bodyParser: false } }

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    const plan = session.metadata?.plan as 'pro' | 'family'
    if (!userId || !plan) return NextResponse.json({ ok: true })

    await admin.from('subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      plan,
      status: 'trialing',
    })
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = invoice.customer as string
    const { data: sub } = await admin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()
    if (sub) {
      await resetUsage(sub.user_id, getCurrentPeriod())
      await admin.from('subscriptions').update({
        status: 'active',
        current_period_start: new Date((invoice.period_start) * 1000).toISOString(),
        current_period_end: new Date((invoice.period_end) * 1000).toISOString(),
      }).eq('stripe_customer_id', customerId)
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const customerId = subscription.customer as string
    const isDeleted = event.type === 'customer.subscription.deleted'

    await admin.from('subscriptions').update({
      plan: isDeleted ? 'free' : (subscription.metadata?.plan as string ?? 'free'),
      status: isDeleted ? 'canceled' : subscription.status as string,
    }).eq('stripe_customer_id', customerId)
  }

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/stripe/webhook/route.ts
git commit -m "feat: add stripe webhook handler (3 events)"
```

---

### Task 9: Gate Existing AI Routes

**Files:**
- Modify: `src/app/api/parse-transaction/route.ts`
- Modify: `src/app/api/import-statement/route.ts`

- [ ] **Step 1: Read parse-transaction route**

Read `src/app/api/parse-transaction/route.ts` to find where to inject the gate check.

- [ ] **Step 2: Add gate to parse-transaction**

After the auth check and before the Anthropic call, add:

```typescript
import { checkAiFeature } from '@/lib/plan-gate'

// After getting user from auth:
const gate = await checkAiFeature(user.id, 'ai_chat')
if (!gate.allowed) {
  return NextResponse.json({ error: gate.reason }, { status: 402 })
}
```

- [ ] **Step 3: Read import-statement route**

Read `src/app/api/import-statement/route.ts` to find where to inject the gate check.

- [ ] **Step 4: Add gate to import-statement**

After the auth check and before the Anthropic call, add:

```typescript
import { checkAiFeature } from '@/lib/plan-gate'

// After getting user from auth:
const gate = await checkAiFeature(user.id, 'pdf_import')
if (!gate.allowed) {
  return NextResponse.json({ error: gate.reason }, { status: 402 })
}
```

- [ ] **Step 5: Build check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/app/api/parse-transaction/route.ts src/app/api/import-statement/route.ts
git commit -m "feat: enforce plan gate on AI routes (402 on limit)"
```

---

### Task 10: Pricing Page

**Files:**
- Create: `src/app/(app)/pricing/page.tsx`
- Create: `src/components/billing/checkout-button.tsx`

- [ ] **Step 1: Create CheckoutButton client component**

Create `src/components/billing/checkout-button.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface CheckoutButtonProps {
  plan: 'pro' | 'family'
  label: string
  className?: string
}

export function CheckoutButton({ plan, label, className }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  return (
    <Button onClick={handleClick} disabled={loading} className={className}>
      {loading ? 'Aguarde...' : label}
    </Button>
  )
}
```

- [ ] **Step 2: Create pricing page**

Create `src/app/(app)/pricing/page.tsx`:

```typescript
import { CheckoutButton } from '@/components/billing/checkout-button'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Hero dark header */}
      <div
        className="px-6 py-12 text-center"
        style={{ background: 'linear-gradient(135deg, #18181b 0%, #3b0764 60%, #1e1b4b 100%)' }}
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 mb-4">
          <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          <span className="text-xs font-medium text-violet-200">Preços simples e transparentes</span>
        </div>
        <h1 className="mb-2 text-3xl font-extrabold text-white">Escolha seu plano</h1>
        <p className="mb-6 text-sm text-zinc-400">Comece grátis. Faça upgrade quando precisar.</p>
        <div className="inline-flex rounded-full bg-white/10 p-1 gap-1">
          <span className="rounded-full bg-white px-4 py-1 text-xs font-semibold text-zinc-900">Mensal</span>
          <span className="px-4 py-1 text-xs text-zinc-400">Anual <span className="text-violet-400">−20%</span></span>
        </div>
      </div>

      {/* Plan cards */}
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

          {/* Free */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="mb-1 text-sm font-bold text-gray-700">Gratuito</div>
            <div className="text-4xl font-extrabold text-gray-900">R$0</div>
            <div className="mb-6 text-sm text-gray-400">para sempre</div>
            <a
              href="/dashboard"
              className="mb-6 block rounded-xl bg-zinc-900 py-2.5 text-center text-sm font-semibold text-white"
            >
              Começar grátis
            </a>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><span className="text-violet-500">✓</span> Transações ilimitadas</li>
              <li className="flex items-center gap-2"><span className="text-violet-500">✓</span> Dashboard básico</li>
              <li className="flex items-center gap-2"><span className="text-gray-300">✗</span> Chat IA</li>
              <li className="flex items-center gap-2"><span className="text-gray-300">✗</span> Import PDF</li>
            </ul>
          </div>

          {/* Pro — featured */}
          <div
            className="relative rounded-2xl p-6"
            style={{ background: 'linear-gradient(160deg, #3b0764, #18181b)' }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1"
              style={{ background: 'linear-gradient(90deg, #7B2FBE, #a855f7)' }}
            >
              <span className="text-[10px] font-bold uppercase text-white">Mais Popular</span>
            </div>
            <div className="mb-1 text-sm font-bold text-violet-300">Pro</div>
            <div className="text-4xl font-extrabold text-white">R$19,90</div>
            <div className="mb-6 text-sm text-zinc-400">por mês · 7 dias grátis</div>
            <CheckoutButton
              plan="pro"
              label="Iniciar trial grátis"
              className="mb-6 w-full rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(90deg, #7B2FBE, #a855f7)' } as React.CSSProperties}
            />
            <ul className="space-y-2 text-sm text-gray-200">
              <li className="flex items-center gap-2"><span className="text-violet-400">✓</span> 30 chats IA/mês</li>
              <li className="flex items-center gap-2"><span className="text-violet-400">✓</span> 2 imports PDF/mês</li>
              <li className="flex items-center gap-2"><span className="text-violet-400">✓</span> Até 2 membros família</li>
              <li className="flex items-center gap-2"><span className="text-violet-400">✓</span> Import CSV ilimitado</li>
            </ul>
          </div>

          {/* Family */}
          <div className="rounded-2xl border-2 border-violet-200 bg-white p-6">
            <div className="mb-1 text-sm font-bold text-violet-700">Família</div>
            <div className="text-4xl font-extrabold text-gray-900">R$39,90</div>
            <div className="mb-6 text-sm text-gray-400">por mês · 14 dias grátis</div>
            <CheckoutButton
              plan="family"
              label="Iniciar trial grátis"
              className="mb-6 w-full rounded-xl bg-violet-100 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-200"
            />
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2"><span className="text-violet-500">✓</span> 200 chats IA/mês (pool)</li>
              <li className="flex items-center gap-2"><span className="text-violet-500">✓</span> PDF ilimitado</li>
              <li className="flex items-center gap-2"><span className="text-violet-500">✓</span> Até 6 membros família</li>
              <li className="flex items-center gap-2"><span className="text-violet-500">✓</span> Dashboard família completo</li>
            </ul>
          </div>

        </div>

        <div className="mt-8 flex justify-center gap-8">
          <span className="text-sm text-gray-400">🔒 Pagamento seguro via Stripe</span>
          <span className="text-sm text-gray-400">↩ Cancele quando quiser</span>
          <span className="text-sm text-gray-400">🇧🇷 Preços em Real</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build check**

```bash
npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/pricing/page.tsx src/components/billing/checkout-button.tsx
git commit -m "feat: add pricing page with Fintech Bold style"
```

---

## Phase 2 — Enforcement + UX

### Task 11: UpgradeModal Component

**Files:**
- Create: `src/components/billing/upgrade-modal.tsx`

- [ ] **Step 1: Create upgrade-modal.tsx**

```typescript
'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { CheckoutButton } from './checkout-button'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  reason: 'upgrade_required' | 'limit_reached'
  feature: 'ai_chat' | 'pdf_import'
}

const FEATURE_LABELS = {
  ai_chat: 'Chat IA',
  pdf_import: 'Import de PDF',
}

export function UpgradeModal({ open, onClose, reason, feature }: UpgradeModalProps) {
  const featureLabel = FEATURE_LABELS[feature]

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {reason === 'upgrade_required' ? '🔒 Recurso exclusivo' : '📊 Limite atingido'}
          </DialogTitle>
          <DialogDescription>
            {reason === 'upgrade_required'
              ? `${featureLabel} está disponível apenas nos planos Pro e Família.`
              : `Você atingiu o limite de ${featureLabel} do seu plano este mês.`}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          <CheckoutButton
            plan="pro"
            label="Assinar Pro — R$19,90/mês"
            className="w-full"
          />
          <CheckoutButton
            plan="family"
            label="Assinar Família — R$39,90/mês"
            className="w-full variant-outline"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Update ChatFab to handle 402 responses**

Read the ChatFab component to find where the fetch to `/api/parse-transaction` is made, then add:

```typescript
if (res.status === 402) {
  const data = await res.json()
  setUpgradeReason(data.error)
  setShowUpgradeModal(true)
  return
}
```

And add state:
```typescript
const [showUpgradeModal, setShowUpgradeModal] = useState(false)
const [upgradeReason, setUpgradeReason] = useState<'upgrade_required' | 'limit_reached'>('upgrade_required')
```

And render:
```typescript
<UpgradeModal
  open={showUpgradeModal}
  onClose={() => setShowUpgradeModal(false)}
  reason={upgradeReason}
  feature="ai_chat"
/>
```

- [ ] **Step 3: Update StatementImport to handle 402 responses**

Read `src/components/import/statement-import.tsx` to find where the fetch to `/api/import-statement` is made, then add the same 402 handling pattern with `feature="pdf_import"`.

- [ ] **Step 4: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/billing/upgrade-modal.tsx
git commit -m "feat: add UpgradeModal and 402 handling in ChatFab and StatementImport"
```

---

### Task 12: PlanBadge in Navbar

**Files:**
- Create: `src/components/billing/plan-badge.tsx`
- Modify: navbar component (read to find exact path first)

- [ ] **Step 1: Create plan-badge.tsx**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUsage, getCurrentPeriod } from '@/lib/usage'
import { PLAN_LIMITS, PLAN_LABELS } from '@/types'
import type { Plan } from '@/types'

export async function PlanBadge() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user.id)
    .single()

  const plan: Plan = sub?.plan ?? 'free'
  const limits = PLAN_LIMITS[plan]
  const usage = await getUsage(user.id, getCurrentPeriod())
  const chatsUsed = usage?.ai_chats_used ?? 0
  const chatsLimit = limits.ai_chats

  return (
    <div className="flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1">
      <span className="text-xs font-semibold text-violet-700">{PLAN_LABELS[plan]}</span>
      {chatsLimit !== null && chatsLimit > 0 && (
        <span className="text-xs text-violet-500">
          {chatsLimit - chatsUsed} IA restante{chatsLimit - chatsUsed !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Find the navbar component path**

```bash
find src -name "navbar*" -o -name "nav-bar*" | head -5
```

- [ ] **Step 3: Add PlanBadge to navbar**

Read the navbar file, then add `<PlanBadge />` alongside the user avatar/profile section:

```typescript
import { PlanBadge } from '@/components/billing/plan-badge'

// Inside the navbar JSX, near the user section:
<PlanBadge />
```

- [ ] **Step 4: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/billing/plan-badge.tsx
git commit -m "feat: add PlanBadge to navbar showing plan and AI usage"
```

---

### Task 13: Billing Settings Page

**Files:**
- Create: `src/app/(app)/settings/billing/page.tsx`

- [ ] **Step 1: Create billing settings page**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUsage, getCurrentPeriod } from '@/lib/usage'
import { PLAN_LIMITS, PLAN_LABELS, PLAN_PRICES } from '@/types'
import type { Plan } from '@/types'
import Link from 'next/link'

export default async function BillingPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const plan: Plan = sub?.plan ?? 'free'
  const limits = PLAN_LIMITS[plan]
  const usage = await getUsage(user.id, getCurrentPeriod())

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Plano e Cobrança</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-lg font-bold text-gray-900">{PLAN_LABELS[plan]}</div>
            <div className="text-sm text-gray-500">{PLAN_PRICES[plan]}</div>
          </div>
          {plan === 'free' && (
            <Link
              href="/pricing"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
            >
              Fazer upgrade
            </Link>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Chat IA este mês</span>
            <span className="font-medium">
              {usage?.ai_chats_used ?? 0}
              {limits.ai_chats !== null ? ` / ${limits.ai_chats}` : ' (ilimitado)'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Imports PDF este mês</span>
            <span className="font-medium">
              {usage?.pdf_imports_used ?? 0}
              {limits.pdf_imports !== null ? ` / ${limits.pdf_imports}` : ' (ilimitado)'}
            </span>
          </div>
        </div>
      </div>

      {sub?.stripe_subscription_id && (
        <p className="text-sm text-gray-500">
          Para cancelar ou alterar seu plano, acesse o portal do cliente Stripe.
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/app/(app)/settings/billing/page.tsx
git commit -m "feat: add billing settings page with usage summary"
```

---

## Phase 3 — UI Fintech Bold

### Task 14: Dashboard Fintech Bold Redesign

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Read current dashboard page**

Read `src/app/(app)/dashboard/page.tsx` to understand current structure.

- [ ] **Step 2: Replace summary cards section**

Find the section that renders the 3 summary cards (receitas, despesas, saldo) and replace with a dark gradient header:

```typescript
{/* Fintech Bold header */}
<div
  className="rounded-2xl p-6 mb-6 text-white"
  style={{ background: 'linear-gradient(135deg, #18181b, #3b0764)' }}
>
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-sm font-medium text-zinc-400">Resumo de {currentMonthLabel}</h2>
  </div>
  <div className="grid grid-cols-3 gap-4">
    <div className="rounded-xl bg-white/10 border border-white/10 p-4">
      <div className="text-xs text-violet-300 mb-1">Receitas</div>
      <div className="text-xl font-bold text-white">{formatCurrency(totalIncome)}</div>
    </div>
    <div className="rounded-xl bg-white/10 border border-white/10 p-4">
      <div className="text-xs text-pink-300 mb-1">Despesas</div>
      <div className="text-xl font-bold text-white">{formatCurrency(totalExpenses)}</div>
    </div>
    <div
      className="rounded-xl border p-4"
      style={{
        background: 'rgba(16,185,129,0.2)',
        borderColor: 'rgba(16,185,129,0.3)',
      }}
    >
      <div className="text-xs text-emerald-300 mb-1">Saldo</div>
      <div className="text-xl font-bold text-emerald-300">{formatCurrency(balance)}</div>
    </div>
  </div>
</div>
```

- [ ] **Step 3: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx
git commit -m "feat: dashboard Fintech Bold dark gradient header"
```

---

### Task 15: Auth Pages Brand Consistency

**Files:**
- Modify: `src/app/auth/login/page.tsx`
- Modify: `src/app/auth/signup/page.tsx`

- [ ] **Step 1: Read login page**

Read `src/app/auth/login/page.tsx`.

- [ ] **Step 2: Wrap login form with Fintech Bold shell**

Replace the outer wrapper div with:

```typescript
<div className="flex min-h-screen">
  {/* Left: brand panel */}
  <div
    className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12"
    style={{ background: 'linear-gradient(135deg, #18181b 0%, #3b0764 100%)' }}
  >
    <div className="text-white text-center">
      <div className="mb-4 text-4xl font-extrabold">FamilyFinance</div>
      <p className="text-zinc-400 text-sm">Controle financeiro para você e sua família</p>
    </div>
  </div>
  {/* Right: form */}
  <div className="flex w-full lg:w-1/2 flex-col items-center justify-center p-8 bg-white">
    {/* existing form content here */}
  </div>
</div>
```

- [ ] **Step 3: Apply same shell to signup page**

Read `src/app/auth/signup/page.tsx` and apply the same split-panel layout.

- [ ] **Step 4: Build check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/login/page.tsx src/app/auth/signup/page.tsx
git commit -m "feat: auth pages Fintech Bold split-panel layout"
```

---

## End-to-End Test Checklist

After all tasks are complete, verify the full flow:

- [ ] Sign up as new user → subscription row created with `plan: 'free'`
- [ ] Try chat IA → 402 → UpgradeModal appears
- [ ] Click "Assinar Pro" → redirected to Stripe Checkout (test mode)
- [ ] Complete Stripe test payment → webhook fires → `subscriptions.plan` = 'pro', `status` = 'trialing'
- [ ] Try chat IA → allowed, `ai_chats_used` increments
- [ ] Use 30 chats → 31st chat returns 402 with `limit_reached` → UpgradeModal appears
- [ ] Simulate `invoice.paid` webhook → `usage` resets to 0
- [ ] PlanBadge shows correct plan and remaining chats
- [ ] `/settings/billing` shows correct plan + usage
- [ ] `/pricing` page loads with all 3 cards, CTA buttons work
- [ ] Dashboard shows dark gradient header with correct sums
