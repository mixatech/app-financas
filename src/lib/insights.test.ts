import { describe, it, expect } from 'vitest'
import { generateInsights } from './insights'
import { Transaction } from '@/types'

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: crypto.randomUUID(), user_id: 'u1', type: 'expense',
    amount: 100, description: 'test', category: 'food',
    date: '2026-04-01', created_at: '', scope: 'personal', ...overrides,
  }
}

describe('generateInsights', () => {
  it('identifica a categoria com maior gasto', () => {
    const txs = [tx({ category: 'food', amount: 500 }), tx({ category: 'transport', amount: 200 })]
    const ins = generateInsights(txs, [])
    const top = ins.find(i => i.type === 'top_category')
    expect(top?.message).toContain('Alimentação')
    expect(top?.positive).toBe(false)
  })

  it('detecta redução de gastos vs mês anterior', () => {
    const ins = generateInsights([tx({ amount: 800 })], [tx({ amount: 1000 })])
    const cmp = ins.find(i => i.type === 'vs_last_month')
    expect(cmp?.positive).toBe(true)
    expect(cmp?.message).toContain('menores')
  })

  it('detecta aumento de gastos vs mês anterior', () => {
    const ins = generateInsights([tx({ amount: 1200 })], [tx({ amount: 1000 })])
    const cmp = ins.find(i => i.type === 'vs_last_month')
    expect(cmp?.positive).toBe(false)
    expect(cmp?.message).toContain('acima')
  })

  it('calcula taxa de economia corretamente', () => {
    const txs = [tx({ type: 'income', amount: 5000 }), tx({ type: 'expense', amount: 3000 })]
    const ins = generateInsights(txs, [])
    const sr  = ins.find(i => i.type === 'savings_rate')
    expect(sr?.positive).toBe(true)
    expect(sr?.message).toContain('40%')
  })
})
