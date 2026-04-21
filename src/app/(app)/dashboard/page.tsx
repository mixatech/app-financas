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
  const endDate = new Date(parseInt(year), parseInt(monthNum), 0)
    .toISOString()
    .split('T')[0]

  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user!.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  const transactions: Transaction[] = data ?? []

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  const monthLabel = format(new Date(`${year}-${monthNum}-15`), 'MMMM yyyy', { locale: ptBR })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 capitalize">{monthLabel}</h1>
          <p className="text-slate-400 text-sm mt-0.5">Resumo financeiro do período</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="month"
            defaultValue={month}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            form="month-form"
          />
          <TransactionForm />
        </div>
      </div>

      <SummaryCards totalIncome={totalIncome} totalExpense={totalExpense} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpenseChart transactions={transactions} />
        <RecentTransactions transactions={transactions} />
      </div>
    </div>
  )
}
