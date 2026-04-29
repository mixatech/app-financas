import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
// SummaryCards replaced by inline Fintech Bold header
import { ExpenseChart } from '@/components/dashboard/expense-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { MemberBreakdown } from '@/components/dashboard/member-breakdown'
import { MemberBarChart } from '@/components/dashboard/member-bar-chart'
import { FamilyToggle } from '@/components/dashboard/family-toggle'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { ChatFab } from '@/components/chat/chat-fab'
import { Transaction, FamilyMember, Card } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createAdminClient()

  const now = new Date()
  const month = params.month ?? format(now, 'yyyy-MM')
  const [year, monthNum] = month.split('-')
  const startDate = `${year}-${monthNum}-01`
  const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0]
  const monthLabel = format(new Date(`${year}-${monthNum}-15`), 'MMMM yyyy', { locale: ptBR })
  const view = params.view ?? 'personal'

  // Buscar membro do usuário
  const { data: myMember } = await db
    .from('family_members')
    .select('id, family_id')
    .eq('user_id', user!.id)
    .maybeSingle()

  const familyId = myMember?.family_id ?? null
  const currentUserMemberId = myMember?.id ?? undefined

  // Buscar dados em paralelo
  const [txResult, membersResult, cardsResult, familyTxResult] = await Promise.all([
    db
      .from('transactions')
      .select('*')
      .eq('user_id', user!.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false }),
    familyId
      ? db.from('family_members').select('*').eq('family_id', familyId)
      : Promise.resolve({ data: [] }),
    familyId
      ? db.from('cards').select('*').eq('family_id', familyId)
      : Promise.resolve({ data: [] }),
    familyId && view === 'family'
      ? db
          .from('transactions')
          .select('*')
          .eq('family_id', familyId)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  const personalTransactions: Transaction[] = txResult.data ?? []
  const familyMembers: FamilyMember[] = (membersResult.data ?? []) as FamilyMember[]
  const cards: Card[] = (cardsResult.data ?? []) as Card[]
  const familyTransactions: Transaction[] = (familyTxResult.data ?? []) as Transaction[]

  const transactions = view === 'family' && familyId ? familyTransactions : personalTransactions

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  function fmt(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const hasFamily = familyMembers.length > 0

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#7B2FBE' }}>
            Dashboard
          </p>
          <h1 className="text-3xl font-bold text-gray-900 capitalize">{monthLabel}</h1>
          <p className="text-gray-400 text-sm mt-1">Resumo financeiro do período</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {hasFamily && (
            <Suspense>
              <FamilyToggle />
            </Suspense>
          )}
          <input
            type="month"
            defaultValue={month}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-[#7B2FBE] focus:border-transparent"
          />
          <TransactionForm
            familyMembers={familyMembers}
            cards={cards}
            currentUserMemberId={currentUserMemberId}
          />
        </div>
      </div>

      {/* Fintech Bold header */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{ background: 'linear-gradient(135deg, #18181b, #3b0764)' }}
      >
        <p className="text-xs font-medium text-zinc-400 mb-4">
          Resumo do mês
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white/10 border border-white/10 p-4">
            <div className="text-xs text-violet-300 mb-1">Receitas</div>
            <div className="text-base sm:text-xl font-bold text-white truncate">{fmt(totalIncome)}</div>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/10 p-4">
            <div className="text-xs text-pink-300 mb-1">Despesas</div>
            <div className="text-base sm:text-xl font-bold text-white truncate">{fmt(totalExpense)}</div>
          </div>
          <div
            className="rounded-xl border p-4"
            style={{ background: 'rgba(16,185,129,0.2)', borderColor: 'rgba(16,185,129,0.3)' }}
          >
            <div className="text-xs text-emerald-300 mb-1">Saldo</div>
            <div className="text-base sm:text-xl font-bold text-emerald-300 truncate">{fmt(balance)}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ExpenseChart transactions={transactions} />
        <RecentTransactions transactions={transactions} />
      </div>

      {view === 'family' && hasFamily && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <MemberBreakdown transactions={transactions} members={familyMembers} />
          <MemberBarChart transactions={transactions} members={familyMembers} />
        </div>
      )}

      <ChatFab />
    </div>
  )
}
