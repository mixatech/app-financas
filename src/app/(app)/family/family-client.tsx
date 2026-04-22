'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FamilyGroup, FamilyMember, Card, CARD_TYPE_LABELS, CardType, MEMBER_COLORS } from '@/types'
import { MemberAvatar } from '@/components/family/member-avatar'
import { Users, CreditCard, Plus, Copy, Check, Crown, Trash2, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface FamilyClientProps {
  group: FamilyGroup
  members: FamilyMember[]
  cards: Card[]
  currentUserId: string
  currentMember: FamilyMember
}

type Tab = 'members' | 'cards'

export function FamilyClient({ group, members: initialMembers, cards: initialCards, currentUserId, currentMember }: FamilyClientProps) {
  const [tab, setTab] = useState<Tab>('members')
  const [members, setMembers] = useState(initialMembers)
  const [cards, setCards] = useState(initialCards)
  const [inviteUrl, setInviteUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false)
  const [cardForm, setCardForm] = useState({ name: '', type: 'credit' as CardType, last_digits: '', color: '#2D8EFF', member_id: currentMember.id })
  const [savingCard, setSavingCard] = useState(false)
  const [cardError, setCardError] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = currentMember.role === 'admin'

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

  async function saveCard() {
    if (!cardForm.name.trim()) return
    setSavingCard(true)
    setCardError('')

    const { data, error } = await supabase
      .from('cards')
      .insert({
        family_id: group.id,
        member_id: cardForm.member_id,
        name: cardForm.name.trim(),
        type: cardForm.type,
        last_digits: cardForm.last_digits || null,
        color: cardForm.color,
      })
      .select()
      .single()

    if (error) { setCardError('Erro ao salvar cartão.'); setSavingCard(false); return }
    setCards((c) => [...c, data as Card])
    setShowCardForm(false)
    setCardForm({ name: '', type: 'credit', last_digits: '', color: '#2D8EFF', member_id: currentMember.id })
    setSavingCard(false)
    router.refresh()
  }

  async function deleteCard(cardId: string) {
    if (!confirm('Excluir este cartão?')) return
    await supabase.from('cards').delete().eq('id', cardId)
    setCards((c) => c.filter((x) => x.id !== cardId))
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
        {([['members', 'Membros', Users], ['cards', 'Cartões', CreditCard]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <Icon className="h-4 w-4" />
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
                    {m.role === 'admin' && (
                      <Crown className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    {m.user_id === currentUserId && (
                      <span className="text-xs text-gray-400">(você)</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{m.role === 'admin' ? 'Administrador' : 'Membro'}</p>
                </div>
                {isAdmin && m.user_id !== currentUserId && (
                  <button
                    onClick={() => removeMember(m.id)}
                    className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards tab */}
      {tab === 'cards' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCardForm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold"
              style={{ background: 'var(--brand-gradient)' }}
            >
              <Plus className="h-4 w-4" />
              Novo cartão
            </button>
          </div>

          {showCardForm && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-800">Novo cartão</p>
                <button onClick={() => setShowCardForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {cardError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                  {cardError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Nome do cartão</Label>
                  <Input
                    placeholder="Ex: Nubank Mylena"
                    value={cardForm.name}
                    onChange={(e) => setCardForm((f) => ({ ...f, name: e.target.value }))}
                    className="h-10 rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Tipo</Label>
                  <Select value={cardForm.type} onValueChange={(v) => setCardForm((f) => ({ ...f, type: v as CardType }))}>
                    <SelectTrigger className="h-10 rounded-xl border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {Object.entries(CARD_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Últimos 4 dígitos</Label>
                  <Input
                    placeholder="0000"
                    maxLength={4}
                    value={cardForm.last_digits}
                    onChange={(e) => setCardForm((f) => ({ ...f, last_digits: e.target.value.replace(/\D/g, '') }))}
                    className="h-10 rounded-xl border-gray-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Membro</Label>
                  <Select value={cardForm.member_id} onValueChange={(v) => setCardForm((f) => ({ ...f, member_id: v ?? '' }))}>
                    <SelectTrigger className="h-10 rounded-xl border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.display_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Cor</Label>
                  <div className="flex gap-2 flex-wrap">
                    {MEMBER_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCardForm((f) => ({ ...f, color: c }))}
                        className={cn('w-7 h-7 rounded-full border-2 transition-transform', cardForm.color === c ? 'border-gray-800 scale-110' : 'border-transparent')}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button onClick={() => setShowCardForm(false)} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  onClick={saveCard}
                  disabled={savingCard || !cardForm.name.trim()}
                  className="flex-1 h-10 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                  style={{ background: 'var(--brand-gradient)' }}
                >
                  {savingCard ? 'Salvando...' : 'Salvar cartão'}
                </button>
              </div>
            </div>
          )}

          {cards.length === 0 && !showCardForm ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-gray-800 font-semibold">Nenhum cartão cadastrado</p>
              <p className="text-gray-400 text-sm mt-1">Adicione os cartões dos membros do grupo</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {cards.map((card, i) => {
                const owner = members.find((m) => m.id === card.member_id)
                return (
                  <div key={card.id} className={`flex items-center gap-4 px-5 py-4 ${i !== cards.length - 1 ? 'border-b border-gray-50' : ''}`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: card.color }}>
                      <CreditCard className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {card.name}
                        {card.last_digits && <span className="text-gray-400 font-normal"> •••• {card.last_digits}</span>}
                      </p>
                      <p className="text-xs text-gray-400">
                        {CARD_TYPE_LABELS[card.type]} · {owner?.display_name ?? '—'}
                      </p>
                    </div>
                    <button onClick={() => deleteCard(card.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
