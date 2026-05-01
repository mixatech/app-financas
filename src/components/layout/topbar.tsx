'use client'

import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

const PAGE_LABELS: Record<string, string> = {
  '/dashboard':        'Dashboard',
  '/transactions':     'Transações',
  '/family':           'Família',
  '/analytics':       'Análises',
  '/settings':         'Configurações',
  '/settings/billing': 'Plano & Faturamento',
}

const SECTION_LABELS: Record<string, string> = {
  '/dashboard':    'Visão Geral',
  '/transactions': 'Finanças',
  '/family':       'Finanças',
  '/analytics':   'Finanças',
  '/settings':     'Conta',
}

interface TopbarProps {
  onMobileMenuToggle: () => void
}

export function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const pathname = usePathname()

  const title = Object.entries(PAGE_LABELS)
    .filter(([key]) => pathname === key || pathname.startsWith(key + '/'))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? 'Dashboard'

  const section = Object.entries(SECTION_LABELS)
    .filter(([key]) => pathname === key || pathname.startsWith(key + '/'))
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1] ?? 'Visão Geral'

  return (
    <header className="sticky top-0 z-40 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center px-6 gap-4">
      <button
        onClick={onMobileMenuToggle}
        className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium leading-none mb-0.5">
          Páginas &nbsp;/&nbsp; {section}
        </p>
        <h1 className="text-base font-bold text-gray-900 leading-tight truncate">{title}</h1>
      </div>
    </header>
  )
}
