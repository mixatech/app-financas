import { createAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

export function getCurrentPeriod(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export async function getOwnerUserId(
  userId: string,
  client?: SupabaseClient
): Promise<string> {
  const supabase = client ?? createAdminClient()
  const { data } = await supabase
    .from('family_members')
    .select('family_groups(created_by)')
    .eq('user_id', userId)
    .single()

  const fg = data?.family_groups as unknown as { created_by: string } | null | undefined
  if (fg && 'created_by' in fg) {
    return fg.created_by
  }
  return userId
}

export async function getUsage(ownerUserId: string, period: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('usage')
    .select('*')
    .eq('owner_user_id', ownerUserId)
    .eq('period', period)
    .single()
  return data ?? null
}

export async function incrementUsage(
  ownerUserId: string,
  period: string,
  feature: 'ai_chat' | 'pdf_import'
): Promise<void> {
  const supabase = createAdminClient()
  const rpcName = feature === 'ai_chat' ? 'increment_ai_chat' : 'increment_pdf_import'
  await supabase.rpc(rpcName, { p_owner_user_id: ownerUserId, p_period: period })
}

export async function resetUsage(ownerUserId: string, period: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('usage')
    .upsert({ owner_user_id: ownerUserId, period, ai_chats_used: 0, pdf_imports_used: 0 })
}
