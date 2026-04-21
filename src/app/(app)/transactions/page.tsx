import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { TransactionList } from '@/components/transactions/transaction-list'
import { TransactionFilters } from '@/components/transactions/transaction-filters'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { Transaction } from '@/types'
import { format } from 'date-fns'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

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
  const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0]

  let query = supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user!.id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  if (params.type && params.type !== 'all') query = query.eq('type', params.type)
  if (params.category && params.category !== 'all') query = query.eq('category', params.category)

  const { data } = await query
  const transactions: Transaction[] = data ?? []

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-green-600 uppercase tracking-widest mb-1">Histórico</p>
          <h1 className="text-3xl font-bold text-gray-900">Transações</h1>
          <p className="text-gray-400 text-sm mt-1">
            {transactions.length} transaç{transactions.length !== 1 ? 'ões' : 'ão'} encontrada{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <TransactionForm />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 px-6 py-4">
        <Suspense>
          <TransactionFilters />
        </Suspense>
      </div>

      {/* Summary strip */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-3 flex flex-col">
            <span className="text-xs text-gray-400 mb-1">Receitas</span>
            <span className="text-base font-bold text-green-600">{fmt(totalIncome)}</span>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 px-5 py-3 flex flex-col">
            <span className="text-xs text-gray-400 mb-1">Despesas</span>
            <span className="text-base font-bold text-gray-800">{fmt(totalExpense)}</span>
          </div>
          <div className={`rounded-xl border px-5 py-3 flex flex-col ${balance >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
            <span className="text-xs text-gray-400 mb-1">Saldo</span>
            <span className={`text-base font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-500'}`}>{fmt(balance)}</span>
          </div>
        </div>
      )}

      {/* List */}
      <TransactionList transactions={transactions} />
    </div>
  )
}
