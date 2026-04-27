import { createAdminClient } from '@/lib/supabase/admin'
import { getUsage, getCurrentPeriod, getOwnerUserId } from '@/lib/usage'
import { PLAN_LIMITS, PLAN_LABELS } from '@/types'
import type { Plan } from '@/types'

interface PlanBadgeProps {
  userId: string
}

export async function PlanBadge({ userId }: PlanBadgeProps) {
  const adminClient = createAdminClient()

  const { data: subscription } = await adminClient
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .maybeSingle()

  const plan: Plan = (subscription?.plan as Plan) ?? 'free'
  const label = PLAN_LABELS[plan]
  const limits = PLAN_LIMITS[plan]

  let badgeText = label

  if (limits.ai_chats !== null && limits.ai_chats > 0) {
    const period = getCurrentPeriod()
    const ownerUserId = await getOwnerUserId(userId, adminClient)
    const usage = await getUsage(ownerUserId, period)
    const used = usage?.ai_chats_used ?? 0
    const remaining = Math.max(0, limits.ai_chats - used)
    badgeText = `${label} · ${remaining} restantes`
  }

  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        background: 'linear-gradient(135deg, #7B2FBE22 0%, #a855f722 100%)',
        color: '#7B2FBE',
        border: '1px solid #7B2FBE33',
      }}
    >
      {badgeText}
    </span>
  )
}
