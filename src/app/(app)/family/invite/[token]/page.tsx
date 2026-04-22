import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { InviteAccept } from './invite-accept'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: PageProps) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/login?redirect=/family/invite/${token}`)
  }

  // Verificar se já é membro de algum grupo
  const { data: member } = await supabase
    .from('family_members')
    .select('id, family_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (member) {
    redirect('/family?msg=already_member')
  }

  // Buscar dados do convite + grupo
  const { data: invite } = await supabase
    .from('family_invites')
    .select('*, family_groups(name)')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!invite) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-xl font-bold text-gray-900">Convite inválido ou expirado</p>
          <p className="text-gray-500 mt-2">Peça ao admin para gerar um novo link.</p>
        </div>
      </div>
    )
  }

  const groupName = (invite.family_groups as { name: string } | null)?.name ?? 'Família'

  return (
    <InviteAccept
      token={token}
      groupName={groupName}
      userEmail={user.email ?? ''}
    />
  )
}
