import { createClient } from '@/lib/supabase/server'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { ExpenseChart } from '@/components/dashboard/expense-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { Transaction } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const now = new Date()
  const month = params.month ?? format(now, 'yyyy-MM')
  const [year, monthNum] = month.split('-')
  const startDate = `${year}-${monthNum}-01`
  const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0]

  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user!.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  const transactions: Transaction[] = data ?? []
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const monthLabel = format(new Date(`${year}-${monthNum}-15`), 'MMMM yyyy', { locale: ptBR })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-1">Dashboard</p>
          <h1 className="text-3xl font-bold text-gray-900 capitalize">{monthLabel}</h1>
          <p className="text-gray-400 text-sm mt-1">Resumo financeiro do período</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            defaultValue={month}
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <TransactionForm />
        </div>
      </div>

      {/* Cards */}
      <SummaryCards totalIncome={totalIncome} totalExpense={totalExpense} />

      {/* Charts + Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ExpenseChart transactions={transactions} />
        <RecentTransactions transactions={transactions} />
      </div>
    </div>
  )
}
