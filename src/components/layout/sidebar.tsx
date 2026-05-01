'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, List, Users, BarChart2, Settings, LogOut, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const links = [
  { href: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações',    icon: List },
  { href: '/family',       label: 'Família',       icon: Users },
  { href: '/analytics',   label: 'Análises',      icon: BarChart2 },
  { href: '/settings',    label: 'Configurações', icon: Settings },
]

interface SidebarProps {
  email: string
  planBadge?: React.ReactNode
  mobileOpen: boolean
  onMobileClose: () => void
}

export function Sidebar({ email, planBadge, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-60 flex flex-col transition-transform duration-300',
        'md:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}
      style={{ background: 'linear-gradient(195deg, #1b1040 0%, #0d0820 100%)' }}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-6 pt-8 pb-6">
        <Link href="/dashboard">
          <Image src="/logo-escrita-branco.png" alt="Finxa" height={28} width={90} unoptimized />
        </Link>
        <button
          onClick={onMobileClose}
          className="md:hidden text-white/40 hover:text-white/80 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-4 h-px bg-white/10 mb-4" />

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                active
                  ? 'text-white bg-white/10'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              )}
            >
              <span
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0 transition-all duration-150',
                  active ? 'shadow-md shadow-violet-900/40' : 'opacity-50'
                )}
                style={{
                  background: active
                    ? 'linear-gradient(135deg, #7B2FBE 0%, #2D8EFF 100%)'
                    : 'rgba(255,255,255,0.08)',
                }}
              >
                <Icon className="h-4 w-4 text-white" />
              </span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-6 mt-4">
        <div className="mx-1 h-px bg-white/10 mb-4" />
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7B2FBE 0%, #2D8EFF 100%)' }}
            >
              {email.charAt(0).toUpperCase()}
            </div>
            <p className="text-xs text-white/50 truncate min-w-0">{email}</p>
          </div>
          {planBadge && <div>{planBadge}</div>}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors w-full"
          >
            <LogOut className="h-3.5 w-3.5 flex-shrink-0" />
            Sair da conta
          </button>
        </div>
      </div>
    </aside>
  )
}
