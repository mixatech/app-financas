import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { FamilyClient } from './family-client'
import { FamilyGroup, FamilyMember, Card, Settlement, MemberSplitRatio } from '@/types'
import { calculateBalances } from '@/lib/balances'

export default async function FamilyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const db = createAdminClient()

  const { data: myMember } = await db
    .from('family_members').select('*, family_groups(*)')
    .eq('user_id', user.id).maybeSingle()

  if (!myMember) redirect('/onboarding')
  const group = myMember.family_groups as FamilyGroup

  const [{ data: members }, { data: cards }, { data: settlements }, { data: splitRatios }, { data: txs }] =
    await Promise.all([
      db.from('family_members').select('*').eq('family_id', group.id).order('created_at'),
      db.from('cards').select('*').eq('family_id', group.id).order('created_at'),
      db.from('settlements').select('*').eq('family_id', group.id).order('settled_at', { ascending: false }),
      db.from('member_split_ratios').select('*').eq('family_id', group.id),
      db.from('transactions').select('*').eq('family_id', group.id).in('scope', ['couple','family','for_member']),
    ])

  const allMembers = (members ?? []) as FamilyMember[]
  const balances = calculateBalances(
    myMember.id, txs ?? [],
    (settlements ?? []) as Settlement[],
    allMembers,
    (splitRatios ?? []) as MemberSplitRatio[]
  )

  return (
    <FamilyClient
      group={group}
      members={allMembers}
      cards={(cards ?? []) as Card[]}
      currentUserId={user.id}
      currentMember={myMember as FamilyMember}
      balances={balances}
      settlements={(settlements ?? []) as Settlement[]}
      splitRatios={(splitRatios ?? []) as MemberSplitRatio[]}
    />
  )
}
