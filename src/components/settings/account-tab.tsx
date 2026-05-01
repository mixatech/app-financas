'use client'

import { useState, useTransition } from 'react'
import { updateDisplayName } from '@/app/(app)/settings/actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AccountTab({ displayName, memberId }: { displayName: string; memberId: string }) {
  const [name, setName] = useState(displayName)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError('')
    startTransition(async () => {
      const res = await updateDisplayName(name.trim(), memberId)
      if (res.error) setError(res.error)
      else { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Minha conta</h2>
        <p className="text-sm text-gray-400 mt-1">Atualize suas informações pessoais.</p>
      </div>
      <form onSubmit={handleSave} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 max-w-md">
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="space-y-1.5">
          <Label className="text-xs text-gray-600">Nome de exibição</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            className="h-10 rounded-xl border-gray-200"
          />
        </div>
        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="px-4 py-2 rounded-xl bg-[#7B2FBE] hover:bg-[#6B28A8] text-white text-sm font-semibold disabled:opacity-60"
        >
          {saved ? '✓ Salvo' : isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  )
}
