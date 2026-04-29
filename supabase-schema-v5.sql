-- supabase-schema-v5.sql
-- Executar no Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Escopo nas transações
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS scope text
    CHECK (scope IN ('personal','couple','family','for_member'))
    DEFAULT 'personal' NOT NULL,
  ADD COLUMN IF NOT EXISTS beneficiary_id uuid
    REFERENCES family_members(id) ON DELETE SET NULL;

-- 2. Ratios de divisão por par
CREATE TABLE IF NOT EXISTS member_split_ratios (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id   uuid REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  member_a_id uuid REFERENCES family_members(id) ON DELETE CASCADE NOT NULL,
  member_b_id uuid REFERENCES family_members(id) ON DELETE CASCADE NOT NULL,
  ratio_a     numeric(5,4) DEFAULT 0.5 NOT NULL,
  ratio_b     numeric(5,4) DEFAULT 0.5 NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL,
  UNIQUE (family_id, member_a_id, member_b_id),
  CHECK (ratio_a + ratio_b = 1)
);

ALTER TABLE member_split_ratios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "split_ratios: family members can read"
  ON member_split_ratios FOR SELECT
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
CREATE POLICY "split_ratios: admin can write"
  ON member_split_ratios FOR ALL
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'admin'));

-- 3. Liquidações
CREATE TABLE IF NOT EXISTS settlements (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id       uuid REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  from_member_id  uuid REFERENCES family_members(id) ON DELETE CASCADE NOT NULL,
  to_member_id    uuid REFERENCES family_members(id) ON DELETE CASCADE NOT NULL,
  amount          numeric(12,2) NOT NULL CHECK (amount > 0),
  note            text,
  settled_at      timestamptz DEFAULT now() NOT NULL,
  created_at      timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settlements: family members can read"
  ON settlements FOR SELECT
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
CREATE POLICY "settlements: family members can insert"
  ON settlements FOR INSERT
  WITH CHECK (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));

-- 4. Visibilidade por membro
ALTER TABLE family_members
  ADD COLUMN IF NOT EXISTS visibility_scope text
    CHECK (visibility_scope IN ('own','couple','family','all'))
    DEFAULT 'family' NOT NULL;

-- 5. Categorias customizadas
CREATE TABLE IF NOT EXISTS custom_categories (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id   uuid REFERENCES family_groups(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  type        text CHECK (type IN ('income','expense')) NOT NULL,
  color       text DEFAULT '#7B2FBE' NOT NULL,
  emoji       text DEFAULT '📦' NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE custom_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_categories: family members can read"
  ON custom_categories FOR SELECT
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid()));
CREATE POLICY "custom_categories: admin can write"
  ON custom_categories FOR ALL
  USING (family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid() AND role = 'admin'));
