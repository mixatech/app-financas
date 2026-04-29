import { describe, it, expect } from 'vitest'
import { calculateBalances } from './balances'
import { FamilyMember, Transaction, Settlement, MemberSplitRatio } from '@/types'

const me:    FamilyMember = { id: 'me',    user_id: 'u1', family_id: 'f1', display_name: 'Mylena', role: 'admin',  color: '#7B2FBE', created_at: '' }
const other: FamilyMember = { id: 'other', user_id: 'u2', family_id: 'f1', display_name: 'Amanda', role: 'member', color: '#2D8EFF', created_at: '' }
const members = [me, other]
const noRatios: MemberSplitRatio[] = []
const noSettlements: Settlement[] = []

function tx(overrides: Partial<Transaction>): Transaction {
  return {
    id: crypto.randomUUID(), user_id: 'u1', type: 'expense',
    amount: 100, description: 'test', category: 'food',
    date: '2026-04-01', created_at: '',
    scope: 'personal',
    ...overrides,
  }
}

describe('calculateBalances — couple (50/50)', () => {
  it('other owes half when I pay couple expense', () => {
    const txs = [tx({ scope: 'couple', paid_by_member_id: 'me', amount: 200 })]
    const [b] = calculateBalances('me', txs, noSettlements, members, noRatios)
    expect(b.amount).toBeCloseTo(100)
  })

  it('I owe half when other pays couple expense', () => {
    const txs = [tx({ scope: 'couple', paid_by_member_id: 'other', amount: 200 })]
    const [b] = calculateBalances('me', txs, noSettlements, members, noRatios)
    expect(b.amount).toBeCloseTo(-100)
  })

  it('zero balance when both paid equal couple expenses', () => {
    const txs = [
      tx({ scope: 'couple', paid_by_member_id: 'me',    amount: 200 }),
      tx({ scope: 'couple', paid_by_member_id: 'other', amount: 200 }),
    ]
    const [b] = calculateBalances('me', txs, noSettlements, members, noRatios)
    expect(b.amount).toBeCloseTo(0)
  })
})

describe('calculateBalances — for_member', () => {
  it('other owes full amount when I pay for them', () => {
    const txs = [tx({ scope: 'for_member', paid_by_member_id: 'me', beneficiary_id: 'other', amount: 150 })]
    const [b] = calculateBalances('me', txs, noSettlements, members, noRatios)
    expect(b.amount).toBeCloseTo(150)
  })

  it('I owe full amount when other pays for me', () => {
    const txs = [tx({ scope: 'for_member', paid_by_member_id: 'other', beneficiary_id: 'me', amount: 80 })]
    const [b] = calculateBalances('me', txs, noSettlements, members, noRatios)
    expect(b.amount).toBeCloseTo(-80)
  })
})

describe('calculateBalances — settlements', () => {
  it('settlement reduces debt', () => {
    const txs = [tx({ scope: 'couple', paid_by_member_id: 'me', amount: 200 })]
    const settles: Settlement[] = [{
      id: 's1', family_id: 'f1',
      from_member_id: 'other', to_member_id: 'me',
      amount: 50, note: null, settled_at: '', created_at: '',
    }]
    const [b] = calculateBalances('me', txs, settles, members, noRatios)
    expect(b.amount).toBeCloseTo(50)
  })
})

describe('calculateBalances — personal scope', () => {
  it('personal transactions do not affect balance', () => {
    const txs = [tx({ scope: 'personal', paid_by_member_id: 'me', amount: 500 })]
    const [b] = calculateBalances('me', txs, noSettlements, members, noRatios)
    expect(b.amount).toBeCloseTo(0)
  })
})
