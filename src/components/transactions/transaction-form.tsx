'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
} from '@/types'
import { Plus } from 'lucide-react'

interface TransactionFormProps {
  transaction?: Transaction
  onSuccess?: () => void
}

const defaultForm: TransactionFormData = {
  type: 'expense',
  amount: '',
  description: '',
  category: 'food',
  date: new Date().toISOString().split('T')[0],
}

export function TransactionForm({ transaction, onSuccess }: TransactionFormProps) {
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  function handleTypeChange(type: 'income' | 'expense') {
    const firstCategory = type === 'income' ? 'salary' : 'food'
    setForm((f) => ({ ...f, type, category: firstCategory as never }))
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

    const payload = {
      type: form.type,
      amount,
      description: form.description,
      category: form.category,
      date: form.date,
      user_id: user.id,
    }

    let error
    if (transaction) {
      ;({ error } = await supabase.from('transactions').update(payload).eq('id', transaction.id))
    } else {
      ;({ error } = await supabase.from('transactions').insert(payload))
    }

    if (error) {
      setError('Erro ao salvar transação.')
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
            <Button variant="outline" size="sm">Editar</Button>
          ) : (
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="h-4 w-4" />
              Nova transação
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? 'Editar transação' : 'Nova transação'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                form.type === 'expense'
                  ? 'bg-red-50 border-red-300 text-red-700'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Despesa
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`py-2 px-4 rounded-lg text-sm font-medium border transition-colors ${
                form.type === 'income'
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Receita
            </button>
          </div>

          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0,00"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              placeholder="Ex: Supermercado, Salário..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm((f) => ({ ...f, category: v as never }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
