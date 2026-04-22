import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingFlow } from './onboarding-flow'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Se já tem grupo, vai direto para o dashboard
  const { data: member } = await supabase
    .from('family_members')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (member) redirect('/dashboard')

  return <OnboardingFlow userId={user.id} userEmail={user.email ?? ''} />
}
