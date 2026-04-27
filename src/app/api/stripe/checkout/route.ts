import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { plan } = await req.json() as { plan: 'pro' | 'family' }
  if (plan !== 'pro' && plan !== 'family') {
    return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
  }

  const priceId = plan === 'pro'
    ? process.env.STRIPE_PRO_PRICE_ID
    : process.env.STRIPE_FAMILY_PRICE_ID

  if (!priceId) {
    return NextResponse.json({ error: 'Price ID não configurado' }, { status: 500 })
  }

  const trialDays = plan === 'pro' ? 7 : 14

  // Look up existing stripe_customer_id from subscriptions table
  const adminClient = createAdminClient()
  const { data: subscription } = await adminClient
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const stripeCustomerId = subscription?.stripe_customer_id ?? null

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    ...(stripeCustomerId
      ? { customer: stripeCustomerId }
      : { customer_email: user.email }),
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: trialDays,
      metadata: {
        user_id: user.id,
        plan,
      },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
    metadata: {
      user_id: user.id,
      plan,
    },
  })

  return NextResponse.json({ url: session.url })
}
