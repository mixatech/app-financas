import { Transaction, getCategoryLabel } from '@/types'
import { Badge } from '@/components/ui/badge'
import { TransactionForm } from './transaction-form'
import { DeleteButton } from './delete-button'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface TransactionListProps {
  transactions: Transaction[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-lg font-medium">Nenhuma transação encontrada</p>
        <p className="text-sm mt-1">Adicione sua primeira transação clicando em &quot;Nova transação&quot;</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-4 bg-white rounded-xl px-4 py-3 shadow-sm border border-slate-100 hover:border-slate-200 transition-colors"
        >
          <div
            className={`w-1 self-stretch rounded-full shrink-0 ${
              t.type === 'income' ? 'bg-green-400' : 'bg-red-400'
            }`}
          />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-700 truncate">{t.description}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="secondary" className="text-xs font-normal shrink-0">
                {getCategoryLabel(t.category)}
              </Badge>
              <span className="text-xs text-slate-400">
                {format(new Date(t.date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          </div>

          <span
            className={`text-sm font-bold shrink-0 ${
              t.type === 'income' ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
          </span>

          <div className="flex gap-1 shrink-0">
            <TransactionForm transaction={t} />
            <DeleteButton id={t.id} />
          </div>
        </div>
      ))}
    </div>
  )
}
