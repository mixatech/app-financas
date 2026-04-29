'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FamilyGroup, FamilyMember, Card, Settlement, MemberSplitRatio } from '@/types'
import { MemberAvatar } from '@/components/family/member-avatar'
import { BalancesTab } from '@/components/family/balances-tab'
import { MemberBalance } from '@/lib/balances'
import { Users, Plus, Copy, Check, Crown, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FamilyClientProps {
  group: FamilyGroup
  members: FamilyMember[]
  cards: Card[]
  currentUserId: string
  currentMember: FamilyMember
  balances: MemberBalance[]
  settlements: Settlement[]
  splitRatios: MemberSplitRatio[]
}

type Tab = 'members' | 'balances'

export function FamilyClient({ group, members: initialMembers, currentUserId, currentMember, balances, settlements }: FamilyClientProps) {
  const [tab, setTab] = useState<Tab>('members')
  const [members, setMembers] = useState(initialMembers)
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const supabase = createClient()
  const isAdmin = currentMember.role === 'admin'

  // router kept for potential future refresh needs
  const _router = useRouter()

  async function generateInvite() {
    setGeneratingInvite(true)
    const res = await fetch('/api/family/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ family_id: group.id }),
    })
    const json = await res.json()
    setInviteUrl(json.url ?? '')
    setGeneratingInvite(false)
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function removeMember(memberId: string) {
    if (!confirm('Remover este membro do grupo?')) return
    await supabase.from('family_members').delete().eq('id', memberId)
    setMembers((m) => m.filter((x) => x.id !== memberId))
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#7B2FBE' }}>Grupo</p>
        <h1 className="text-3xl font-bold text-gray-900">{group.name}</h1>
        <p className="text-gray-400 text-sm mt-1">{members.length} membro{members.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
        {([['members', 'Membros'], ['balances', 'Saldos']] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === t ? 'bg-white text-[#7B2FBE] shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}>
            {t === 'members' && <Users className="h-4 w-4" />}
            {label}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {tab === 'members' && (
        <div className="space-y-4">
          {isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Convidar membro</p>
              {inviteUrl ? (
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={inviteUrl}
                    className="flex-1 text-xs border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 text-gray-600 truncate"
                  />
                  <button
                    onClick={copyInvite}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white shrink-0"
                    style={{ background: copied ? '#16a34a' : 'var(--brand-gradient)' }}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={generateInvite}
                  disabled={generatingInvite}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                  style={{ background: 'var(--brand-gradient)' }}
                >
                  <Plus className="h-4 w-4" />
                  {generatingInvite ? 'Gerando...' : 'Gerar link de convite'}
                </button>
              )}
              <p className="text-xs text-gray-400 mt-2">O link expira em 7 dias</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {members.map((m, i) => (
              <div
                key={m.id}
                className={`flex items-center gap-4 px-5 py-4 ${i !== members.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <MemberAvatar name={m.display_name} color={m.color} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-800">{m.display_name}</p>
                    {m.role === 'admin' && <Crown className="h-3.5 w-3.5 text-amber-500" />}
                    {m.user_id === currentUserId && <span className="text-xs text-gray-400">(você)</span>}
                  </div>
                  <p className="text-xs text-gray-400">{m.role === 'admin' ? 'Administrador' : 'Membro'}</p>
                </div>
                {isAdmin && m.user_id !== currentUserId && (
                  <button onClick={() => removeMember(m.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Balances tab */}
      {tab === 'balances' && (
        <BalancesTab
          balances={balances} myMemberId={currentMember.id}
          familyId={group.id} settlements={settlements} members={members}
        />
      )}
    </div>
  )
}
