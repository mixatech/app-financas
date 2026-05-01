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

const CATEGORY_META: Record<string, { emoji: string; bg: string }> = {
  food:          { emoji: '🍽️', bg: 'rgba(251,146,60,0.12)'  },
  transport:     { emoji: '🚗', bg: 'rgba(59,130,246,0.12)'  },
  housing:       { emoji: '🏠', bg: 'rgba(16,185,129,0.12)'  },
  health:        { emoji: '❤️', bg: 'rgba(239,68,68,0.12)'   },
  education:     { emoji: '📚', bg: 'rgba(99,102,241,0.12)'  },
  entertainment: { emoji: '🎬', bg: 'rgba(236,72,153,0.12)'  },
  clothing:      { emoji: '👗', bg: 'rgba(168,85,247,0.12)'  },
  other_expense: { emoji: '📦', bg: 'rgba(107,114,128,0.12)' },
  salary:        { emoji: '💼', bg: 'rgba(16,185,129,0.12)'  },
  freelance:     { emoji: '💻', bg: 'rgba(123,47,190,0.12)'  },
  investment:    { emoji: '📈', bg: 'rgba(59,130,246,0.12)'  },
  other_income:  { emoji: '✨', bg: 'rgba(123,47,190,0.12)'  },
}

function CategoryIcon({ category }: { category: string }) {
  const meta = CATEGORY_META[category] ?? { emoji: '💰', bg: 'rgba(123,47,190,0.10)' }
  return (
    <span
      className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-base"
      style={{ background: meta.bg }}
    >
      {meta.emoji}
    </span>
  )
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const recent = transactions.slice(0, 8)

  return (
    <div
      className="bg-white rounded-2xl p-6"
      style={{ boxShadow: '0 2px 16px rgba(123,47,190,0.07)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Transações Recentes</h2>
          <p className="text-xs text-gray-400 mt-0.5">Últimas movimentações do período</p>
        </div>
        <Link
          href="/transactions"
          className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
          style={{ background: 'rgba(123,47,190,0.08)', color: '#7B2FBE' }}
        >
          Ver todas <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-300 text-sm">
          Nenhuma transação no período
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 pb-2 mb-1 border-b border-gray-100">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Descrição</span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest hidden sm:block">Categoria</span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest text-right">Valor</span>
          </div>

          <div className="divide-y divide-gray-50">
            {recent.map((t) => {
              const isIncome = t.type === 'income'
              return (
                <div key={t.id} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon category={t.category} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{t.description}</p>
                      <p className="text-xs text-gray-400">
                        {format(new Date(t.date + 'T00:00:00'), 'dd MMM', { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap hidden sm:inline-block"
                    style={{ background: 'rgba(123,47,190,0.07)', color: '#7B2FBE' }}
                  >
                    {getCategoryLabel(t.category)}
                  </span>

                  <div className="text-right">
                    <span
                      className="text-sm font-bold whitespace-nowrap block"
                      style={{ color: isIncome ? '#10b981' : '#ef4444' }}
                    >
                      {isIncome ? '+' : '−'}&nbsp;{fmt(t.amount)}
                    </span>
                    <span className="text-[10px] text-gray-400">{isIncome ? 'Receita' : 'Despesa'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
