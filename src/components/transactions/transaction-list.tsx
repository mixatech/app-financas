import { Transaction, getCategoryLabel } from '@/types'
import { TransactionForm } from './transaction-form'
import { DeleteButton } from './delete-button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TransactionListProps {
  transactions: Transaction[]
}

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
        <p className="text-gray-800 font-semibold text-lg">Nenhuma transação encontrada</p>
        <p className="text-gray-400 text-sm mt-1">
          Ajuste os filtros ou adicione sua primeira transação
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {transactions.map((t, i) => (
        <div
          key={t.id}
          className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${
            i !== transactions.length - 1 ? 'border-b border-gray-50' : ''
          }`}
        >
          {/* Color indicator */}
          <div
            className={`w-1 h-10 rounded-full shrink-0 ${
              t.type === 'income' ? 'bg-green-500' : 'bg-red-400'
            }`}
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{t.description}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {getCategoryLabel(t.category)} ·{' '}
              {format(new Date(t.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          {/* Amount */}
          <span
            className={`text-sm font-bold shrink-0 ${
              t.type === 'income' ? 'text-green-600' : 'text-gray-800'
            }`}
          >
            {t.type === 'income' ? '+' : '−'} {fmt(t.amount)}
          </span>

          {/* Actions */}
          <div className="flex gap-1.5 shrink-0">
            <TransactionForm transaction={t} />
            <DeleteButton id={t.id} />
          </div>
        </div>
      ))}
    </div>
  )
}
