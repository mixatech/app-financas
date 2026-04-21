import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Transaction, getCategoryLabel } from '@/types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RecentTransactionsProps {
  transactions: Transaction[]
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recent = transactions.slice(0, 8)

  return (
    <Card className="border-0 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-slate-700">Transações Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">Nenhuma transação no período</p>
        ) : (
          <div className="space-y-3">
            {recent.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{t.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className="text-xs font-normal">
                      {getCategoryLabel(t.category)}
                    </Badge>
                    <span className="text-xs text-slate-400">
                      {format(new Date(t.date + 'T00:00:00'), 'dd MMM', { locale: ptBR })}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ml-4 shrink-0 ${
                    t.type === 'income' ? 'text-green-600' : 'text-red-500'
                  }`}
                >
                  {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
