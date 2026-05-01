'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send, Bot, CheckCircle2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, Category, FamilyMember } from '@/types'
import { UpgradeModal } from '@/components/billing/upgrade-modal'

interface ParsedTransaction {
  type: 'income' | 'expense'
  amount: number
  description: string
  category: string
  date: string
  confidence: number
}

interface TransactionChatProps {
  onClose: () => void
}

type Scope = 'personal' | 'couple' | 'family' | 'for_member'

export function TransactionChat({ onClose }: TransactionChatProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [parsed, setParsed] = useState<ParsedTransaction | null>(null)
  const [edited, setEdited] = useState<ParsedTransaction | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeReason, setUpgradeReason] = useState<'upgrade_required' | 'limit_reached'>('upgrade_required')

  const [familyId, setFamilyId] = useState<string | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [currentUserMemberId, setCurrentUserMemberId] = useState<string | null>(null)
  const [scope, setScope] = useState<Scope>('personal')
  const [scopeTargetMemberId, setScopeTargetMemberId] = useState<string>('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadFamily() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: member } = await supabase
        .from('family_members').select('id, family_id').eq('user_id', user.id).maybeSingle()
      if (!member?.family_id) return
      setFamilyId(member.family_id)
      setCurrentUserMemberId(member.id)
      const { data: members } = await supabase
        .from('family_members').select('*').eq('family_id', member.family_id)
      setFamilyMembers((members ?? []) as FamilyMember[])
    }
    loadFamily()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const hasFamily = familyMembers.length > 0

  async function handleParse() {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    setParsed(null)
    setEdited(null)

    const res = await fetch('/api/parse-transaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })

    if (res.status === 402) {
      const data = await res.json()
      setUpgradeReason(data.error as 'upgrade_required' | 'limit_reached')
      setShowUpgradeModal(true)
      setLoading(false)
      return
    }

    const json = await res.json()

    if (res.status === 503) {
      setError('Chat IA não está configurado. Adicione ANTHROPIC_API_KEY no .env.local.')
      setLoading(false)
      return
    }

    if (!res.ok) {
      setError(json.error ?? 'Erro ao interpretar.')
      setLoading(false)
      return
    }

    setParsed(json.transaction)
    setEdited(json.transaction)
    setLoading(false)
  }

  async function handleSave() {
    if (!edited) return
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Não autenticado.'); setSaving(false); return }

    const payload: Record<string, unknown> = {
      user_id: user.id,
      type: edited.type,
      amount: edited.amount,
      description: edited.description,
      category: edited.category,
      date: edited.date,
      source: 'chat_ai',
    }

    if (hasFamily && familyId) {
      payload.family_id = familyId
      payload.scope = scope
      if (currentUserMemberId) payload.paid_by_member_id = currentUserMemberId
      const spentBy = scope === 'for_member' && scopeTargetMemberId
        ? scopeTargetMemberId
        : currentUserMemberId
      if (spentBy) payload.spent_by_member_id = spentBy
      if (scope === 'for_member' && scopeTargetMemberId) {
        payload.beneficiary_id = scopeTargetMemberId
      }
    }

    const result = await supabase.from('transactions').insert(payload)
    if (result.error) { setError('Erro ao salvar.'); setSaving(false); return }

    setSaved(true)
    router.refresh()
    setTimeout(onClose, 1200)
  }

  const categories = edited?.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="flex flex-col h-full">
      {/* Header — sem X próprio, o DialogContent já tem */}
      <div className="flex items-center gap-2 p-4 border-b border-gray-100">
        <div className="p-1.5 rounded-lg" style={{ background: 'var(--brand-gradient)' }}>
          <Bot className="h-4 w-4 text-white" />
        </div>
        <span className="font-semibold text-gray-800 text-sm">Registrar com IA</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Erro antes de ter dados (parse falhou) */}
        {error && !edited && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">{error}</div>
        )}

        {/* Instrução */}
        {!parsed && (
          <div className="bg-purple-50 rounded-2xl p-4 text-sm text-gray-600">
            <p className="font-medium text-gray-800 mb-1">Descreva sua transação em linguagem natural</p>
            <p className="text-gray-500 text-xs">Ex: <em>&quot;Gastei 80 reais no mercado hoje&quot;</em> ou <em>&quot;Recebi meu salário de 3000&quot;</em></p>
          </div>
        )}

        {/* Mensagem do usuário */}
        {text && parsed && (
          <div className="flex justify-end">
            <div className="bg-gray-100 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-xs">
              <p className="text-sm text-gray-800">{text}</p>
            </div>
          </div>
        )}

        {/* Card de confirmação */}
        {edited && !saved && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="h-4 w-4 text-[#7B2FBE]" />
              <span className="text-xs font-medium text-gray-500">
                {parsed!.confidence >= 0.8 ? 'Entendi! Confirme os dados:' : 'Fiz uma sugestão — revise antes de salvar:'}
              </span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">{error}</div>
            )}

            {/* Tipo */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setEdited((e) => e ? { ...e, type: t, category: t === 'income' ? 'salary' : 'food' } : e)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    edited.type === t
                      ? t === 'income' ? 'bg-white text-[#7B2FBE] shadow-sm' : 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-500'
                  }`}
                >
                  {t === 'income' ? 'Receita' : 'Despesa'}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Valor (R$)</Label>
              <Input
                type="number"
                step="0.01"
                value={edited.amount}
                onChange={(e) => setEdited((ed) => ed ? { ...ed, amount: parseFloat(e.target.value) || 0 } : ed)}
                className="h-9 rounded-xl border-gray-200 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-gray-500">Descrição</Label>
              <Input
                value={edited.description}
                onChange={(e) => setEdited((ed) => ed ? { ...ed, description: e.target.value } : ed)}
                className="h-9 rounded-xl border-gray-200 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Categoria</Label>
                <Select
                  value={edited.category}
                  onValueChange={(v) => setEdited((ed) => ed ? { ...ed, category: v as Category } : ed)}
                >
                  <SelectTrigger className="h-9 rounded-xl border-gray-200 text-xs">
                    <SelectValue>
                      {categories.find(c => c.value === edited.category)?.label ?? edited.category}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categories.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Data</Label>
                <Input
                  type="date"
                  value={edited.date}
                  onChange={(e) => setEdited((ed) => ed ? { ...ed, date: e.target.value } : ed)}
                  className="h-9 rounded-xl border-gray-200 text-xs"
                />
              </div>
            </div>

            {/* Para quem é? — só aparece se o usuário tem família */}
            {hasFamily && (
              <div className="space-y-2">
                <Label className="text-xs text-gray-500">Para quem é?</Label>
                <div className="grid grid-cols-2 gap-1.5">
                  {([
                    { value: 'personal',   label: 'Só minha'    },
                    { value: 'couple',     label: 'Casal'       },
                    { value: 'family',     label: 'Família'     },
                    { value: 'for_member', label: 'Para alguém' },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setScope(opt.value)}
                      className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        scope === opt.value
                          ? 'bg-[#7B2FBE] text-white border-[#7B2FBE]'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {(scope === 'couple' || scope === 'for_member') && (
                  <Select value={scopeTargetMemberId} onValueChange={v => setScopeTargetMemberId(v ?? '')}>
                    <SelectTrigger className="h-9 rounded-xl border-gray-200 text-xs">
                      <SelectValue>
                        {familyMembers.find(m => m.id === scopeTargetMemberId)?.display_name
                          ?? (scope === 'couple' ? 'Dividir com...' : 'Para quem...')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {familyMembers
                        .filter(m => m.id !== currentUserMemberId)
                        .map(m => (
                          <SelectItem key={m.id} value={m.id} className="text-xs">{m.display_name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setParsed(null); setEdited(null); setText(''); setScope('personal'); setScopeTargetMemberId('') }}
                className="flex-1 h-9 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-9 rounded-xl text-white text-xs font-semibold disabled:opacity-60"
                style={{ background: 'var(--brand-gradient)' }}
              >
                {saving ? 'Salvando...' : 'Confirmar e Salvar'}
              </button>
            </div>
          </div>
        )}

        {/* Sucesso */}
        {saved && (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-[#7B2FBE]" />
            <p className="font-semibold text-gray-800">Transação salva!</p>
          </div>
        )}
      </div>

      {/* Input */}
      {!parsed && (
        <div className="p-4 border-t border-gray-100">
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Gastei 50 reais no Uber hoje..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !loading && handleParse()}
              className="rounded-xl border-gray-200 text-sm"
              disabled={loading}
            />
            <button
              onClick={handleParse}
              disabled={loading || !text.trim()}
              className="px-3 py-2 rounded-xl text-white disabled:opacity-60 shrink-0"
              style={{ background: 'var(--brand-gradient)' }}
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}

      <UpgradeModal
        open={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        reason={upgradeReason}
        feature="ai_chat"
      />
    </div>
  )
}
