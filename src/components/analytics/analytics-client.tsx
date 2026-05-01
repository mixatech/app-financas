'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts'
import { Insight } from '@/lib/insights'

interface AnalyticsClientProps {
  monthlyData: { month: string; income: number; expense: number }[]
  categoryData: { name: string; value: number; color: string }[]
  memberData:   { name: string; expense: number; color: string }[]
  insights:     Insight[]
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

const PALETTE = [
  '#7B2FBE', '#9333ea', '#6366f1', '#a78bfa', '#c4b5fd',
  '#818cf8', '#4f46e5', '#8b5cf6', '#312e81', '#0ea5e9',
]

export function AnalyticsClient({ monthlyData, categoryData, memberData, insights }: AnalyticsClientProps) {
  return (
    <div className="space-y-6">
      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((ins, i) => (
            <div key={i} className="rounded-2xl p-4" style={ins.positive
              ? { background: 'rgba(123,47,190,0.06)', border: '1px solid rgba(123,47,190,0.12)' }
              : { background: 'rgba(123,47,190,0.10)', border: '1px solid rgba(123,47,190,0.20)' }}>
              <p className="text-sm font-medium" style={{ color: ins.positive ? '#7B2FBE' : '#4c1d95' }}>{ins.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Evolução mensal */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(123,47,190,0.07)' }}>
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Evolução mensal</h2>
        <p className="text-xs text-gray-400 mb-4">Receitas vs. Despesas</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyData} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} width={52} />
            <Tooltip
              formatter={(v, name) => [fmt(Number(v)), name]}
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              cursor={{ fill: '#f9fafb' }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
            <Bar dataKey="income"  name="Receita" fill="#7B2FBE" radius={[6,6,0,0]} />
            <Bar dataKey="expense" name="Despesa" fill="#C4B5FD" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Breakdown por categoria */}
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(123,47,190,0.07)' }}>
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Por categoria</h2>
          <p className="text-xs text-gray-400 mb-4">Distribuição de despesas</p>
          {categoryData.length === 0
            ? <p className="text-sm text-gray-400 py-8 text-center">Sem despesas no período</p>
            : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" cx="50%" cy="50%"
                      innerRadius={52} outerRadius={78} paddingAngle={3} strokeWidth={0}>
                      {categoryData.map((_e, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v) => fmt(Number(v))}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 mt-4">
                  {categoryData.slice(0, 5).map((c, i) => {
                    const color = PALETTE[i % PALETTE.length]
                    const total = categoryData.reduce((s, x) => s + x.value, 0)
                    const pct = total > 0 ? Math.round((c.value / total) * 100) : 0
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                            <span className="text-xs text-gray-600">{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-800">{fmt(c.value)}</span>
                            <span className="text-[10px] text-gray-400 w-7 text-right">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-1 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color, opacity: 0.85 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
        </div>

        {/* Por membro */}
        {memberData.length > 0 && (
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 2px 16px rgba(123,47,190,0.07)' }}>
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Por membro</h2>
            <p className="text-xs text-gray-400 mb-4">Gastos totais</p>
            <div className="space-y-3">
              {memberData.map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: '#7B2FBE' }} />
                      <span className="text-sm font-medium text-gray-900">{m.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{fmt(m.expense)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{
                      background: '#7B2FBE',
                      width: `${Math.min(100, (m.expense / (memberData[0]?.expense || 1)) * 100)}%`
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
