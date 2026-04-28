'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface TransactionPayload {
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category: string
  card_id: string | null
  family_id: string | null
  source: string
}

export async function saveImportedTransactions(transactions: TransactionPayload[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sessão expirada. Faça login novamente.' }

  const db = createAdminClient()
  const payload = transactions.map((t) => ({ ...t, user_id: user.id }))

  for (let i = 0; i < payload.length; i += 100) {
    const { error } = await db.from('transactions').insert(payload.slice(i, i + 100))
    if (error) return { error: error.message }
  }

  return { success: true, count: payload.length }
}
