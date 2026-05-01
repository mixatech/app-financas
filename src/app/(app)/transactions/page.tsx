import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { TransactionList } from '@/components/transactions/transaction-list'
import { TransactionFilters } from '@/components/transactions/transaction-filters'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { StatementImport } from '@/components/import/statement-import'
import { ChatFab } from '@/components/chat/chat-fab'
import { Transaction, Card, FamilyMember } from '@/types'
import { format } from 'date-fns'

function fmt(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; type?: string; category?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const db = createAdminClient()

  const now = new Date()
  const month = params.month ?? format(now, 'yyyy-MM')
  const [year, monthNum] = month.split('-')
  const startDate = `${year}-${monthNum}-01`
  const endDate = new Date(parseInt(year), parseInt(monthNum), 0).toISOString().split('T')[0]

  // Buscar membro do usuário (para cartões e família)
  const { data: myMember } = await db
    .from('family_members')
    .select('id, family_id')
    .eq('user_id', user!.id)
    .maybeSingle()

  const familyId = myMember?.family_id ?? null
  const currentUserMemberId = myMember?.id ?? undefined

  // Buscar transações, cartões e membros em paralelo
  const [transactionsResult, cardsResult, membersResult] = await Promise.all([
    (async () => {
      let query = db
        .from('transactions')
        .select('*')
        .eq('user_id', user!.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false })

      if (params.type && params.type !== 'all') query = query.eq('type', params.type)
      if (params.category && params.category !== 'all') query = query.eq('category', params.category)

      return query
    })(),
    familyId
      ? db.from('cards').select('*').eq('family_id', familyId)
      : Promise.resolve({ data: [] }),
    familyId
      ? db.from('family_members').select('*').eq('family_id', familyId)
      : Promise.resolve({ data: [] }),
  ])

  const transactions: Transaction[] = transactionsResult.data ?? []
  const cards: Card[] = (cardsResult.data ?? []) as Card[]
  const familyMembers: FamilyMember[] = (membersResult.data ?? []) as FamilyMember[]

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = totalIncome - totalExpense

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Transações</h2>
          <p className="text-sm text-gray-400 mt-0.5">
            {transactions.length} transaç{transactions.length !== 1 ? 'ões' : 'ão'} encontrada{transactions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <StatementImport cards={cards} userId={user!.id} familyId={familyId} />
          <TransactionForm familyMembers={familyMembers} cards={cards} currentUserMemberId={currentUserMemberId} familyId={familyId ?? undefined} />
        </div>
      </div>

      <div className="bg-white rounded-2xl px-6 py-4" style={{ boxShadow: '0 2px 16px rgba(123,47,190,0.07)' }}>
        <Suspense>
          <TransactionFilters />
        </Suspense>
      </div>

      {transactions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl px-5 py-4 flex flex-col" style={{ boxShadow: '0 2px 16px rgba(123,47,190,0.07)' }}>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Receitas</span>
            <span className="text-lg font-bold" style={{ color: '#7B2FBE' }}>{fmt(totalIncome)}</span>
          </div>
          <div className="bg-white rounded-xl px-5 py-4 flex flex-col" style={{ boxShadow: '0 2px 16px rgba(123,47,190,0.07)' }}>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Despesas</span>
            <span className="text-lg font-bold text-gray-800">{fmt(totalExpense)}</span>
          </div>
          <div className="bg-white rounded-xl px-5 py-4 flex flex-col" style={{ boxShadow: '0 2px 16px rgba(123,47,190,0.07)' }}>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Saldo</span>
            <span className="text-lg font-bold" style={{ color: balance >= 0 ? '#7B2FBE' : '#374151' }}>{fmt(balance)}</span>
          </div>
        </div>
      )}

      <TransactionList
        transactions={transactions}
        familyMembers={familyMembers}
        cards={cards}
        currentUserMemberId={currentUserMemberId}
        familyId={familyId ?? undefined}
      />
      <ChatFab />
    </div>
  )
}
