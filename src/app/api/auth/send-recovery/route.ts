import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const email = body?.email

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'E-mail obrigatório' }, { status: 400 })
  }

  const origin = request.headers.get('origin') ?? request.nextUrl.origin
  const redirectTo = `${origin}/auth/reset-password`

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })

  if (error) {
    // Não revela se o e-mail existe
    console.error('generateLink recovery error:', error.message)
    return NextResponse.json({ success: true })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  const { error: sendError } = await resend.emails.send({
    from: 'Finxa <noreply@mixatech.com>',
    to: email,
    subject: 'Redefina sua senha — Finxa',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff">
        <h2 style="color:#18181b;margin-bottom:8px">Redefinir senha</h2>
        <p style="color:#52525b;margin-bottom:24px">
          Clique no botão abaixo para criar uma nova senha para sua conta no Finxa.
          O link expira em 1 hora.
        </p>
        <a href="${data.properties.action_link}"
           style="display:inline-block;background:linear-gradient(135deg,#18181b,#3b0764);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">
          Redefinir senha
        </a>
        <p style="color:#a1a1aa;font-size:12px;margin-top:32px">
          Se você não solicitou a redefinição de senha, ignore este e-mail.
        </p>
      </div>
    `,
  })

  if (sendError) {
    console.error('Resend error:', sendError)
    return NextResponse.json({ error: 'Erro ao enviar e-mail. Tente novamente.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
