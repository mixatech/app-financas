'use client'

import { Transaction, FamilyMember } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface MemberBarChartProps {
  transactions: Transaction[]
  members: FamilyMember[]
}

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function MemberBarChart({ transactions, members }: MemberBarChartProps) {
  const expenses = transactions.filter((t) => t.type === 'expense')

  const data = members.map((m) => ({
    name: m.display_name.split(' ')[0],
    value: expenses.filter((t) => t.spent_by_member_id === m.id).reduce((s, t) => s + t.amount, 0),
    color: m.color,
  })).filter((d) => d.value > 0)

  if (data.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Comparativo de gastos</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barSize={40} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
          />
          <YAxis hide />
          <Tooltip
            formatter={(value) => [fmt(typeof value === 'number' ? value : 0), 'Gastos']}
            contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            cursor={{ fill: '#f9fafb' }}
          />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
