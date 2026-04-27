'use client'

import { useState } from 'react'

interface CheckoutButtonProps {
  plan: 'pro' | 'family'
  label: string
  className?: string
}

export function CheckoutButton({ plan, label, className }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? 'Aguarde...' : label}
    </button>
  )
}
