import { Transaction, Settlement, FamilyMember, MemberSplitRatio } from '@/types'

export interface MemberBalance {
  memberId: string
  memberName: string
  /** Positivo: o membro me deve. Negativo: eu devo ao membro. */
  amount: number
}

export function calculateBalances(
  myMemberId: string,
  transactions: Transaction[],
  settlements: Settlement[],
  allMembers: FamilyMember[],
  splitRatios: MemberSplitRatio[]
): MemberBalance[] {
  const otherMembers = allMembers.filter(m => m.id !== myMemberId)

  return otherMembers.map(other => {
    const ratio = splitRatios.find(r =>
      (r.member_a_id === myMemberId && r.member_b_id === other.id) ||
      (r.member_a_id === other.id   && r.member_b_id === myMemberId)
    )

    const myRatio  = ratio ? (ratio.member_a_id === myMemberId ? ratio.ratio_a : ratio.ratio_b) : 0.5
    const hisRatio = 1 - myRatio
    const memberCount = allMembers.length

    let balance = 0

    for (const tx of transactions) {
      if (tx.scope === 'couple') {
        if (tx.paid_by_member_id === myMemberId) {
          balance += tx.amount * hisRatio
        } else if (tx.paid_by_member_id === other.id) {
          balance -= tx.amount * myRatio
        }
      } else if (tx.scope === 'for_member') {
        if (tx.paid_by_member_id === myMemberId && tx.beneficiary_id === other.id) {
          balance += tx.amount
        } else if (tx.paid_by_member_id === other.id && tx.beneficiary_id === myMemberId) {
          balance -= tx.amount
        }
      } else if (tx.scope === 'family' && memberCount > 0) {
        const share = tx.amount / memberCount
        if (tx.paid_by_member_id === myMemberId) {
          balance += share
        } else if (tx.paid_by_member_id === other.id) {
          balance -= share
        }
      }
    }

    for (const s of settlements) {
      if (s.from_member_id === other.id && s.to_member_id === myMemberId) {
        balance -= s.amount
      } else if (s.from_member_id === myMemberId && s.to_member_id === other.id) {
        balance += s.amount
      }
    }

    return { memberId: other.id, memberName: other.display_name, amount: balance }
  })
}
