import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { TransactionList } from '@/components/transactions/transaction-list'
import { TransactionFilters } from '@/components/transactions/transaction-filters'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { Transaction } from '@/types'
import { format } from 'date-fns'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; type?: string; category?: string }>
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

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user!.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  if (params.type && params.type !== 'all') {
    query = query.eq('type', params.type)
  }
  if (params.category && params.category !== 'all') {
    query = query.eq('category', params.category)
  }

  const { data } = await query
  const transactions: Transaction[] = data ?? []

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Transações</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {transactions.length} transação{transactions.length !== 1 ? 'ões' : ''} encontrada{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <TransactionForm />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <Suspense>
          <TransactionFilters />
        </Suspense>
      </div>

      {transactions.length > 0 && (
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 font-medium">
            Receitas:{' '}
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-red-500 font-medium">
            Despesas:{' '}
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}
          </span>
          <span className="text-slate-300">|</span>
          <span className={`font-medium ${totalIncome - totalExpense >= 0 ? 'text-blue-600' : 'text-orange-500'}`}>
            Saldo:{' '}
            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              totalIncome - totalExpense
            )}
          </span>
        </div>
      )}

      <TransactionList transactions={transactions} />
    </div>
  )
}
