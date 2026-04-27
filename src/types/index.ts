// ── Tipos originais (v1) ─────────────────────────────────────

export type TransactionType = 'income' | 'expense'

export type Category =
  | 'salary'
  | 'freelance'
  | 'investment'
  | 'other_income'
  | 'food'
  | 'transport'
  | 'housing'
  | 'health'
  | 'education'
  | 'entertainment'
  | 'clothing'
  | 'other_expense'

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  description: string
  category: Category
  date: string
  created_at: string
  // Campos v2 (nullable — dados antigos não quebram)
  family_id?: string | null
  paid_by_member_id?: string | null
  spent_by_member_id?: string | null
  card_id?: string | null
  source?: TransactionSource
}

export interface TransactionFormData {
  type: TransactionType
  amount: string
  description: string
  category: Category
  date: string
}

export const INCOME_CATEGORIES: { value: Category; label: string }[] = [
  { value: 'salary', label: 'Salário' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investment', label: 'Investimento' },
  { value: 'other_income', label: 'Outras receitas' },
]

export const EXPENSE_CATEGORIES: { value: Category; label: string }[] = [
  { value: 'food', label: 'Alimentação' },
  { value: 'transport', label: 'Transporte' },
  { value: 'housing', label: 'Moradia' },
  { value: 'health', label: 'Saúde' },
  { value: 'education', label: 'Educação' },
  { value: 'entertainment', label: 'Lazer' },
  { value: 'clothing', label: 'Vestuário' },
  { value: 'other_expense', label: 'Outras despesas' },
]

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES]

export function getCategoryLabel(category: Category): string {
  return ALL_CATEGORIES.find((c) => c.value === category)?.label ?? category
}

export const CATEGORY_COLORS: Record<string, string> = {
  salary: '#7B2FBE',
  freelance: '#2D8EFF',
  investment: '#8b5cf6',
  other_income: '#06b6d4',
  food: '#f97316',
  transport: '#eab308',
  housing: '#ec4899',
  health: '#14b8a6',
  education: '#6366f1',
  entertainment: '#f43f5e',
  clothing: '#a855f7',
  other_expense: '#94a3b8',
}

// ── Novos tipos v2.0 ─────────────────────────────────────────

export type MemberRole = 'admin' | 'member'
export type CardType = 'credit' | 'debit' | 'pix' | 'cash' | 'other'
export type TransactionSource = 'manual' | 'chat_ai' | 'csv_import' | 'pdf_import'

export interface FamilyGroup {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface FamilyMember {
  id: string
  family_id: string
  user_id: string
  display_name: string
  role: MemberRole
  color: string
  created_at: string
}

export interface Card {
  id: string
  family_id: string
  member_id: string
  name: string
  type: CardType
  last_digits: string | null
  color: string
  created_at: string
}

export interface FamilyInvite {
  id: string
  family_id: string
  token: string
  created_by: string
  expires_at: string
  used_at: string | null
  created_at: string
}

export const CARD_TYPE_LABELS: Record<CardType, string> = {
  credit: 'Crédito',
  debit: 'Débito',
  pix: 'PIX',
  cash: 'Dinheiro',
  other: 'Outro',
}

export const MEMBER_COLORS = [
  '#7B2FBE',
  '#2D8EFF',
  '#f97316',
  '#14b8a6',
  '#ec4899',
  '#eab308',
  '#6366f1',
  '#f43f5e',
]

// ── Tipos para billing/SaaS ──────────────────────────────────────

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
  family: { ai_chats: 200,  pdf_imports: null, family_members: 6 },
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
