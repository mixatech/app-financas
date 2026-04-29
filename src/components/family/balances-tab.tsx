'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MemberBalance } from '@/lib/balances'
import { Settlement, FamilyMember } from '@/types'
import { SettlementModal } from './settlement-modal'
import { CheckCircle } from 'lucide-react'

interface BalancesTabProps {
  balances: MemberBalance[]
  myMemberId: string
  familyId: string
  settlements: Settlement[]
  members: FamilyMember[]
}

export function BalancesTab({ balances, myMemberId, familyId, settlements, members }: BalancesTabProps) {
  const [selected, setSelected] = useState<MemberBalance | null>(null)
  const router = useRouter()
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(v))

  const nonZero = balances.filter(b => Math.abs(b.amount) > 0.01)

  if (nonZero.length === 0) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <CheckCircle className="h-12 w-12 text-emerald-400 mb-3" />
        <p className="text-gray-700 font-medium">Todos os saldos estão zerados</p>
        <p className="text-sm text-gray-400 mt-1">Nenhum membro deve nada a outro.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {nonZero.map(b => (
        <div key={b.memberId}
          className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {b.amount > 0 ? b.memberName : 'Você'}
              <span className="font-normal text-gray-500"> deve para </span>
              {b.amount > 0 ? 'você' : b.memberName}
            </p>
            <p className={`text-2xl font-bold mt-1 ${b.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {fmt(b.amount)}
            </p>
          </div>
          <button onClick={() => setSelected(b)}
            className="px-4 py-2 rounded-xl bg-[#7B2FBE] hover:bg-[#6B28A8] text-white text-sm font-semibold whitespace-nowrap">
            Quitar
          </button>
        </div>
      ))}

      {settlements.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Histórico</h3>
          <div className="space-y-2">
            {settlements.slice(0, 10).map(s => {
              const from = members.find(m => m.id === s.from_member_id)
              const to   = members.find(m => m.id === s.to_member_id)
              return (
                <div key={s.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-50">
                  <span className="text-gray-600">
                    <span className="font-medium">{from?.display_name}</span> pagou <span className="font-medium">{to?.display_name}</span>
                    {s.note ? ` — ${s.note}` : ''}
                  </span>
                  <div className="text-right">
                    <span className="font-semibold text-gray-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.amount)}
                    </span>
                    <span className="block text-xs text-gray-400">
                      {new Date(s.settled_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {selected && (
        <SettlementModal
          balance={selected} myMemberId={myMemberId} familyId={familyId}
          open={!!selected} onClose={() => setSelected(null)}
          onSettled={() => { setSelected(null); router.refresh() }}
        />
      )}
    </div>
  )
}
