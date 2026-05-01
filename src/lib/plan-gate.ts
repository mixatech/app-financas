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
  try {
    const supabase = createAdminClient()

    const { data: sub, error: subError } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .single()

    // Tabela não existe → libera acesso
    if (subError?.code === '42P01' || subError?.message?.includes('does not exist')) {
      return { allowed: true }
    }

    // Usuário sem linha na tabela (ainda não tem assinatura cadastrada) → libera
    if (!sub) {
      return { allowed: true }
    }

    const isActive = sub?.status === 'active' || sub?.status === 'trialing'
    const plan: Plan = (isActive ? (sub?.plan as Plan) : undefined) ?? 'free'
    const limits = PLAN_LIMITS[plan]

    const limit = feature === 'ai_chat' ? limits.ai_chats : limits.pdf_imports

    if (limit === 0) {
      return { allowed: false, reason: 'upgrade_required' }
    }

    const ownerUserId = await getOwnerUserId(userId)
    const period = getCurrentPeriod()

    if (limit === null) {
      await incrementUsage(ownerUserId, period, feature).catch(() => {})
      return { allowed: true }
    }

    const usage = await getUsage(ownerUserId, period)
    const used = feature === 'ai_chat'
      ? (usage?.ai_chats_used ?? 0)
      : (usage?.pdf_imports_used ?? 0)

    if (used >= limit) {
      return { allowed: false, reason: 'limit_reached' }
    }

    await incrementUsage(ownerUserId, period, feature).catch(() => {})
    return { allowed: true }
  } catch {
    // Falha inesperada (ex: tabelas ausentes) → libera para não bloquear
    return { allowed: true }
  }
}
