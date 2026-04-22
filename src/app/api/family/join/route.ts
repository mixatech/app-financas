import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MEMBER_COLORS } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { token, display_name } = await req.json()
  if (!token || !display_name) {
    return NextResponse.json({ error: 'token e display_name são obrigatórios' }, { status: 400 })
  }

  // Buscar convite válido
  const { data: invite } = await supabase
    .from('family_invites')
    .select('*')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) {
    return NextResponse.json({ error: 'Convite inválido ou expirado' }, { status: 404 })
  }

  // Verificar se já é membro
  const { data: existing } = await supabase
    .from('family_members')
    .select('id')
    .eq('family_id', invite.family_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Você já é membro deste grupo' }, { status: 409 })
  }

  // Escolher cor baseado na posição do membro
  const { count } = await supabase
    .from('family_members')
    .select('*', { count: 'exact', head: true })
    .eq('family_id', invite.family_id)

  const color = MEMBER_COLORS[(count ?? 0) % MEMBER_COLORS.length]

  // Adicionar membro
  const { error: memberErr } = await supabase.from('family_members').insert({
    family_id: invite.family_id,
    user_id: user.id,
    display_name: display_name.trim(),
    role: 'member',
    color,
  })

  if (memberErr) return NextResponse.json({ error: 'Erro ao entrar no grupo' }, { status: 500 })

  // Marcar convite como usado
  await supabase
    .from('family_invites')
    .update({ used_at: new Date().toISOString() })
    .eq('id', invite.id)

  return NextResponse.json({ success: true, family_id: invite.family_id })
}
