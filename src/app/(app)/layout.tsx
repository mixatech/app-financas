import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/app-shell'
import { PlanBadge } from '@/components/billing/plan-badge'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <AppShell email={user.email ?? ''} planBadge={<PlanBadge userId={user.id} />}>
      {children}
    </AppShell>
  )
}
