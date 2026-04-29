import { Transaction, getCategoryLabel } from '@/types'

export interface Insight {
  type: 'top_category' | 'vs_last_month' | 'savings_rate'
  message: string
  positive: boolean
}

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function generateInsights(current: Transaction[], previous: Transaction[]): Insight[] {
  const insights: Insight[] = []
  const curExpenses = current.filter(t => t.type === 'expense')
  const curIncome   = current.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const curTotal    = curExpenses.reduce((s, t) => s + t.amount, 0)
  const prevTotal   = previous.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const catMap = curExpenses.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount; return acc
  }, {})
  const top = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0]
  if (top) {
    const pct = curTotal > 0 ? Math.round((top[1] / curTotal) * 100) : 0
    insights.push({
      type: 'top_category',
      message: `${getCategoryLabel(top[0])} foi a maior despesa — ${fmt(top[1])} (${pct}% do total)`,
      positive: false,
    })
  }

  if (prevTotal > 0 && curTotal > 0) {
    const diff = curTotal - prevTotal
    const pct  = Math.round(Math.abs(diff / prevTotal) * 100)
    insights.push({
      type: 'vs_last_month',
      message: diff < 0
        ? `Gastos ${pct}% menores que no mês anterior — ${fmt(Math.abs(diff))} a menos`
        : `Gastos ${pct}% acima do mês anterior — ${fmt(diff)} a mais`,
      positive: diff < 0,
    })
  }

  if (curIncome > 0) {
    const saved = curIncome - curTotal
    const rate  = Math.round((saved / curIncome) * 100)
    insights.push({
      type: 'savings_rate',
      message: saved >= 0
        ? `Taxa de economia: ${rate}% da renda — ${fmt(saved)} guardados`
        : `Gastos superaram a renda em ${fmt(Math.abs(saved))}`,
      positive: saved >= 0,
    })
  }

  return insights
}
