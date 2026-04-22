import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FamilyClient } from './family-client'
import { FamilyGroup, FamilyMember, Card } from '@/types'

export default async function FamilyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Buscar membro do usuário
  const { data: myMember } = await supabase
    .from('family_members')
    .select('*, family_groups(*)')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!myMember) redirect('/onboarding')

  const group = myMember.family_groups as FamilyGroup

  // Buscar todos os membros + cartões do grupo em paralelo
  const [{ data: members }, { data: cards }] = await Promise.all([
    supabase
      .from('family_members')
      .select('*')
      .eq('family_id', group.id)
      .order('created_at'),
    supabase
      .from('cards')
      .select('*')
      .eq('family_id', group.id)
      .order('created_at'),
  ])

  return (
    <FamilyClient
      group={group}
      members={(members ?? []) as FamilyMember[]}
      cards={(cards ?? []) as Card[]}
      currentUserId={user.id}
      currentMember={myMember as FamilyMember}
    />
  )
}
