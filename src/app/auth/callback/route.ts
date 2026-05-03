import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  if (type === 'recovery') {
    return NextResponse.redirect(`${origin}/auth/reset-password`)
  }

  // next: explicit post-auth destination (e.g. password reset)
  const next = searchParams.get('next')
  if (next?.startsWith('/')) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  // redirect: preserve URL for invite links and other pre-auth flows
  const redirectTo = searchParams.get('redirect')
  const safePath = redirectTo?.startsWith('/') ? redirectTo : '/dashboard'
  return NextResponse.redirect(`${origin}${safePath}`)
}
