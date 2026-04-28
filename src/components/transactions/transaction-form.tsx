'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Transaction,
  TransactionFormData,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  FamilyMember,
  Card,
} from '@/types'
import { Plus, Pencil } from 'lucide-react'

interface TransactionFormProps {
  transaction?: Transaction
  onSuccess?: () => void
  familyMembers?: FamilyMember[]
  cards?: Card[]
  currentUserMemberId?: string
}

const defaultForm: TransactionFormData = {
  type: 'expense',
  amount: '',
  description: '',
  category: 'food',
  date: new Date().toISOString().split('T')[0],
}

export function TransactionForm({
  transaction,
  onSuccess,
  familyMembers = [],
  cards = [],
  currentUserMemberId,
}: TransactionFormProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<TransactionFormData>(
    transaction
      ? {
          type: transaction.type,
          amount: String(transaction.amount),
          description: transaction.description,
          category: transaction.category,
          date: transaction.date,
        }
      : defaultForm
  )
  const [paidBy, setPaidBy] = useState<string>(
    transaction?.paid_by_member_id ?? currentUserMemberId ?? ''
  )
  const [spentBy, setSpentBy] = useState<string>(
    transaction?.spent_by_member_id ?? currentUserMemberId ?? ''
  )
  const [cardId, setCardId] = useState<string>(transaction?.card_id ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const hasFamily = familyMembers.length > 0
  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  // Detecta se categoria salva não está na lista (ex: ao editar transação antiga com categoria custom)
  useEffect(() => {
    const known = categories.some((c) => c.value === form.category)
    if (!known && form.category) {
      setIsCustom(true)
      setCustomCategory(form.category)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleTypeChange(type: 'income' | 'expense') {
    const firstCategory = type === 'income' ? 'salary' : 'food'
    setIsCustom(false)
    setCustomCategory('')
    setForm((f) => ({ ...f, type, category: firstCategory }))
  }

  function handleCategoryChange(value: string | null) {
    if (!value) return
    if (value === '__custom__') {
      setIsCustom(true)
      setForm((f) => ({ ...f, category: customCategory }))
    } else {
      setIsCustom(false)
      setForm((f) => ({ ...f, category: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const amount = parseFloat(form.amount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) {
      setError('Informe um valor válido.')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Usuário não autenticado.'); setLoading(false); return }

    const payload: Record<string, unknown> = {
      type: form.type,
      amount,
      description: form.description,
      category: form.category,
      date: form.date,
      user_id: user.id,
    }

    if (hasFamily) {
      if (paidBy) payload.paid_by_member_id = paidBy
      if (spentBy) payload.spent_by_member_id = spentBy
      if (cardId) payload.card_id = cardId
    }

    let dbError
    if (transaction) {
      ;({ error: dbError } = await supabase.from('transactions').update(payload).eq('id', transaction.id))
    } else {
      ;({ error: dbError } = await supabase.from('transactions').insert(payload))
    }

    if (dbError) {
      setError('Erro ao salvar transação. Tente novamente.')
      setLoading(false)
      return
    }

    setOpen(false)
    setForm(defaultForm)
    onSuccess?.()
    router.refresh()
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          transaction ? (
            <button className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-lg transition-colors">
              <Pencil className="h-3 w-3" />
              Editar
            </button>
          ) : (
            <button
              className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
              style={{ background: 'var(--brand-gradient)' }}
            >
              <Plus className="h-4 w-4" />
              Nova transação
            </button>
          )
        }
      />
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">
            {transaction ? 'Editar transação' : 'Nova transação'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-1">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
            {(['expense', 'income'] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`py-2 px-4 rounded-lg text-sm font-semibold transition-all ${
                  form.type === type
                    ? type === 'income'
                      ? 'bg-white text-[#7B2FBE] shadow-sm'
                      : 'bg-white text-red-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {type === 'income' ? 'Receita' : 'Despesa'}
              </button>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              className="h-11 rounded-xl border-gray-200"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Descrição</Label>
            <Input
              placeholder="Ex: Supermercado, Salário..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="h-11 rounded-xl border-gray-200"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Categoria</Label>
            <Select
              value={isCustom ? '__custom__' : form.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="h-11 rounded-xl border-gray-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">+ Personalizada...</SelectItem>
              </SelectContent>
            </Select>
            {isCustom && (
              <Input
                placeholder="Nome da categoria"
                value={customCategory}
                onChange={(e) => {
                  setCustomCategory(e.target.value)
                  setForm((f) => ({ ...f, category: e.target.value }))
                }}
                className="h-11 rounded-xl border-gray-200 mt-2"
                autoFocus
              />
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">Data</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="h-11 rounded-xl border-gray-200"
              required
            />
          </div>

          {/* Family fields */}
          {hasFamily && (
            <>
              {form.type === 'expense' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Pago por</Label>
                    <Select value={paidBy} onValueChange={(v) => setPaidBy(v ?? '')}>
                      <SelectTrigger className="h-11 rounded-xl border-gray-200">
                        <SelectValue placeholder="Quem pagou?" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {familyMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.display_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-gray-700">Gasto de</Label>
                    <Select value={spentBy} onValueChange={(v) => setSpentBy(v ?? '')}>
                      <SelectTrigger className="h-11 rounded-xl border-gray-200">
                        <SelectValue placeholder="Para quem?" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {familyMembers.map((m) => (
                          <SelectItem key={m.id} value={m.id}>{m.display_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {cards.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-gray-700">Cartão (opcional)</Label>
                  <Select value={cardId} onValueChange={(v) => setCardId(v ?? '')}>
                    <SelectTrigger className="h-11 rounded-xl border-gray-200">
                      <SelectValue placeholder="Selecionar cartão..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="">Nenhum</SelectItem>
                      {cards.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}{c.last_digits ? ` ···${c.last_digits}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 rounded-xl text-white text-sm font-semibold transition-opacity disabled:opacity-60"
              style={{ background: 'var(--brand-gradient)' }}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
