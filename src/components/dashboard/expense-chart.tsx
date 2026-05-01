'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Transaction, getCategoryLabel } from '@/types'

interface ExpenseChartProps {
  transactions: Transaction[]
}

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const SHADOW = { boxShadow: '0 3.5px 5.5px 0 rgba(0,0,0,0.06)' }

export function ExpenseChart({ transactions }: ExpenseChartProps) {
  const expenses = transactions.filter((t) => t.type === 'expense')
  const total = expenses.reduce((s, t) => s + t.amount, 0)

  // Paleta monocromática violeta — profissional e coesa
  const PALETTE = [
    '#7B2FBE', '#9333ea', '#6366f1', '#a78bfa', '#c4b5fd',
    '#818cf8', '#4f46e5', '#8b5cf6', '#312e81', '#0ea5e9',
  ]

  const data = Object.entries(
    expenses.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + t.amount
      return acc
    }, {})
  )
    .map(([category, value], i) => ({
      name: getCategoryLabel(category as never),
      value,
      color: PALETTE[i % PALETTE.length],
      pct: total > 0 ? ((value / total) * 100).toFixed(0) : '0',
    }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 h-full" style={SHADOW}>
        <h2 className="text-sm font-semibold text-gray-800 mb-1">Despesas por Categoria</h2>
        <p className="text-xs text-gray-400 mb-6">Distribuição do período</p>
        <div className="flex items-center justify-center h-48 text-gray-300 text-sm">
          Nenhuma despesa no período
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-6 h-full" style={SHADOW}>
      <h2 className="text-sm font-semibold text-gray-800 mb-1">Despesas por Categoria</h2>
      <p className="text-xs text-gray-400 mb-2">Distribuição do período</p>

      <div className="relative">
        <ResponsiveContainer width="100%" height={196}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={86}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
                fontSize: '12px',
                padding: '8px 12px',
              }}
              formatter={(value) => [fmt(typeof value === 'number' ? value : 0), 'Total']}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-gray-400 font-medium">Total</span>
          <span className="text-sm font-bold text-gray-900 leading-tight">{fmt(total)}</span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {data.slice(0, 5).map((entry) => (
          <div key={entry.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                <span className="text-xs text-gray-600 truncate">{entry.name}</span>
              </div>
              <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                <span className="text-xs font-semibold text-gray-800">{fmt(entry.value)}</span>
                <span className="text-[10px] text-gray-400 w-7 text-right">{entry.pct}%</span>
              </div>
            </div>
            <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${entry.pct}%`, backgroundColor: entry.color, opacity: 0.85 }}
              />
            </div>
          </div>
        ))}
        {data.length > 5 && (
          <p className="text-[10px] text-gray-400 text-center pt-1">
            +{data.length - 5} outras categorias
          </p>
        )}
      </div>
    </div>
  )
}
