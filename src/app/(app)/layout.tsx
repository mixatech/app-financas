import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { PlanBadge } from '@/components/billing/plan-badge'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar email={user.email ?? ''} planBadge={<PlanBadge userId={user.id} />} />
      <main className="max-w-7xl mx-auto px-6 py-10">
        {children}
      </main>
    </div>
  )
}
