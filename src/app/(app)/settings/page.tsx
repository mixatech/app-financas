import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SettingsShell } from '@/components/settings/settings-shell'
import { CategoriesTab } from '@/components/settings/categories-tab'
import { CardsTab } from '@/components/settings/cards-tab'
import { SplitTab } from '@/components/settings/split-tab'
import { PermissionsTab } from '@/components/settings/permissions-tab'
import { AccountTab } from '@/components/settings/account-tab'
import { FamilyMember, Card, MemberSplitRatio, CustomCategory } from '@/types'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'categories' } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const db = createAdminClient()
  const { data: myMember } = await db
    .from('family_members').select('*')
    .eq('user_id', user.id).maybeSingle()

  if (!myMember) redirect('/onboarding')

  const isAdmin = myMember.role === 'admin'
  const familyId: string = myMember.family_id

  let content: React.ReactNode

  if (tab === 'categories' && isAdmin) {
    let customCats: CustomCategory[] = []
    try {
      const { data } = await db.from('custom_categories' as never).select('*').eq('family_id', familyId).order('created_at')
      customCats = (data ?? []) as CustomCategory[]
    } catch { /* tabela ainda não existe no Supabase */ }
    content = <CategoriesTab familyId={familyId} customCategories={customCats} />

  } else if (tab === 'cards' && isAdmin) {
    const [{ data: cards }, { data: members }] = await Promise.all([
      db.from('cards').select('*').eq('family_id', familyId).order('created_at'),
      db.from('family_members').select('*').eq('family_id', familyId).order('created_at'),
    ])
    content = (
      <CardsTab
        familyId={familyId}
        cards={(cards ?? []) as Card[]}
        members={(members ?? []) as FamilyMember[]}
      />
    )

  } else if (tab === 'split' && isAdmin) {
    const [{ data: members }, { data: splitRatios }] = await Promise.all([
      db.from('family_members').select('*').eq('family_id', familyId).order('created_at'),
      db.from('member_split_ratios').select('*').eq('family_id', familyId),
    ])
    content = (
      <SplitTab
        familyId={familyId}
        members={(members ?? []) as FamilyMember[]}
        splitRatios={(splitRatios ?? []) as MemberSplitRatio[]}
      />
    )

  } else if (tab === 'permissions' && isAdmin) {
    const { data: members } = await db.from('family_members').select('*').eq('family_id', familyId).order('created_at')
    content = <PermissionsTab members={(members ?? []) as FamilyMember[]} />

  } else {
    content = <AccountTab displayName={myMember.display_name} memberId={myMember.id} />
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900">Preferências</h2>
        <p className="text-sm text-gray-400 mt-0.5">Gerencie sua conta e as configurações do grupo</p>
      </div>
      <SettingsShell isAdmin={isAdmin}>
        {content}
      </SettingsShell>
    </div>
  )
}
