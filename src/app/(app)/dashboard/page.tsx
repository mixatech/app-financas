import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { ExpenseChart } from '@/components/dashboard/expense-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { MemberBreakdown } from '@/components/dashboard/member-breakdown'
import { MemberBarChart } from '@/components/dashboard/member-bar-chart'
import { SpendingTrend } from '@/components/dashboard/spending-trend'
import { FamilyToggle } from '@/components/dashboard/family-toggle'
import { MonthPicker } from '@/components/dashboard/month-picker'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { ChatFab } from '@/components/chat/chat-fab'
import { Transaction, FamilyMember, Card } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react'

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

  const balancePositive = balance >= 0
  const expensePct = totalIncome > 0 ? ((totalExpense / totalIncome) * 100).toFixed(0) : null

  return (
    <div className="space-y-6">
      {/* Cabeçalho minimalista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 capitalize">{monthLabel}</h2>
          <p className="text-sm text-gray-400 mt-0.5">Resumo financeiro do período</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {hasFamily && (
            <Suspense>
              <FamilyToggle />
            </Suspense>
          )}
          <Suspense>
            <MonthPicker value={month} />
          </Suspense>
          <TransactionForm
            familyMembers={familyMembers}
            cards={cards}
            currentUserMemberId={currentUserMemberId}
            familyId={familyId ?? undefined}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Receitas */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(123,47,190,0.07)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(123,47,190,0.10)' }}>
              <TrendingUp className="h-4 w-4" style={{ color: '#7B2FBE' }} />
            </span>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Receitas</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{fmt(totalIncome)}</p>
          <p className="text-xs text-gray-400">Entradas do período</p>
        </div>

        {/* Despesas */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(123,47,190,0.07)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(123,47,190,0.10)' }}>
              <CreditCard className="h-4 w-4" style={{ color: '#7B2FBE' }} />
            </span>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Despesas</p>
          </div>
          <p className="text-2xl font-bold text-gray-900 mb-1">{fmt(totalExpense)}</p>
          <p className="text-xs text-gray-400">
            {expensePct ? `${expensePct}% da receita` : 'Saídas do período'}
          </p>
        </div>

        {/* Saldo — card destaque com fundo violeta */}
        <div className="rounded-2xl p-5" style={{ background: 'linear-gradient(135deg, #7B2FBE 0%, #9333ea 100%)', boxShadow: '0 8px 24px rgba(123,47,190,0.30)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <Wallet className="h-4 w-4 text-white" />
            </span>
            <p className="text-xs font-semibold text-white/60 uppercase tracking-wider">Saldo</p>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{fmt(balance)}</p>
          <span
            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
          >
            {balancePositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {balancePositive ? 'Resultado positivo' : 'Resultado negativo'}
          </span>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <SpendingTrend transactions={transactions} month={month} />
        </div>
        <div className="lg:col-span-2">
          <ExpenseChart transactions={transactions} />
        </div>
      </div>

      {/* Transações recentes */}
      <RecentTransactions transactions={transactions} />

      {/* Família */}
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
