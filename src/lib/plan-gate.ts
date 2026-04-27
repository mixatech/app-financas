import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentPeriod, getOwnerUserId, getUsage, incrementUsage } from './usage'
import { PLAN_LIMITS } from '@/types'
import type { Plan } from '@/types'

type GateResult =
  | { allowed: true }
  | { allowed: false; reason: 'upgrade_required' | 'limit_reached' }

export async function checkAiFeature(
  userId: string,
  feature: 'ai_chat' | 'pdf_import'
): Promise<GateResult> {
  const supabase = createAdminClient()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .single()

  const plan: Plan = (sub?.plan ?? 'free') as Plan
  const limits = PLAN_LIMITS[plan]

  const limit = feature === 'ai_chat' ? limits.ai_chats : limits.pdf_imports

  if (limit === 0) {
    return { allowed: false, reason: 'upgrade_required' }
  }

  const ownerUserId = await getOwnerUserId(userId)
  const period = getCurrentPeriod()

  if (limit === null) {
    await incrementUsage(ownerUserId, period, feature)
    return { allowed: true }
  }

  const usage = await getUsage(ownerUserId, period)
  const used = feature === 'ai_chat'
    ? (usage?.ai_chats_used ?? 0)
    : (usage?.pdf_imports_used ?? 0)

  if (used >= limit) {
    return { allowed: false, reason: 'limit_reached' }
  }

  await incrementUsage(ownerUserId, period, feature)
  return { allowed: true }
}
