'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Transaction, getCategoryLabel, CATEGORY_COLORS } from '@/types'

interface ExpenseChartProps {
  transactions: Transaction[]
}

export function ExpenseChart({ transactions }: ExpenseChartProps) {
  const expenses = transactions.filter((t) => t.type === 'expense')

  const categoryMap = expenses.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount
    return acc
  }, {})

  const data = Object.entries(categoryMap)
    .map(([category, value]) => ({
      name: getCategoryLabel(category as never),
      value,
      color: CATEGORY_COLORS[category] ?? '#94a3b8',
    }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Despesas por Categoria</h2>
        <p className="text-xs text-gray-400 mb-6">Distribuição do período</p>
        <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
          Nenhuma despesa no período
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="text-sm font-semibold text-gray-700 mb-1">Despesas por Categoria</h2>
      <p className="text-xs text-gray-400 mb-4">Distribuição do período</p>
      <ResponsiveContainer width="100%" height={270}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={65}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              fontSize: '13px',
            }}
            formatter={(value) =>
              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                typeof value === 'number' ? value : 0
              )
            }
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ fontSize: '12px', color: '#6b7280' }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
