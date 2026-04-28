'use client'

import { useState } from 'react'
import type React from 'react'

interface CheckoutButtonProps {
  plan: 'pro' | 'family'
  label: string
  className?: string
  style?: React.CSSProperties
}

export function CheckoutButton({ plan, label, className, style }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? `Erro ${res.status}`)
        console.error('Checkout error:', res.status, data)
      }
    } catch (err) {
      setError('Erro de conexão')
      console.error('Checkout fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      <button
        onClick={handleClick}
        disabled={loading}
        className={className}
        style={style}
      >
        {loading ? 'Aguarde...' : label}
      </button>
      {error && (
        <p className="mt-2 text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  )
}
