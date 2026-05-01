'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

interface AppShellProps {
  email: string
  planBadge?: React.ReactNode
  children: React.ReactNode
}

export function AppShell({ email, planBadge, children }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div
      className="flex min-h-screen"
      style={{
        background: '#F8F5FF',
        backgroundImage: `
          radial-gradient(ellipse 60% 40% at 15% 8%, rgba(123,47,190,0.10) 0%, transparent 60%),
          radial-gradient(ellipse 50% 35% at 85% 85%, rgba(45,142,255,0.07) 0%, transparent 55%)
        `,
      }}
    >
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <Sidebar
        email={email}
        planBadge={planBadge}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col md:ml-60 min-w-0">
        <Topbar onMobileMenuToggle={() => setMobileOpen(o => !o)} />
        <main className="flex-1 p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
