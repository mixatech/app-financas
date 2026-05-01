import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUsage, getCurrentPeriod, getOwnerUserId } from '@/lib/usage'
import { PLAN_LABELS, PLAN_LIMITS, PLAN_PRICES } from '@/types'
import { SettingsShell } from '@/components/settings/settings-shell'
import { PlanCard } from '@/components/billing/plan-card'
import type { Plan, Subscription } from '@/types'

const PLAN_FEATURES: Record<Plan, string[]> = {
  free: [
    'Dashboard pessoal',
    'Transações ilimitadas',
    'Exportação CSV',
    '1 membro (só você)',
  ],
  pro: [
    'Tudo do Gratuito',
    '30 conversas com IA/mês',
    '2 importações de PDF/mês',
    'Grupos familiares (até 2 membros)',
    'Suporte prioritário',
  ],
  family: [
    'Tudo do Pro',
    '200 conversas com IA/mês',
    'Importações de PDF ilimitadas',
    'Até 6 membros na família',
    'Dashboard familiar completo',
    'Relatórios avançados',
  ],
}

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const db = createAdminClient()

  const [subscriptionResult, ownerUserId, memberResult] = await Promise.all([
    db.from('subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
    getOwnerUserId(user.id, db),
    db.from('family_members').select('role').eq('user_id', user.id).maybeSingle(),
  ])

  const subscription = subscriptionResult.data as Subscription | null
  const plan: Plan = subscription?.plan ?? 'free'
  const limits = PLAN_LIMITS[plan]
  const isAdmin = memberResult.data?.role === 'admin'

  const period = getCurrentPeriod()
  const usage = await getUsage(ownerUserId, period)

  const aiChatsUsed = usage?.ai_chats_used ?? 0
  const pdfImportsUsed = usage?.pdf_imports_used ?? 0

  const formatLimit = (value: number | null) =>
    value === null ? 'ilimitado' : String(value)

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900">Assinatura</h2>
        <p className="text-sm text-gray-400 mt-0.5">Gerencie seu plano e acompanhe o uso</p>
      </div>
      <SettingsShell isAdmin={isAdmin}>
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Assinatura &amp; Plano</h2>
            <p className="text-sm text-gray-400 mt-1">Gerencie seu plano e acompanhe o uso do mês.</p>
          </div>

          {/* Grade de planos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Planos disponíveis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(['free', 'pro', 'family'] as Plan[]).map((p) => (
                <PlanCard
                  key={p}
                  plan={p}
                  label={PLAN_LABELS[p]}
                  price={PLAN_PRICES[p]}
                  features={PLAN_FEATURES[p]}
                  currentPlan={plan}
                  isPopular={p === 'pro'}
                />
              ))}
            </div>
          </div>

          {/* Uso do mês */}
          <div className="bg-white rounded-2xl p-6 space-y-4" style={{ boxShadow: '0 2px 16px rgba(123,47,190,0.07)' }}>
            <h3 className="text-sm font-semibold text-gray-700">Uso este mês</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">Conversas com IA</span>
                <span className="font-semibold text-gray-900">
                  {aiChatsUsed} / {formatLimit(limits.ai_chats)}
                </span>
              </div>
              {limits.ai_chats !== null && limits.ai_chats > 0 && (
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((aiChatsUsed / limits.ai_chats) * 100, 100)}%`,
                      backgroundColor: aiChatsUsed >= limits.ai_chats ? '#ef4444' : '#7B2FBE',
                    }}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">Importações de PDF</span>
                <span className="font-semibold text-gray-900">
                  {pdfImportsUsed} / {formatLimit(limits.pdf_imports)}
                </span>
              </div>
              {limits.pdf_imports !== null && limits.pdf_imports > 0 && (
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((pdfImportsUsed / limits.pdf_imports) * 100, 100)}%`,
                      backgroundColor: pdfImportsUsed >= limits.pdf_imports ? '#ef4444' : '#7B2FBE',
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {subscription?.stripe_subscription_id && (
            <div className="rounded-2xl p-5" style={{ background: 'rgba(123,47,190,0.06)', border: '1px solid rgba(123,47,190,0.12)' }}>
              <p className="text-sm" style={{ color: '#7B2FBE' }}>
                Para cancelar ou alterar a forma de pagamento, clique em{' '}
                <strong>Gerenciar assinatura</strong> no card do plano desejado acima.
                O downgrade é processado pelo portal seguro do Stripe.
              </p>
            </div>
          )}
        </div>
      </SettingsShell>
    </div>
  )
}
