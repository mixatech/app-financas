'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function FamilyToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get('view') ?? 'personal'

  function toggle(v: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', v)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
      {(['personal', 'family'] as const).map((v) => (
        <button
          key={v}
          onClick={() => toggle(v)}
          className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            view === v ? 'bg-white shadow-sm text-[#7B2FBE]' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {v === 'personal' ? 'Meu resumo' : 'Família'}
        </button>
      ))}
    </div>
  )
}
