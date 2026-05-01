'use client'

import { useState, useTransition } from 'react'
import { FamilyMember, MemberSplitRatio } from '@/types'
import { upsertSplitRatio } from '@/app/(app)/settings/actions'

export function SplitTab({ familyId, members, splitRatios }: { familyId: string; members: FamilyMember[]; splitRatios: MemberSplitRatio[] }) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState<string | null>(null)

  const pairs: [FamilyMember, FamilyMember][] = []
  for (let i = 0; i < members.length; i++)
    for (let j = i + 1; j < members.length; j++)
      pairs.push([members[i], members[j]])

  function getRatio(a: FamilyMember, b: FamilyMember) {
    const r = splitRatios.find(x =>
      (x.member_a_id === a.id && x.member_b_id === b.id) ||
      (x.member_a_id === b.id && x.member_b_id === a.id)
    )
    if (!r) return 50
    return Math.round((r.member_a_id === a.id ? r.ratio_a : r.ratio_b) * 100)
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-gray-900">Divisão de gastos</h2>
        <p className="text-sm text-gray-400 mt-1">Proporção padrão para despesas com escopo &quot;Casal&quot;.</p>
      </div>
      {pairs.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">Adicione mais membros para configurar a divisão.</p>
      )}
      {pairs.map(([a, b]) => {
        const key = `${a.id}-${b.id}`
        return (
          <PairSlider key={key} a={a} b={b} initial={getRatio(a, b)}
            onSave={v => startTransition(async () => {
              await upsertSplitRatio(familyId, a.id, b.id, v / 100)
              setSaved(key); setTimeout(() => setSaved(null), 2000)
            })}
            isPending={isPending} wasSaved={saved === key} />
        )
      })}
    </div>
  )
}

function PairSlider({ a, b, initial, onSave, isPending, wasSaved }: {
  a: FamilyMember; b: FamilyMember; initial: number
  onSave: (v: number) => void; isPending: boolean; wasSaved: boolean
}) {
  const [ratioA, setRatioA] = useState(initial)
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ background: a.color }} />
        <span className="text-sm font-semibold text-gray-900">{a.display_name}</span>
        <span className="text-gray-400">↔</span>
        <div className="w-3 h-3 rounded-full" style={{ background: b.color }} />
        <span className="text-sm font-semibold text-gray-900">{b.display_name}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="font-medium text-gray-700">{a.display_name} <span className="text-[#7B2FBE] font-bold">{ratioA}%</span></span>
        <span className="font-medium text-gray-700">{b.display_name} <span className="text-[#2D8EFF] font-bold">{100 - ratioA}%</span></span>
      </div>
      <input type="range" min={10} max={90} step={5} value={ratioA}
        onChange={e => setRatioA(Number(e.target.value))} className="w-full accent-[#7B2FBE]" />
      <button onClick={() => onSave(ratioA)} disabled={isPending}
        className="px-4 py-1.5 rounded-xl bg-[#7B2FBE] hover:bg-[#6B28A8] text-white text-xs font-semibold disabled:opacity-60">
        {wasSaved ? '✓ Salvo' : isPending ? 'Salvando...' : 'Salvar'}
      </button>
    </div>
  )
}
