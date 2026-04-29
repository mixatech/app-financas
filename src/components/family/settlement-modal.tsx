'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MemberBalance } from '@/lib/balances'

interface SettlementModalProps {
  balance: MemberBalance
  myMemberId: string
  familyId: string
  open: boolean
  onClose: () => void
  onSettled: () => void
}

export function SettlementModal({ balance, myMemberId, familyId, open, onClose, onSettled }: SettlementModalProps) {
  const supabase = createClient()
  const [amount, setAmount] = useState(String(Math.abs(balance.amount).toFixed(2)))
  const [note, setNote]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const fromId = balance.amount > 0 ? balance.memberId : myMemberId
  const toId   = balance.amount > 0 ? myMemberId : balance.memberId

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const amt = parseFloat(amount.replace(',', '.'))
    if (isNaN(amt) || amt <= 0) { setError('Informe um valor válido.'); setLoading(false); return }
    const { error: dbError } = await supabase.from('settlements').insert({
      family_id: familyId, from_member_id: fromId, to_member_id: toId,
      amount: amt, note: note.trim() || null,
    })
    if (dbError) { setError('Erro ao registrar liquidação.'); setLoading(false); return }
    setLoading(false); onClose(); onSettled()
  }

  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">Registrar quitação</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500">
          {balance.amount > 0 ? `${balance.memberName} pagará a você` : `Você pagará a ${balance.memberName}`}
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Valor (R$)</Label>
            <Input type="number" step="0.01" min="0.01" value={amount}
              onChange={e => setAmount(e.target.value)} className="h-11 rounded-xl border-gray-200" required />
            <p className="text-xs text-gray-400">Saldo total: {fmt(Math.abs(balance.amount))}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Nota (opcional)</Label>
            <Input placeholder='"Pix de quinta"' value={note} onChange={e => setNote(e.target.value)}
              className="h-11 rounded-xl border-gray-200" />
          </div>
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 h-11 rounded-xl bg-[#7B2FBE] hover:bg-[#6B28A8] text-white text-sm font-semibold disabled:opacity-60">
              {loading ? 'Salvando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
