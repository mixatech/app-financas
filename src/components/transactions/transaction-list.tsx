import { Transaction, getCategoryLabel, FamilyMember, Card } from '@/types'
import { TransactionForm } from './transaction-form'
import { DeleteButton } from './delete-button'
import { MemberAvatar } from '@/components/family/member-avatar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CreditCard } from 'lucide-react'

interface TransactionListProps {
  transactions: Transaction[]
  familyMembers?: FamilyMember[]
  cards?: Card[]
  currentUserMemberId?: string
  familyId?: string
}

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function TransactionList({
  transactions,
  familyMembers = [],
  cards = [],
  currentUserMemberId,
  familyId,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-16 text-center" style={{ boxShadow: '0 2px 16px rgba(123,47,190,0.07)' }}>
        <p className="text-gray-800 font-semibold text-lg">Nenhuma transação encontrada</p>
        <p className="text-gray-400 text-sm mt-1">
          Ajuste os filtros ou adicione sua primeira transação
        </p>
      </div>
    )
  }

  const memberMap = Object.fromEntries(familyMembers.map((m) => [m.id, m]))
  const cardMap = Object.fromEntries(cards.map((c) => [c.id, c]))

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(123,47,190,0.07)' }}>
      {transactions.map((t, i) => {
        const paidByMember = t.paid_by_member_id ? memberMap[t.paid_by_member_id] : null
        const card = t.card_id ? cardMap[t.card_id] : null

        return (
          <div
            key={t.id}
            className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors ${
              i !== transactions.length - 1 ? 'border-b border-gray-50' : ''
            }`}
          >
            {/* Color indicator */}
            <div
              className="w-1 h-10 rounded-full shrink-0"
              style={{ background: t.type === 'income' ? 'var(--brand-gradient)' : '#f87171' }}
            />

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{t.description}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-gray-400">
                  {getCategoryLabel(t.category)} ·{' '}
                  {format(new Date(t.date + 'T00:00:00'), "dd 'de' MMMM", { locale: ptBR })}
                </span>
                {card && (
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md">
                    <CreditCard className="h-3 w-3" />
                    {card.name}
                  </span>
                )}
              </div>
            </div>

            {/* Member avatar */}
            {paidByMember && (
              <MemberAvatar name={paidByMember.display_name} color={paidByMember.color} size="sm" />
            )}

            {/* Amount */}
            <span
              className="text-sm font-bold shrink-0"
              style={{ color: t.type === 'income' ? '#7B2FBE' : '#111827' }}
            >
              {t.type === 'income' ? '+' : '−'} {fmt(t.amount)}
            </span>

            {/* Actions */}
            <div className="flex gap-1.5 shrink-0">
              <TransactionForm
                transaction={t}
                familyMembers={familyMembers}
                cards={cards}
                currentUserMemberId={currentUserMemberId}
                familyId={familyId}
              />
              <DeleteButton id={t.id} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
