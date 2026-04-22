'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, Users, Link2, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createFamilyGroup } from './actions'

interface OnboardingFlowProps {
  userId: string
  userEmail: string
}

type Step = 'choose' | 'create' | 'join'

export function OnboardingFlow({ userEmail }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('choose')
  const [groupName, setGroupName] = useState('')
  const [displayName, setDisplayName] = useState(userEmail.split('@')[0])
  const [inviteLink, setInviteLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleCreateGroup() {
    if (!groupName.trim() || !displayName.trim()) return
    setLoading(true)
    setError('')

    const result = await createFamilyGroup(groupName, displayName)

    if (result.error) {
      console.error('[Onboarding] Erro ao criar grupo:', result.error)
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/family')
    router.refresh()
  }

  async function handleJoinByLink() {
    const token = inviteLink.split('/').pop()
    if (!token) { setError('Link inválido.'); return }
    router.push(`/family/invite/${token}`)
  }

  async function handleSkip() {
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="text-white p-2 rounded-xl" style={{ background: 'var(--brand-gradient)' }}>
            <TrendingUp className="h-5 w-5" />
          </div>
          <span className="font-bold text-gray-900 text-xl">FamilyFinance</span>
        </div>

        {step === 'choose' && (
          <div className="space-y-4">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Como você quer começar?</h1>
              <p className="text-gray-500 mt-2">Escolha uma das opções abaixo</p>
            </div>

            <button
              onClick={() => setStep('create')}
              className="w-full bg-white border border-gray-200 hover:border-purple-300 rounded-2xl p-5 flex items-start gap-4 text-left transition-all hover:shadow-sm group"
            >
              <div className="p-2.5 rounded-xl shrink-0 group-hover:scale-105 transition-transform" style={{ background: 'var(--brand-gradient)' }}>
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Criar grupo familiar</p>
                <p className="text-sm text-gray-500 mt-0.5">Você vira admin e pode convidar os membros da família</p>
              </div>
            </button>

            <button
              onClick={() => setStep('join')}
              className="w-full bg-white border border-gray-200 hover:border-blue-300 rounded-2xl p-5 flex items-start gap-4 text-left transition-all hover:shadow-sm group"
            >
              <div className="bg-blue-100 p-2.5 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
                <Link2 className="h-5 w-5 text-[#2D8EFF]" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Entrar em um grupo</p>
                <p className="text-sm text-gray-500 mt-0.5">Cole o link de convite que você recebeu</p>
              </div>
            </button>

            <button
              onClick={handleSkip}
              className="w-full bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-5 flex items-start gap-4 text-left transition-all hover:shadow-sm group"
            >
              <div className="bg-gray-100 p-2.5 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
                <User className="h-5 w-5 text-gray-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Usar individualmente</p>
                <p className="text-sm text-gray-500 mt-0.5">Pular por agora e usar o app sozinho</p>
              </div>
            </button>
          </div>
        )}

        {step === 'create' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Criar grupo familiar</h2>
              <p className="text-sm text-gray-500 mt-1">Você poderá convidar membros depois</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Nome do grupo</Label>
              <Input
                placeholder="Ex: Família Silva"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="h-11 rounded-xl border-gray-200"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Seu nome no grupo</Label>
              <Input
                placeholder="Ex: Mylena"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="h-11 rounded-xl border-gray-200"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setStep('choose'); setError('') }}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={loading || !groupName.trim() || !displayName.trim()}
                className="flex-1 h-11 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ background: 'var(--brand-gradient)' }}
              >
                {loading ? 'Criando...' : 'Criar grupo'}
              </button>
            </div>
          </div>
        )}

        {step === 'join' && (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Entrar em um grupo</h2>
              <p className="text-sm text-gray-500 mt-1">Cole o link de convite que você recebeu</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">Link de convite</Label>
              <Input
                placeholder="https://familyfinance.app/family/invite/..."
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                className="h-11 rounded-xl border-gray-200"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setStep('choose'); setError('') }}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                onClick={handleJoinByLink}
                disabled={!inviteLink.trim()}
                className="flex-1 h-11 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ background: 'var(--brand-gradient)' }}
              >
                Entrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
