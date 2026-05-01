'use client'

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Transaction } from '@/types'
import { format, eachDayOfInterval } from 'date-fns'

interface SpendingTrendProps {
  transactions: Transaction[]
  month: string
}

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
  }).format(value)
}

export function SpendingTrend({ transactions, month }: SpendingTrendProps) {
  const [year, monthNum] = month.split('-').map(Number)
  const start = new Date(year, monthNum - 1, 1)
  const end = new Date(year, monthNum, 0)

  const weeks: { label: string; income: number; expense: number }[] = []
  const days = eachDayOfInterval({ start, end })
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7)
    const label = `Sem ${Math.floor(i / 7) + 1}`
    const income = chunk.reduce((s, day) => {
      const ds = format(day, 'yyyy-MM-dd')
      return s + transactions.filter(t => t.date === ds && t.type === 'income').reduce((a, t) => a + t.amount, 0)
    }, 0)
    const expense = chunk.reduce((s, day) => {
      const ds = format(day, 'yyyy-MM-dd')
      return s + transactions.filter(t => t.date === ds && t.type === 'expense').reduce((a, t) => a + t.amount, 0)
    }, 0)
    weeks.push({ label, income, expense })
  }

  const hasData = weeks.some((w) => w.income > 0 || w.expense > 0)

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  return (
    <div
      className="rounded-2xl p-6 h-full relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1e0a3c 0%, #3b1278 50%, #1a1060 100%)',
        boxShadow: '0 8px 32px rgba(30,10,60,0.40)',
      }}
    >
      {/* Decorative orbs */}
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(147,51,234,0.25) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.20) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}
      />

      <div className="relative flex items-start justify-between mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.45)' }}>Fluxo do Mês</p>
          <h2 className="text-xl font-bold text-white mt-1">Receitas vs Despesas</h2>
        </div>
        <div className="flex flex-col gap-1.5 text-right">
          <div className="flex items-center justify-end gap-2">
            <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Receitas</span>
            <span className="text-sm font-bold text-white">{fmt(totalIncome)}</span>
          </div>
          <div className="flex items-center justify-end gap-2">
            <span className="text-[10px] font-medium" style={{ color: 'rgba(255,255,255,0.45)' }}>Despesas</span>
            <span className="text-sm font-bold" style={{ color: '#c4b5fd' }}>{fmt(totalExpense)}</span>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>
          Nenhuma movimentação no período
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={175}>
          <AreaChart data={weeks} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" stopOpacity={0.30} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c4b5fd" stopOpacity={0.40} />
                <stop offset="100%" stopColor="#c4b5fd" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.40)' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.40)' }}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
            />
            <Tooltip
              cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
              contentStyle={{
                background: 'rgba(20,5,45,0.95)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.40)',
                fontSize: '12px',
                padding: '10px 14px',
                color: '#fff',
              }}
              formatter={(value, name) => [
                fmt(typeof value === 'number' ? value : 0),
                name === 'income' ? 'Receitas' : 'Despesas',
              ]}
            />
            <Area
              type="monotone"
              dataKey="income"
              name="income"
              stroke="#ffffff"
              strokeWidth={2}
              fill="url(#incomeGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#fff', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="expense"
              name="expense"
              stroke="#c4b5fd"
              strokeWidth={2}
              fill="url(#expenseGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#c4b5fd', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      <div className="flex items-center gap-5 mt-4 relative">
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 rounded-full bg-white inline-block opacity-70" />
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.50)' }}>Receitas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 rounded-full inline-block" style={{ background: '#c4b5fd', opacity: 0.7 }} />
          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.50)' }}>Despesas</span>
        </div>
      </div>
    </div>
  )
}
