'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InviteAcceptProps {
  token: string
  groupName: string
  userEmail: string
}

export function InviteAccept({ token, groupName, userEmail }: InviteAcceptProps) {
  const [displayName, setDisplayName] = useState(userEmail.split('@')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleJoin() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/family/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, display_name: displayName }),
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Erro ao entrar no grupo.')
      setLoading(false)
      return
    }

    router.push('/family')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 p-8 space-y-6">
        <div className="flex justify-center">
          <div className="p-3 rounded-2xl" style={{ background: 'var(--brand-gradient)' }}>
            <Users className="h-7 w-7 text-white" />
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900">Você foi convidado!</h1>
          <p className="text-gray-500 mt-1">
            Para entrar no grupo <span className="font-semibold text-gray-800">{groupName}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-gray-700">Como você quer ser chamado?</Label>
          <Input
            placeholder="Seu nome no grupo"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-11 rounded-xl border-gray-200"
          />
        </div>

        <button
          onClick={handleJoin}
          disabled={loading || !displayName.trim()}
          className="w-full h-11 rounded-xl text-white font-semibold disabled:opacity-60"
          style={{ background: 'var(--brand-gradient)' }}
        >
          {loading ? 'Entrando...' : `Entrar em ${groupName}`}
        </button>
      </div>
    </div>
  )
}
