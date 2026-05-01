'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface MonthPickerProps {
  value: string
}

export function MonthPicker({ value }: MonthPickerProps) {
  const router = useRouter()
  const params = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = new URLSearchParams(params.toString())
    next.set('month', e.target.value)
    router.push(`/dashboard?${next.toString()}`)
  }

  return (
    <input
      type="month"
      defaultValue={value}
      onChange={handleChange}
      className="rounded-xl px-3 py-2 text-sm text-gray-600 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:border-transparent"
      style={{ '--tw-ring-color': '#7B2FBE' } as React.CSSProperties}
    />
  )
}
