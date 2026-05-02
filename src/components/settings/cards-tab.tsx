'use client'

import { useState, useTransition } from 'react'
import { Card, FamilyMember, CardType, CARD_TYPE_LABELS, BANKS } from '@/types'
import { createCard, deleteCard } from '@/app/(app)/settings/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard, Trash2, Plus } from 'lucide-react'

const CARD_COLORS = ['#7B2FBE','#2D8EFF','#f97316','#10b981','#f43f5e','#eab308','#1e293b','#6366f1']

export function CardsTab({ familyId, cards, members }: { familyId: string; cards: Card[]; members: FamilyMember[] }) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({
    name: '', type: 'credit' as CardType, last_digits: '',
    color: '#7B2FBE', bank: '', member_id: members[0]?.id ?? '',
  })
  const [error, setError] = useState('')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setError('')
    startTransition(async () => {
      const res = await createCard(familyId, {
        ...form,
        last_digits: form.last_digits || null,
        bank: form.bank || null,
      })
      if (res.error) setError(res.error)
      else setForm(f => ({ ...f, name: '', last_digits: '' }))
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Cartões do grupo</h2>
        <p className="text-sm text-gray-400 mt-1">Cartões usados para registrar transações.</p>
      </div>

      <div className="space-y-2">
        {cards.length === 0
          ? <p className="text-sm text-gray-400 py-4 text-center">Nenhum cartão cadastrado.</p>
          : cards.map(c => {
            const owner = members.find(m => m.id === c.member_id)
            return (
              <div key={c.id} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: c.color }}>
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">
                    {c.name}{c.last_digits ? ` ···${c.last_digits}` : ''}
                  </p>
                  <p className="text-xs text-gray-400">
                    {CARD_TYPE_LABELS[c.type]}{c.bank ? ` · ${c.bank}` : ''}{owner ? ` · ${owner.display_name}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => startTransition(() => { deleteCard(c.id); })}
                  disabled={isPending}
                  className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
      </div>

      <form onSubmit={handleCreate} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-700">Novo cartão</h3>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Nome</Label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({...f, name: e.target.value}))}
              placeholder="Ex: Nubank roxo"
              className="h-9 rounded-xl border-gray-200"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Últimos 4 dígitos</Label>
            <Input
              value={form.last_digits}
              onChange={e => setForm(f => ({...f, last_digits: e.target.value.slice(0, 4)}))}
              placeholder="0000"
              maxLength={4}
              className="h-9 rounded-xl border-gray-200"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Tipo</Label>
            <Select value={form.type} onValueChange={v => setForm(f => ({...f, type: v as CardType}))}>
              <SelectTrigger className="h-9 rounded-xl border-gray-200">
                <SelectValue>{CARD_TYPE_LABELS[form.type]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(CARD_TYPE_LABELS) as [CardType, string][]).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Banco</Label>
            <Select value={form.bank} onValueChange={(v) => setForm(f => ({...f, bank: v ?? ''}))}>
              <SelectTrigger className="h-9 rounded-xl border-gray-200">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent>
                {BANKS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        {members.length > 1 && (
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Dono</Label>
            <Select value={form.member_id} onValueChange={(v) => setForm(f => ({...f, member_id: v ?? ''}))}>
              <SelectTrigger className="h-9 rounded-xl border-gray-200">
                <SelectValue>{members.find(m => m.id === form.member_id)?.display_name ?? 'Selecionar'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {members.map(m => <SelectItem key={m.id} value={m.id}>{m.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs text-gray-600">Cor</Label>
          <div className="flex gap-2 flex-wrap">
            {CARD_COLORS.map(c => (
              <button
                key={c} type="button"
                onClick={() => setForm(f => ({...f, color: c}))}
                className={`w-6 h-6 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending || !form.name.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7B2FBE] hover:bg-[#6B28A8] text-white text-sm font-semibold disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />{isPending ? 'Salvando...' : 'Adicionar'}
        </button>
      </form>
    </div>
  )
}
