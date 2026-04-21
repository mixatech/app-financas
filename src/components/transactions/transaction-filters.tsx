'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ALL_CATEGORIES } from '@/types'

export function TransactionFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== 'all') {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <span className="text-sm font-medium text-gray-500">Filtrar por:</span>

      <input
        type="month"
        defaultValue={searchParams.get('month') ?? ''}
        onChange={(e) => updateParam('month', e.target.value)}
        className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent h-9"
      />

      <Select
        defaultValue={searchParams.get('type') ?? 'all'}
        onValueChange={(v) => updateParam('type', v ?? 'all')}
      >
        <SelectTrigger className="w-36 h-9 rounded-xl border-gray-200 text-sm">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="income">Receitas</SelectItem>
          <SelectItem value="expense">Despesas</SelectItem>
        </SelectContent>
      </Select>

      <Select
        defaultValue={searchParams.get('category') ?? 'all'}
        onValueChange={(v) => updateParam('category', v ?? 'all')}
      >
        <SelectTrigger className="w-48 h-9 rounded-xl border-gray-200 text-sm">
          <SelectValue placeholder="Categoria" />
        </SelectTrigger>
        <SelectContent className="rounded-xl">
          <SelectItem value="all">Todas categorias</SelectItem>
          {ALL_CATEGORIES.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
