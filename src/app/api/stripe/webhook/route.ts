import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { resetUsage, getCurrentPeriod } from '@/lib/usage'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.user_id
    const plan = session.metadata?.plan as 'pro' | 'family'
    if (!userId || !plan) return NextResponse.json({ ok: true })

    await admin.from('subscriptions').upsert({
      user_id: userId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: session.subscription as string,
      plan,
      status: 'trialing',
    })
  }

  if (event.type === 'invoice.paid') {
    const invoice = event.data.object as Stripe.Invoice
    const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id
    if (!customerId) return NextResponse.json({ ok: true })

    const { data: sub } = await admin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (sub) {
      await resetUsage(sub.user_id, getCurrentPeriod())
      await admin
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: new Date(invoice.period_start * 1000).toISOString(),
          current_period_end: new Date(invoice.period_end * 1000).toISOString(),
        })
        .eq('stripe_customer_id', customerId)
    }
  }

  if (
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription
    const customerId =
      typeof subscription.customer === 'string'
        ? subscription.customer
        : subscription.customer?.id
    if (!customerId) return NextResponse.json({ ok: true })

    const isDeleted = event.type === 'customer.subscription.deleted'

    await admin
      .from('subscriptions')
      .update({
        plan: isDeleted ? 'free' : (subscription.metadata?.plan ?? 'free'),
        status: isDeleted ? 'canceled' : subscription.status,
      })
      .eq('stripe_customer_id', customerId)
  }

  return NextResponse.json({ ok: true })
}
