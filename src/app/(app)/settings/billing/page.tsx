import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUsage, getCurrentPeriod, getOwnerUserId } from '@/lib/usage'
import { PLAN_LABELS, PLAN_LIMITS, PLAN_PRICES } from '@/types'
import type { Plan, Subscription } from '@/types'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const db = createAdminClient()

  // Fetch subscription and resolve owner user ID in parallel
  const [subscriptionResult, ownerUserId] = await Promise.all([
    db
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
    getOwnerUserId(user.id, db),
  ])

  const subscription = subscriptionResult.data as Subscription | null
  const plan: Plan = subscription?.plan ?? 'free'
  const limits = PLAN_LIMITS[plan]

  const period = getCurrentPeriod()
  const usage = await getUsage(ownerUserId, period)

  const aiChatsUsed = usage?.ai_chats_used ?? 0
  const pdfImportsUsed = usage?.pdf_imports_used ?? 0

  const formatLimit = (value: number | null) =>
    value === null ? 'ilimitado' : String(value)

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      {/* Header */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#7B2FBE' }}>
          Configurações
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Assinatura &amp; Plano</h1>
        <p className="text-gray-400 text-sm mt-1">Gerencie seu plano e acompanhe o uso do mês</p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Plano atual</h2>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: plan === 'free' ? '#f3f4f6' : '#ede9fe',
                color: plan === 'free' ? '#6b7280' : '#7B2FBE',
              }}
            >
              {PLAN_LABELS[plan]}
            </span>
            <span className="text-2xl font-bold text-gray-900">{PLAN_PRICES[plan]}</span>
          </div>

          {plan === 'free' && (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#7B2FBE' }}
            >
              Fazer upgrade
            </Link>
          )}
        </div>

        {plan === 'free' && (
          <p className="text-sm text-gray-500">
            Atualize para o plano Pro ou Família para desbloquear mais recursos.
          </p>
        )}
      </div>

      {/* Usage This Month */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Uso este mês</h2>

        {/* AI Chats */}
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

        {/* PDF Imports */}
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

      {/* Stripe Portal Note */}
      {subscription?.stripe_subscription_id && (
        <div className="bg-purple-50 rounded-2xl border border-purple-100 p-5">
          <p className="text-sm text-purple-700">
            Sua assinatura e cobranças são gerenciadas pelo Stripe. Para cancelar ou alterar
            a forma de pagamento, entre em contato com o suporte ou acesse o portal do cliente
            pelo email cadastrado.
          </p>
        </div>
      )}
    </div>
  )
}
