'use client'

import { useState } from 'react'
import type { Plan } from '@/types'

interface PlanCardProps {
  plan: Plan
  label: string
  price: string
  features: string[]
  currentPlan: Plan
  isPopular?: boolean
}

function getPlanRank(plan: Plan): number {
  const ranks: Record<Plan, number> = { free: 0, pro: 1, family: 2 }
  return ranks[plan]
}

export function PlanCard({
  plan,
  label,
  price,
  features,
  currentPlan,
  isPopular = false,
}: PlanCardProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCurrent = plan === currentPlan
  const isUpgrade = getPlanRank(plan) > getPlanRank(currentPlan)
  const isDowngrade = getPlanRank(plan) < getPlanRank(currentPlan)

  async function handleUpgrade() {
    if (plan === 'free') return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? `Erro ${res.status}`)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  async function handlePortal() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = (await res.json()) as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? `Erro ${res.status}`)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const borderStyle = isCurrent || isPopular
    ? { border: '2px solid #7B2FBE' }
    : { border: '2px solid transparent' }

  return (
    <div
      className="bg-white rounded-2xl p-6 flex flex-col relative"
      style={{
        boxShadow: '0 2px 16px rgba(123,47,190,0.07)',
        ...borderStyle,
      }}
    >
      {/* Badges row */}
      <div className="flex items-center gap-2 mb-1 min-h-[24px]">
        {isCurrent && (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
            style={{ backgroundColor: '#ede9fe', color: '#7B2FBE' }}
          >
            Plano atual
          </span>
        )}
        {isPopular && !isCurrent && (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: '#7B2FBE' }}
          >
            Mais popular
          </span>
        )}
      </div>

      {/* Plan name + price */}
      <h3 className="text-lg font-bold text-gray-900 mt-1">{label}</h3>
      <p className="text-2xl font-extrabold mt-1 mb-4" style={{ color: '#7B2FBE' }}>
        {price}
      </p>

      {/* Feature list */}
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-gray-600">
            <svg
              className="mt-0.5 shrink-0"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="8" cy="8" r="8" fill="#ede9fe" />
              <path
                d="M5 8l2 2 4-4"
                stroke="#7B2FBE"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {/* Action button */}
      {isCurrent ? (
        <div
          className="w-full h-10 rounded-xl flex items-center justify-center text-sm font-semibold"
          style={{ backgroundColor: '#f3f4f6', color: '#6b7280' }}
        >
          Plano atual
        </div>
      ) : isUpgrade && plan !== 'free' ? (
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full h-10 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: '#7B2FBE' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Aguarde...
            </span>
          ) : (
            'Fazer upgrade'
          )}
        </button>
      ) : isDowngrade ? (
        <button
          onClick={handlePortal}
          disabled={loading}
          className="w-full h-10 rounded-xl text-sm font-semibold transition-colors hover:bg-gray-50 disabled:opacity-60"
          style={{ border: '1.5px solid #e5e7eb', color: '#374151', backgroundColor: 'white' }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Aguarde...
            </span>
          ) : (
            'Gerenciar assinatura'
          )}
        </button>
      ) : null}

      {error && (
        <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  )
}
