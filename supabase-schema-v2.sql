-- ============================================================
-- FamilyFinance v2.0 — Schema incremental
-- EXECUTAR APÓS supabase-schema.sql (v1) já estar no banco
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. TABELAS
-- ─────────────────────────────────────────────

create table if not exists family_groups (
  id         uuid default gen_random_uuid() primary key,
  name       text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now() not null
);

create index if not exists family_groups_created_by_idx on family_groups(created_by);

create table if not exists family_members (
  id           uuid default gen_random_uuid() primary key,
  family_id    uuid references family_groups(id) on delete cascade not null,
  user_id      uuid references auth.users(id) on delete cascade not null,
  display_name text not null,
  role         text check (role in ('admin', 'member')) default 'member' not null,
  color        text default '#7B2FBE' not null,
  created_at   timestamptz default now() not null,
  unique (family_id, user_id)
);

create index if not exists family_members_family_id_idx on family_members(family_id);
create index if not exists family_members_user_id_idx on family_members(user_id);

create table if not exists cards (
  id          uuid default gen_random_uuid() primary key,
  family_id   uuid references family_groups(id) on delete cascade not null,
  member_id   uuid references family_members(id) on delete cascade not null,
  name        text not null,
  type        text check (type in ('credit', 'debit', 'pix', 'cash', 'other')) not null,
  last_digits text,
  color       text default '#2D8EFF' not null,
  created_at  timestamptz default now() not null
);

create index if not exists cards_family_id_idx on cards(family_id);
create index if not exists cards_member_id_idx on cards(member_id);

create table if not exists family_invites (
  id         uuid default gen_random_uuid() primary key,
  family_id  uuid references family_groups(id) on delete cascade not null,
  token      text unique not null,
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz default now() not null
);

create index if not exists family_invites_token_idx on family_invites(token);
create index if not exists family_invites_family_id_idx on family_invites(family_id);

-- ─────────────────────────────────────────────
-- 2. ALTER TABLE transactions
-- ─────────────────────────────────────────────
alter table transactions
  add column if not exists family_id          uuid references family_groups(id) on delete set null,
  add column if not exists paid_by_member_id  uuid references family_members(id) on delete set null,
  add column if not exists spent_by_member_id uuid references family_members(id) on delete set null,
  add column if not exists card_id            uuid references cards(id) on delete set null,
  add column if not exists source             text default 'manual' not null;

create index if not exists transactions_family_id_idx on transactions(family_id);

-- ─────────────────────────────────────────────
-- 3. RLS
-- ─────────────────────────────────────────────
alter table family_groups  enable row level security;
alter table family_members enable row level security;
alter table cards          enable row level security;
alter table family_invites enable row level security;

-- ─────────────────────────────────────────────
-- 4. FUNÇÕES HELPER (security definer — bypassam RLS)
-- Evitam recursão infinita nas policies de family_members
-- ─────────────────────────────────────────────
create or replace function get_my_family_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select family_id from family_members where user_id = auth.uid()
$$;

create or replace function is_family_admin(p_family_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from family_members
    where family_id = p_family_id
      and user_id = auth.uid()
      and role = 'admin'
  )
$$;

create or replace function get_my_member_id(p_family_id uuid)
returns uuid
language sql
security definer
stable
as $$
  select id from family_members
  where family_id = p_family_id
    and user_id = auth.uid()
  limit 1;
$$;

-- ─────────────────────────────────────────────
-- 5. POLICIES — family_groups
-- ─────────────────────────────────────────────
drop policy if exists "Members can view their family group" on family_groups;
create policy "Members can view their family group"
  on family_groups for select
  using (id in (select get_my_family_ids()));

drop policy if exists "Authenticated users can create family groups" on family_groups;
create policy "Authenticated users can create family groups"
  on family_groups for insert
  with check (auth.uid() = created_by);

drop policy if exists "Creator can update family group" on family_groups;
create policy "Creator can update family group"
  on family_groups for update
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- ─────────────────────────────────────────────
-- 6. POLICIES — family_members
-- ─────────────────────────────────────────────
drop policy if exists "Members can view family members" on family_members;
create policy "Members can view family members"
  on family_members for select
  using (family_id in (select get_my_family_ids()));

drop policy if exists "Admins or self can insert family members" on family_members;
create policy "Admins or self can insert family members"
  on family_members for insert
  with check (
    auth.uid() = user_id
    or is_family_admin(family_id)
  );

drop policy if exists "Admins or self can update family members" on family_members;
create policy "Admins or self can update family members"
  on family_members for update
  using (
    auth.uid() = user_id
    or is_family_admin(family_id)
  );

drop policy if exists "Admins can delete family members" on family_members;
create policy "Admins can delete family members"
  on family_members for delete
  using (is_family_admin(family_id));

-- ─────────────────────────────────────────────
-- 7. POLICIES — cards
-- ─────────────────────────────────────────────
drop policy if exists "Family members can view cards" on cards;
create policy "Family members can view cards"
  on cards for select
  using (family_id in (select get_my_family_ids()));

drop policy if exists "Family members can insert cards" on cards;
create policy "Family members can insert cards"
  on cards for insert
  with check (family_id in (select get_my_family_ids()));

drop policy if exists "Family members can update cards" on cards;
create policy "Family members can update cards"
  on cards for update
  using (family_id in (select get_my_family_ids()));

drop policy if exists "Admins can delete cards" on cards;
create policy "Admins can delete cards"
  on cards for delete
  using (is_family_admin(family_id));

-- ─────────────────────────────────────────────
-- 8. POLICIES — family_invites
-- ─────────────────────────────────────────────
drop policy if exists "Admins can view family invites" on family_invites;
create policy "Admins can view family invites"
  on family_invites for select
  using (is_family_admin(family_id));

-- Permite qualquer autenticado ler convites válidos pelo token (necessário para aceite de convite)
drop policy if exists "Anyone can view valid invites" on family_invites;
create policy "Anyone can view valid invites"
  on family_invites for select
  using (
    is_family_admin(family_id)
    or (used_at is null and expires_at > now())
  );

drop policy if exists "Admins can create invites" on family_invites;
create policy "Admins can create invites"
  on family_invites for insert
  with check (is_family_admin(family_id));

drop policy if exists "Admins can update invites" on family_invites;
create policy "Admins can update invites"
  on family_invites for update
  using (family_id in (select get_my_family_ids()));

-- ─────────────────────────────────────────────
-- 9. POLICIES — transactions (atualizar)
-- ─────────────────────────────────────────────
drop policy if exists "Users can view own transactions" on transactions;
create policy "Users can view own transactions"
  on transactions for select
  using (
    auth.uid() = user_id
    or (
      family_id is not null
      and family_id in (select get_my_family_ids())
    )
  );

drop policy if exists "Users can insert own transactions" on transactions;
create policy "Users can insert own transactions"
  on transactions for insert
  with check (
    auth.uid() = user_id
    and (
      family_id is null
      or family_id in (select get_my_family_ids())
    )
  );
