'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { MEMBER_COLORS } from '@/types'

export async function createFamilyGroup(groupName: string, displayName: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada. Faça login novamente.' }

  const admin = createAdminClient()

  const { data: group, error: groupErr } = await admin
    .from('family_groups')
    .insert({ name: groupName.trim(), created_by: user.id })
    .select()
    .single()

  if (groupErr || !group) {
    return { error: groupErr?.message ?? 'Erro ao criar grupo' }
  }

  const { error: memberErr } = await admin.from('family_members').insert({
    family_id: group.id,
    user_id: user.id,
    display_name: displayName.trim(),
    role: 'admin',
    color: MEMBER_COLORS[0],
  })

  if (memberErr) {
    return { error: memberErr.message ?? 'Erro ao configurar membro' }
  }

  return { success: true }
}
