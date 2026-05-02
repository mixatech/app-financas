'use client'

import { useTransition } from 'react'
import { FamilyMember } from '@/types'
import { updateMemberVisibility } from '@/app/(app)/settings/actions'
import { MemberAvatar } from '@/components/family/member-avatar'

const SCOPE_OPTIONS = [
  { value: 'own',    label: 'Só as próprias' },
  { value: 'couple', label: 'Do casal' },
  { value: 'family', label: 'Da família' },
  { value: 'all',    label: 'Tudo' },
] as const

export function PermissionsTab({ members }: { members: FamilyMember[] }) {
  const [isPending, startTransition] = useTransition()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Visibilidade por membro</h2>
        <p className="text-sm text-gray-400 mt-1">Controle quais transações cada membro consegue visualizar.</p>
      </div>
      <div className="space-y-3">
        {members.map(m => (
          <div key={m.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4">
            <MemberAvatar name={m.display_name} color={m.color} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">{m.display_name}</p>
              <p className="text-xs text-gray-400">{m.role === 'admin' ? 'Administrador' : 'Membro'}</p>
            </div>
            <select
              defaultValue={m.visibility_scope ?? 'own'}
              disabled={isPending}
              onChange={e => startTransition(() => { updateMemberVisibility(m.id, e.target.value as 'own' | 'couple' | 'family' | 'all'); })}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-300 disabled:opacity-60"
            >
              {SCOPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
