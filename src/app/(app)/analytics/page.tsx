import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { AnalyticsClient } from '@/components/analytics/analytics-client'
import { generateInsights } from '@/lib/insights'
import { Transaction, FamilyMember, getCategoryLabel, CATEGORY_COLORS } from '@/types'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ months?: string; view?: string }>
}) {
  const params   = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const db = createAdminClient()

  const rangeMonths = parseInt(params.months ?? '3')
  const view        = params.view ?? 'personal'

  const { data: myMember } = await db
    .from('family_members').select('id, family_id, role').eq('user_id', user.id).maybeSingle()

  const familyId = myMember?.family_id ?? null
  const now      = new Date()
  const start    = startOfMonth(subMonths(now, rangeMonths - 1))
  const end      = endOfMonth(now)
  const prevStart = startOfMonth(subMonths(start, 1))
  const prevEnd   = endOfMonth(subMonths(start, 1))
  const d = (date: Date) => date.toISOString().split('T')[0]

  const baseQuery = view === 'family' && familyId
    ? db.from('transactions').select('*').eq('family_id', familyId)
    : db.from('transactions').select('*').eq('user_id', user.id)

  const [{ data: txs }, { data: prevTxs }, { data: members }] = await Promise.all([
    baseQuery.gte('date', d(start)).lte('date', d(end)).order('date', { ascending: false }),
    db.from('transactions').select('*').eq('user_id', user.id).gte('date', d(prevStart)).lte('date', d(prevEnd)),
    familyId ? db.from('family_members').select('*').eq('family_id', familyId) : Promise.resolve({ data: [] }),
  ])

  const transactions: Transaction[]  = txs ?? []
  const allMembers:   FamilyMember[] = (members ?? []) as FamilyMember[]

  // Dados mensais
  const monthlyMap: Record<string, { income: number; expense: number }> = {}
  for (let i = rangeMonths - 1; i >= 0; i--) {
    const key = format(subMonths(now, i), 'MMM/yy', { locale: ptBR })
    monthlyMap[key] = { income: 0, expense: 0 }
  }
  for (const t of transactions) {
    const key = format(new Date(t.date + 'T12:00:00'), 'MMM/yy', { locale: ptBR })
    if (monthlyMap[key]) monthlyMap[key][t.type] += t.amount
  }
  const monthlyData = Object.entries(monthlyMap).map(([month, v]) => ({ month, ...v }))

  // Dados por categoria
  const catMap: Record<string, number> = {}
  for (const t of transactions.filter(t => t.type === 'expense')) {
    catMap[t.category] = (catMap[t.category] ?? 0) + t.amount
  }
  const categoryData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([cat, value]) => ({ name: getCategoryLabel(cat), value, color: CATEGORY_COLORS[cat] ?? '#94a3b8' }))

  // Dados por membro
  const memberData = allMembers
    .map(m => ({
      name: m.display_name, color: m.color,
      expense: transactions.filter(t => t.type === 'expense' && t.paid_by_member_id === m.id).reduce((s, t) => s + t.amount, 0),
    }))
    .filter(m => m.expense > 0)
    .sort((a, b) => b.expense - a.expense)

  const insights = generateInsights(transactions, prevTxs ?? [])
  const totalIncome  = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const fmtBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#7B2FBE' }}>Análises</p>
          <h1 className="text-3xl font-bold text-gray-900">Visão financeira</h1>
          <p className="text-gray-400 text-sm mt-1">Últimos {rangeMonths} meses</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[3,6,12].map(m => (
            <a key={m} href={`/analytics?months=${m}&view=${view}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                rangeMonths === m ? 'bg-[#7B2FBE] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#7B2FBE]'
              }`}>{m}m</a>
          ))}
          {familyId && (
            <>
              <a href={`/analytics?months=${rangeMonths}&view=personal`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${view === 'personal' ? 'bg-[#7B2FBE] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#7B2FBE]'}`}>
                Pessoal
              </a>
              <a href={`/analytics?months=${rangeMonths}&view=family`}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${view === 'family' ? 'bg-[#7B2FBE] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-[#7B2FBE]'}`}>
                Família
              </a>
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, #18181b, #3b0764)' }}>
        <p className="text-xs font-medium text-zinc-400 mb-4">Resumo do período</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/10 border border-white/10 p-4">
            <div className="text-xs text-violet-300 mb-1">Receitas</div>
            <div className="text-base sm:text-xl font-bold text-white truncate">{fmtBRL(totalIncome)}</div>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/10 p-4">
            <div className="text-xs text-pink-300 mb-1">Despesas</div>
            <div className="text-base sm:text-xl font-bold text-white truncate">{fmtBRL(totalExpense)}</div>
          </div>
          <div className="rounded-xl border p-4" style={{ background: 'rgba(16,185,129,0.2)', borderColor: 'rgba(16,185,129,0.3)' }}>
            <div className="text-xs text-emerald-300 mb-1">Economia</div>
            <div className="text-base sm:text-xl font-bold text-emerald-300 truncate">{fmtBRL(totalIncome - totalExpense)}</div>
          </div>
        </div>
      </div>

      <AnalyticsClient
        monthlyData={monthlyData}
        categoryData={categoryData}
        memberData={memberData}
        insights={insights}
      />
    </div>
  )
}
