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
