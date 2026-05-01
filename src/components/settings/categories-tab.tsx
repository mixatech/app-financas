'use client'

import { useState, useTransition } from 'react'
import { CustomCategory, INCOME_CATEGORIES, EXPENSE_CATEGORIES } from '@/types'
import { createCustomCategory, deleteCustomCategory } from '@/app/(app)/settings/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus } from 'lucide-react'

const PRESET_COLORS = ['#7B2FBE','#2D8EFF','#f97316','#10b981','#f43f5e','#eab308','#6366f1','#ec4899']
const EMOJIS = ['🛒','🍔','🚗','🏠','💊','🎓','🎬','📱','👗','💅','🐾','✈️','💻','🎁','💼','📈']

export function CategoriesTab({ familyId, customCategories }: { familyId: string; customCategories: CustomCategory[] }) {
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState({ name: '', type: 'expense' as 'income'|'expense', color: '#7B2FBE', emoji: '📦' })
  const [error, setError] = useState('')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    startTransition(async () => {
      const res = await createCustomCategory(familyId, form)
      if (res.error) setError(res.error)
      else setForm(f => ({ ...f, name: '' }))
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Categorias padrão</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].map(c => (
            <span key={c.value} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">{c.label}</span>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-gray-900">Personalizadas</h2>
        <div className="mt-3 space-y-2">
          {customCategories.map(c => (
            <div key={c.id} className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">{c.emoji}</span>
                <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                <span className="text-sm font-medium text-gray-800">{c.name}</span>
                <span className="text-xs text-gray-400">{c.type === 'income' ? 'Receita' : 'Despesa'}</span>
              </div>
              <button onClick={() => startTransition(() => deleteCustomCategory(c.id))} disabled={isPending}
                className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleCreate} className="mt-4 bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Nova categoria</h3>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Nome</Label>
              <Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))}
                placeholder="Ex: Academia" className="h-9 rounded-xl border-gray-200" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-gray-600">Tipo</Label>
              <div className="flex gap-2">
                {(['expense','income'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({...f, type: t}))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all ${form.type === t ? 'bg-[#7B2FBE] text-white border-[#7B2FBE]' : 'border-gray-200 text-gray-600'}`}>
                    {t === 'income' ? 'Receita' : 'Despesa'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Cor</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setForm(f => ({...f, color: c}))}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${form.color === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-600">Emoji</Label>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => setForm(f => ({...f, emoji: e}))}
                  className={`w-8 h-8 rounded-lg text-lg ${form.emoji === e ? 'bg-purple-100' : 'hover:bg-gray-100'}`}>{e}</button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={isPending || !form.name.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#7B2FBE] hover:bg-[#6B28A8] text-white text-sm font-semibold disabled:opacity-60">
            <Plus className="h-4 w-4" />{isPending ? 'Salvando...' : 'Adicionar'}
          </button>
        </form>
      </div>
    </div>
  )
}
