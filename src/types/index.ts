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
  salary: '#22c55e',
  freelance: '#3b82f6',
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
