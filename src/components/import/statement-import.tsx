'use client'

import { useState, useRef } from 'react'
import { Upload, FileText } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Card, CardType, CARD_TYPE_LABELS } from '@/types'
import { ImportPreviewTable } from './import-preview-table'

interface ParsedTransaction {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  include: boolean
}

interface StatementImportProps {
  cards: Card[]
  userId: string
  familyId?: string | null
}

export function StatementImport({ cards, userId, familyId }: StatementImportProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedCardId, setSelectedCardId] = useState('')
  const [fileType, setFileType] = useState<'csv' | 'pdf'>('csv')
  const [processing, setProcessing] = useState(false)
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([])
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function resetState() {
    setStep(1)
    setSelectedCardId('')
    setFileType('csv')
    setTransactions([])
    setError('')
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setProcessing(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('fileType', fileType)

    const res = await fetch('/api/import-statement', { method: 'POST', body: formData })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Erro ao processar arquivo.')
      setProcessing(false)
      return
    }

    setTransactions((json.transactions as Omit<ParsedTransaction, 'include'>[]).map((t) => ({ ...t, include: true })))
    setStep(2)
    setProcessing(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetState() }}>
      <DialogTrigger
        render={
          <button className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
            <Upload className="h-4 w-4" />
            Importar extrato
          </button>
        }
      />
      <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900">
            {step === 1 ? 'Importar extrato' : `Preview — ${transactions.filter((t) => t.include).length} transações`}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-5 py-2">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Cartão / Conta de origem</Label>
              <Select value={selectedCardId} onValueChange={(v) => setSelectedCardId(v ?? '')}>
                <SelectTrigger className="h-11 rounded-xl border-gray-200">
                  <SelectValue placeholder="Selecione o cartão..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {cards.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} {c.last_digits ? `•••• ${c.last_digits}` : ''} — {CARD_TYPE_LABELS[c.type as CardType]}
                    </SelectItem>
                  ))}
                  <SelectItem value="no_card">Sem cartão</SelectItem>
                </SelectContent>
              </Select>
              {cards.length === 0 && (
                <p className="text-xs text-amber-600">Nenhum cartão cadastrado. Vá em Família → Cartões para adicionar.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Tipo de arquivo</Label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                {(['csv', 'pdf'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFileType(t)}
                    className={`py-2 rounded-lg text-sm font-semibold transition-all ${
                      fileType === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {t.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {fileType === 'csv'
                  ? 'Suporte: Nubank, Inter e CSV genérico'
                  : 'PDF de qualquer banco — analisado por IA'}
              </p>
            </div>

            <div
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-purple-300 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {processing ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                  <p className="text-sm text-gray-500">Processando arquivo...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-10 w-10 text-gray-300" />
                  <p className="text-sm font-medium text-gray-600">
                    Clique para selecionar o arquivo {fileType.toUpperCase()}
                  </p>
                  <p className="text-xs text-gray-400">ou arraste e solte aqui</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept={fileType === 'csv' ? '.csv,text/csv' : '.pdf,application/pdf'}
                className="hidden"
                onChange={handleFileUpload}
                disabled={processing}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <ImportPreviewTable
            transactions={transactions}
            onChange={setTransactions}
            cardId={selectedCardId === 'no_card' ? null : selectedCardId || null}
            userId={userId}
            familyId={familyId ?? null}
            fileType={fileType}
            onDone={() => { setOpen(false); resetState() }}
            onBack={() => setStep(1)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
