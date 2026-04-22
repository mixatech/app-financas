import { describe, it, expect } from 'vitest'
import { getCategoryLabel } from '@/types'

describe('getCategoryLabel', () => {
  it('returns correct label for expense categories', () => {
    expect(getCategoryLabel('food')).toBe('Alimentação')
    expect(getCategoryLabel('transport')).toBe('Transporte')
    expect(getCategoryLabel('housing')).toBe('Moradia')
    expect(getCategoryLabel('health')).toBe('Saúde')
    expect(getCategoryLabel('education')).toBe('Educação')
    expect(getCategoryLabel('entertainment')).toBe('Lazer')
    expect(getCategoryLabel('clothing')).toBe('Vestuário')
    expect(getCategoryLabel('other_expense')).toBe('Outras despesas')
  })

  it('returns correct label for income categories', () => {
    expect(getCategoryLabel('salary')).toBe('Salário')
    expect(getCategoryLabel('freelance')).toBe('Freelance')
    expect(getCategoryLabel('investment')).toBe('Investimento')
    expect(getCategoryLabel('other_income')).toBe('Outras receitas')
  })

  it('returns the raw value for unknown categories', () => {
    expect(getCategoryLabel('unknown' as never)).toBe('unknown')
  })
})
