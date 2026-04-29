'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Insight } from '@/lib/insights'

interface AnalyticsClientProps {
  monthlyData: { month: string; income: number; expense: number }[]
  categoryData: { name: string; value: number; color: string }[]
  memberData:   { name: string; expense: number; color: string }[]
  insights:     Insight[]
}

const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export function AnalyticsClient({ monthlyData, categoryData, memberData, insights }: AnalyticsClientProps) {
  return (
    <div className="space-y-6">
      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((ins, i) => (
            <div key={i} className={`rounded-2xl border p-4 ${ins.positive ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
              <p className={`text-sm font-medium ${ins.positive ? 'text-emerald-800' : 'text-amber-800'}`}>{ins.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Evolução mensal */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-1">Evolução mensal</h2>
        <p className="text-xs text-gray-400 mb-6">Receitas vs. Despesas</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} barGap={4}>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => fmt(Number(v))} />
            <Bar dataKey="income"  name="Receita" fill="#7B2FBE" radius={[4,4,0,0]} />
            <Bar dataKey="expense" name="Despesa" fill="#f97316" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Breakdown por categoria */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Por categoria</h2>
          <p className="text-xs text-gray-400 mb-4">Distribuição de despesas</p>
          {categoryData.length === 0
            ? <p className="text-sm text-gray-400 py-8 text-center">Sem despesas no período</p>
            : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" outerRadius={70}>
                      {categoryData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {categoryData.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
                        <span className="text-gray-600">{c.name}</span>
                      </div>
                      <span className="font-medium text-gray-900">{fmt(c.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
        </div>

        {/* Por membro */}
        {memberData.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Por membro</h2>
            <p className="text-xs text-gray-400 mb-4">Gastos totais</p>
            <div className="space-y-3">
              {memberData.map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: m.color }} />
                      <span className="text-sm font-medium text-gray-700">{m.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{fmt(m.expense)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="h-2 rounded-full" style={{
                      background: m.color,
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
