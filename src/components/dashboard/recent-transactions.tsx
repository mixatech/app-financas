import { Transaction, getCategoryLabel } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

interface RecentTransactionsProps {
  transactions: Transaction[]
}

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recent = transactions.slice(0, 7)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold text-gray-700">Transações Recentes</h2>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-700"
        >
          Ver todas <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <p className="text-xs text-gray-400 mb-5">Últimas movimentações</p>

      {recent.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
          Nenhuma transação no período
        </div>
      ) : (
        <div className="space-y-1">
          {recent.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    t.type === 'income' ? 'bg-green-500' : 'bg-red-400'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.description}</p>
                  <p className="text-xs text-gray-400">
                    {getCategoryLabel(t.category)} ·{' '}
                    {format(new Date(t.date + 'T00:00:00'), 'dd MMM', { locale: ptBR })}
                  </p>
                </div>
              </div>
              <span
                className={`text-sm font-semibold ml-3 shrink-0 ${
                  t.type === 'income' ? 'text-green-600' : 'text-gray-800'
                }`}
              >
                {t.type === 'income' ? '+' : '−'} {fmt(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
