import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { addDays } from 'date-fns'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { family_id } = await req.json()
  if (!family_id) return NextResponse.json({ error: 'family_id obrigatório' }, { status: 400 })

  // Verificar que o usuário é admin do grupo
  const { data: member } = await supabase
    .from('family_members')
    .select('role')
    .eq('family_id', family_id)
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    return NextResponse.json({ error: 'Apenas admins podem gerar convites' }, { status: 403 })
  }

  const token = crypto.randomUUID()
  const expires_at = addDays(new Date(), 7).toISOString()

  const { error } = await supabase.from('family_invites').insert({
    family_id,
    token,
    created_by: user.id,
    expires_at,
  })

  if (error) return NextResponse.json({ error: 'Erro ao gerar convite' }, { status: 500 })

  const origin = req.headers.get('origin') ?? ''
  return NextResponse.json({ url: `${origin}/family/invite/${token}` })
}
