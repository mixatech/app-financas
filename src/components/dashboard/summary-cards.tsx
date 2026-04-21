import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'

interface SummaryCardsProps {
  totalIncome: number
  totalExpense: number
}

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function SummaryCards({ totalIncome, totalExpense }: SummaryCardsProps) {
  const balance = totalIncome - totalExpense

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
      {/* Receitas */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-green-200 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-500">Receitas</span>
          <div className="bg-green-50 p-2 rounded-xl">
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{fmt(totalIncome)}</p>
        <p className="text-xs text-gray-400 mt-1">Total do período</p>
      </div>

      {/* Despesas */}
      <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-red-200 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-500">Despesas</span>
          <div className="bg-red-50 p-2 rounded-xl">
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900">{fmt(totalExpense)}</p>
        <p className="text-xs text-gray-400 mt-1">Total do período</p>
      </div>

      {/* Saldo */}
      <div className={`rounded-2xl p-6 border transition-colors ${
        balance >= 0
          ? 'bg-green-600 border-green-600'
          : 'bg-red-500 border-red-500'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-white/80">Saldo</span>
          <div className="bg-white/20 p-2 rounded-xl">
            <Wallet className="h-4 w-4 text-white" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white">{fmt(balance)}</p>
        <p className="text-xs text-white/60 mt-1">Receitas − Despesas</p>
      </div>
    </div>
  )
}
