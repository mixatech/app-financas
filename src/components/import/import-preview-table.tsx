'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveImportedTransactions } from '@/app/(app)/transactions/actions'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  include: boolean
}

interface ImportPreviewTableProps {
  transactions: ParsedTransaction[]
  onChange: (t: ParsedTransaction[]) => void
  cardId: string | null
  userId: string
  familyId: string | null
  fileType: 'csv' | 'pdf'
  onDone: () => void
  onBack: () => void
}

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function ImportPreviewTable({
  transactions,
  onChange,
  cardId,
  userId,
  familyId,
  fileType,
  onDone,
  onBack,
}: ImportPreviewTableProps) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  function toggle(index: number) {
    onChange(transactions.map((t, i) => i === index ? { ...t, include: !t.include } : t))
  }

  function updateCategory(index: number, category: string) {
    onChange(transactions.map((t, i) => i === index ? { ...t, category } : t))
  }

  async function handleImport() {
    const toImport = transactions.filter((t) => t.include)
    if (toImport.length === 0) return
    setSaving(true)
    setError('')

    const payload = toImport.map((t) => ({
      type: t.type,
      amount: t.amount,
      description: t.description,
      category: t.category,
      date: t.date,
      card_id: cardId,
      family_id: familyId,
      source: fileType === 'csv' ? 'csv_import' : 'pdf_import',
    }))

    const result = await saveImportedTransactions(payload)
    if (result.error) { setError(`Erro ao importar: ${result.error}`); setSaving(false); return }

    setSaved(true)
    const firstDate = toImport[0].date.substring(0, 7) // YYYY-MM
    router.push(`/transactions?month=${firstDate}`)
    setTimeout(onDone, 1200)
  }

  const included = transactions.filter((t) => t.include)

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <CheckCircle2 className="h-12 w-12 text-[#7B2FBE]" />
        <p className="font-semibold text-gray-800 text-lg">{included.length} transações importadas!</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 overflow-hidden">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      <div className="overflow-y-auto max-h-[50vh] rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 w-8"></th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Data</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Descrição</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Valor</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Categoria</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => {
              const cats = t.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
              return (
                <tr
                  key={i}
                  className={`border-b border-gray-50 transition-colors ${t.include ? '' : 'opacity-40'}`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={t.include}
                      onChange={() => toggle(i)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-3 py-2 text-gray-600 whitespace-nowrap text-xs">
                    {format(new Date(t.date + 'T00:00:00'), 'dd/MM/yy', { locale: ptBR })}
                  </td>
                  <td className="px-3 py-2 text-gray-800 max-w-[160px] truncate">{t.description}</td>
                  <td className={`px-3 py-2 font-medium whitespace-nowrap text-xs ${t.type === 'income' ? 'text-[#7B2FBE]' : 'text-gray-800'}`}>
                    {t.type === 'income' ? '+' : '−'} {fmt(t.amount)}
                  </td>
                  <td className="px-3 py-2">
                    <Select value={t.category} onValueChange={(v) => updateCategory(i, v ?? '')}>
                      <SelectTrigger className="h-7 text-xs rounded-lg border-gray-200 w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {cats.map((c) => (
                          <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <button onClick={onBack} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
          Voltar
        </button>
        <button
          onClick={handleImport}
          disabled={saving || included.length === 0}
          className="flex-1 h-11 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
          style={{ background: 'var(--brand-gradient)' }}
        >
          {saving ? 'Importando...' : `Importar ${included.length} transações`}
        </button>
      </div>
    </div>
  )
}
