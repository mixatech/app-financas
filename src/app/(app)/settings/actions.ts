'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { CardType } from '@/types'

export async function createCustomCategory(familyId: string, data: {
  name: string; type: 'income' | 'expense'; color: string; emoji: string
}) {
  const { error } = await createAdminClient().from('custom_categories').insert({ family_id: familyId, ...data })
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function deleteCustomCategory(id: string) {
  const { error } = await createAdminClient().from('custom_categories').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function upsertSplitRatio(familyId: string, memberAId: string, memberBId: string, ratioA: number) {
  const ratioB = Math.round((1 - ratioA) * 10000) / 10000
  const { error } = await createAdminClient().from('member_split_ratios').upsert({
    family_id: familyId, member_a_id: memberAId, member_b_id: memberBId,
    ratio_a: ratioA, ratio_b: ratioB, updated_at: new Date().toISOString(),
  }, { onConflict: 'family_id,member_a_id,member_b_id' })
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function updateMemberVisibility(memberId: string, scope: 'own' | 'couple' | 'family' | 'all') {
  const { error } = await createAdminClient().from('family_members').update({ visibility_scope: scope }).eq('id', memberId)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function updateDisplayName(newName: string, memberId: string) {
  const supabase = await createClient()
  const { error: authError } = await supabase.auth.updateUser({ data: { full_name: newName } })
  if (authError) return { error: authError.message }
  const { error: memberError } = await createAdminClient().from('family_members').update({ display_name: newName }).eq('id', memberId)
  if (memberError) return { error: memberError.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function createCard(familyId: string, data: {
  name: string; type: CardType; last_digits: string | null; color: string; bank: string | null; member_id: string
}) {
  const { error } = await createAdminClient().from('cards').insert({ family_id: familyId, ...data })
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}

export async function deleteCard(id: string) {
  const { error } = await createAdminClient().from('cards').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}
