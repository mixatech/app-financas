import { Transaction, FamilyMember } from '@/types'
import { MemberAvatar } from '@/components/family/member-avatar'

interface MemberBreakdownProps {
  transactions: Transaction[]
  members: FamilyMember[]
}

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function MemberBreakdown({ transactions, members }: MemberBreakdownProps) {
  const expenses = transactions.filter((t) => t.type === 'expense')
  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)

  const memberStats = members.map((m) => {
    const memberExpenses = expenses.filter((t) => t.spent_by_member_id === m.id)
    const amount = memberExpenses.reduce((s, t) => s + t.amount, 0)
    const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0
    return { member: m, amount, pct }
  }).sort((a, b) => b.amount - a.amount)

  if (memberStats.every((s) => s.amount === 0)) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">Gastos por membro</h3>
      <div className="space-y-4">
        {memberStats.map(({ member, amount, pct }) => (
          <div key={member.id} className="flex items-center gap-3">
            <MemberAvatar name={member.display_name} color={member.color} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-gray-700 truncate">{member.display_name}</span>
                <span className="text-xs font-bold text-gray-800 ml-2 shrink-0">{fmt(amount)}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: member.color }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-400 w-10 text-right shrink-0">{pct.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
