'use client'

import Link from 'next/link'
import { useSearchParams, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'categories',  label: 'Categorias', href: '/settings?tab=categories'  },
  { key: 'cards',       label: 'Cartões',    href: '/settings?tab=cards'       },
  { key: 'split',       label: 'Divisão',    href: '/settings?tab=split'       },
  { key: 'permissions', label: 'Membros',    href: '/settings?tab=permissions' },
  { key: 'account',     label: 'Conta',      href: '/settings?tab=account'     },
  { key: 'billing',     label: 'Plano',      href: '/settings/billing'         },
]

export function SettingsShell({ children, isAdmin }: { children: React.ReactNode; isAdmin: boolean }) {
  const searchParams = useSearchParams()
  const pathname     = usePathname()
  const activeTab    = pathname === '/settings/billing'
    ? 'billing'
    : (searchParams.get('tab') ?? 'categories')
  const visibleTabs  = isAdmin
    ? TABS
    : TABS.filter(t => t.key === 'account' || t.key === 'billing')

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="md:w-48 shrink-0">
        <nav className="flex md:flex-col gap-1 flex-wrap">
          {visibleTabs.map(tab => (
            <Link key={tab.key} href={tab.href}
              className={cn(
                'px-4 py-2.5 rounded-xl text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-purple-50 text-[#7B2FBE]'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}>
              {tab.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}
